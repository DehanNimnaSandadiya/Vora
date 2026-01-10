import express from 'express';
import { body, validationResult } from 'express-validator';
import TaskComment from '../models/TaskComment.js';
import Task from '../models/Task.js';
import Room from '../models/Room.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Get comments for a task
router.get('/tasks/:taskId/comments', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check room access
    const room = await Room.findById(task.roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isMember = room.owner.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const comments = await TaskComment.find({ taskId: req.params.taskId })
      .populate('userId', 'name email avatar avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    logger.error('Error fetching task comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create comment
router.post('/tasks/:taskId/comments', [
  body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
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

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check room access
    const room = await Room.findById(task.roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isMember = room.owner.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { text } = req.body;

    const comment = await TaskComment.create({
      taskId: req.params.taskId,
      userId: req.user._id,
      text,
    });

    await comment.populate('userId', 'name email avatar avatarUrl');

    // Notify assigned user if different from commenter
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: task.assignedTo,
        type: 'task_assigned',
        title: 'New Comment',
        body: `${req.user.name} commented on a task assigned to you`,
        data: { taskId: task._id, roomId: task.roomId },
      });

      req.app.get('io').to(`user:${task.assignedTo}`).emit('notifications:new', {
        type: 'task_assigned',
        title: 'New Comment',
        body: `${req.user.name} commented on a task assigned to you`,
      });
    }

    // Emit comment update via socket
    req.app.get('io').to(task.roomId.toString()).emit('task:comment-added', {
      taskId: task._id,
      comment,
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }
    logger.error('Error creating task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

