import express from 'express';
import { body, validationResult } from 'express-validator';
import TaskTemplate from '../models/TaskTemplate.js';
import Task from '../models/Task.js';
import Room from '../models/Room.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Get all templates for current user
router.get('/', async (req, res) => {
  try {
    const templates = await TaskTemplate.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    logger.error('Error fetching task templates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create template
router.post('/', [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 100 }).withMessage('Template name cannot exceed 100 characters'),
  body('tasks').isArray({ min: 1 }).withMessage('Tasks array is required'),
  body('tasks.*.text').trim().notEmpty().withMessage('Task text is required').isLength({ max: 500 }).withMessage('Task text cannot exceed 500 characters'),
  body('tasks.*.priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('tasks.*.tags').optional().isArray().withMessage('Tags must be an array'),
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

    const { name, tasks } = req.body;

    const template = await TaskTemplate.create({
      userId: req.user._id,
      name,
      tasks: tasks.map(t => ({
        text: t.text.trim(),
        priority: t.priority || 'medium',
        tags: t.tags || [],
      })),
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error('Error creating task template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Apply template to room
router.post('/rooms/:roomId/from-template', [
  body('templateId').isMongoId().withMessage('Invalid template ID'),
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

    const { templateId } = req.body;

    const template = await TaskTemplate.findOne({ _id: templateId, userId: req.user._id });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
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
    const isMember = room.owner.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember && room.isPrivate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Create tasks from template
    const tasks = await Task.insertMany(
      template.tasks.map(taskData => ({
        roomId: req.params.roomId,
        text: taskData.text,
        createdBy: req.user._id,
        status: 'todo',
        priority: taskData.priority,
        tags: taskData.tags,
        templateId: template._id,
      }))
    );

    // Populate tasks
    await Task.populate(tasks, { path: 'createdBy', select: 'name email avatar' });

    // Emit task updates via socket
    req.app.get('io').to(req.params.roomId).emit('tasks:updated', {
      action: 'create-many',
      tasks,
    });

    res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID or template ID',
      });
    }
    logger.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

