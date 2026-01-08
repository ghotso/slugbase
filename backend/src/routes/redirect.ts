import { Router } from 'express';
import { queryOne } from '../db/index.js';

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
router.get('/:user_key/:slug', async (req, res) => {
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

    // Redirect with 302 (temporary redirect)
    res.redirect(302, (bookmark as any).url);
  } catch (error: any) {
    res.status(500).send('Internal Server Error');
  }
});

export default router;
