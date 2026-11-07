import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { ITask, ISubTask, IAttachment } from '../types/index.js';
import { emitToProject, emitToWorkspace, emitToUser } from '../socket/socketHandler.js';

const router = Router();

// List / filter tasks
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { workspaceId, projectId, status, assignee, priority, search, label } = req.query;

  let tasks = storage.getTasks({
    workspace: workspaceId as string | undefined,
    project: projectId as string | undefined,
    status: status as string | undefined,
    assignee: assignee as string | undefined,
  });

  if (priority) {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  if (label) {
    tasks = tasks.filter((t) => t.labels.includes(label as string));
  }

  if (search) {
    const term = (search as string).toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.labels.some((l) => l.toLowerCase().includes(term))
    );
  }

  // Sort by order ascending
  tasks.sort((a, b) => a.order - b.order);

  res.json(tasks);
});

// Single task
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

// Create task
router.post('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const {
    title,
    description,
    projectId,
    workspaceId,
    status = 'todo',
    priority = 'medium',
    assignee,
    startDate,
    dueDate,
    labels = [],
  } = req.body;

  if (!title || !projectId || !workspaceId) {
    res.status(400).json({ error: 'Title, projectId, and workspaceId are required' });
    return;
  }

  const existingInColumn = storage.getTasks({ project: projectId, status });

  const newTask: ITask = {
    _id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description || '',
    project: projectId,
    workspace: workspaceId,
    status,
    priority,
    assignee: assignee || undefined,
    creator: req.user!.userId,
    startDate: startDate || undefined,
    dueDate: dueDate || undefined,
    labels: Array.isArray(labels) ? labels : [],
    subtasks: [],
    attachments: [],
    order: existingInColumn.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = storage.addTask(newTask);

  // Notify assignee if not the creator
  if (assignee && assignee !== req.user!.userId) {
    const creatorUser = storage.getUserById(req.user!.userId);
    const notif = storage.addNotification({
      _id: `notif_${Date.now()}`,
      recipient: assignee,
      sender: req.user!.userId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${creatorUser?.name || 'A team member'} assigned you to "${saved.title}"`,
      link: `/projects/${projectId}?task=${saved._id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    emitToUser(assignee, 'notification:new', notif);
  }

  // Activity Log
  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: workspaceId,
    project: projectId,
    task: saved._id,
    user: req.user!.userId,
    action: 'Created task',
    details: `Created task "${saved.title}" in ${status.replace('_', ' ')}`,
    createdAt: new Date().toISOString(),
  });

  emitToProject(projectId, 'task:created', saved);
  emitToWorkspace(workspaceId, 'task:created', saved);

  res.status(201).json(saved);
});

