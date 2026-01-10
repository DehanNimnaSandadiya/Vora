import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string') {
      logger.warn('Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      // Verify token with JWT_SECRET
      if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET not configured');
        return next(new Error('Authentication error: Server configuration error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        logger.warn('Socket connection rejected: Invalid token payload');
        return next(new Error('Authentication error: Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.warn(`Socket connection rejected: User not found (${decoded.id})`);
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      logger.debug(`Socket authenticated: ${user.email} (${socket.id})`);
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Socket connection rejected: Invalid JWT token');
        return next(new Error('Authentication error: Invalid token'));
      } else if (error.name === 'TokenExpiredError') {
        logger.warn('Socket connection rejected: Expired token');
        return next(new Error('Authentication error: Token expired'));
      }
      logger.error('Socket auth error:', error);
      return next(new Error('Authentication error: Token verification failed'));
    }
  } catch (error) {
    logger.error('Socket auth unexpected error:', error);
    next(new Error('Authentication error'));
  }
};

