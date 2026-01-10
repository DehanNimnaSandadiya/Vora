import Room from '../models/Room.js';
import RoomMember from '../models/RoomMember.js';

// Check if user has access to a room
export const roomAccess = async (req, res, next) => {
  try {
    const roomId = req.params.roomId || req.params.id;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if user is owner or member
    const isOwner = room.owner.toString() === req.user._id.toString();
    const isMember = room.members.some(memberId => memberId.toString() === req.user._id.toString());

    // Check RoomMember table for additional role info
    const roomMember = await RoomMember.findOne({ roomId, userId: req.user._id });
    
    // For public rooms, allow access to anyone
    if (!room.isPrivate) {
      req.room = room;
      req.roomMember = roomMember;
      req.isRoomOwner = isOwner;
      req.isRoomModerator = isOwner || (roomMember && roomMember.role === 'moderator');
      req.isRoomMember = isOwner || isMember || roomMember;
      return next();
    }

    // For private rooms, require membership
    if (!isOwner && !isMember && !roomMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Room is private.',
      });
    }

    req.room = room;
    req.roomMember = roomMember;
    req.isRoomOwner = isOwner;
    req.isRoomModerator = isOwner || (roomMember && roomMember.role === 'moderator');
    req.isRoomMember = isOwner || isMember || roomMember;

    next();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Check if user has at least the specified role
export const roomRoleAtLeast = (requiredRole) => {
  const roleHierarchy = {
    member: 1,
    moderator: 2,
    owner: 3,
  };

  return async (req, res, next) => {
    try {
      if (!req.room) {
        return res.status(400).json({
          success: false,
          message: 'Room context required. Use roomAccess middleware first.',
        });
      }

      const userRole = req.isRoomOwner ? 'owner' : (req.roomMember?.role || 'member');
      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${requiredRole}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  };
};

