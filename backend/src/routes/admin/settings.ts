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
 *     description: Returns all system configuration settings as a key-value object. Admin only.
 *     tags: [Admin - Settings]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *               example:
 *                 setting1: "value1"
 *                 setting2: "value2"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
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
 *     description: Returns a specific system setting by its key. Admin only.
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
 *         description: Setting key
 *         example: "app_name"
 *     responses:
 *       200:
 *         description: Setting value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   example: "app_name"
 *                 value:
 *                   type: string
 *                   example: "SlugBase"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Setting not found
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
 *     description: Creates or updates a system setting. If the key exists, it will be updated. Admin only.
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
 *                 example: "app_name"
 *                 description: Setting key (unique identifier)
 *               value:
 *                 type: string
 *                 example: "SlugBase"
 *                 description: Setting value (will be stored as string)
 *     responses:
 *       200:
 *         description: Setting saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                 value:
 *                   type: string
 *       400:
 *         description: Missing key or value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
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
 *     description: Deletes a system setting by its key. Admin only.
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
 *         description: Setting key to delete
 *         example: "app_name"
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setting deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
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
