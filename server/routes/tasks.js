import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Room from '../models/Room.js';
import { protect } from '../middleware/protect.js';
import { checkAndAwardBadges } from '../utils/badges.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const createTaskValidation = [
  body('text').trim().notEmpty().withMessage('Task text is required').isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag cannot exceed 50 characters'),
];

const updateTaskValidation = [
  body('text').optional().trim().isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('status').optional().isIn(['todo', 'doing', 'done']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag cannot exceed 50 characters'),
];

// Get tasks for a room
// Handles both /api/tasks/:roomId/tasks and /api/tasks/rooms/:roomId/tasks
router.get('/:roomId/tasks', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

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

    const tasks = await Task.find({ roomId: req.params.roomId })
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

// Create task
// Handles both /api/tasks/:roomId/tasks and /api/tasks/rooms/:roomId/tasks
router.post('/:roomId/tasks', createTaskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const room = await Room.findById(req.params.roomId);

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

    const { text, assignedTo, status, dueDate, priority, tags } = req.body;

    const task = await Task.create({
      roomId: req.params.roomId,
      text,
      createdBy: req.user._id,
      assignedTo: assignedTo || null,
      status: status || 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
      tags: tags || [],
    });

    await task.populate('createdBy', 'name email avatar');
    if (task.assignedTo) {
      await task.populate('assignedTo', 'name email avatar');
    }

    // Create notification if task is assigned to someone
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.create({
        userId: task.assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        body: `${req.user.name} assigned you a task: ${task.text.substring(0, 50)}${task.text.length > 50 ? '...' : ''}`,
        data: { taskId: task._id, roomId: req.params.roomId },
      });

      // Emit notification via socket
      req.app.get('io').to(`user:${task.assignedTo}`).emit('notifications:new', {
        type: 'task_assigned',
        title: 'New Task Assigned',
        body: `${req.user.name} assigned you a task`,
      });
    }

    // Convert to plain object for socket emission
    const taskObj = task.toObject ? task.toObject() : JSON.parse(JSON.stringify(task));

    // Emit task update via socket
    req.app.get('io').to(req.params.roomId).emit('tasks:updated', {
      action: 'create',
      task: taskObj,
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
router.patch('/:taskId', updateTaskValidation, async (req, res) => {
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

    // Check if user is a member of the room
    const room = await Room.findById(task.roomId);
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

    const wasCompleted = task.status === 'done';
    if (text !== undefined) task.text = text;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) task.priority = priority;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    // Check badges if task was just completed
    if (status === 'done' && !wasCompleted && task.assignedTo) {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(task.assignedTo, {
        $inc: { 'stats.tasksCompleted': 1 },
      });
      await checkAndAwardBadges(task.assignedTo.toString());
    }

    await task.populate('createdBy', 'name email avatar');
    if (task.assignedTo) {
      await task.populate('assignedTo', 'name email avatar');
    }

    // Convert to plain object for socket emission (handles Mongoose documents)
    const taskObj = task.toObject ? task.toObject() : JSON.parse(JSON.stringify(task));

    // Emit task update via socket - use roomId as string
    const roomIdStr = task.roomId.toString();
    req.app.get('io').to(roomIdStr).emit('tasks:updated', {
      action: 'update',
      task: taskObj,
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
router.delete('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is creator or room owner
    const room = await Room.findById(task.roomId);
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

    const roomId = task.roomId.toString();
    await task.deleteOne();

    // Emit task update via socket
    req.app.get('io').to(roomId).emit('tasks:updated', {
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

export default router;

