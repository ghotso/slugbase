import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { CreateBookmarkInput, UpdateBookmarkInput } from '../types.js';

const router = Router();
router.use(requireAuth);

// Get all bookmarks for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { folder_id, tag_id } = req.query;

    let sql = `
      SELECT b.*, f.name as folder_name
      FROM bookmarks b
      LEFT JOIN folders f ON b.folder_id = f.id
      WHERE b.user_id = ?
    `;
    const params: any[] = [userId];

    if (folder_id) {
      sql += ' AND b.folder_id = ?';
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

    // Get tags for each bookmark
    for (const bookmark of bookmarks as any[]) {
      const tags = await query(
        `SELECT t.* FROM tags t
         INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE bt.bookmark_id = ?`,
        [bookmark.id]
      );
      bookmark.tags = tags;
      if (bookmark.folder_name) {
        bookmark.folder = { id: bookmark.folder_id, name: bookmark.folder_name };
      }
    }

    res.json(bookmarks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single bookmark
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const bookmark = await queryOne(
      `SELECT b.*, f.name as folder_name
       FROM bookmarks b
       LEFT JOIN folders f ON b.folder_id = f.id
       WHERE b.id = ? AND b.user_id = ?`,
      [id, userId]
    );

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const tags = await query(
      `SELECT t.* FROM tags t
       INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
       WHERE bt.bookmark_id = ?`,
      [id]
    );

    (bookmark as any).tags = tags;
    if ((bookmark as any).folder_name) {
      (bookmark as any).folder = { id: (bookmark as any).folder_id, name: (bookmark as any).folder_name };
    }

    res.json(bookmark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create bookmark
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
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
      `INSERT INTO bookmarks (id, user_id, title, url, slug, forwarding_enabled, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookmarkId, userId, data.title, data.url, data.slug, data.forwarding_enabled || false, data.folder_id || null]
    );

    // Add tags
    if (data.tag_ids && data.tag_ids.length > 0) {
      for (const tagId of data.tag_ids) {
        await execute(
          'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          [bookmarkId, tagId]
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
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
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
    if (data.folder_id !== undefined) {
      updates.push('folder_id = ?');
      params.push(data.folder_id || null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await execute(
      `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update tags if provided
    if (data.tag_ids !== undefined) {
      await execute('DELETE FROM bookmark_tags WHERE bookmark_id = ?', [id]);
      for (const tagId of data.tag_ids) {
        await execute('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    }

    const bookmark = await queryOne('SELECT * FROM bookmarks WHERE id = ?', [id]);
    res.json(bookmark);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bookmark
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
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
