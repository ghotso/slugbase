import { Router } from 'express';
import { queryOne } from '../db/index.js';
import { strictRateLimiter } from '../middleware/security.js';
import { validateUrl } from '../utils/validation.js';

const router = Router();

/**
 * @swagger
 * /{user_key}/{slug}:
 *   get:
 *     summary: Redirect to bookmark URL
 *     description: Public redirect endpoint. Redirects to the bookmark's URL if forwarding is enabled for the bookmark.
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: user_key
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique key
 *         example: "abc12345"
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Bookmark slug
 *         example: "example-slug"
 *     responses:
 *       302:
 *         description: Redirect to bookmark URL
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: "https://example.com"
 *       404:
 *         description: Bookmark not found or forwarding not enabled
 */
// Redirect route: /{user_key}/{slug}
router.get('/:user_key/:slug', strictRateLimiter, async (req, res) => {
  try {
    const { user_key, slug } = req.params;

    const bookmark = await queryOne(
      `SELECT b.* FROM bookmarks b
       INNER JOIN users u ON b.user_id = u.id
       WHERE u.user_key = ? AND b.slug = ? AND b.forwarding_enabled = TRUE`,
      [user_key, slug]
    );

    if (!bookmark) {
      return res.status(404).send('Not Found');
    }

    const redirectUrl = (bookmark as any).url;

    // Validate redirect URL to prevent open redirect vulnerabilities
    const urlValidation = validateUrl(redirectUrl);
    if (!urlValidation.valid) {
      console.error('Invalid redirect URL detected:', redirectUrl);
      return res.status(400).send('Invalid redirect URL');
    }

    // Redirect with 302 (temporary redirect)
    res.redirect(302, redirectUrl);
  } catch (error: any) {
    // Don't expose error details to client
    console.error('Redirect error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
