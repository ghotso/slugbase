/**
 * Demo reset endpoint
 * Only available when DEMO_MODE is enabled
 * Allows manual triggering of database reset
 */

import { Router } from 'express';
import { resetDatabase } from '../../db/seed.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/admin/demo-reset:
 *   post:
 *     summary: Reset demo database
 *     description: Resets the database to initial demo state. Only available when DEMO_MODE=true. Requires admin authentication.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database reset completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database reset completed successfully"
 *       403:
 *         description: Not authorized (not admin) or DEMO_MODE not enabled
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth(), async (req, res) => {
  try {
    // Only allow in DEMO_MODE
    if (process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({
        error: 'Demo reset is only available when DEMO_MODE is enabled',
      });
    }

    // Check if user is admin
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Perform reset
    console.log('🔄 Manual database reset triggered by admin');
    await resetDatabase();

    res.json({
      message: 'Database reset completed successfully',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
    });
  }
});

export default router;
