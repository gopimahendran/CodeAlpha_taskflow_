import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectDocument extends Document {
  name: string;
  description: string;
  workspace: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  status: 'active' | 'archived' | 'completed';
  deadline?: Date;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
    deadline: { type: Date },
    color: { type: String, default: '#5B5BD6' },
    icon: { type: String, default: 'folder' },
  },
  { timestamps: true }
);

export const ProjectModel = mongoose.models.Project || mongoose.model<IProjectDocument>('Project', ProjectSchema);
