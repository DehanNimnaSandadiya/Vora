import mongoose from 'mongoose';

const roomMemberSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['owner', 'moderator', 'member'],
    default: 'member',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure one role per user per room
roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

const RoomMember = mongoose.model('RoomMember', roomMemberSchema);

export default RoomMember;

