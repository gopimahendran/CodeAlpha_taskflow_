import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { IComment } from '../types/index.js';
import { emitToProject, emitToUser } from '../socket/socketHandler.js';

const router = Router();

// Get comments for a task
router.get('/:taskId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const comments = storage.getComments(req.params.taskId);
  res.json(comments);
});

// Add comment to a task
router.post('/:taskId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { content, parentComment } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Comment content cannot be empty' });
    return;
  }

  const task = storage.getTaskById(req.params.taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const userId = req.user!.userId;
  const currentUser = storage.getUserById(userId);

  // Extract mentions from @Username
  const allUsers = storage.getUsers();
  const mentionedUserIds: string[] = [];
  allUsers.forEach((u) => {
    if (content.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
      if (u._id !== userId) mentionedUserIds.push(u._id);
    }
  });

  const newComment: IComment = {
    _id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    task: req.params.taskId,
    user: userId,
    content: content.trim(),
    parentComment: parentComment || undefined,
    mentions: mentionedUserIds,
    createdAt: new Date().toISOString(),
  };

  const saved = storage.addComment(newComment);

  // Send notifications for mentions
  mentionedUserIds.forEach((mId) => {
    const notif = storage.addNotification({
      _id: `notif_${Date.now()}_${mId}`,
      recipient: mId,
      sender: userId,
      type: 'comment_added',
      title: 'Mentioned in comment',
      message: `${currentUser?.name || 'A team member'} mentioned you on "${task.title}"`,
      link: `/projects/${task.project}?task=${task._id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    emitToUser(mId, 'notification:new', notif);
  });

  // If task has an assignee different from commenter and not already mentioned, notify them too
  const assigneeId = typeof task.assignee === 'string' ? task.assignee : (task.assignee as any)?._id;
  if (assigneeId && assigneeId !== userId && !mentionedUserIds.includes(assigneeId)) {
    const notif = storage.addNotification({
      _id: `notif_${Date.now()}_assignee`,
      recipient: assigneeId,
      sender: userId,
      type: 'comment_added',
      title: 'New comment on your task',
      message: `${currentUser?.name || 'A team member'} commented on "${task.title}"`,
      link: `/projects/${task.project}?task=${task._id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    emitToUser(assigneeId, 'notification:new', notif);
  }

  // Activity Log
  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    user: userId,
    action: 'Added comment',
    details: `Commented on "${task.title}": "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
    createdAt: new Date().toISOString(),
  });

  emitToProject(task.project, 'comment:created', { taskId: task._id, comment: saved });

  res.status(201).json(saved);
});

export default router;
