import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  code: {
    type: String,
    sparse: true,
    trim: true,
    minlength: [4, 'Room code must be at least 4 characters'],
    maxlength: [20, 'Room code cannot exceed 20 characters'],
  },
  codeHash: {
    type: String,
    sparse: true,
  },
  codeExpiresAt: {
    type: Date,
    default: null,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  goal: {
    type: String,
    trim: true,
    maxlength: [200, 'Goal cannot exceed 200 characters'],
    default: '',
  },
  pinnedNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Pinned notes cannot exceed 2000 characters'],
    default: '',
  },
  schedule: {
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    repeats: {
      type: String,
      enum: ['none', 'daily', 'weekly'],
      default: 'none',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate code and hash for private rooms
roomSchema.pre('save', async function (next) {
  if (this.isPrivate && !this.codeHash) {
    // Generate a random 6-character code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.code = code;
    // Hash the code
    const salt = await bcrypt.genSalt(10);
    this.codeHash = await bcrypt.hash(code, salt);
  }
  if (!this.isPrivate) {
    this.code = undefined;
    this.codeHash = undefined;
    this.codeExpiresAt = undefined;
  }
  next();
});

// Add owner to members array on creation
roomSchema.post('save', async function (doc) {
  if (doc.isNew && !doc.members.some(m => m.toString() === doc.owner.toString())) {
    doc.members.push(doc.owner);
    await doc.save();
  }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;

