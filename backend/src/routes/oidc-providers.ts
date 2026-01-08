import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '../utils/encryption.js';
import { reloadOIDCStrategies } from '../auth/oidc.js';

const router = Router();
router.use(requireAuth());
router.use(requireAdmin()); // Only admins can manage OIDC providers

// Get all OIDC providers (without secrets)
router.get('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const providers = await query('SELECT id, provider_key, issuer_url, scopes, auto_create_users, default_role, created_at FROM oidc_providers ORDER BY created_at DESC', []);
    const providersList = Array.isArray(providers) ? providers : (providers ? [providers] : []);
    res.json(providersList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single OIDC provider (without secret)
router.get('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const provider = await queryOne(
      'SELECT id, provider_key, issuer_url, scopes, auto_create_users, default_role, created_at FROM oidc_providers WHERE id = ?',
      [id]
    );
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create OIDC provider
router.post('/', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const {
      provider_key,
      client_id,
      client_secret,
      issuer_url,
      scopes = 'openid profile email',
      auto_create_users = true,
      default_role = 'user'
    } = req.body;

    if (!provider_key || !client_id || !client_secret || !issuer_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate default_role
    if (default_role !== 'user' && default_role !== 'admin') {
      return res.status(400).json({ error: 'default_role must be "user" or "admin"' });
    }

    // Check if provider_key already exists
    const existing = await queryOne('SELECT id FROM oidc_providers WHERE provider_key = ?', [provider_key]);
    if (existing) {
      return res.status(400).json({ error: 'Provider with this key already exists' });
    }

    // Encrypt client_secret before storing
    const encryptedSecret = encrypt(client_secret);

    const providerId = uuidv4();
    await execute(
      `INSERT INTO oidc_providers (id, provider_key, client_id, client_secret, issuer_url, scopes, auto_create_users, default_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        providerId,
        provider_key,
        client_id,
        encryptedSecret,
        issuer_url,
        scopes,
        auto_create_users ? 1 : 0,
        default_role
      ]
    );

    // Reload OIDC strategies
    await reloadOIDCStrategies();

    const provider = await queryOne(
      'SELECT id, provider_key, issuer_url, scopes, auto_create_users, default_role, created_at FROM oidc_providers WHERE id = ?',
      [providerId]
    );
    res.status(201).json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update OIDC provider
router.put('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const {
      provider_key,
      client_id,
      client_secret,
      issuer_url,
      scopes,
      auto_create_users,
      default_role
    } = req.body;

    const existing = await queryOne('SELECT * FROM oidc_providers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Validate default_role if provided
    if (default_role && default_role !== 'user' && default_role !== 'admin') {
      return res.status(400).json({ error: 'default_role must be "user" or "admin"' });
    }

    // Check provider_key uniqueness if changed
    if (provider_key && provider_key !== (existing as any).provider_key) {
      const keyExists = await queryOne('SELECT id FROM oidc_providers WHERE provider_key = ? AND id != ?', [provider_key, id]);
      if (keyExists) {
        return res.status(400).json({ error: 'Provider with this key already exists' });
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (provider_key !== undefined) {
      updates.push('provider_key = ?');
      params.push(provider_key);
    }
    if (client_id !== undefined) {
      updates.push('client_id = ?');
      params.push(client_id);
    }
    if (client_secret !== undefined) {
      // Encrypt new secret
      updates.push('client_secret = ?');
      params.push(encrypt(client_secret));
    }
    if (issuer_url !== undefined) {
      updates.push('issuer_url = ?');
      params.push(issuer_url);
    }
    if (scopes !== undefined) {
      updates.push('scopes = ?');
      params.push(scopes);
    }
    if (auto_create_users !== undefined) {
      updates.push('auto_create_users = ?');
      params.push(auto_create_users ? 1 : 0);
    }
    if (default_role !== undefined) {
      updates.push('default_role = ?');
      params.push(default_role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await execute(
      `UPDATE oidc_providers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Reload OIDC strategies
    await reloadOIDCStrategies();

    const provider = await queryOne(
      'SELECT id, provider_key, issuer_url, scopes, auto_create_users, default_role, created_at FROM oidc_providers WHERE id = ?',
      [id]
    );
    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete OIDC provider
router.delete('/:id', async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    const provider = await queryOne('SELECT * FROM oidc_providers WHERE id = ?', [id]);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await execute('DELETE FROM oidc_providers WHERE id = ?', [id]);

    // Reload OIDC strategies
    await reloadOIDCStrategies();

    res.json({ message: 'Provider deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
