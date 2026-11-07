import { Router, Response } from 'express';
import { storage } from '../data/storage.js';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const notifs = storage.getNotifications(req.user!.userId);
  res.json(notifs);
});

// Mark one as read
router.put('/:id/read', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const success = storage.markNotificationAsRead(req.params.id);
  res.json({ success });
});

// Mark all as read
router.put('/read-all', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  storage.markAllNotificationsAsRead(req.user!.userId);
  res.json({ success: true });
});

export default router;
