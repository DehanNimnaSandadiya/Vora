import express from 'express';
import { body, validationResult } from 'express-validator';
import PomodoroPreset from '../models/PomodoroPreset.js';
import User from '../models/User.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Get all presets for current user
router.get('/', async (req, res) => {
  try {
    const presets = await PomodoroPreset.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      presets,
    });
  } catch (error) {
    logger.error('Error fetching presets:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create preset
const createPresetValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('focusMinutes').isInt({ min: 1, max: 120 }).withMessage('Focus minutes must be between 1 and 120'),
  body('breakMinutes').isInt({ min: 1, max: 60 }).withMessage('Break minutes must be between 1 and 60'),
  body('longBreakMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Long break minutes must be between 1 and 60'),
  body('cycles').optional().isInt({ min: 1, max: 10 }).withMessage('Cycles must be between 1 and 10'),
];

router.post('/', createPresetValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { name, focusMinutes, breakMinutes, longBreakMinutes, cycles, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await PomodoroPreset.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const preset = await PomodoroPreset.create({
      userId: req.user._id,
      name,
      focusMinutes,
      breakMinutes,
      longBreakMinutes: longBreakMinutes || null,
      cycles: cycles || null,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      preset,
    });
  } catch (error) {
    logger.error('Error creating preset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Update preset
router.patch('/:id', [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('focusMinutes').optional().isInt({ min: 1, max: 120 }).withMessage('Focus minutes must be between 1 and 120'),
  body('breakMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Break minutes must be between 1 and 60'),
  body('longBreakMinutes').optional().isInt({ min: 1, max: 60 }).withMessage('Long break minutes must be between 1 and 60'),
  body('cycles').optional().isInt({ min: 1, max: 10 }).withMessage('Cycles must be between 1 and 10'),
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

    const preset = await PomodoroPreset.findOne({ _id: req.params.id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found',
      });
    }

    const { name, focusMinutes, breakMinutes, longBreakMinutes, cycles, isDefault } = req.body;

    if (name !== undefined) preset.name = name;
    if (focusMinutes !== undefined) preset.focusMinutes = focusMinutes;
    if (breakMinutes !== undefined) preset.breakMinutes = breakMinutes;
    if (longBreakMinutes !== undefined) preset.longBreakMinutes = longBreakMinutes || null;
    if (cycles !== undefined) preset.cycles = cycles || null;
    if (isDefault !== undefined) preset.isDefault = isDefault;

    await preset.save();

    res.json({
      success: true,
      preset,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preset ID',
      });
    }
    logger.error('Error updating preset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete preset
router.delete('/:id', async (req, res) => {
  try {
    const preset = await PomodoroPreset.findOne({ _id: req.params.id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found',
      });
    }

    await preset.deleteOne();

    res.json({
      success: true,
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preset ID',
      });
    }
    logger.error('Error deleting preset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Set preset as default
router.post('/:id/default', async (req, res) => {
  try {
    const preset = await PomodoroPreset.findOne({ _id: req.params.id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found',
      });
    }

    // Unset other defaults
    await PomodoroPreset.updateMany(
      { userId: req.user._id, _id: { $ne: preset._id } },
      { $set: { isDefault: false } }
    );

    preset.isDefault = true;
    await preset.save();

    // Update user's defaultPresetId in preferences
    const user = await User.findById(req.user._id);
    if (user.preferences && user.preferences.focus) {
      user.preferences.focus.defaultPresetId = preset._id;
      await user.save();
    }

    res.json({
      success: true,
      preset,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preset ID',
      });
    }
    logger.error('Error setting default preset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

