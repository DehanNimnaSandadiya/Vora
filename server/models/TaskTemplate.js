import mongoose from 'mongoose';

const taskTemplateSchema = new mongoose.Schema({
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
    maxlength: [100, 'Template name cannot exceed 100 characters'],
  },
  tasks: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Task text cannot exceed 500 characters'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    tags: [{
      type: String,
      trim: true,
    }],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

taskTemplateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const TaskTemplate = mongoose.model('TaskTemplate', taskTemplateSchema);

export default TaskTemplate;

