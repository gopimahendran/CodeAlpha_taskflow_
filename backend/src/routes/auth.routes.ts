import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from '../data/storage.js';
import { JWT_SECRET, authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { IUser } from '../types/index.js';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = storage.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'A user with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: IUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      role: role || 'Product Designer',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.addUser(newUser);

    // Auto add to primary workspace
    const primaryWs = storage.getWorkspaces()[0];
    if (primaryWs) {
      storage.addWorkspaceMember({
        _id: `wsm_${Date.now()}`,
        workspace: primaryWs._id,
        user: newUser._id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
    }

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = storage.getUserByEmail(email);
    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Current User Profile
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const user = storage.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Update Profile
router.put('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const { name, avatar, role, bio } = req.body;
  const updated = storage.updateUser(req.user!.userId, {
    ...(name && { name }),
    ...(avatar !== undefined && { avatar }),
    ...(role && { role }),
    ...(bio !== undefined && { bio }),
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { password: _, ...userWithoutPassword } = updated;
  res.json({ user: userWithoutPassword });
});

// List all users for assigning tasks / team lists
router.get('/users', authenticateJWT, (_req: AuthenticatedRequest, res: Response): void => {
  const users = storage.getUsers().map((u) => {
    const { password: _, ...uNoPass } = u;
    return uNoPass;
  });
  res.json(users);
});

// Quick switch demo user (convenience for evaluating role perspectives)
router.post('/demo-switch', (req: Request, res: Response): void => {
  const { userId } = req.body;
  const user = storage.getUserById(userId) || storage.getUsers()[0];
  if (!user) {
    res.status(404).json({ error: 'Demo user not found' });
    return;
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

export default router;
