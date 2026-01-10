import { logger } from '../utils/logger.js';

const activeSharers = new Map();

export const initializeScreenShareHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('screenshare:start', (data) => {
      try {
        const { roomId, offer } = data;

        if (!roomId || !offer) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        if (!socket.currentRoomId || String(socket.currentRoomId) !== String(roomId)) {
          socket.emit('error', { message: 'Please join the room first' });
          return;
        }

        const roomIdStr = String(roomId);

        if (activeSharers.has(roomIdStr)) {
          socket.emit('error', { message: 'Someone is already sharing their screen' });
          return;
        }

        activeSharers.set(roomIdStr, socket.id);

        socket.to(roomIdStr).emit('screenshare:start', {
          userId: socket.id,
          offer,
        });

        logger.info(`Screen share started in room ${roomIdStr} by ${socket.userId}`);
      } catch (error) {
        logger.error('Error starting screen share:', error);
        socket.emit('error', { message: 'Failed to start screen share' });
      }
    });

    socket.on('screenshare:stop', (data) => {
      try {
        const { roomId } = data;

        if (!roomId) {
          return;
        }

        const roomIdStr = String(roomId);
        const sharerId = activeSharers.get(roomIdStr);

        if (sharerId === socket.id) {
          activeSharers.delete(roomIdStr);
          io.to(roomIdStr).emit('screenshare:stop', { userId: socket.id });
          logger.info(`Screen share stopped in room ${roomIdStr}`);
        }
      } catch (error) {
        logger.error('Error stopping screen share:', error);
      }
    });

    socket.on('screenshare:ice-candidate', (data) => {
      try {
        const { roomId, candidate } = data;

        if (!roomId || !candidate) {
          return;
        }

        const roomIdStr = String(roomId);

        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          return;
        }

        // Check if this socket is the sharer
        const sharerId = activeSharers.get(roomIdStr);
        if (sharerId === socket.id) {
          // Sharer's ICE candidates go to all viewers
          socket.to(roomIdStr).emit('screenshare:ice-candidate', {
            userId: socket.id,
            candidate,
          });
        } else {
          // Viewer's ICE candidates go only to the sharer
          if (sharerId) {
            io.to(sharerId).emit('screenshare:ice-candidate', {
              userId: socket.id,
              candidate,
            });
          }
        }
      } catch (error) {
        logger.error('Error handling ICE candidate:', error);
      }
    });

    socket.on('screenshare:answer', (data) => {
      try {
        const { roomId, answer, sharerUserId } = data;

        if (!roomId || !answer || !sharerUserId) {
          return;
        }

        const roomIdStr = String(roomId);

        if (!socket.currentRoomId || String(socket.currentRoomId) !== roomIdStr) {
          return;
        }

        io.to(sharerUserId).emit('screenshare:answer', {
          userId: socket.id,
          answer,
        });
      } catch (error) {
        logger.error('Error handling answer:', error);
      }
    });

    socket.on('disconnect', () => {
      for (const [roomId, sharerId] of activeSharers.entries()) {
        if (sharerId === socket.id) {
          activeSharers.delete(roomId);
          io.to(roomId).emit('screenshare:stop', { userId: socket.id });
        }
      }
    });
  });
};
