import { Router } from 'express';
import { queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get current user profile
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await queryOne('SELECT id, email, name, user_key, is_admin, language, theme FROM users WHERE id = ?', [userId]);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/me', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { language, theme } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (language !== undefined) {
      updates.push('language = ?');
      params.push(language);
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      params.push(theme);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);
    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await queryOne('SELECT id, email, name, user_key, is_admin, language, theme FROM users WHERE id = ?', [userId]);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
