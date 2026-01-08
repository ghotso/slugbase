import { Router } from 'express';
import { generateCSRFToken } from '../middleware/security.js';

const router = Router();

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     description: Returns a CSRF token for use in state-changing operations. Token is also set as an httpOnly cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: "csrf-token-value"
 *         headers:
 *           Set-Cookie:
 *             description: CSRF token in httpOnly cookie
 *             schema:
 *               type: string
 */
// Route is mounted at /api/csrf-token, so this handles GET /api/csrf-token
router.get('/', (req, res) => {
  try {
    const token = generateCSRFToken(req, res);
    res.json({ csrfToken: token });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

export default router;
