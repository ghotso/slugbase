import { Router } from 'express';
import { queryOne, query, execute } from '../db/index.js';
import { strictRateLimiter } from '../middleware/security.js';
import { validateUrl } from '../utils/validation.js';

const router = Router();

// Note: No middleware here - we'll check in the route handler itself

/**
 * @swagger
 * /{user_key}/{slug}:
 *   get:
 *     summary: Redirect to bookmark URL
 *     description: Public redirect endpoint. Redirects to the bookmark's URL if forwarding is enabled. Works for both owned bookmarks and shared bookmarks. The user_key can be the owner's key or any user who has access to the shared bookmark.
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: user_key
 *         required: true
 *         schema:
 *           type: string
 *         description: User's unique key (can be owner's key or any user with access to the shared bookmark)
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
 *         description: Bookmark not found, forwarding not enabled, or user doesn't have access
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

    // First, try to find a bookmark owned by this user_key
    let bookmark = await queryOne(
      `SELECT b.* FROM bookmarks b
       INNER JOIN users u ON b.user_id = u.id
       WHERE u.user_key = ? AND b.slug = ? AND b.forwarding_enabled = TRUE`,
      [user_key, slug]
    );

    // If not found, try to find a shared bookmark accessible by this user_key
    if (!bookmark) {
      // Get the user_id from the user_key
      const user = await queryOne(
        'SELECT id FROM users WHERE user_key = ?',
        [user_key]
      );

      if (user) {
        const userId = (user as any).id;

        // Get user's teams
        const userTeams = await query(
          'SELECT team_id FROM team_members WHERE user_id = ?',
          [userId]
        );
        const teamIds = Array.isArray(userTeams) ? userTeams.map((t: any) => t.team_id) : [];

        // Find shared bookmark with matching slug
        let sql = `
          SELECT DISTINCT b.*
          FROM bookmarks b
          LEFT JOIN bookmark_user_shares bus ON b.id = bus.bookmark_id
          LEFT JOIN bookmark_team_shares bts ON b.id = bts.bookmark_id
          LEFT JOIN bookmark_folders bf ON b.id = bf.bookmark_id
          LEFT JOIN folder_user_shares fus ON bf.folder_id = fus.folder_id
          LEFT JOIN folder_team_shares fts ON bf.folder_id = fts.folder_id
          WHERE b.slug = ? AND b.forwarding_enabled = TRUE AND b.user_id != ?
            AND (bus.user_id = ?
            OR (bts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND bts.team_id IS NOT NULL)
            OR fus.user_id = ?
            OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL AND bf.folder_id IS NOT NULL))
        `;
        const params: any[] = [slug, userId, userId, userId];
        if (teamIds.length > 0) {
          params.push(...teamIds);
          params.push(...teamIds); // Second set for folder shares
        }

        bookmark = await queryOne(sql, params);
      }
    }

    if (!bookmark) {
      return res.status(404).send('Not Found');
    }

    const redirectUrl = (bookmark as any).url;
    const bookmarkId = (bookmark as any).id;

    // Track access (increment access_count and update last_accessed_at)
    // Do this asynchronously so it doesn't block the redirect
    execute(
      `UPDATE bookmarks 
       SET access_count = COALESCE(access_count, 0) + 1,
           last_accessed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [bookmarkId]
    ).catch((err) => {
      // Log error but don't fail the redirect
      console.error('Failed to track bookmark access:', err);
    });

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
