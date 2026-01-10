import express from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/protect.js';
import { adminOnly } from '../middleware/adminOnly.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import { getActiveSocketUsersCount } from '../socket/roomHandlers.js';

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

// GET /api/admin/users?page=1&limit=10&search=
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { university: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// PATCH /api/admin/users/:id
router.patch(
  '/users/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('university').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, university } = req.body;

      // Don't allow updating admin override
      if (id === 'admin-override') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update admin user',
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update only allowed fields
      if (name !== undefined) user.name = name;
      if (university !== undefined) user.university = university;

      await user.save();

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          university: user.university,
          provider: user.provider,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Server error',
      });
    }
  }
);

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin override
    if (id === 'admin-override') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find rooms owned by user
    const ownedRooms = await Room.find({ owner: id });
    const roomIds = ownedRooms.map((room) => room._id);

    // Delete related data
    await Message.deleteMany({ userId: id });
    await Task.deleteMany({ $or: [{ createdBy: id }, { assignedTo: id }] });
    await Message.deleteMany({ roomId: { $in: roomIds } });
    await Task.deleteMany({ roomId: { $in: roomIds } });
    await Room.deleteMany({ owner: id });

    // Remove user from room memberships
    await Room.updateMany(
      { members: id },
      { $pull: { members: id } }
    );

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// GET /api/admin/rooms?page=1&limit=10&search=
router.get('/rooms', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const rooms = await Room.find(searchQuery)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get member and message counts for each room
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const memberCount = room.members ? room.members.length : 0;
        const messageCount = await Message.countDocuments({ roomId: room._id });

        return {
          _id: room._id,
          name: room.name,
          isPrivate: room.isPrivate,
          owner: room.owner,
          createdAt: room.createdAt,
          memberCount,
          messageCount,
        };
      })
    );

    const total = await Room.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        rooms: roomsWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// DELETE /api/admin/rooms/:id
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Delete related data
    await Message.deleteMany({ roomId: id });
    await Task.deleteMany({ roomId: id });

    // Delete room
    await Room.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Room deleted successfully',
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
    // Last 14 days
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
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
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
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
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
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
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

    // Ensure all statuses are present
    const statusMap = { todo: 0, doing: 0, done: 0 };
    tasksByStatus.forEach((item) => {
      statusMap[item.status] = item.count;
    });

    res.json({
      success: true,
      data: {
        usersByDay,
        roomsByDay,
        messagesByDay,
        tasksByStatus: [
          { status: 'todo', count: statusMap.todo },
          { status: 'doing', count: statusMap.doing },
          { status: 'done', count: statusMap.done },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

export default router;



