import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspaceMemberDocument extends Document {
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMemberDocument>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

WorkspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMemberModel =
  mongoose.models.WorkspaceMember || mongoose.model<IWorkspaceMemberDocument>('WorkspaceMember', WorkspaceMemberSchema);
