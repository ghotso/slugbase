import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth());

// Get all tags for user
router.get('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const tags = await query('SELECT * FROM tags WHERE user_id = ? ORDER BY name', [userId]);
    res.json(tags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tag
router.get('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;

    const tag = await queryOne('SELECT * FROM tags WHERE id = ? AND user_id = ?', [id, userId]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create tag
router.post('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if tag with same name exists
    const existing = await queryOne('SELECT id FROM tags WHERE user_id = ? AND name = ?', [userId, name]);
    if (existing) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const tagId = uuidv4();
    await execute('INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)', [tagId, userId, name]);

    const tag = await queryOne('SELECT * FROM tags WHERE id = ?', [tagId]);
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag
router.put('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const tag = await queryOne('SELECT * FROM tags WHERE id = ? AND user_id = ?', [id, userId]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Check if new name conflicts
    const existing = await queryOne('SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?', [userId, name, id]);
    if (existing) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    await execute('UPDATE tags SET name = ? WHERE id = ?', [name, id]);
    const updated = await queryOne('SELECT * FROM tags WHERE id = ?', [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tag
router.delete('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    const { id } = req.params;

    const tag = await queryOne('SELECT * FROM tags WHERE id = ? AND user_id = ?', [id, userId]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await execute('DELETE FROM tags WHERE id = ?', [id]);
    res.json({ message: 'Tag deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
