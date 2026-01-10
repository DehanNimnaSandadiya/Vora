import mongoose from 'mongoose';

const pomodoroPresetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Preset name cannot exceed 100 characters'],
  },
  focusMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 120,
  },
  breakMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 60,
  },
  longBreakMinutes: {
    type: Number,
    min: 1,
    max: 60,
    default: null,
  },
  cycles: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one default preset per user
pomodoroPresetSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('PomodoroPreset').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const PomodoroPreset = mongoose.model('PomodoroPreset', pomodoroPresetSchema);

export default PomodoroPreset;

