import { logger } from '../utils/logger.js';
import StudySession from '../models/StudySession.js';

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
  } catch (error) {
    logger.error('Error ending study session:', error);
  }
}

export const initializeTimerHandlers = (io) => {
  // Timer tick - emit sync every 1 second for active timers
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, state] of roomStates.entries()) {
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
        
        io.to(roomId).emit('timer:sync', {
          mode: state.mode,
          endsAt: state.endsAt,
          isRunning: state.isRunning,
          remaining: remaining,
          durations: state.durations,
        });
      } else if (!state.isRunning && state.endsAt) {
        // Timer is paused, still emit sync with current remaining time
        const remaining = Math.max(0, state.endsAt - now);
        io.to(roomId).emit('timer:sync', {
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
    socket.on('timer:start', (data) => {
      try {
        const { roomId, focusMinutes, breakMinutes } = data;

        if (!roomId || !focusMinutes || !breakMinutes) {
          socket.emit('error', { message: 'Room ID and durations are required' });
          return;
        }

        // Validate user is in the room
        if (!socket.currentRoomId || socket.currentRoomId !== roomId || !socket.rooms.has(roomId)) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        const now = Date.now();
        const focusMs = focusMinutes * 60 * 1000;

        roomStates.set(roomId, {
          mode: 'focus',
          endsAt: now + focusMs,
          isRunning: true,
          durations: {
            focusMinutes,
            breakMinutes,
          },
        });

        // Emit sync to all in room
        io.to(roomId).emit('timer:sync', {
          mode: 'focus',
          endsAt: now + focusMs,
          isRunning: true,
          remaining: focusMs,
          durations: {
            focusMinutes,
            breakMinutes,
          },
        });
      } catch (error) {
        logger.error('Error starting timer:', error);
        socket.emit('error', { message: 'Couldn\'t start timer' });
      }
    });

    // Timer pause
    socket.on('timer:pause', (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        // Validate user is in the room
        if (!socket.currentRoomId || socket.currentRoomId !== roomId || !socket.rooms.has(roomId)) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        const state = roomStates.get(roomId);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        if (state.isRunning) {
          // Calculate remaining time
          const now = Date.now();
          const remaining = Math.max(0, state.endsAt - now);
          
          // Update state - pause
          state.isRunning = false;
          // Adjust endsAt to maintain remaining time when resumed
          state.endsAt = now + remaining;

          io.to(roomId).emit('timer:sync', {
            mode: state.mode,
            endsAt: state.endsAt,
            isRunning: false,
            remaining: remaining,
            durations: state.durations,
          });
        }
      } catch (error) {
        logger.error('Error pausing timer:', error);
        socket.emit('error', { message: 'Couldn\'t pause timer' });
      }
    });

    // Timer resume
    socket.on('timer:resume', (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        // Validate user is in the room
        if (!socket.currentRoomId || socket.currentRoomId !== roomId || !socket.rooms.has(roomId)) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        const state = roomStates.get(roomId);
        if (!state) {
          socket.emit('error', { message: 'Timer not found' });
          return;
        }

        if (!state.isRunning && state.endsAt) {
          const now = Date.now();
          const remaining = Math.max(0, state.endsAt - now);
          
          // Resume with remaining time
          state.isRunning = true;
          state.endsAt = now + remaining;

          io.to(roomId).emit('timer:sync', {
            mode: state.mode,
            endsAt: state.endsAt,
            isRunning: true,
            remaining: remaining,
            durations: state.durations,
          });
        }
      } catch (error) {
        logger.error('Error resuming timer:', error);
        socket.emit('error', { message: 'Couldn\'t resume timer' });
      }
    });

    // Timer reset
    socket.on('timer:reset', (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        // Validate user is in the room
        if (!socket.currentRoomId || socket.currentRoomId !== roomId || !socket.rooms.has(roomId)) {
          socket.emit('error', { message: 'Not in this room' });
          return;
        }

        const state = roomStates.get(roomId);
        
        // End any active sessions before resetting
        if (state && state.sessionStartTimes) {
          state.sessionStartTimes.forEach((sessionData, userId) => {
            endSession(userId, roomId, sessionData);
          });
        }

        roomStates.delete(roomId);

        io.to(roomId).emit('timer:sync', {
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

        // Check if user is in the room (but allow if join is in progress)
        const isInRoom = socket.currentRoomId === roomId && socket.rooms.has(roomId);
        
        if (!isInRoom && socket.currentRoomId) {
          // User is in a different room, don't sync
          return;
        }

        // Don't require room membership for read-only sync (allows sync during room join)
        const state = roomStates.get(roomId);

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

