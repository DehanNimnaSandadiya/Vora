import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/protect.js';
import { adminOnly } from '../middleware/adminOnly.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import { getActiveSocketUsersCount } from '../socket/roomHandlers.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalTasks = await Task.countDocuments();
    const activeSocketUsers = getActiveSocketUsersCount();

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const roomsCreatedLast7Days = await Room.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRooms,
        totalMessages,
        totalTasks,
        activeSocketUsers,
        newUsersLast7Days,
        roomsCreatedLast7Days,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Users by day (last 14 days)
    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Rooms by day (last 14 days)
    const roomsByDay = await Room.aggregate([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Messages by day (last 14 days)
    const messagesByDay = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Fill in missing dates with 0 counts
    const dateMap = new Map();
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, count: 0 });
    }

    usersByDay.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.set(item.date, { ...dateMap.get(item.date), count: item.count });
      }
    });
    const filledUsersByDay = Array.from(dateMap.values());

    dateMap.forEach((value, key) => {
      dateMap.set(key, { date: key, count: 0 });
    });
    roomsByDay.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.set(item.date, { ...dateMap.get(item.date), count: item.count });
      }
    });
    const filledRoomsByDay = Array.from(dateMap.values());

    dateMap.forEach((value, key) => {
      dateMap.set(key, { date: key, count: 0 });
    });
    messagesByDay.forEach(item => {
      if (dateMap.has(item.date)) {
        dateMap.set(item.date, { ...dateMap.get(item.date), count: item.count });
      }
    });
    const filledMessagesByDay = Array.from(dateMap.values());

    res.json({
      success: true,
      data: {
        usersByDay: filledUsersByDay,
        roomsByDay: filledRoomsByDay,
        messagesByDay: filledMessagesByDay,
        tasksByStatus: tasksByStatus || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// POST /api/admin/seed-users - Create sample users for demo
router.post('/seed-users', async (req, res) => {
  try {
    const sampleUsers = [
      { name: 'Alex Chen', email: 'alex.demo@vora.test', university: 'MIT' },
      { name: 'Sarah Johnson', email: 'sarah.demo@vora.test', university: 'Stanford' },
      { name: 'Mike Rodriguez', email: 'mike.demo@vora.test', university: 'Harvard' },
      { name: 'Emma Wilson', email: 'emma.demo@vora.test', university: 'Yale' },
      { name: 'David Kim', email: 'david.demo@vora.test', university: 'Berkeley' },
      { name: 'Lisa Anderson', email: 'lisa.demo@vora.test', university: 'Princeton' },
      { name: 'James Brown', email: 'james.demo@vora.test', university: 'Columbia' },
      { name: 'Maria Garcia', email: 'maria.demo@vora.test', university: 'UCLA' },
    ];

    const createdUsers = [];
    const defaultPassword = await bcrypt.hash('demo123', 10);

    for (const userData of sampleUsers) {
      // Check if user already exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        createdUsers.push({ email: userData.email, status: 'already_exists' });
        continue;
      }

      const user = await User.create({
        ...userData,
        password: defaultPassword,
        provider: 'local',
        role: 'user',
      });
      createdUsers.push({ email: user.email, name: user.name, status: 'created', id: user._id });
    }

    res.json({
      success: true,
      message: `Seed operation completed. ${createdUsers.filter(u => u.status === 'created').length} users created.`,
      users: createdUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed users',
    });
  }
});

export default router;
