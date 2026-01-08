import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth());

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags
 *     description: Returns all tags for the authenticated user
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123e4567-e89b-12d3-a456-426614174000"
 *                   name:
 *                     type: string
 *                     example: "work"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     description: Returns a single tag by ID. User must own the tag.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Tag details
 *       404:
 *         description: Tag not found
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag
 *     description: Creates a new tag. Tag names must be unique per user.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "work"
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing name or tag with same name already exists
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update tag
 *     description: Updates an existing tag. User must own the tag. Tag names must be unique per user.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "updated-tag-name"
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *       400:
 *         description: Missing name or tag with same name already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tag not found
 */
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

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete tag
 *     description: Deletes a tag. User must own the tag. This removes the tag from all bookmarks.
 *     tags: [Tags]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tag deleted"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tag not found
 */
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
