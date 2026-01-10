import express from 'express';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Get user analytics
router.get('/me', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    let days = 30;
    if (range === '30d') days = 30;
    if (range === '7d') days = 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const user = await User.findById(req.user._id);

    // Get focus sessions
    const focusSessions = await StudySession.find({
      userId: req.user._id,
      mode: 'focus',
      startedAt: { $gte: startDate },
      endedAt: { $ne: null },
    }).lean();

    // Group focus minutes by day
    const focusMinutesByDay = {};
    focusSessions.forEach(session => {
      const day = session.startedAt.toISOString().split('T')[0];
      const minutes = Math.floor(session.durationSeconds / 60);
      if (!focusMinutesByDay[day]) {
        focusMinutesByDay[day] = 0;
      }
      focusMinutesByDay[day] += minutes;
    });

    // Get tasks completed
    const tasksCompleted = await Task.countDocuments({
      createdBy: req.user._id,
      status: 'done',
      createdAt: { $gte: startDate },
    });

    // Get most used rooms (top 5)
    const roomUsage = await StudySession.aggregate([
      {
        $match: {
          userId: req.user._id,
          roomId: { $ne: null },
          startedAt: { $gte: startDate },
          endedAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$roomId',
          totalMinutes: { $sum: { $divide: ['$durationSeconds', 60] } },
        },
      },
      {
        $sort: { totalMinutes: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const roomIds = roomUsage.map(r => r._id);
    const rooms = await Room.find({ _id: { $in: roomIds } })
      .select('name description')
      .lean();

    const mostUsedRooms = roomUsage.map(usage => {
      const room = rooms.find(r => r._id.toString() === usage._id.toString());
      return {
        roomId: usage._id,
        roomName: room?.name || 'Unknown Room',
        totalMinutes: Math.floor(usage.totalMinutes),
      };
    });

    // Calculate goal progress
    const dailyGoalMinutes = user.preferences?.focus?.dailyGoalMinutes || 120;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = await StudySession.find({
      userId: req.user._id,
      mode: 'focus',
      startedAt: { $gte: today },
      endedAt: { $ne: null },
    }).lean();

    const todayMinutes = todaySessions.reduce((sum, s) => sum + Math.floor(s.durationSeconds / 60), 0);
    const goalProgress = {
      dailyGoalMinutes,
      actualMinutes: todayMinutes,
      progressPercent: Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)),
    };

    // Get streak count
    const streakCount = user.stats?.streakCount || 0;

    res.json({
      success: true,
      analytics: {
        focusMinutesByDay,
        streakCount,
        tasksCompletedCount: tasksCompleted,
        mostUsedRooms,
        goalProgress,
        range: days,
      },
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get friends leaderboard (focus time last 7 days)
router.get('/leaderboard', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('friends');
    
    if (!user.friends || user.friends.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const leaderboard = await StudySession.aggregate([
      {
        $match: {
          userId: { $in: user.friends },
          mode: 'focus',
          startedAt: { $gte: startDate },
          endedAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalMinutes: { $sum: { $divide: ['$durationSeconds', 60] } },
        },
      },
      {
        $sort: { totalMinutes: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const userIds = leaderboard.map(l => l._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name avatar avatarUrl')
      .lean();

    const leaderboardWithUsers = leaderboard.map(entry => {
      const userData = users.find(u => u._id.toString() === entry._id.toString());
      return {
        userId: entry._id,
        name: userData?.name || 'Unknown',
        avatar: userData?.avatar || userData?.avatarUrl || null,
        totalMinutes: Math.floor(entry.totalMinutes),
      };
    });

    res.json({
      success: true,
      leaderboard: leaderboardWithUsers,
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

