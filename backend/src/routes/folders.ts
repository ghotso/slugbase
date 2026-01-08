import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth);

// Get all folders for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const folders = await query('SELECT * FROM folders WHERE user_id = ? ORDER BY name', [userId]);
    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single folder
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await queryOne('SELECT * FROM folders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if folder with same name exists
    const existing = await queryOne('SELECT id FROM folders WHERE user_id = ? AND name = ?', [userId, name]);
    if (existing) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    const folderId = uuidv4();
    await execute('INSERT INTO folders (id, user_id, name) VALUES (?, ?, ?)', [folderId, userId, name]);

    const folder = await queryOne('SELECT * FROM folders WHERE id = ?', [folderId]);
    res.status(201).json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update folder
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const folder = await queryOne('SELECT * FROM folders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if new name conflicts
    const existing = await queryOne('SELECT id FROM folders WHERE user_id = ? AND name = ? AND id != ?', [userId, name, id]);
    if (existing) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    await execute('UPDATE folders SET name = ? WHERE id = ?', [name, id]);
    const updated = await queryOne('SELECT * FROM folders WHERE id = ?', [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete folder
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await queryOne('SELECT * FROM folders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await execute('DELETE FROM folders WHERE id = ?', [id]);
    res.json({ message: 'Folder deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
