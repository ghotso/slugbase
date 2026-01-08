import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { CreateBookmarkInput, UpdateBookmarkInput } from '../types.js';

const router = Router();
router.use(requireAuth());

// Get all bookmarks for user (including shared bookmarks)
router.get('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { folder_id, tag_id } = req.query;

    // Get user's teams
    const userTeams = await query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [userId]
    );
    const teamIds = Array.isArray(userTeams) ? userTeams.map((t: any) => t.team_id) : [];

    // Build query for own bookmarks + shared bookmarks (directly shared or via shared folders)
    let sql = `
      SELECT DISTINCT b.*,
             CASE WHEN b.user_id = ? THEN 'own' ELSE 'shared' END as bookmark_type
      FROM bookmarks b
      LEFT JOIN bookmark_team_shares bts ON b.id = bts.bookmark_id
      LEFT JOIN bookmark_folders bf ON b.id = bf.bookmark_id
      LEFT JOIN folder_team_shares fts ON bf.folder_id = fts.folder_id
      WHERE (b.user_id = ? 
        OR (bts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND bts.team_id IS NOT NULL)
        OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL AND bf.folder_id IS NOT NULL))
    `;
    const params: any[] = [userId, userId];
    if (teamIds.length > 0) {
      params.push(...teamIds);
      params.push(...teamIds); // Second set for folder shares
    }

    if (folder_id) {
      sql += ' AND b.id IN (SELECT bookmark_id FROM bookmark_folders WHERE folder_id = ?)';
      params.push(folder_id);
    }

    if (tag_id) {
      sql += `
        AND b.id IN (
          SELECT bookmark_id FROM bookmark_tags WHERE tag_id = ?
        )
      `;
      params.push(tag_id);
    }

    sql += ' ORDER BY b.created_at DESC';

    const bookmarks = await query(sql, params);

    // Get tags, folders, and teams for each bookmark
    for (const bookmark of bookmarks as any[]) {
      const tags = await query(
        `SELECT t.* FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ?`,
        [bookmark.id]
      );
      bookmark.tags = tags;
      
      // Get folders for this bookmark
      const bookmarkFolders = await query(
        `SELECT f.* FROM folders f
         INNER JOIN bookmark_folders bf ON f.id = bf.folder_id
         WHERE bf.bookmark_id = ?`,
        [bookmark.id]
      );
      bookmark.folders = Array.isArray(bookmarkFolders) ? bookmarkFolders : (bookmarkFolders ? [bookmarkFolders] : []);
      
      // Get shared teams for this bookmark
      const sharedTeams = await query(
        `SELECT t.* FROM teams t
         INNER JOIN bookmark_team_shares bts ON t.id = bts.team_id
         WHERE bts.bookmark_id = ?`,
        [bookmark.id]
      );
      bookmark.shared_teams = Array.isArray(sharedTeams) ? sharedTeams : (sharedTeams ? [sharedTeams] : []);
    }

    res.json(bookmarks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single bookmark (own or shared)
router.get('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;

    // Get user's teams
    const userTeams = await query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [userId]
    );
    const teamIds = Array.isArray(userTeams) ? userTeams.map((t: any) => t.team_id) : [];

    // Check if bookmark is owned by user or shared with user's teams (directly or via folder)
    let sql = `
      SELECT DISTINCT b.*
      FROM bookmarks b
      LEFT JOIN bookmark_team_shares bts ON b.id = bts.bookmark_id
      LEFT JOIN bookmark_folders bf ON b.id = bf.bookmark_id
      LEFT JOIN folder_team_shares fts ON bf.folder_id = fts.folder_id
      WHERE b.id = ? AND (b.user_id = ? 
        OR (bts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND bts.team_id IS NOT NULL)
        OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL AND bf.folder_id IS NOT NULL))
    `;
    const params: any[] = [id, userId];
    if (teamIds.length > 0) {
      params.push(...teamIds);
      params.push(...teamIds); // Second set for folder shares
    }

    const bookmark = await queryOne(sql, params);

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const tags = await query(
      `SELECT t.* FROM tags t
       INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
       WHERE bt.bookmark_id = ?`,
      [id]
    );

    // Get folders for this bookmark
    const bookmarkFolders = await query(
      `SELECT f.* FROM folders f
       INNER JOIN bookmark_folders bf ON f.id = bf.folder_id
       WHERE bf.bookmark_id = ?`,
      [id]
    );

    // Get shared teams for this bookmark
    const sharedTeams = await query(
      `SELECT t.* FROM teams t
       INNER JOIN bookmark_team_shares bts ON t.id = bts.team_id
       WHERE bts.bookmark_id = ?`,
      [id]
    );

    (bookmark as any).tags = tags;
    (bookmark as any).folders = Array.isArray(bookmarkFolders) ? bookmarkFolders : (bookmarkFolders ? [bookmarkFolders] : []);
    (bookmark as any).shared_teams = Array.isArray(sharedTeams) ? sharedTeams : (sharedTeams ? [sharedTeams] : []);

    res.json(bookmark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create bookmark
router.post('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const data: CreateBookmarkInput = req.body;

    if (!data.title || !data.url || !data.slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if slug is unique for user
    const existing = await queryOne(
      'SELECT id FROM bookmarks WHERE user_id = ? AND slug = ?',
      [userId, data.slug]
    );

    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const bookmarkId = uuidv4();
    await execute(
      `INSERT INTO bookmarks (id, user_id, title, url, slug, forwarding_enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookmarkId, userId, data.title, data.url, data.slug, data.forwarding_enabled || false]
    );

    // Add folders
    if (data.folder_ids && data.folder_ids.length > 0) {
      // Verify user owns all folders
      for (const folderId of data.folder_ids) {
        const folder = await queryOne('SELECT * FROM folders WHERE id = ? AND user_id = ?', [folderId, userId]);
        if (!folder) {
          return res.status(403).json({ error: `You do not own folder ${folderId}` });
        }
        await execute(
          'INSERT INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
          [bookmarkId, folderId]
        );
      }
    }

    // Add tags
    if (data.tag_ids && data.tag_ids.length > 0) {
      for (const tagId of data.tag_ids) {
        await execute(
          'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          [bookmarkId, tagId]
        );
      }
    }

    // Add team shares
    if (data.team_ids && data.team_ids.length > 0) {
      // Verify user is member of all teams
      for (const teamId of data.team_ids) {
        const isMember = await queryOne(
          'SELECT * FROM team_members WHERE user_id = ? AND team_id = ?',
          [userId, teamId]
        );
        if (!isMember) {
          return res.status(403).json({ error: `You are not a member of team ${teamId}` });
        }
        await execute(
          'INSERT INTO bookmark_team_shares (bookmark_id, team_id) VALUES (?, ?)',
          [bookmarkId, teamId]
        );
      }
    }

    const bookmark = await queryOne('SELECT * FROM bookmarks WHERE id = ?', [bookmarkId]);
    res.status(201).json(bookmark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update bookmark
router.put('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;
    const data: UpdateBookmarkInput = req.body;

    // Check ownership
    const existing = await queryOne('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== (existing as any).slug) {
      const slugExists = await queryOne(
        'SELECT id FROM bookmarks WHERE user_id = ? AND slug = ? AND id != ?',
        [userId, data.slug, id]
      );
      if (slugExists) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    // Update bookmark
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.url !== undefined) {
      updates.push('url = ?');
      params.push(data.url);
    }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      params.push(data.slug);
    }
    if (data.forwarding_enabled !== undefined) {
      updates.push('forwarding_enabled = ?');
      params.push(data.forwarding_enabled);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await execute(
      `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update folders if provided
    if (data.folder_ids !== undefined) {
      await execute('DELETE FROM bookmark_folders WHERE bookmark_id = ?', [id]);
      if (data.folder_ids.length > 0) {
        // Verify user owns all folders
        for (const folderId of data.folder_ids) {
          const folder = await queryOne('SELECT * FROM folders WHERE id = ? AND user_id = ?', [folderId, userId]);
          if (!folder) {
            return res.status(403).json({ error: `You do not own folder ${folderId}` });
          }
          await execute(
            'INSERT INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
            [id, folderId]
          );
        }
      }
    }

    // Update tags if provided
    if (data.tag_ids !== undefined) {
      await execute('DELETE FROM bookmark_tags WHERE bookmark_id = ?', [id]);
      for (const tagId of data.tag_ids) {
        await execute('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    }

    // Update team shares if provided
    if (data.team_ids !== undefined) {
      await execute('DELETE FROM bookmark_team_shares WHERE bookmark_id = ?', [id]);
      if (data.team_ids.length > 0) {
        // Verify user is member of all teams
        for (const teamId of data.team_ids) {
          const isMember = await queryOne(
            'SELECT * FROM team_members WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
          );
          if (!isMember) {
            return res.status(403).json({ error: `You are not a member of team ${teamId}` });
          }
          await execute(
            'INSERT INTO bookmark_team_shares (bookmark_id, team_id) VALUES (?, ?)',
            [id, teamId]
          );
        }
      }
    }

    const bookmark = await queryOne('SELECT * FROM bookmarks WHERE id = ?', [id]);
    res.json(bookmark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bookmark
router.delete('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;

    const bookmark = await queryOne('SELECT * FROM bookmarks WHERE id = ? AND user_id = ?', [id, userId]);
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await execute('DELETE FROM bookmarks WHERE id = ?', [id]);
    res.json({ message: 'Bookmark deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
