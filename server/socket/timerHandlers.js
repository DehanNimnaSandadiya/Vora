import { logger } from '../utils/logger.js';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import { checkAndAwardBadges } from '../utils/badges.js';

// In-memory room state storage
// Format: { roomId: { mode, endsAt, isRunning, durations: { focusMinutes, breakMinutes } } }
const roomStates = new Map();

// Helper function to end study session
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

    // Update user stats and check badges for focus sessions
    if (sessionData.mode === 'focus' && durationSeconds > 0) {
      const durationMinutes = Math.floor(durationSeconds / 60);
      const user = await User.findById(userId);
      if (user) {
        // Update focus minutes
        user.stats.totalFocusMinutes = (user.stats.totalFocusMinutes || 0) + durationMinutes;
        
        // Update streak - check if this is a new day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActivity = user.stats.lastActivityDate ? new Date(user.stats.lastActivityDate) : null;
        const lastActivityDate = lastActivity ? new Date(lastActivity.setHours(0, 0, 0, 0)) : null;
        
        if (!lastActivityDate || lastActivityDate.getTime() !== today.getTime()) {
          // New day activity
          if (!lastActivityDate) {
            // First activity ever
            user.stats.streakCount = 1;
          } else {
            const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              // Consecutive day
              user.stats.streakCount = (user.stats.streakCount || 0) + 1;
            } else {
              // Streak broken
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

export const initializeTimerHandlers = (io) => {
  // Timer tick - emit sync every 1 second for active timers
  setInterval(() => {
    const now = Date.now();
    for (const [roomIdStr, state] of roomStates.entries()) {
      if (state.isRunning && state.endsAt) {
        let remaining = Math.max(0, state.endsAt - now);
        
        // Auto-transition when timer reaches 0
        if (remaining === 0) {
          state.isRunning = false;
          // Switch mode
          state.mode = state.mode === 'focus' ? 'break' : 'focus';
          
          // Auto-start break timer if in break mode
          if (state.mode === 'break') {
            const breakMs = state.durations.breakMinutes * 60 * 1000;
            state.endsAt = now + breakMs;
            state.isRunning = true;
            remaining = breakMs;
          } else {
            // Focus ended, break ended - timer is complete
            state.endsAt = null;
            remaining = 0;
          }
        }
        
        io.to(roomIdStr).emit('timer:sync', {
          mode: state.mode,
          endsAt: state.endsAt,
          isRunning: state.isRunning,
          remaining: remaining,
          durations: state.durations,
        });
      } else if (!state.isRunning && state.endsAt) {
        // Timer is paused, still emit sync with current remaining time
        const remaining = Math.max(0, state.endsAt - now);
        io.to(roomIdStr).emit('timer:sync', {
          mode: state.mode,
          endsAt: state.endsAt,
          isRunning: false,
          remaining: remaining,
          durations: state.durations,
        });
      }
    }
  }, 1000);

  io.on('connection', (socket) => {
    // Timer start
    socket.on('timer:start', async (data) => {
      try {
        const { roomId, focusMinutes, breakMinutes } = data;

        if (!roomId || focusMinutes === undefined || breakMinutes === undefined) {
          socket.emit('error', { message: 'Room ID and durations are required' });
          return;
        }

        // Normalize roomId to string for comparison
        const roomIdStr = String(roomId);
        
        // Check if socket is in the room - be very lenient (allow if currentRoomId matches)
        let isInRoom = socket.rooms.has(roomIdStr);
        
        if (!isInRoom) {
          // Check if currentRoomId matches (room join might be in progress)
          if (socket.currentRoomId && String(socket.currentRoomId) === roomIdStr) {
            // Try to join explicitly (in case join wasn't complete)
            socket.join(roomIdStr);
            // Wait a bit for join to process (socket.join is async internally)
            await new Promise(resolve => setTimeout(resolve, 100));
            isInRoom = socket.rooms.has(roomIdStr);
          }
        }
        
        if (!isInRoom) {
          logger.warn(`Timer start: Socket ${socket.id} not in room ${roomIdStr}. Current rooms: ${Array.from(socket.rooms).join(', ')}, currentRoomId: ${socket.currentRoomId}`);
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const now = Date.now();
        const focusMs = focusMinutes * 60 * 1000;

        roomStates.set(roomIdStr, {
          mode: 'focus',
          endsAt: now + focusMs,
          isRunning: true,
          durations: {
            focusMinutes,
            breakMinutes,
          },
        });

        // Emit sync to all in room (including sender)
        const syncData = {
          mode: 'focus',
          endsAt: now + focusMs,
          isRunning: true,
          remaining: focusMs,
          durations: {
            focusMinutes,
            breakMinutes,
          },
        };
        io.to(roomIdStr).emit('timer:sync', syncData);
        logger.info(`Timer started in room ${roomIdStr}: ${focusMinutes}min focus / ${breakMinutes}min break`);
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

        // Normalize roomId to string
        const roomIdStr = String(roomId);
        
        // Check if socket is in the room - allow if currentRoomId matches
        let isInRoom = socket.rooms.has(roomIdStr);
        if (!isInRoom && socket.currentRoomId && String(socket.currentRoomId) === roomIdStr) {
          socket.join(roomIdStr);
          await new Promise(resolve => setTimeout(resolve, 50));
          isInRoom = socket.rooms.has(roomIdStr);
        }
        
        if (!isInRoom) {
          logger.warn(`Timer pause: Socket ${socket.id} not in room ${roomIdStr}`);
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        if (state.isRunning && state.endsAt) {
          // Calculate remaining time
          const now = Date.now();
          const remaining = Math.max(0, state.endsAt - now);
          
          // Update state - pause
          state.isRunning = false;
          // Adjust endsAt to maintain remaining time when resumed
          state.endsAt = now + remaining;

          io.to(roomIdStr).emit('timer:sync', {
            mode: state.mode,
            endsAt: state.endsAt,
            isRunning: false,
            remaining: remaining,
            durations: state.durations,
          });
          logger.info(`Timer paused in room ${roomIdStr}: ${Math.floor(remaining / 60000)}min remaining`);
        }
      } catch (error) {
        logger.error('Error pausing timer:', error);
        socket.emit('error', { message: 'Couldn\'t pause timer' });
      }
    });

    // Timer resume
    socket.on('timer:resume', async (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        // Normalize roomId to string
        const roomIdStr = String(roomId);
        
        // Check if socket is in the room - allow if currentRoomId matches
        let isInRoom = socket.rooms.has(roomIdStr);
        if (!isInRoom && socket.currentRoomId && String(socket.currentRoomId) === roomIdStr) {
          socket.join(roomIdStr);
          await new Promise(resolve => setTimeout(resolve, 50));
          isInRoom = socket.rooms.has(roomIdStr);
        }
        
        if (!isInRoom) {
          logger.warn(`Timer resume: Socket ${socket.id} not in room ${roomIdStr}`);
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        if (!state.isRunning && state.endsAt) {
          const now = Date.now();
          const remaining = Math.max(0, state.endsAt - now);
          
          if (remaining > 0) {
            // Resume with remaining time
            state.isRunning = true;
            state.endsAt = now + remaining;

            io.to(roomIdStr).emit('timer:sync', {
              mode: state.mode,
              endsAt: state.endsAt,
              isRunning: true,
              remaining: remaining,
              durations: state.durations,
            });
            logger.info(`Timer resumed in room ${roomIdStr}: ${Math.floor(remaining / 60000)}min remaining`);
          } else {
            // Timer expired while paused, reset it
            state.endsAt = null;
            state.isRunning = false;
            io.to(roomIdStr).emit('timer:sync', {
              mode: state.mode,
              endsAt: null,
              isRunning: false,
              remaining: 0,
              durations: state.durations,
            });
          }
        }
      } catch (error) {
        logger.error('Error resuming timer:', error);
        socket.emit('error', { message: 'Couldn\'t resume timer' });
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

        // Normalize roomId to string
        const roomIdStr = String(roomId);
        
        // Check if socket is in the room - allow if currentRoomId matches
        let isInRoom = socket.rooms.has(roomIdStr);
        if (!isInRoom && socket.currentRoomId && String(socket.currentRoomId) === roomIdStr) {
          socket.join(roomIdStr);
          await new Promise(resolve => setTimeout(resolve, 50));
          isInRoom = socket.rooms.has(roomIdStr);
        }
        
        if (!isInRoom) {
          logger.warn(`Timer reset: Socket ${socket.id} not in room ${roomIdStr}`);
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const state = roomStates.get(roomIdStr);
        
        // End any active sessions before resetting
        if (state && state.sessionStartTimes) {
          state.sessionStartTimes.forEach((sessionData, userId) => {
            endSession(userId, roomIdStr, sessionData);
          });
        }

        roomStates.delete(roomIdStr);

        io.to(roomIdStr).emit('timer:sync', {
          mode: 'focus',
          endsAt: null,
          isRunning: false,
          remaining: 0,
          durations: null,
        });
      } catch (error) {
        logger.error('Error resetting timer:', error);
        socket.emit('error', { message: 'Couldn\'t reset timer' });
      }
    });

    // Send current state when joining a room
    socket.on('timer:request-sync', (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          socket.emit('timer:sync', {
            mode: 'focus',
            endsAt: null,
            isRunning: false,
            remaining: 0,
            durations: null,
          });
          return;
        }

        // Normalize roomId to string
        const roomIdStr = String(roomId);
        
        // Check if socket is in the room (more lenient - allow if in room regardless of currentRoomId)
        const isInRoom = socket.rooms.has(roomIdStr);
        
        if (!isInRoom) {
          // Socket not in room yet, send default empty state
          socket.emit('timer:sync', {
            mode: 'focus',
            endsAt: null,
            isRunning: false,
            remaining: 0,
            durations: null,
          });
          return;
        }

        // Socket is in room, send current state
        const state = roomStates.get(roomIdStr);

        if (state) {
          const now = Date.now();
          const remaining = state.endsAt ? Math.max(0, state.endsAt - now) : 0;

          socket.emit('timer:sync', {
            mode: state.mode,
            endsAt: state.endsAt,
            isRunning: state.isRunning && remaining > 0,
            remaining: remaining,
            durations: state.durations,
          });
        } else {
          socket.emit('timer:sync', {
            mode: 'focus',
            endsAt: null,
            isRunning: false,
            remaining: 0,
            durations: null,
          });
        }
      } catch (error) {
        logger.error('Error syncing timer:', error);
        socket.emit('timer:sync', {
          mode: 'focus',
          endsAt: null,
          isRunning: false,
          remaining: 0,
          durations: null,
        });
      }
    });
  });
};

