import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get activity logs
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { workspaceId, projectId } = req.query;
  const logs = storage.getActivityLogs(workspaceId as string | undefined, projectId as string | undefined);
  res.json(logs);
});

export default router;