// Update task
router.put('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const currentTask = storage.getTaskById(req.params.id);
  if (!currentTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updates = req.body;
  const previousStatus = currentTask.status;
  const previousAssignee = typeof currentTask.assignee === 'string' ? currentTask.assignee : (currentTask.assignee as any)?._id;

  const updated = storage.updateTask(req.params.id, updates);
  if (!updated) {
    res.status(500).json({ error: 'Failed to update task' });
    return;
  }

  // Check if status changed
  if (updates.status && updates.status !== previousStatus) {
    storage.addActivityLog({
      _id: `act_${Date.now()}`,
      workspace: updated.workspace,
      project: updated.project,
      task: updated._id,
      user: req.user!.userId,
      action: 'Moved task',
      details: `Moved "${updated.title}" from ${previousStatus.replace('_', ' ')} to ${updates.status.replace('_', ' ')}`,
      createdAt: new Date().toISOString(),
    });
  }

  // Check if assignee changed
  const newAssigneeId = typeof updated.assignee === 'string' ? updated.assignee : (updated.assignee as any)?._id;
  if (newAssigneeId && newAssigneeId !== previousAssignee && newAssigneeId !== req.user!.userId) {
    const creatorUser = storage.getUserById(req.user!.userId);
    const notif = storage.addNotification({
      _id: `notif_${Date.now()}`,
      recipient: newAssigneeId,
      sender: req.user!.userId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${creatorUser?.name || 'A team member'} assigned you to "${updated.title}"`,
      link: `/projects/${updated.project}?task=${updated._id}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    emitToUser(newAssigneeId, 'notification:new', notif);
  }

  emitToProject(updated.project, 'task:updated', updated);
  emitToWorkspace(updated.workspace, 'task:updated', updated);

  res.json(updated);
});

// Move task status & order (optimized for drag-and-drop)
router.put('/:id/status', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { status, order } = req.body;
  const currentTask = storage.getTaskById(req.params.id);
  if (!currentTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const prevStatus = currentTask.status;
  const updated = storage.updateTask(req.params.id, {
    status,
    ...(order !== undefined && { order: Number(order) }),
  });

  if (!updated) {
    res.status(500).json({ error: 'Failed to update task status' });
    return;
  }

  if (prevStatus !== status) {
    storage.addActivityLog({
      _id: `act_${Date.now()}`,
      workspace: updated.workspace,
      project: updated.project,
      task: updated._id,
      user: req.user!.userId,
      action: 'Moved task',
      details: `Moved "${updated.title}" to ${status.replace('_', ' ')}`,
      createdAt: new Date().toISOString(),
    });
  }

  emitToProject(updated.project, 'task:moved', {
    taskId: updated._id,
    fromStatus: prevStatus,
    toStatus: status,
    order: updated.order,
    task: updated,
  });

  res.json(updated);
});

// Delete task
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const deleted = storage.deleteTask(req.params.id);
  if (!deleted) {
    res.status(500).json({ error: 'Failed to delete task' });
    return;
  }

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: task.workspace,
    project: task.project,
    user: req.user!.userId,
    action: 'Deleted task',
    details: `Deleted task "${task.title}"`,
    createdAt: new Date().toISOString(),
  });

  emitToProject(task.project, 'task:deleted', { taskId: req.params.id });
  emitToWorkspace(task.workspace, 'task:deleted', { taskId: req.params.id });

  res.json({ success: true, message: 'Task deleted successfully' });
});

// --- Subtasks ---
router.post('/:id/subtasks', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Subtask title is required' });
    return;
  }

  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const newSub: ISubTask = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    title: title.trim(),
    completed: false,
  };

  const updatedSubtasks = [...task.subtasks, newSub];
  const updated = storage.updateTask(task._id, { subtasks: updatedSubtasks });

  emitToProject(task.project, 'task:updated', updated);
  res.status(201).json(updated);
});

router.put('/:id/subtasks/:subtaskId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { completed, title } = req.body;
  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updatedSubtasks = task.subtasks.map((st) => {
    if (st.id === req.params.subtaskId) {
      return {
        ...st,
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(title !== undefined && { title: title.trim() }),
      };
    }
    return st;
  });

  const updated = storage.updateTask(task._id, { subtasks: updatedSubtasks });
  emitToProject(task.project, 'task:updated', updated);
  res.json(updated);
});

router.delete('/:id/subtasks/:subtaskId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updatedSubtasks = task.subtasks.filter((st) => st.id !== req.params.subtaskId);
  const updated = storage.updateTask(task._id, { subtasks: updatedSubtasks });
  emitToProject(task.project, 'task:updated', updated);
  res.json(updated);
});

// --- Attachments ---
router.post('/:id/attachments', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, size, url } = req.body;
  if (!name || !size) {
    res.status(400).json({ error: 'Attachment name and size are required' });
    return;
  }

  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const newAtt: IAttachment = {
    id: `att_${Date.now()}`,
    name,
    size,
    url: url || '#',
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user!.userId,
  };

  const updatedAttachments = [...task.attachments, newAtt];
  const updated = storage.updateTask(task._id, { attachments: updatedAttachments });

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    user: req.user!.userId,
    action: 'Added attachment',
    details: `Attached "${name}" to task "${task.title}"`,
    createdAt: new Date().toISOString(),
  });

  emitToProject(task.project, 'task:updated', updated);
  res.status(201).json(updated);
});

router.delete('/:id/attachments/:attachmentId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const task = storage.getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updatedAttachments = task.attachments.filter((a) => a.id !== req.params.attachmentId);
  const updated = storage.updateTask(task._id, { attachments: updatedAttachments });
  emitToProject(task.project, 'task:updated', updated);
  res.json(updated);
});

export default router;
