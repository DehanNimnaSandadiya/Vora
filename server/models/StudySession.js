import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
    index: true,
  },
  startedAt: {
    type: Date,
    required: true,
    index: true,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  mode: {
    type: String,
    enum: ['focus', 'break'],
    required: true,
  },
  source: {
    type: String,
    enum: ['pomodoro', 'manual'],
    required: true,
  },
});

// Compound index for efficient queries
studySessionSchema.index({ userId: 1, startedAt: -1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);

export default StudySession;

