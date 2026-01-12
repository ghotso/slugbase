import { Router } from 'express';
import { query, queryOne } from '../db/index.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns statistics for the authenticated user's dashboard
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBookmarks:
 *                   type: number
 *                 totalFolders:
 *                   type: number
 *                 totalTags:
 *                   type: number
 *                 sharedBookmarks:
 *                   type: number
 *                 sharedFolders:
 *                   type: number
 *                 recentBookmarks:
 *                   type: array
 *                 topTags:
 *                   type: array
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;

    // Get user's teams
    const userTeams = await query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [userId]
    );
    const teamIds = Array.isArray(userTeams) ? userTeams.map((t: any) => t.team_id) : [];

    // Total bookmarks (own only)
    const totalBookmarksResult = await queryOne(
      'SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?',
      [userId]
    );
    const totalBookmarks = (totalBookmarksResult as any)?.count || 0;

    // Total folders (own only)
    const totalFoldersResult = await queryOne(
      'SELECT COUNT(*) as count FROM folders WHERE user_id = ?',
      [userId]
    );
    const totalFolders = (totalFoldersResult as any)?.count || 0;

    // Total tags (own only)
    const totalTagsResult = await queryOne(
      'SELECT COUNT(*) as count FROM tags WHERE user_id = ?',
      [userId]
    );
    const totalTags = (totalTagsResult as any)?.count || 0;

    // Shared bookmarks count (bookmarks shared with user)
    let sharedBookmarksQuery = `
      SELECT COUNT(DISTINCT b.id) as count
      FROM bookmarks b
      LEFT JOIN bookmark_user_shares bus ON b.id = bus.bookmark_id
      LEFT JOIN bookmark_team_shares bts ON b.id = bts.bookmark_id
      LEFT JOIN bookmark_folders bf ON b.id = bf.bookmark_id
      LEFT JOIN folder_user_shares fus ON bf.folder_id = fus.folder_id
      LEFT JOIN folder_team_shares fts ON bf.folder_id = fts.folder_id
      WHERE b.user_id != ? AND (
        bus.user_id = ?
        OR (bts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND bts.team_id IS NOT NULL)
        OR fus.user_id = ?
        OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL AND bf.folder_id IS NOT NULL)
      )
    `;
    const sharedBookmarksParams: any[] = [userId, userId, userId];
    if (teamIds.length > 0) {
      sharedBookmarksParams.push(...teamIds);
      sharedBookmarksParams.push(...teamIds);
    }
    const sharedBookmarksResult = await queryOne(sharedBookmarksQuery, sharedBookmarksParams);
    const sharedBookmarks = (sharedBookmarksResult as any)?.count || 0;

    // Shared folders count (folders shared with user)
    let sharedFoldersQuery = `
      SELECT COUNT(DISTINCT f.id) as count
      FROM folders f
      LEFT JOIN folder_user_shares fus ON f.id = fus.folder_id
      LEFT JOIN folder_team_shares fts ON f.id = fts.folder_id
      WHERE f.user_id != ? AND (
        fus.user_id = ?
        OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL)
      )
    `;
    const sharedFoldersParams: any[] = [userId, userId];
    if (teamIds.length > 0) {
      sharedFoldersParams.push(...teamIds);
    }
    const sharedFoldersResult = await queryOne(sharedFoldersQuery, sharedFoldersParams);
    const sharedFolders = (sharedFoldersResult as any)?.count || 0;

    // Recent bookmarks (last 5, own only)
    const recentBookmarks = await query(
      'SELECT id, title, url, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    const recentBookmarksList = Array.isArray(recentBookmarks) ? recentBookmarks : (recentBookmarks ? [recentBookmarks] : []);

    // Top tags (most used, top 5)
    const topTags = await query(
      `SELECT t.id, t.name, COUNT(bt.bookmark_id) as bookmark_count
       FROM tags t
       INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
       INNER JOIN bookmarks b ON bt.bookmark_id = b.id
       WHERE t.user_id = ?
       GROUP BY t.id, t.name
       ORDER BY bookmark_count DESC
       LIMIT 5`,
      [userId]
    );
    const topTagsList = Array.isArray(topTags) ? topTags : (topTags ? [topTags] : []);

    res.json({
      totalBookmarks,
      totalFolders,
      totalTags,
      sharedBookmarks,
      sharedFolders,
      recentBookmarks: recentBookmarksList,
      topTags: topTagsList,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
