import express from 'express';
import { body, validationResult } from 'express-validator';
import Room from '../models/Room.js';
import Invite from '../models/Invite.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/protect.js';
import { roomAccess, roomRoleAtLeast } from '../middleware/roomAccess.js';
import { sendInviteEmail } from '../config/email.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.use(protect);

// Create link invite
router.post('/:id/invites/link', roomAccess, roomRoleAtLeast('member'), async (req, res) => {
  try {
    const roomId = req.params.id;
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days default
    const expiresAt = new Date(Date.now() + expiresIn);

    const invite = await Invite.create({
      roomId,
      createdBy: req.user._id,
      type: 'link',
      expiresAt,
    });

    res.json({
      success: true,
      invite: {
        token: invite.token,
        expiresAt: invite.expiresAt,
        inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/rooms/join?token=${invite.token}`,
      },
    });
  } catch (error) {
    logger.error('Error creating link invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create email invite
router.post('/:id/invites/email', roomAccess, roomRoleAtLeast('member'), [
  body('email').isEmail().withMessage('Valid email is required'),
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

    const roomId = req.params.id;
    const { email } = req.body;
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiresAt = new Date(Date.now() + expiresIn);

    const room = await Room.findById(roomId).populate('owner', 'name email');

    const invite = await Invite.create({
      roomId,
      createdBy: req.user._id,
      email: email.toLowerCase(),
      type: 'email',
      expiresAt,
    });

    // Try to send email
    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/rooms/join?token=${invite.token}`;
    
    try {
      await sendInviteEmail(email, room.name, req.user.name, inviteLink);
    } catch (emailError) {
      logger.warn('Email sending failed, but invite created:', emailError);
      // Continue - invite is still created and token can be shared manually
    }

    res.json({
      success: true,
      invite: {
        token: invite.token,
        expiresAt: invite.expiresAt,
        inviteLink,
        emailSent: process.env.EMAIL_USER && process.env.EMAIL_PASS,
      },
      message: process.env.EMAIL_USER && process.env.EMAIL_PASS 
        ? 'Invite sent successfully' 
        : 'Invite created but email not configured. Share the token manually.',
    });
  } catch (error) {
    logger.error('Error creating email invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Join room with invite token
router.post('/joinWithInvite', [
  body('token').notEmpty().withMessage('Token is required'),
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

    const { token } = req.body;

    const invite = await Invite.findOne({ token });

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite token',
      });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invite has expired',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        message: 'Invite has already been used',
      });
    }

    const room = await Room.findById(invite.roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if already a member
    if (room.members.includes(req.user._id)) {
      invite.usedAt = new Date();
      await invite.save();
      return res.json({
        success: true,
        message: 'Already a member of this room',
        room,
      });
    }

    // Add user to members
    room.members.push(req.user._id);
    await room.save();

    // Mark invite as used
    invite.usedAt = new Date();
    await invite.save();

    await room.populate('owner', 'name email avatar');
    await room.populate('members', 'name email avatar');

    // Emit join event
    req.app.get('io').to(room._id.toString()).emit('room:member-joined', {
      userId: req.user._id,
      userName: req.user.name,
    });

    res.json({
      success: true,
      message: 'Successfully joined room',
      room,
    });
  } catch (error) {
    logger.error('Error joining with invite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

