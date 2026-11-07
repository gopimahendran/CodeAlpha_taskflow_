import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { IProject } from '../types/index.js';
import { emitToWorkspace } from '../socket/socketHandler.js';

const router = Router();

// List projects
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { workspaceId, status } = req.query;
  let projects = storage.getProjects(workspaceId as string | undefined);

  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  // Enrich with task metrics
  const enriched = projects.map((proj) => {
    const tasks = storage.getTasks({ project: proj._id });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      ...proj,
      stats: {
        total,
        completed,
        inProgress,
        progressPercent,
      },
    };
  });

  res.json(enriched);
});

// Single project
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const proj = storage.getProjectById(req.params.id);
  if (!proj) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const tasks = storage.getTasks({ project: proj._id });
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  res.json({
    ...proj,
    stats: {
      total,
      completed,
      inProgress,
      progressPercent,
    },
  });
});

// Create project
router.post('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, description, workspaceId, deadline, color, icon } = req.body;
  if (!name || !workspaceId) {
    res.status(400).json({ error: 'Project name and workspaceId are required' });
    return;
  }

  const newProj: IProject = {
    _id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: description || '',
    workspace: workspaceId,
    owner: req.user!.userId,
    status: 'active',
    deadline: deadline || undefined,
    color: color || '#5B5BD6',
    icon: icon || 'folder',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  storage.addProject(newProj);

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: workspaceId,
    project: newProj._id,
    user: req.user!.userId,
    action: 'Created project',
    details: `Created new project "${newProj.name}"`,
    createdAt: new Date().toISOString(),
  });

  emitToWorkspace(workspaceId, 'project:created', newProj);
  res.status(201).json(newProj);
});

// Update project
router.put('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, description, status, deadline, color, icon } = req.body;
  const updated = storage.updateProject(req.params.id, {
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(status && { status }),
    ...(deadline !== undefined && { deadline }),
    ...(color && { color }),
    ...(icon && { icon }),
  });

  if (!updated) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: updated.workspace,
    project: updated._id,
    user: req.user!.userId,
    action: 'Updated project',
    details: `Updated settings for "${updated.name}"`,
    createdAt: new Date().toISOString(),
  });

  emitToWorkspace(updated.workspace, 'project:updated', updated);
  res.json(updated);
});

// Archive toggle
router.put('/:id/archive', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const proj = storage.getProjectById(req.params.id);
  if (!proj) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const newStatus = proj.status === 'archived' ? 'active' : 'archived';
  const updated = storage.updateProject(req.params.id, { status: newStatus });

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: proj.workspace,
    project: proj._id,
    user: req.user!.userId,
    action: newStatus === 'archived' ? 'Archived project' : 'Restored project',
    details: `${newStatus === 'archived' ? 'Archived' : 'Restored'} "${proj.name}"`,
    createdAt: new Date().toISOString(),
  });

  emitToWorkspace(proj.workspace, 'project:updated', updated);
  res.json(updated);
});

// Delete project
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const proj = storage.getProjectById(req.params.id);
  if (!proj) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const deleted = storage.deleteProject(req.params.id);
  if (!deleted) {
    res.status(500).json({ error: 'Failed to delete project' });
    return;
  }

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: proj.workspace,
    user: req.user!.userId,
    action: 'Deleted project',
    details: `Deleted project "${proj.name}" and associated tasks`,
    createdAt: new Date().toISOString(),
  });

  emitToWorkspace(proj.workspace, 'project:deleted', { projectId: req.params.id });
  res.json({ success: true, message: 'Project and associated tasks deleted' });
});

export default router;
