import express from 'express';
import { body, validationResult } from 'express-validator';
import StudySession from '../models/StudySession.js';
import User from '../models/User.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Store active sessions in memory (userId -> sessionId)
const activeSessions = new Map();

// Start study session
router.post('/start', [
  body('roomId').optional().isMongoId().withMessage('Invalid room ID'),
  body('mode').isIn(['focus', 'break']).withMessage('Mode must be focus or break'),
  body('source').isIn(['pomodoro', 'manual']).withMessage('Source must be pomodoro or manual'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { roomId, mode, source } = req.body;

    // End any existing active session for this user
    const existingSessionId = activeSessions.get(req.user._id.toString());
    if (existingSessionId) {
      const existingSession = await StudySession.findById(existingSessionId);
      if (existingSession && !existingSession.endedAt) {
        const durationSeconds = Math.floor((Date.now() - existingSession.startedAt.getTime()) / 1000);
        existingSession.endedAt = new Date();
        existingSession.durationSeconds = durationSeconds;
        await existingSession.save();
        activeSessions.delete(req.user._id.toString());
      }
    }

    // Create new session
    const session = await StudySession.create({
      userId: req.user._id,
      roomId: roomId || null,
      startedAt: new Date(),
      mode,
      source,
    });

    activeSessions.set(req.user._id.toString(), session._id.toString());

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    logger.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// End study session
router.post('/end', [
  body('sessionId').optional().isMongoId().withMessage('Invalid session ID'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { sessionId } = req.body;

    let session;
    if (sessionId) {
      session = await StudySession.findOne({ _id: sessionId, userId: req.user._id });
    } else {
      // End the active session
      const activeSessionId = activeSessions.get(req.user._id.toString());
      if (activeSessionId) {
        session = await StudySession.findById(activeSessionId);
      }
    }

    if (!session || session.endedAt) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found',
      });
    }

    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    session.endedAt = new Date();
    session.durationSeconds = durationSeconds;
    await session.save();

    activeSessions.delete(req.user._id.toString());

    // Update user stats if focus session completed
    if (session.mode === 'focus' && durationSeconds > 0) {
      const user = await User.findById(req.user._id);
      if (user.preferences && user.preferences.focus) {
        const dailyGoalMinutes = user.preferences.focus.dailyGoalMinutes || 120;
        const sessionMinutes = Math.floor(durationSeconds / 60);
        
        // Check if goal was met today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get total focus minutes for today
        const todaySessions = await StudySession.find({
          userId: req.user._id,
          mode: 'focus',
          startedAt: { $gte: today },
          endedAt: { $ne: null },
        });

        const totalMinutes = todaySessions.reduce((sum, s) => sum + Math.floor(s.durationSeconds / 60), 0);
        
        if (totalMinutes >= dailyGoalMinutes && user.stats) {
          const lastGoalMet = user.stats.lastGoalMetDate;
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (!lastGoalMet || lastGoalMet < yesterday) {
            // New streak
            user.stats.streakCount = 1;
          } else if (lastGoalMet >= yesterday && lastGoalMet < today) {
            // Continue streak
            user.stats.streakCount = (user.stats.streakCount || 0) + 1;
          }
          user.stats.lastGoalMetDate = today;
          await user.save();
        }
      }
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get session summary
router.get('/summary', async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    let days = 7;
    if (range === '30d') days = 30;
    if (range === '7d') days = 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await StudySession.find({
      userId: req.user._id,
      mode: 'focus',
      startedAt: { $gte: startDate },
      endedAt: { $ne: null },
    }).sort({ startedAt: 1 }).lean();

    // Group by day
    const byDay = {};
    let totalMinutes = 0;

    sessions.forEach(session => {
      const day = session.startedAt.toISOString().split('T')[0];
      const minutes = Math.floor(session.durationSeconds / 60);
      totalMinutes += minutes;

      if (!byDay[day]) {
        byDay[day] = 0;
      }
      byDay[day] += minutes;
    });

    // Calculate weekly totals
    const weeklyTotals = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.toISOString().split('T')[0];
      weeklyTotals.push({
        date: dayKey,
        minutes: byDay[dayKey] || 0,
      });
    }

    res.json({
      success: true,
      summary: {
        totalMinutes,
        focusMinutesByDay: weeklyTotals,
        days,
      },
    });
  } catch (error) {
    logger.error('Error fetching session summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Export sessions as CSV
router.get('/export', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    let days = 30;
    if (range === '30d') days = 30;
    if (range === '7d') days = 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await StudySession.find({
      userId: req.user._id,
      startedAt: { $gte: startDate },
      endedAt: { $ne: null },
    }).sort({ startedAt: 1 }).lean();

    // Generate CSV
    const csvHeader = 'Date,Start Time,End Time,Duration (minutes),Mode,Source,Room ID\n';
    const csvRows = sessions.map(session => {
      const startDate = new Date(session.startedAt);
      const endDate = new Date(session.endedAt);
      const durationMinutes = Math.floor(session.durationSeconds / 60);
      
      return `${startDate.toISOString().split('T')[0]},${startDate.toTimeString().split(' ')[0]},${endDate.toTimeString().split(' ')[0]},${durationMinutes},${session.mode},${session.source},${session.roomId || ''}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=study-sessions-${range}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

