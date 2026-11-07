import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: mongoose.Types.ObjectId;
  creator: mongoose.Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  labels: string[];
  subtasks: { id: string; title: string; completed: boolean }[];
  attachments: { id: string; name: string; size: string; url: string; uploadedAt: string; uploadedBy?: string }[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubTaskSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: String, required: true },
    uploadedBy: { type: String },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    labels: [{ type: String }],
    subtasks: [SubTaskSchema],
    attachments: [AttachmentSchema],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
