import { logger } from '../utils/logger.js';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { checkAndAwardBadges } from '../utils/badges.js';

// Server-authoritative timer state per room
// Structure: { roomId: { mode, isRunning, durationsSec: { focus, break }, remainingSec, startedAt, endsAt, updatedAt } }
const roomStates = new Map();

async function endSession(userId, roomId, sessionData) {
  try {
    const durationSeconds = Math.floor((Date.now() - sessionData.startedAt.getTime()) / 1000);
    
    await StudySession.create({
      userId,
      roomId: roomId || null,
      startedAt: sessionData.startedAt,
      endedAt: new Date(),
      durationSeconds,
      mode: sessionData.mode,
      source: sessionData.source,
    });

    if (sessionData.mode === 'focus' && durationSeconds > 0) {
      const durationMinutes = Math.floor(durationSeconds / 60);
      const user = await User.findById(userId);
      if (user) {
        user.stats.totalFocusMinutes = (user.stats.totalFocusMinutes || 0) + durationMinutes;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActivity = user.stats.lastActivityDate ? new Date(user.stats.lastActivityDate) : null;
        const lastActivityDate = lastActivity ? new Date(lastActivity.setHours(0, 0, 0, 0)) : null;
        
        if (!lastActivityDate || lastActivityDate.getTime() !== today.getTime()) {
          if (!lastActivityDate) {
            user.stats.streakCount = 1;
          } else {
            const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              user.stats.streakCount = (user.stats.streakCount || 0) + 1;
            } else {
              user.stats.streakCount = 1;
            }
          }
          user.stats.lastActivityDate = today;
        }
        
        await user.save();
        await checkAndAwardBadges(userId);
      }
    }
  } catch (error) {
    logger.error('Error ending study session:', error);
  }
}

function broadcastTimerState(io, roomIdStr, state) {
  io.to(roomIdStr).emit('timer:state', {
    roomId: roomIdStr,
    state: {
      mode: state.mode,
      isRunning: state.isRunning,
      durationsSec: state.durationsSec,
      remainingSec: state.remainingSec,
      startedAt: state.startedAt,
      endsAt: state.endsAt,
      updatedAt: state.updatedAt,
    },
  });
}

