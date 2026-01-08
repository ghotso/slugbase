import { Router } from 'express';
import { queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth());

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 user_key:
 *                   type: string
 *                 is_admin:
 *                   type: boolean
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 theme:
 *                   type: string
 *                   example: "auto"
 *       401:
 *         description: Unauthorized
 */
// Get current user profile
router.get('/me', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const user = await queryOne('SELECT id, email, name, user_key, is_admin, language, theme FROM users WHERE id = ?', [userId]);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user settings
 *     description: Updates the authenticated user's language and theme preferences
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, de, fr]
 *                 example: "en"
 *                 description: User's preferred language
 *               theme:
 *                 type: string
 *                 enum: [light, dark, auto]
 *                 example: "auto"
 *                 description: User's preferred theme
 *     responses:
 *       200:
 *         description: User settings updated successfully
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized
 */
// Update user settings
router.put('/me', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
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
