import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';
import { protect } from '../middleware/protect.js';
import { roomAccess, roomRoleAtLeast } from '../middleware/roomAccess.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(protect);

// Pin message (mod+)
router.patch('/:id/pin', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check room access and role
    const room = await Room.findById(message.roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isOwner = room.owner.toString() === req.user._id.toString();
    const roomMember = await RoomMember.findOne({ roomId: room._id, userId: req.user._id });
    const isModerator = isOwner || (roomMember && roomMember.role === 'moderator');

    if (!isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Only moderators can pin messages',
      });
    }

    message.pinned = !message.pinned;
    await message.save();

    await message.populate('userId', 'name email avatar avatarUrl');

    // Emit update via socket
    req.app.get('io').to(message.roomId.toString()).emit('message:updated', {
      messageId: message._id,
      pinned: message.pinned,
    });

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }
    logger.error('Error pinning message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete message (soft delete, mod+)
router.patch('/:id/delete', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check room access and role
    const room = await Room.findById(message.roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const isOwner = room.owner.toString() === req.user._id.toString();
    const roomMember = await RoomMember.findOne({ roomId: room._id, userId: req.user._id });
    const isModerator = isOwner || (roomMember && roomMember.role === 'moderator');

    if (!isModerator && message.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only moderators can delete messages',
      });
    }

    // Soft delete
    message.deletedAt = new Date();
    await message.save();

    // Emit update via socket
    req.app.get('io').to(message.roomId.toString()).emit('message:deleted', {
      messageId: message._id,
      deletedAt: message.deletedAt,
    });

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }
    logger.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Add reaction to message
router.post('/:id/react', [
  body('emoji').trim().notEmpty().withMessage('Emoji is required').isLength({ max: 10 }).withMessage('Emoji too long'),
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

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check room access
    const room = await Room.findById(message.roomId);
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

    const { emoji } = req.body;

    // Initialize reactions array if needed
    if (!message.reactions) {
      message.reactions = [];
    }

    // Find existing reaction
    let reaction = message.reactions.find(r => r.emoji === emoji);
    
    if (reaction) {
      // Toggle user in reaction
      const userIndex = reaction.userIds.findIndex(id => id.toString() === req.user._id.toString());
      if (userIndex >= 0) {
        // Remove reaction
        reaction.userIds.splice(userIndex, 1);
        if (reaction.userIds.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        reaction.userIds.push(req.user._id);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        userIds: [req.user._id],
      });
    }

    await message.save();

    // Emit update via socket
    req.app.get('io').to(message.roomId.toString()).emit('message:reaction-updated', {
      messageId: message._id,
      reactions: message.reactions,
    });

    res.json({
      success: true,
      reactions: message.reactions,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }
    logger.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

