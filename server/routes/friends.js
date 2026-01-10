import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/protect.js';
import { logger } from '../utils/logger.js';
// io is accessed via req.app.get('io') in routes

const router = express.Router();

router.use(protect);

// Get friends list
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email avatar avatarUrl')
      .select('friends');

    res.json({
      success: true,
      friends: user.friends || [],
    });
  } catch (error) {
    logger.error('Error fetching friends:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get friend requests (incoming)
router.get('/requests', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequestsIn', 'name email avatar avatarUrl')
      .select('friendRequestsIn friendRequestsOut');

    res.json({
      success: true,
      requestsIn: user.friendRequestsIn || [],
      requestsOut: user.friendRequestsOut || [],
    });
  } catch (error) {
    logger.error('Error fetching friend requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Send friend request
const sendRequestValidation = [
  body('userId').optional().isMongoId().withMessage('Invalid user ID'),
  body('email').optional().isEmail().withMessage('Invalid email'),
];

router.post('/request', sendRequestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Either userId or email is required',
      });
    }

    let targetUser;
    if (userId) {
      targetUser = await User.findById(userId);
    } else {
      targetUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself',
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already friends
    if (user.friends.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends',
      });
    }

    // Check if request already sent
    if (user.friendRequestsOut.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent',
      });
    }

    // Check if already received a request from them
    if (user.friendRequestsIn.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'They already sent you a friend request. Accept it instead.',
      });
    }

    // Add to user's outgoing requests
    user.friendRequestsOut.push(targetUser._id);
    await user.save();

    // Add to target's incoming requests
    targetUser.friendRequestsIn.push(req.user._id);
    await targetUser.save();

    // Create notification
    await Notification.create({
      userId: targetUser._id,
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${user.name} sent you a friend request`,
      data: { fromUserId: user._id },
    });

    // Emit notification via socket
    req.app.get('io').to(`user:${targetUser._id}`).emit('notifications:new', {
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${user.name} sent you a friend request`,
    });

    res.json({
      success: true,
      message: 'Friend request sent',
    });
  } catch (error) {
    logger.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Accept friend request
router.post('/accept', [
  body('userId').isMongoId().withMessage('Invalid user ID'),
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

    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    const sender = await User.findById(userId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.friendRequestsIn.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending friend request from this user',
      });
    }

    // Remove from requests
    user.friendRequestsIn = user.friendRequestsIn.filter(id => id.toString() !== userId.toString());
    sender.friendRequestsOut = sender.friendRequestsOut.filter(id => id.toString() !== req.user._id.toString());

    // Add as friends
    if (!user.friends.includes(userId)) {
      user.friends.push(userId);
    }
    if (!sender.friends.includes(req.user._id)) {
      sender.friends.push(req.user._id);
    }

    await user.save();
    await sender.save();

    // Create notification for sender
    await Notification.create({
      userId: sender._id,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      body: `${user.name} accepted your friend request`,
      data: { fromUserId: user._id },
    });

    req.app.get('io').to(`user:${sender._id}`).emit('notifications:new', {
      type: 'friend_request',
      title: 'Friend Request Accepted',
      body: `${user.name} accepted your friend request`,
    });

    res.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (error) {
    logger.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Reject friend request
router.post('/reject', [
  body('userId').isMongoId().withMessage('Invalid user ID'),
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

    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    const sender = await User.findById(userId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.friendRequestsIn.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'No pending friend request from this user',
      });
    }

    // Remove from requests
    user.friendRequestsIn = user.friendRequestsIn.filter(id => id.toString() !== userId.toString());
    sender.friendRequestsOut = sender.friendRequestsOut.filter(id => id.toString() !== req.user._id.toString());

    await user.save();
    await sender.save();

    res.json({
      success: true,
      message: 'Friend request rejected',
    });
  } catch (error) {
    logger.error('Error rejecting friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Remove friend
router.post('/remove', [
  body('userId').isMongoId().withMessage('Invalid user ID'),
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

    const { userId } = req.body;
    const user = await User.findById(req.user._id);
    const friend = await User.findById(userId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove from both sides
    user.friends = user.friends.filter(id => id.toString() !== userId.toString());
    friend.friends = friend.friends.filter(id => id.toString() !== req.user._id.toString());

    await user.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Friend removed',
    });
  } catch (error) {
    logger.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Search users (for adding friends)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    })
      .select('name email avatar avatarUrl')
      .limit(20)
      .lean();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

