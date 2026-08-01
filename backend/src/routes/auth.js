import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../db.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    readingGoal: row.reading_goal,
    createdAt: row.created_at
  };
}

router.post(
  '/register',
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, email, password, fullName, readingGoal } = req.body;

      const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (username, email, password_hash, full_name, reading_goal)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [username, email, passwordHash, fullName || username, readingGoal || 12]
      );
      const user = result.rows[0];

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      res.status(201).json({ user: publicUser(user), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, password } = req.body;
      const result = await query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      res.json({ user: publicUser(user), accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const result = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', (req, res) => {
  // Stateless JWT: logout is handled client-side by discarding tokens.
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/me',
  requireAuth,
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('readingGoal').optional().isInt({ min: 1, max: 500 }).withMessage('Reading goal must be between 1 and 500'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { fullName, readingGoal } = req.body;
      const result = await query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             reading_goal = COALESCE($2, reading_goal)
         WHERE id = $3
         RETURNING *`,
        [fullName ?? null, readingGoal !== undefined ? Number(readingGoal) : null, req.userId]
      );
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json(publicUser(user));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/password',
  requireAuth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { currentPassword, newPassword } = req.body;
      const result = await query('SELECT * FROM users WHERE id = $1', [req.userId]);
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found' });

      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);

      res.json({ message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