export const initializeTimerHandlers = (io) => {
  // Broadcast timer state every 1 second for active timers
  setInterval(() => {
    const now = Date.now();
    for (const [roomIdStr, state] of roomStates.entries()) {
      if (!state.isRunning || !state.startedAt || !state.endsAt) {
        continue;
      }

      const elapsed = now - state.startedAt;
      const remaining = Math.max(0, Math.ceil((state.endsAt - now) / 1000));

      // Timer expired
      if (remaining === 0) {
        state.isRunning = false;
        state.startedAt = null;
        state.endsAt = null;
        state.remainingSec = 0;
        state.updatedAt = now;
        broadcastTimerState(io, roomIdStr, state);
        continue;
      }

      state.remainingSec = remaining;
      state.updatedAt = now;
      broadcastTimerState(io, roomIdStr, state);
    }
  }, 1000);

  io.on('connection', (socket) => {
    // Get timer state
    socket.on('timer:get', async (data) => {
      try {
        const { roomId } = data;
        if (!roomId) {
          socket.emit('timer:state', {
            roomId: null,
            state: null,
          });
          return;
        }

        const roomIdStr = String(roomId);
        
        logger.info(`timer:get request: socket.id=${socket.id}, requested roomId=${roomIdStr}, socket.currentRoomId=${socket.currentRoomId}`);
        
        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          logger.warn(`timer:get: Socket not in room, attempting auto-join. socket.id=${socket.id}, socket.currentRoomId: ${socket.currentRoomId}, requested roomId: ${roomIdStr}`);
          
          try {
            const room = await Room.findById(roomId);
            if (!room) {
              socket.emit('timer:state', { roomId: roomIdStr, state: null });
              return;
            }
            
            const isMember = room.owner._id.toString() === socket.userId ||
                             room.members.some(memberId => memberId.toString() === socket.userId);
            if (!isMember && room.isPrivate) {
              socket.emit('timer:state', { roomId: roomIdStr, state: null });
              return;
            }
            
            socket.join(roomIdStr);
            socket.currentRoomId = roomIdStr;
            logger.info(`Auto-joined room for timer:get: socket.id=${socket.id}, roomId=${roomIdStr}`);
          } catch (err) {
            logger.error('Error auto-joining room for timer:get:', err);
            socket.emit('timer:state', { roomId: roomIdStr, state: null });
            return;
          }
        }

        const state = roomStates.get(roomIdStr);
        if (state) {
          const now = Date.now();
          let remainingSec = state.remainingSec;

          if (state.isRunning && state.startedAt && state.endsAt) {
            remainingSec = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
          }

          socket.emit('timer:state', {
            roomId: roomIdStr,
            state: {
              mode: state.mode,
              isRunning: state.isRunning,
              durationsSec: state.durationsSec,
              remainingSec,
              startedAt: state.startedAt,
              endsAt: state.endsAt,
              updatedAt: state.updatedAt,
            },
          });
        } else {
          socket.emit('timer:state', {
            roomId: roomIdStr,
            state: null,
          });
        }
      } catch (error) {
        logger.error('Error getting timer state:', error);
        socket.emit('timer:state', {
          roomId: data?.roomId || null,
          state: null,
        });
      }
    });

    // Timer start
    socket.on('timer:start', async (data) => {
      try {
        const { roomId, focusMinutes, breakMinutes } = data;

        if (!roomId || focusMinutes === undefined || breakMinutes === undefined) {
          logger.warn(`Timer start failed: Missing parameters. roomId: ${roomId}, focusMinutes: ${focusMinutes}, breakMinutes: ${breakMinutes}`);
          socket.emit('error', { message: 'Room ID and durations are required' });
          return;
        }

        const roomIdStr = String(roomId);
        
        logger.info(`Timer start received: socket.id=${socket.id}, socket.currentRoomId=${socket.currentRoomId}, requested roomId=${roomIdStr}`);
        
        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          logger.warn(`Timer start failed: Socket not in room. socket.id=${socket.id}, socket.currentRoomId: ${socket.currentRoomId}, requested roomId: ${roomIdStr}`);
          
          // Try to join the room if not already in it
          try {
            const room = await Room.findById(roomId);
            if (room) {
              const isMember = room.owner._id.toString() === socket.userId ||
                               room.members.some(memberId => memberId.toString() === socket.userId);
              if (isMember || !room.isPrivate) {
                socket.join(roomIdStr);
                socket.currentRoomId = roomIdStr;
                logger.info(`Auto-joined room for timer: socket.id=${socket.id}, roomId=${roomIdStr}`);
              } else {
                socket.emit('error', { message: 'Access denied' });
                return;
              }
            } else {
              socket.emit('error', { message: 'Room not found' });
              return;
            }
          } catch (err) {
            logger.error('Error auto-joining room for timer:', err);
            socket.emit('error', { message: 'Please join the room first' });
            return;
          }
        }
        
        logger.info(`Timer start request received: roomId=${roomIdStr}, focus=${focusMinutes}min, break=${breakMinutes}min`);

        const now = Date.now();
        const focusSec = focusMinutes * 60;
        const breakSec = breakMinutes * 60;

        let state = roomStates.get(roomIdStr);
        if (!state) {
          state = {
            mode: 'focus',
            isRunning: false,
            durationsSec: { focus: focusSec, break: breakSec },
            remainingSec: focusSec,
            startedAt: null,
            endsAt: null,
            updatedAt: now,
          };
        } else {
          state.durationsSec = { focus: focusSec, break: breakSec };
        }

        if (state.remainingSec <= 0) {
          state.remainingSec = state.durationsSec[state.mode];
        }

        state.isRunning = true;
        state.startedAt = now;
        state.endsAt = now + (state.remainingSec * 1000);
        state.updatedAt = now;

        roomStates.set(roomIdStr, state);
        broadcastTimerState(io, roomIdStr, state);
        logger.info(`Timer started in room ${roomIdStr}: ${focusMinutes}min/${breakMinutes}min`);
      } catch (error) {
        logger.error('Error starting timer:', error);
        socket.emit('error', { message: 'Couldn\'t start timer' });
      }
    });

    // Timer pause
    socket.on('timer:pause', async (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        const roomIdStr = String(roomId);
        
        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        const now = Date.now();
        if (state.isRunning && state.endsAt) {
          state.remainingSec = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
        }

        state.isRunning = false;
        state.startedAt = null;
        state.endsAt = null;
        state.updatedAt = now;

        broadcastTimerState(io, roomIdStr, state);
        logger.info(`Timer paused in room ${roomIdStr}`);
      } catch (error) {
        logger.error('Error pausing timer:', error);
        socket.emit('error', { message: 'Couldn\'t pause timer' });
      }
    });

    // Timer reset
    socket.on('timer:reset', async (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        const roomIdStr = String(roomId);
        
        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        const now = Date.now();
        state.isRunning = false;
        state.startedAt = null;
        state.endsAt = null;
        state.remainingSec = state.durationsSec[state.mode];
        state.updatedAt = now;

        broadcastTimerState(io, roomIdStr, state);
        logger.info(`Timer reset in room ${roomIdStr}`);
      } catch (error) {
        logger.error('Error resetting timer:', error);
        socket.emit('error', { message: 'Couldn\'t reset timer' });
      }
    });

    // Timer mode switch
    socket.on('timer:mode', async (data) => {
      try {
        const { roomId, mode } = data;

        if (!roomId || !mode || !['focus', 'break'].includes(mode)) {
          socket.emit('error', { message: 'Room ID and valid mode are required' });
          return;
        }

        const roomIdStr = String(roomId);
        
        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        const now = Date.now();
        state.mode = mode;
        state.isRunning = false;
        state.startedAt = null;
        state.endsAt = null;
        state.remainingSec = state.durationsSec[mode];
        state.updatedAt = now;

        broadcastTimerState(io, roomIdStr, state);
        logger.info(`Timer mode switched in room ${roomIdStr}: ${mode}`);
      } catch (error) {
        logger.error('Error switching timer mode:', error);
        socket.emit('error', { message: 'Couldn\'t switch mode' });
      }
    });
  });
};
