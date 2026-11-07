import mongoose, { Document, Schema } from 'mongoose';

export interface ICommentDocument extends Document {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  parentComment?: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const CommentModel = mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);
