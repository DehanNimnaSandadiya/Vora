import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array(),
      });
    }

    const { name, email, password, university } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      university: university || null,
      provider: 'local',
    });

    const token = generateToken(user._id, 'user');

    res.status(201).json({
      success: true,
      token,
      role: 'user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        university: user.university,
        provider: user.provider,
        role: 'user',
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
});

router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      // Admin login - generate token with admin role
      // Note: We don't require the admin user to exist in DB
      const token = generateToken('admin-override', 'admin');
      
      return res.json({
        success: true,
        token,
        role: 'admin',
        user: {
          id: 'admin-override',
          name: 'Admin',
          email: adminEmail,
          avatar: null,
          university: null,
          provider: 'local',
          role: 'admin',
          badges: [],
          stats: {
            streakCount: 0,
            totalFocusMinutes: 0,
            tasksCompleted: 0,
          },
        },
      });
    }

    // Normal user login flow
    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is local provider
    if (user.provider !== 'local') {
      return res.status(401).json({
        success: false,
        message: `Please sign in with ${user.provider}`,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id, 'user');

    res.json({
      success: true,
      token,
      role: 'user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        university: user.university,
        provider: user.provider,
        role: 'user',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
});

// Get current user (protected)
router.get('/me', protect, async (req, res) => {
  try {
    // Handle admin override (no DB user)
    if (req.user._id === 'admin-override' || req.user.role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL || 'adminvora@gmail.com';
      return res.json({
        success: true,
        user: {
          id: 'admin-override',
          name: 'Admin',
          email: adminEmail,
          avatar: null,
          university: null,
          provider: 'local',
          role: 'admin',
          badges: [],
          stats: {
            streakCount: 0,
            totalFocusMinutes: 0,
            tasksCompleted: 0,
          },
        },
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Get role from req.user (set by protect middleware)
    const role = req.user.role || 'user';

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        university: user.university,
        provider: user.provider,
        createdAt: user.createdAt,
        role,
        badges: user.badges || [],
        stats: user.stats || {
          streakCount: 0,
          totalFocusMinutes: 0,
          tasksCompleted: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
});

export default router;

