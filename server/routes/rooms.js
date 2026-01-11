import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const createRoomValidation = [
  body('name').trim().notEmpty().withMessage('Room name is required').isLength({ max: 100 }).withMessage('Room name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
  body('goal').optional().trim().isLength({ max: 200 }).withMessage('Goal cannot exceed 200 characters'),
  body('pinnedNotes').optional().trim().isLength({ max: 2000 }).withMessage('Pinned notes cannot exceed 2000 characters'),
  body('schedule.startsAt').optional().isISO8601().withMessage('Invalid start date'),
  body('schedule.endsAt').optional().isISO8601().withMessage('Invalid end date'),
  body('schedule.repeats').optional().isIn(['none', 'daily', 'weekly']).withMessage('Invalid repeat value'),
  body('codeExpiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
];

const joinRoomValidation = [
  body('code').optional().trim().isLength({ min: 4, max: 20 }).withMessage('Code must be between 4 and 20 characters'),
];

// Create room
router.post('/', createRoomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { name, description, isPrivate, goal, pinnedNotes, schedule, codeExpiresAt } = req.body;

    const room = await Room.create({
      name,
      description: description || '',
      isPrivate: isPrivate || false,
      owner: req.user._id,
      members: [req.user._id],
      goal: goal || '',
      pinnedNotes: pinnedNotes || '',
      schedule: schedule || { repeats: 'none' },
      codeExpiresAt: codeExpiresAt ? new Date(codeExpiresAt) : null,
    });

    await room.populate('owner', 'name email avatar badges');

    res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Get all rooms - public rooms visible to all, private rooms only if user is a member
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false }, // All public rooms
        { owner: req.user._id }, // User's own private rooms
        { members: req.user._id }, // Private rooms user is a member of
      ],
    })
      .populate('owner', 'name email avatar badges')
      .populate('members', 'name email avatar badges')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'name email avatar badges')
      .populate('members', 'name email avatar badges');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is owner or member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(member => member._id.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Room is private.',
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Join room
router.post('/:id/join', joinRoomValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is already a member
    if (room.members.includes(req.user._id)) {
      return res.json({
        success: true,
        message: 'Already a member of this room',
        room,
      });
    }

    // Validate code for private rooms
    if (room.isPrivate) {
      const { code } = req.body;
      if (!code || code !== room.code) {
        return res.status(403).json({
          success: false,
          message: 'Invalid room code',
        });
      }
    }

    // Add user to members
    room.members.push(req.user._id);
    await room.save();

    await room.populate('owner', 'name email avatar badges');
    await room.populate('members', 'name email avatar badges');

    res.json({
      success: true,
      message: 'Successfully joined room',
      room,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Get room messages
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ roomId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await Message.countDocuments({ roomId: req.params.id });

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// ===== TASKS ROUTES (REST design: /rooms/:roomId/tasks) =====

const createTaskValidation = [
  body('text').trim().notEmpty().withMessage('Task text is required').isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
];

const updateTaskValidation = [
  body('text').optional().trim().isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('status').optional().isIn(['todo', 'doing', 'done']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
];

// Get tasks for a room
router.get('/:id/tasks', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const tasks = await Task.find({ roomId: req.params.id })
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Get Jitsi call details for a room
router.get('/:id/call', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    
    // Generate unique room name per call to avoid members-only/lobby issues
    const roomIdStr = req.params.id.toString();
    const randomId = crypto.randomBytes(4).toString('hex');
    const roomName = `vora-${roomIdStr}-${randomId}`;

    res.json({
      success: true,
      domain,
      roomName,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Create task
router.post('/:id/tasks', createTaskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { text, assignedTo, status } = req.body;

    const task = await Task.create({
      roomId: req.params.id,
      text,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      status: status || 'todo',
    });

    await task.populate('createdBy', 'name email avatar');
    if (task.assignedTo) {
      await task.populate('assignedTo', 'name email avatar');
    }

    // Emit task update via socket
    req.app.get('io').to(req.params.id).emit('tasks:updated', {
      action: 'create',
      task,
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID or assignedTo ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Update task
router.patch('/:id/tasks/:taskId', updateTaskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify task belongs to the room
    if (task.roomId.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Task does not belong to this room',
      });
    }

    // Check if user is a member of the room
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { text, status, assignedTo, dueDate, priority, tags } = req.body;
    const previousAssignedTo = task.assignedTo?.toString();

    if (text !== undefined) task.text = text;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) task.priority = priority;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    await task.populate('createdBy', 'name email avatar');
    if (task.assignedTo) {
      await task.populate('assignedTo', 'name email avatar');
    }

    // Create notification if task is assigned to someone new
    if (assignedTo && assignedTo !== previousAssignedTo && assignedTo !== req.user._id.toString()) {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        userId: assignedTo,
        type: 'task_assigned',
        title: 'Task Assigned',
        body: `${req.user.name} assigned you a task: ${task.text.substring(0, 50)}${task.text.length > 50 ? '...' : ''}`,
        data: { taskId: task._id, roomId: req.params.id },
      });

      // Emit notification via socket
      req.app.get('io').to(`user:${assignedTo}`).emit('notifications:new', {
        type: 'task_assigned',
        title: 'Task Assigned',
        body: `${req.user.name} assigned you a task`,
      });
    }

    // Emit task update via socket
    req.app.get('io').to(req.params.id).emit('tasks:updated', {
      action: 'update',
      task,
    });

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Delete task
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify task belongs to the room
    if (task.roomId.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Task does not belong to this room',
      });
    }

    // Check if user is creator or room owner
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isRoomOwner = room.owner._id.toString() === req.user._id.toString();

    if (!isCreator && !isRoomOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only task creator or room owner can delete tasks',
      });
    }

    await task.deleteOne();

    // Emit task update via socket
    req.app.get('io').to(req.params.id).emit('tasks:updated', {
      action: 'delete',
      taskId: req.params.taskId,
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Update room (owner/mod only)
router.patch('/:id', [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Room name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('goal').optional().trim().isLength({ max: 200 }).withMessage('Goal cannot exceed 200 characters'),
  body('pinnedNotes').optional().trim().isLength({ max: 2000 }).withMessage('Pinned notes cannot exceed 2000 characters'),
  body('isPrivate').optional().isBoolean(),
  body('schedule.startsAt').optional().isISO8601(),
  body('schedule.endsAt').optional().isISO8601(),
  body('schedule.repeats').optional().isIn(['none', 'daily', 'weekly']),
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

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is owner
    const isOwner = room.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can update room settings',
      });
    }

    const { name, description, goal, pinnedNotes, isPrivate, schedule } = req.body;

    if (name !== undefined) room.name = name.trim();
    if (description !== undefined) room.description = description.trim();
    if (goal !== undefined) room.goal = goal.trim();
    if (pinnedNotes !== undefined) room.pinnedNotes = pinnedNotes.trim();
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (schedule !== undefined) {
      room.schedule = {
        startsAt: schedule.startsAt ? new Date(schedule.startsAt) : null,
        endsAt: schedule.endsAt ? new Date(schedule.endsAt) : null,
        repeats: schedule.repeats || 'none',
      };
    }

    await room.save();

    await room.populate('owner', 'name email avatar badges');
    await room.populate('members', 'name email avatar badges');

    // Emit update via socket
    req.app.get('io').to(req.params.id).emit('room:updated', { room });

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Update room member role (owner only)
router.post('/:id/role', [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['owner', 'moderator', 'member']).withMessage('Invalid role'),
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

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is owner
    const isOwner = room.owner.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can update roles',
      });
    }

    const { userId, role } = req.body;

    // Don't allow changing owner role
    if (role === 'owner' && userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer ownership via this endpoint',
      });
    }

    // Check if user is a member
    if (!room.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this room',
      });
    }

    // Use RoomMember model if available, otherwise update room metadata
    const RoomMember = (await import('../models/RoomMember.js')).default;
    let roomMember = await RoomMember.findOne({ roomId: req.params.id, userId });
    
    if (roomMember) {
      roomMember.role = role;
      await roomMember.save();
    } else {
      // Create RoomMember entry
      roomMember = await RoomMember.create({
        roomId: req.params.id,
        userId,
        role,
      });
    }

    // Emit update via socket
    req.app.get('io').to(req.params.id).emit('room:role-updated', { userId, role });

    res.json({
      success: true,
      message: 'Role updated successfully',
      role,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID or user ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

