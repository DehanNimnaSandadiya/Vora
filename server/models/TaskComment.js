import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

taskCommentSchema.index({ taskId: 1, createdAt: -1 });

const TaskComment = mongoose.model('TaskComment', taskCommentSchema);

export default TaskComment;

