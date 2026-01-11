import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { logger } from '../utils/logger.js';

// Store user presence: { roomId: { userId: { status, joinedAt } } }
const roomPresence = new Map();

// Store active socket users: Set of userIds
const activeSocketUsers = new Set();

// Store typing indicators: { roomId: { userId: lastTypingTime } }
const typingUsers = new Map();

// Store muted users per room: { roomId: { userId: expiresAt } }
const mutedUsers = new Map();

export const initializeRoomHandlers = (io) => {
  // Clean up expired muted users every minute
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, mutedMap] of mutedUsers.entries()) {
      for (const [userId, expiresAt] of mutedMap.entries()) {
        if (now > expiresAt) {
          mutedMap.delete(userId);
        }
      }
      if (mutedMap.size === 0) {
        mutedUsers.delete(roomId);
      }
    }
  }, 60000);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.id})`);
    
    // Track active user
    if (socket.userId) {
      activeSocketUsers.add(socket.userId);
    }

    // Join room
    socket.on('room:join', async (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          logger.warn(`room:join failed: No roomId provided. socket.id: ${socket.id}`);
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        logger.info(`room:join request: roomId=${roomId}, socket.id=${socket.id}, userId=${socket.userId}`);

        const room = await Room.findById(roomId);

        if (!room) {
          logger.warn(`room:join failed: Room not found. roomId=${roomId}, socket.id=${socket.id}`);
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is a member
        const isMember = room.owner._id.toString() === socket.userId ||
                         room.members.some(memberId => memberId.toString() === socket.userId);

        if (!isMember && room.isPrivate) {
          logger.warn(`room:join failed: Access denied. roomId=${roomId}, userId=${socket.userId}, socket.id=${socket.id}`);
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Leave previous room if in one
        if (socket.currentRoomId) {
          const prevRoomIdStr = String(socket.currentRoomId);
          socket.leave(prevRoomIdStr);
          removePresence(prevRoomIdStr, socket.userId);
        }

        // Normalize roomId to string for consistency
        const roomIdStr = String(roomId);
        
        // Join new room
        socket.join(roomIdStr);
        socket.currentRoomId = roomIdStr;
        logger.info(`room:join success: socket.id=${socket.id}, roomId=${roomIdStr}, socket.currentRoomId=${socket.currentRoomId}`);

        // Add presence
        if (!roomPresence.has(roomIdStr)) {
          roomPresence.set(roomIdStr, new Map());
        }
        roomPresence.get(roomIdStr).set(socket.userId, {
          status: 'idle',
          joinedAt: new Date(),
          user: socket.user,
        });

        // Emit updated presence to room
        emitPresence(io, roomIdStr);

        socket.emit('room:joined', { roomId: roomIdStr });
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Couldn\'t join room' });
      }
    });

    // Leave room
    socket.on('room:leave', () => {
      if (socket.currentRoomId) {
        const roomIdStr = String(socket.currentRoomId);
        socket.leave(roomIdStr);
        removePresence(roomIdStr, socket.userId);
        emitPresence(io, roomIdStr);
        socket.currentRoomId = null;
      }
    });

    // Update presence status
    socket.on('presence:update', (data) => {
      try {
        const { status } = data;

        if (!['studying', 'break', 'idle'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        if (!socket.currentRoomId) {
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        const roomPresenceMap = roomPresence.get(socket.currentRoomId);
        if (roomPresenceMap && roomPresenceMap.has(socket.userId)) {
          roomPresenceMap.get(socket.userId).status = status;
          emitPresence(io, socket.currentRoomId);
        }
      } catch (error) {
        logger.error('Error updating presence:', error);
        socket.emit('error', { message: 'Couldn\'t update status' });
      }
    });

    // Send chat message
    socket.on('chat:message', async (data) => {
      try {
        const { roomId, text } = data;

        if (!roomId || !text || !text.trim()) {
          socket.emit('error', { message: 'Room ID and message text are required' });
          return;
        }

        if (text.length > 1000) {
          socket.emit('error', { message: 'Message is too long' });
          return;
        }

        const room = await Room.findById(roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is a member
        const isMember = room.owner._id.toString() === socket.userId ||
                         room.members.some(memberId => memberId.toString() === socket.userId);

        if (!isMember && room.isPrivate) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          roomId,
          userId: socket.userId,
          text: text.trim(),
        });

        await message.populate('userId', 'name email avatar');

        // Clear typing indicator
        clearTypingIndicator(roomId, socket.userId);

        // Broadcast message to room
        io.to(roomId).emit('chat:message', {
          _id: message._id,
          roomId: message.roomId,
          userId: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email,
            avatar: socket.user.avatar,
          },
          text: message.text,
          reactions: message.reactions || [],
          pinned: message.pinned || false,
          createdAt: message.createdAt,
        });
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Couldn\'t send message' });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (data) => {
      try {
        const { roomId, isTyping } = data;

        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          return;
        }

        if (isTyping) {
          if (!typingUsers.has(roomId)) {
            typingUsers.set(roomId, new Map());
          }
          typingUsers.get(roomId).set(socket.userId, Date.now());
        } else {
          clearTypingIndicator(roomId, socket.userId);
          return;
        }

        // Emit typing indicator (throttled)
        socket.to(roomId).emit('chat:typing', {
          roomId,
          userId: socket.userId,
          userName: socket.user.name,
          isTyping: true,
        });

        // Auto-clear after 3 seconds
        setTimeout(() => {
          clearTypingIndicator(roomId, socket.userId);
          emitTypingStopped(io, roomId, socket.userId);
        }, 3000);
      } catch (error) {
        logger.error('Error handling typing indicator:', error);
      }
    });

    // Mute user (mod+)
    socket.on('room:mute-user', async (data) => {
      try {
        const { roomId, userId, minutes } = data;

        if (!socket.currentRoomId || socket.currentRoomId !== roomId) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        // Check if user is moderator (simplified check - in production, verify via RoomMember)
        const room = await Room.findById(roomId);
        if (!room || room.owner.toString() !== socket.userId) {
          socket.emit('error', { message: 'Only moderators can mute users' });
          return;
        }

        const expiresAt = Date.now() + (minutes * 60 * 1000);
        if (!mutedUsers.has(roomId)) {
          mutedUsers.set(roomId, new Map());
        }
        mutedUsers.get(roomId).set(userId, expiresAt);

        io.to(roomId).emit('room:user-muted', { userId, minutes, expiresAt });
      } catch (error) {
        logger.error('Error muting user:', error);
        socket.emit('error', { message: 'Couldn\'t mute user' });
      }
    });

    // Join user room for notifications
    socket.on('user:subscribe', () => {
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.userId} (${socket.id}), reason: ${reason}`);
      if (socket.currentRoomId) {
        const roomIdStr = String(socket.currentRoomId);
        removePresence(roomIdStr, socket.userId);
        emitPresence(io, roomIdStr);
      }
      
      if (socket.userId) {
        const userSockets = Array.from(io.sockets.sockets.values())
          .filter(s => s.userId === socket.userId && s.id !== socket.id);
        if (userSockets.length === 0) {
          activeSocketUsers.delete(socket.userId);
        }
      }
    });
  });
};

