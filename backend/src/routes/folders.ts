import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth());

// Get all folders for user (own + shared)
router.get('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
    
    // Get user's teams
    const userTeams = await query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [userId]
    );
    const teamIds = Array.isArray(userTeams) ? userTeams.map((t: any) => t.team_id) : [];

    // Get own folders + shared folders
    let sql = `
      SELECT DISTINCT f.*,
             CASE WHEN f.user_id = ? THEN 'own' ELSE 'shared' END as folder_type
      FROM folders f
      LEFT JOIN folder_team_shares fts ON f.id = fts.folder_id
      WHERE (f.user_id = ? OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL))
    `;
    const params: any[] = [userId, userId];
    if (teamIds.length > 0) {
      params.push(...teamIds);
    }
    sql += ' ORDER BY f.name';

    const folders = await query(sql, params);

    // Get shared teams for each folder
    for (const folder of folders as any[]) {
      const sharedTeams = await query(
        `SELECT t.* FROM teams t
         INNER JOIN folder_team_shares fts ON t.id = fts.team_id
         WHERE fts.folder_id = ?`,
        [folder.id]
      );
      folder.shared_teams = Array.isArray(sharedTeams) ? sharedTeams : (sharedTeams ? [sharedTeams] : []);
    }

    res.json(folders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single folder (own or shared)
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

    let sql = `
      SELECT DISTINCT f.*
      FROM folders f
      LEFT JOIN folder_team_shares fts ON f.id = fts.folder_id
      WHERE f.id = ? AND (f.user_id = ? OR (fts.team_id IN (${teamIds.length > 0 ? teamIds.map(() => '?').join(',') : 'NULL'}) AND fts.team_id IS NOT NULL))
    `;
    const params: any[] = [id, userId];
    if (teamIds.length > 0) {
      params.push(...teamIds);
    }

    const folder = await queryOne(sql, params);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get shared teams
    const sharedTeams = await query(
      `SELECT t.* FROM teams t
       INNER JOIN folder_team_shares fts ON t.id = fts.team_id
       WHERE fts.folder_id = ?`,
      [id]
    );
    (folder as any).shared_teams = Array.isArray(sharedTeams) ? sharedTeams : (sharedTeams ? [sharedTeams] : []);

    res.json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
router.post('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
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
    const { team_ids } = req.body;

    await execute('INSERT INTO folders (id, user_id, name) VALUES (?, ?, ?)', [folderId, userId, name]);

    // Add team shares if provided
    if (team_ids && team_ids.length > 0) {
      // Verify user is member of all teams
      for (const teamId of team_ids) {
        const isMember = await queryOne(
          'SELECT * FROM team_members WHERE user_id = ? AND team_id = ?',
          [userId, teamId]
        );
        if (!isMember) {
          return res.status(403).json({ error: `You are not a member of team ${teamId}` });
        }
        await execute(
          'INSERT INTO folder_team_shares (folder_id, team_id) VALUES (?, ?)',
          [folderId, teamId]
        );
      }
    }

    const folder = await queryOne('SELECT * FROM folders WHERE id = ?', [folderId]);
    res.status(201).json(folder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update folder
router.put('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
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

    const { team_ids } = req.body;

    await execute('UPDATE folders SET name = ? WHERE id = ?', [name, id]);

    // Update team shares if provided
    if (team_ids !== undefined) {
      await execute('DELETE FROM folder_team_shares WHERE folder_id = ?', [id]);
      if (team_ids.length > 0) {
        // Verify user is member of all teams
        for (const teamId of team_ids) {
          const isMember = await queryOne(
            'SELECT * FROM team_members WHERE user_id = ? AND team_id = ?',
            [userId, teamId]
          );
          if (!isMember) {
            return res.status(403).json({ error: `You are not a member of team ${teamId}` });
          }
          await execute(
            'INSERT INTO folder_team_shares (folder_id, team_id) VALUES (?, ?)',
            [id, teamId]
          );
        }
      }
    }

    const updated = await queryOne('SELECT * FROM folders WHERE id = ?', [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!.id;
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
