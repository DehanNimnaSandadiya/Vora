import express from 'express';
import { body, validationResult } from 'express-validator';
import Room from '../models/Room.js';
import { protect } from '../middleware/protect.js';
import { sendRoomInvite } from '../config/email.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const sendInviteValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('roomId').isMongoId().withMessage('Invalid room ID'),
];

// Send room invite via email
router.post('/send', sendInviteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { email, roomId } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is a member
    const isMember = room.owner._id.toString() === req.user._id.toString() ||
                     room.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the room to send invites',
      });
    }

    // Generate invite link
    const inviteLink = `${process.env.CLIENT_URL}/rooms/${roomId}`;
    
    try {
      await sendRoomInvite(
        email,
        room.name,
        room.isPrivate ? room.code : null,
        inviteLink
      );

      logger.info(`Invite sent to ${email} for room ${roomId} by user ${req.user._id}`);

      res.json({
        success: true,
        message: 'Invite sent successfully',
      });
    } catch (emailError) {
      logger.error('Failed to send email invite:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invite email. Please check email configuration.',
      });
    }
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

export default router;