// Helper functions
function removePresence(roomId, userId) {
  const roomPresenceMap = roomPresence.get(roomId);
  if (roomPresenceMap) {
    roomPresenceMap.delete(userId);
    if (roomPresenceMap.size === 0) {
      roomPresence.delete(roomId);
    }
  }
}

function emitPresence(io, roomId) {
  const roomPresenceMap = roomPresence.get(roomId);
  if (!roomPresenceMap) {
    io.to(roomId).emit('room:presence', { users: [] });
    return;
  }

  const users = Array.from(roomPresenceMap.entries()).map(([userId, data]) => ({
    userId,
    status: data.status,
    joinedAt: data.joinedAt,
    user: {
      _id: data.user._id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.avatar,
      badges: data.user.badges || [],
    },
  }));

  io.to(roomId).emit('room:presence', { users });
}

// Helper function to clear typing indicator
function clearTypingIndicator(roomId, userId) {
  const roomTyping = typingUsers.get(roomId);
  if (roomTyping) {
    roomTyping.delete(userId);
    if (roomTyping.size === 0) {
      typingUsers.delete(roomId);
    } else {
      // Emit typing stopped
      io.to(roomId).emit('chat:typing', {
        roomId,
        userId,
        isTyping: false,
      });
    }
  }
}

// Export function to get active socket users count
export const getActiveSocketUsersCount = () => {
  return activeSocketUsers.size;
}// Export function to check if user is online
export const isUserOnline = (userId) => {
  return activeSocketUsers.has(userId);
}

// Export function to get online friends
export const getOnlineFriends = (friendsList) => {
  return friendsList.filter(friendId => activeSocketUsers.has(friendId));
}

// Export function to check if user is muted in room
export const isUserMuted = (roomId, userId) => {
  const roomMuted = mutedUsers.get(roomId);
  if (!roomMuted || !roomMuted.has(userId)) {
    return false;
  }
  const expiresAt = roomMuted.get(userId);
  if (Date.now() > expiresAt) {
    roomMuted.delete(userId);
    return false;
  }
  return true;
}