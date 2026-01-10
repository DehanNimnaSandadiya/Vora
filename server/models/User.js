import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  password: {
    type: String,
    select: false, // Don't return password by default
    minlength: [6, 'Password must be at least 6 characters'],
  },
  avatar: {
    type: String,
    default: null,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
    required: true,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '',
  },
  university: {
    type: String,
    trim: true,
    default: null,
  },
  timezone: {
    type: String,
    trim: true,
    default: 'UTC',
  },
  language: {
    type: String,
    enum: ['en', 'si', 'ta'],
    default: 'en',
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
    notifications: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    focus: {
      dailyGoalMinutes: {
        type: Number,
        default: 120,
        min: 0,
      },
      defaultPresetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PomodoroPreset',
        default: null,
      },
      focusModeEnabled: {
        type: Boolean,
        default: false,
      },
      distractionBlockerEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  stats: {
    streakCount: {
      type: Number,
      default: 0,
    },
    lastGoalMetDate: {
      type: Date,
      default: null,
    },
    totalFocusMinutes: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
  },
  badges: [{
    type: String,
    enum: ['first_session', 'streak_3', 'task_finisher', 'focused_5h'],
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequestsIn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequestsOut: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving (only for local provider)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.provider !== 'local') {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;

