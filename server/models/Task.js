import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: [true, 'Task text is required'],
    trim: true,
    maxlength: [500, 'Task text cannot exceed 500 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  dueDate: {
    type: Date,
    default: null,
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskTemplate',
    default: null,
  },
  status: {
    type: String,
    enum: ['todo', 'doing', 'done'],
    default: 'todo',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

taskSchema.index({ roomId: 1, status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

