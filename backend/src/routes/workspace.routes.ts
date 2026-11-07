import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { IWorkspace, IWorkspaceMember } from '../types/index.js';
import { emitToWorkspace } from '../socket/socketHandler.js';

const router = Router();

// Get all workspaces user belongs to
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.userId;
  const allWs = storage.getWorkspaces();
  // Filter where user is owner or member
  const accessible = allWs.filter((ws) => {
    if (ws.owner === userId) return true;
    const members = storage.getWorkspaceMembers(ws._id);
    return members.some((m) => {
      const uId = typeof m.user === 'string' ? m.user : (m.user as any)?._id;
      return uId === userId;
    });
  });

  res.json(accessible.length > 0 ? accessible : allWs.slice(0, 1));
});

// Get single workspace
router.get('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const ws = storage.getWorkspaceById(req.params.id);
  if (!ws) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }
  res.json(ws);
});

// Create workspace
router.post('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Workspace name is required' });
    return;
  }

  const userId = req.user!.userId;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newWs: IWorkspace = {
    _id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: description || '',
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    owner: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  storage.addWorkspace(newWs);

  // Add owner to members
  storage.addWorkspaceMember({
    _id: `wsm_${Date.now()}`,
    workspace: newWs._id,
    user: userId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  });

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: newWs._id,
    user: userId,
    action: 'Created workspace',
    details: `Created workspace "${newWs.name}"`,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(newWs);
});

// Update workspace
router.put('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, description } = req.body;
  const updated = storage.updateWorkspace(req.params.id, {
    ...(name && { name }),
    ...(description !== undefined && { description }),
  });

  if (!updated) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }

  emitToWorkspace(req.params.id, 'workspace:updated', updated);
  res.json(updated);
});

// Get workspace members
router.get('/:id/members', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const members = storage.getWorkspaceMembers(req.params.id);
  res.json(members);
});

// Invite / add member
router.post('/:id/members', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { email, role = 'member' } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Member email is required' });
    return;
  }

  const user = storage.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with this email address' });
    return;
  }

  const existingMembers = storage.getWorkspaceMembers(req.params.id);
  const alreadyMember = existingMembers.some((m) => {
    const uId = typeof m.user === 'string' ? m.user : (m.user as any)?._id;
    return uId === user._id;
  });

  if (alreadyMember) {
    res.status(400).json({ error: 'User is already a member of this workspace' });
    return;
  }

  const newMember: IWorkspaceMember = {
    _id: `wsm_${Date.now()}`,
    workspace: req.params.id,
    user: user._id,
    role: role as any,
    joinedAt: new Date().toISOString(),
  };

  storage.addWorkspaceMember(newMember);

  storage.addActivityLog({
    _id: `act_${Date.now()}`,
    workspace: req.params.id,
    user: req.user!.userId,
    action: 'Added member',
    details: `Added ${user.name} (${role}) to the workspace`,
    createdAt: new Date().toISOString(),
  });

  emitToWorkspace(req.params.id, 'workspace:memberAdded', { member: newMember, user });
  res.status(201).json({ ...newMember, userDetails: user });
});

// Remove member
router.delete('/:id/members/:userId', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const removed = storage.removeWorkspaceMember(req.params.id, req.params.userId);
  if (!removed) {
    res.status(404).json({ error: 'Member not found in workspace' });
    return;
  }

  emitToWorkspace(req.params.id, 'workspace:memberRemoved', { userId: req.params.userId });
  res.json({ success: true, message: 'Member removed from workspace' });
});

export default router;
