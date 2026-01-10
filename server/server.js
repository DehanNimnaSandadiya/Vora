// Load environment variables FIRST before any other imports
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import passport from 'passport';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db.js';
import { initializeEmail } from './config/email.js';
import './config/passport.js';
import { helmetConfig, authRateLimit, apiRateLimit } from './middleware/security.js';
import { requestLogger, logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import googleAuthRouter from './routes/googleAuth.js';
import roomsRouter from './routes/rooms.js';
import tasksRouter from './routes/tasks.js';
import usersRouter from './routes/users.js';
import invitesRouter from './routes/invites.js';
import adminRouter from './routes/admin.js';
import friendsRouter from './routes/friends.js';
import presetsRouter from './routes/presets.js';
import sessionsRouter from './routes/sessions.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter from './routes/analytics.js';
import roomInvitesRouter from './routes/roomInvites.js';
import taskCommentsRouter from './routes/taskComments.js';
import taskTemplatesRouter from './routes/taskTemplates.js';
import messagesRouter from './routes/messages.js';
import { socketAuth } from './middleware/socketAuth.js';
import { initializeRoomHandlers } from './socket/roomHandlers.js';
import { initializeTimerHandlers } from './socket/timerHandlers.js';
import { initializeScreenShareHandlers } from './socket/screenShareHandlers.js';

const app = express();

// Normalize CLIENT_URL - remove trailing slash for CORS matching
const normalizeUrl = (url) => {
  if (!url) return 'http://localhost:5173';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

const CLIENT_URL = normalizeUrl(process.env.CLIENT_URL);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(new Error('No origin header'));
      }
      const normalizedOrigin = normalizeUrl(origin);
      if (normalizedOrigin === CLIENT_URL) {
        callback(null, origin);
      } else {
        logger.warn(`Socket.io CORS blocked: ${origin} (normalized: ${normalizedOrigin}) not matching ${CLIENT_URL}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  pingTimeout: 60000,
  pingInterval: 25025,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Socket.io authentication
io.use(socketAuth);

// PORT handling - Render sets PORT automatically, fallback for local dev only
const PORT = process.env.PORT || 5000;
if (!process.env.PORT && process.env.NODE_ENV === 'production') {
  logger.warn('⚠️  PORT environment variable not set in production. Using default 5000.');
}

// Security middleware
app.use(helmetConfig);

// CORS - strict with CLIENT_URL (handles trailing slashes)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Normalize both incoming origin and allowed origin (remove trailing slashes)
    const normalizedOrigin = normalizeUrl(origin);
    const normalizedAllowed = CLIENT_URL;
    
    // Check if normalized origins match
    if (normalizedOrigin === normalizedAllowed) {
      // Return the exact origin that was requested (CORS requirement)
      callback(null, origin);
    } else {
      logger.warn(`CORS blocked: ${origin} (normalized: ${normalizedOrigin}) not matching ${normalizedAllowed}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization - prevent NoSQL injection
app.use(mongoSanitize());

// Request logging
app.use(requestLogger);

// Session for passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vora-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Store io instance for use in routes
app.set('io', io);

// Routes
app.use('/health', healthRouter);
// Mount Google OAuth routes at /api/auth (standardized route)
app.use('/api/auth', googleAuthRouter); // Google OAuth routes (/api/auth/google, /api/auth/google/callback)
// Mount auth routes at /api/auth (general auth routes)
app.use('/api/auth', authRateLimit, authRouter); // Rate limit auth routes
// Also mount at /auth for backward compatibility
app.use('/auth', googleAuthRouter); // Google OAuth routes (/auth/google, /auth/google/callback)
app.use('/auth', authRateLimit, authRouter); // General auth routes
app.use('/api/rooms', apiRateLimit, roomsRouter);
app.use('/rooms', apiRateLimit, roomsRouter); // Also mount at /rooms for client compatibility
app.use('/api/users', apiRateLimit, usersRouter);
app.use('/users', apiRateLimit, usersRouter); // Also mount at /users for client compatibility
app.use('/api/invites', apiRateLimit, invitesRouter);
app.use('/invites', apiRateLimit, invitesRouter); // Also mount at /invites for client compatibility
app.use('/api/tasks', apiRateLimit, tasksRouter);
app.use('/tasks', apiRateLimit, tasksRouter); // Also mount at /tasks for client compatibility
app.use('/api/admin', apiRateLimit, adminRouter);
app.use('/admin', apiRateLimit, adminRouter); // Also mount at /admin for client compatibility
app.use('/api/friends', apiRateLimit, friendsRouter);
app.use('/friends', apiRateLimit, friendsRouter);
app.use('/api/presets', apiRateLimit, presetsRouter);
app.use('/presets', apiRateLimit, presetsRouter);
app.use('/api/sessions', apiRateLimit, sessionsRouter);
app.use('/sessions', apiRateLimit, sessionsRouter);
app.use('/api/notifications', apiRateLimit, notificationsRouter);
app.use('/notifications', apiRateLimit, notificationsRouter);
app.use('/api/analytics', apiRateLimit, analyticsRouter);
app.use('/analytics', apiRateLimit, analyticsRouter);
app.use('/api/rooms', apiRateLimit, roomInvitesRouter); // Mount roomInvites at /api/rooms/:id/invites
app.use('/api/tasks', apiRateLimit, taskCommentsRouter); // Mount taskComments at /api/tasks/:taskId/comments
app.use('/api/task-templates', apiRateLimit, taskTemplatesRouter);
app.use('/task-templates', apiRateLimit, taskTemplatesRouter);
app.use('/api/messages', apiRateLimit, messagesRouter);
app.use('/messages', apiRateLimit, messagesRouter);

// Log mounted routes in development
if (process.env.NODE_ENV !== 'production') {
  logger.info('📋 API Routes mounted successfully');
}

// Socket.io connection logging
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} from ${socket.handshake.address}`);
  
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

io.engine.on('connection_error', (err) => {
  logger.error('Socket.io engine connection error:', err);
});

// Socket.io handlers
initializeRoomHandlers(io);
initializeTimerHandlers(io);
initializeScreenShareHandlers(io);

// Initialize email
initializeEmail();

// 404 handler for unmatched API routes (must be after all routes)
app.use('/api/*', (req, res) => {
  logger.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} (http://0.0.0.0:${PORT})`);
      logger.info(`📡 Socket.io server ready`);
      logger.info(`🌐 Client URL: ${CLIENT_URL}`);
      if (process.env.GOOGLE_CLIENT_ID) {
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/google/callback`;
        logger.info(`🔐 Google OAuth callback: ${callbackUrl}`);
      }
    });
  })
  .catch((error) => {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  });

export { io };

