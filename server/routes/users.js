import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('university').optional().trim().isLength({ max: 200 }).withMessage('University name cannot exceed 200 characters'),
  body('timezone').optional().trim().isLength({ max: 50 }).withMessage('Timezone cannot exceed 50 characters'),
  body('language').optional().isIn(['en', 'si', 'ta']).withMessage('Language must be en, si, or ta'),
  body('avatarUrl').optional().trim().isURL().withMessage('Avatar URL must be a valid URL'),
  body('preferences.theme').optional().isIn(['dark', 'light', 'system']).withMessage('Theme must be dark, light, or system'),
  body('preferences.notifications.inApp').optional().isBoolean(),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.focus.dailyGoalMinutes').optional().isInt({ min: 0, max: 1440 }).withMessage('Daily goal must be between 0 and 1440 minutes'),
  body('preferences.focus.defaultPresetId').optional().isMongoId().withMessage('Invalid preset ID'),
  body('preferences.focus.focusModeEnabled').optional().isBoolean(),
  body('preferences.focus.distractionBlockerEnabled').optional().isBoolean(),
];

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('preferences.focus.defaultPresetId', 'name focusMinutes breakMinutes');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        university: user.university,
        timezone: user.timezone,
        language: user.language,
        preferences: user.preferences,
        stats: user.stats,
        badges: user.badges || [],
        provider: user.provider,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
});

// Update profile
router.patch('/me', updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { name, bio, university, timezone, language, avatarUrl, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio ? bio.trim() : '';
    if (university !== undefined) user.university = university ? university.trim() : null;
    if (timezone !== undefined) user.timezone = timezone ? timezone.trim() : 'UTC';
    if (language !== undefined) user.language = language;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || null;

    // Update preferences if provided
    if (preferences) {
      if (!user.preferences) user.preferences = {};
      
      if (preferences.theme !== undefined) {
        if (!user.preferences.theme) user.preferences.theme = {};
        user.preferences.theme = preferences.theme;
      }
      
      if (preferences.notifications !== undefined) {
        if (!user.preferences.notifications) user.preferences.notifications = {};
        if (preferences.notifications.inApp !== undefined) user.preferences.notifications.inApp = preferences.notifications.inApp;
        if (preferences.notifications.email !== undefined) user.preferences.notifications.email = preferences.notifications.email;
        if (preferences.notifications.push !== undefined) user.preferences.notifications.push = preferences.notifications.push;
      }
      
      if (preferences.focus !== undefined) {
        if (!user.preferences.focus) user.preferences.focus = {};
        if (preferences.focus.dailyGoalMinutes !== undefined) user.preferences.focus.dailyGoalMinutes = preferences.focus.dailyGoalMinutes;
        if (preferences.focus.defaultPresetId !== undefined) user.preferences.focus.defaultPresetId = preferences.focus.defaultPresetId || null;
        if (preferences.focus.focusModeEnabled !== undefined) user.preferences.focus.focusModeEnabled = preferences.focus.focusModeEnabled;
        if (preferences.focus.distractionBlockerEnabled !== undefined) user.preferences.focus.distractionBlockerEnabled = preferences.focus.distractionBlockerEnabled;
      }
    }

    await user.save();

    await user.populate('preferences.focus.defaultPresetId', 'name focusMinutes breakMinutes');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        university: user.university,
        timezone: user.timezone,
        language: user.language,
        preferences: user.preferences,
        stats: user.stats,
        provider: user.provider,
        role: user.role,
        createdAt: user.createdAt,
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

