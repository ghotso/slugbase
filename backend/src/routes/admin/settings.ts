import { Router } from 'express';
import { query, queryOne, execute } from '../../db/index.js';
import { AuthRequest, requireAuth, requireAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth());
router.use(requireAdmin());

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all system settings
 *     tags: [Admin - Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 */
router.get('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const settings = await query('SELECT * FROM system_config ORDER BY key', []);
    const settingsList = Array.isArray(settings) ? settings : (settings ? [settings] : []);
    
    // Convert array to object
    const settingsObj: Record<string, string> = {};
    settingsList.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Admin - Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting value
 */
router.get('/:key', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { key } = req.params;
    const setting = await queryOne('SELECT * FROM system_config WHERE key = ?', [key]);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json({ key: (setting as any).key, value: (setting as any).value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/settings:
 *   post:
 *     summary: Set system setting
 *     tags: [Admin - Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting saved
 */
router.post('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    await execute(
      'INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)',
      [key, String(value)]
    );

    const setting = await queryOne('SELECT * FROM system_config WHERE key = ?', [key]);
    res.json({ key: (setting as any).key, value: (setting as any).value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   delete:
 *     summary: Delete system setting
 *     tags: [Admin - Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted
 */
router.delete('/:key', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { key } = req.params;
    await execute('DELETE FROM system_config WHERE key = ?', [key]);
    res.json({ message: 'Setting deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
