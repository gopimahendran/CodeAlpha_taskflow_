import { Router, Request, Response } from 'express';
import { storage } from '../data/storage.js';

const router = Router();

// Reset & seed initial sample data
router.post('/reset', (_req: Request, res: Response): void => {
  try {
    storage.resetToDefaults();
    res.json({ success: true, message: 'Database reset to default realistic sample data successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset seed data' });
  }
});

export default router;
