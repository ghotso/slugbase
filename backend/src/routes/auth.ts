import { Router } from 'express';
import passport from 'passport';
import { queryOne, execute, isInitialized } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { reloadOIDCStrategies } from '../auth/oidc.js';

const router = Router();

router.get('/providers', async (req, res) => {
  try {
    const providers = await query('SELECT id, provider_key, issuer_url FROM oidc_providers', []);
    const providersList = Array.isArray(providers) ? providers : (providers ? [providers] : []);
    res.json(providersList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', (req, res) => {
  if (req.user) {
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      user_key: user.user_key,
      is_admin: user.is_admin,
      language: user.language,
      theme: user.theme,
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: 'Logged out' });
  });
});

// OIDC login route
router.get('/:provider', async (req, res, next) => {
  const { provider } = req.params;
  passport.authenticate(provider)(req, res, next);
});

// OIDC callback route
router.get('/:provider/callback', (req, res, next) => {
  const { provider } = req.params;
  passport.authenticate(provider, {
    successRedirect: process.env.FRONTEND_URL || 'http://localhost:3000',
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
  })(req, res, next);
});

// Setup route - only accessible when system is not initialized
router.post('/setup', async (req, res) => {
  try {
    const initialized = await isInitialized();
    if (initialized) {
      return res.status(403).json({ error: 'System already initialized' });
    }

    const { provider_key, client_id, client_secret, issuer_url, scopes } = req.body;

    if (!provider_key || !client_id || !client_secret || !issuer_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create OIDC provider
    const providerId = uuidv4();
    await execute(
      `INSERT INTO oidc_providers (id, provider_key, client_id, client_secret, issuer_url, scopes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [providerId, provider_key, client_id, client_secret, issuer_url, scopes || 'openid profile email']
    );

    // Mark system as initialized
    await execute(
      `INSERT INTO system_config (key, value) VALUES ('initialized', 'true') 
       ON CONFLICT(key) DO UPDATE SET value = 'true'`,
      []
    );

    // Reload OIDC strategies
    await reloadOIDCStrategies();

    res.json({ message: 'Setup completed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/setup/status', async (req, res) => {
  try {
    const initialized = await isInitialized();
    res.json({ initialized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
