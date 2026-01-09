import { Router } from 'express';
import { queryOne } from '../db/index.js';
import { strictRateLimiter } from '../middleware/security.js';
import { validateUrl } from '../utils/validation.js';

const router = Router();

// Note: No middleware here - we'll check in the route handler itself

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
// Only match if we have exactly 2 path segments (not root or single segment)
router.get('/:user_key/:slug', strictRateLimiter, async (req, res, next) => {
  try {
    // CRITICAL: Check path segments FIRST - if not exactly 2, skip this route entirely
    const pathSegments = req.path.split('/').filter(Boolean);
    if (req.path === '/' || req.path === '' || pathSegments.length !== 2) {
      // Don't process - this route shouldn't match root or non-2-segment paths
      // But Express has already matched the route pattern, so we need to call next()
      // However, this will go to next middleware, not next route handler
      // So we need a different approach - don't mount this router at root
      return next();
    }

    const { user_key, slug } = req.params;

    // Additional validation: ensure we have both parameters
    if (!user_key || !slug) {
      return next(); // Let it fall through to next handler
    }

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
