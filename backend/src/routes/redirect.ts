import { Router } from 'express';
import { queryOne } from '../db/index.js';

const router = Router();

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
