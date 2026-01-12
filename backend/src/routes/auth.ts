import { Router } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, queryOne, execute, isInitialized } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { reloadOIDCStrategies } from '../auth/oidc.js';
import { generateToken } from '../utils/jwt.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { authRateLimiter, strictRateLimiter } from '../middleware/security.js';
import { validateEmail, normalizeEmail, validatePassword, validateLength, sanitizeString } from '../utils/validation.js';
import { generateUserKey } from '../utils/user-key.js';

const router = Router();

/**
 * @swagger
 * /api/auth/providers:
 *   get:
 *     summary: Get available OIDC providers
 *     description: Returns a list of all configured OIDC providers (public endpoint, no authentication required)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: List of OIDC providers
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
 *                   provider_key:
 *                     type: string
 *                     example: "google"
 *                   issuer_url:
 *                     type: string
 *                     example: "https://accounts.google.com"
 *       500:
 *         description: Server error
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await query('SELECT id, provider_key, issuer_url FROM oidc_providers', []);
    const providersList = Array.isArray(providers) ? providers : (providers ? [providers] : []);
    
    // Add callback URL information for each provider to help with OIDC configuration
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const providersWithCallback = providersList.map((p: any) => ({
      ...p,
      callback_url: `${baseUrl}/api/auth/${p.provider_key}/callback`,
    }));
    
    res.json(providersWithCallback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 user_key:
 *                   type: string
 *                   example: "abc12345"
 *                 is_admin:
 *                   type: boolean
 *                   example: false
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 theme:
 *                   type: string
 *                   example: "auto"
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth(), (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user!;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    user_key: user.user_key,
    is_admin: user.is_admin,
    language: (user as any).language || 'en',
    theme: (user as any).theme || 'auto',
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticate a user with email and password. Returns user information and sets an httpOnly JWT cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 user_key:
 *                   type: string
 *                   example: "abc12345"
 *                 is_admin:
 *                   type: boolean
 *                   example: false
 *                 language:
 *                   type: string
 *                   example: "en"
 *                 theme:
 *                   type: string
 *                   example: "auto"
 *         headers:
 *           Set-Cookie:
 *             description: JWT token in httpOnly cookie
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict"
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials or account has no password set
 */
// Local authentication (email/password)
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate and normalize email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    const normalizedEmail = normalizeEmail(email);

    // Find user by email (use normalized email)
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user has a password set
    if (!(user as any).password_hash) {
      return res.status(401).json({ error: 'This account does not have a password set. Please use OIDC login.' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, (user as any).password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken({
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      user_key: (user as any).user_key,
      is_admin: (user as any).is_admin,
    });

    // Set httpOnly cookie with JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Always use strict for CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      user_key: (user as any).user_key,
      is_admin: (user as any).is_admin,
      language: (user as any).language,
      theme: (user as any).theme,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     description: Clears the authentication cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 */
router.post('/logout', (req, res) => {
  // Clear JWT cookie
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict', // Always use strict for CSRF protection
  });
  res.json({ message: 'Logged out' });
});

/**
 * @swagger
 * /api/auth/{provider}:
 *   get:
 *     summary: Initiate OIDC login
 *     description: Redirects to the OIDC provider's authentication page. This is a redirect endpoint, not a JSON API.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC provider key (e.g., "google", "github")
 *         example: "google"
 *     responses:
 *       302:
 *         description: Redirect to OIDC provider
 *       404:
 *         description: Provider not found
 */
// OIDC login route
// Note: OIDC requires sessions for the OAuth flow, so we don't use session: false here
router.get('/:provider', async (req, res, next) => {
  const { provider } = req.params;
  console.log(`[OIDC] Initiating login for provider: ${provider}`);
  console.log(`[OIDC] Request URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`[OIDC] BASE_URL env: ${process.env.BASE_URL}`);
  passport.authenticate(provider)(req, res, next);
});

/**
 * @swagger
 * /api/auth/{provider}/callback:
 *   get:
 *     summary: OIDC callback endpoint
 *     description: Handles the OIDC provider callback after authentication. This is a redirect endpoint used by the OIDC flow.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC provider key
 *         example: "google"
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from OIDC provider
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       302:
 *         description: Redirect to frontend (success) or login page (error)
 */
// OIDC callback route
// Note: OIDC requires sessions for the OAuth flow, but we convert to JWT after authentication
router.get('/:provider/callback', (req, res, next) => {
  const { provider } = req.params;
  console.log(`[OIDC] Callback received for provider: ${provider}`);
  console.log(`[OIDC] Query params:`, req.query);
  console.log(`[OIDC] Session ID:`, req.session?.id);
  console.log(`[OIDC] Session data:`, req.session);
  console.log(`[OIDC] Cookies:`, req.cookies);
  
  passport.authenticate(provider, (err: any, user: any, info: any) => {
    console.log(`[OIDC] Authentication result for ${provider}:`);
    console.log(`[OIDC] Error:`, err ? err.message : 'none');
    console.log(`[OIDC] User:`, user ? { id: user.id, email: user.email } : 'none');
    console.log(`[OIDC] Info:`, info);
    
    if (err || !user) {
      // Check for specific error types
      let errorParam = 'auth_failed';
      if (err) {
        console.error(`[OIDC] Authentication error for ${provider}:`, {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        if (err.message === 'AUTO_CREATE_DISABLED') {
          errorParam = 'auto_create_disabled';
        }
      } else if (!user) {
        console.error(`[OIDC] No user returned for ${provider}. Info:`, info);
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${errorParam}`);
    }

    // Generate JWT token for OIDC user
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      user_key: user.user_key,
      is_admin: user.is_admin,
    });

    // Set httpOnly cookie with JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Always use strict for CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Destroy session since we're using JWT for authentication
    // Session was only needed for the OAuth flow
    req.session?.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Error destroying session:', sessionErr);
      }
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    });
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/setup:
 *   post:
 *     summary: Initial system setup
 *     description: Creates the first admin user. Only accessible when the system is not yet initialized.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               name:
 *                 type: string
 *                 example: "Admin User"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: Setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setup completed successfully. You can now log in."
 *       400:
 *         description: Invalid input or user already exists
 *       403:
 *         description: System already initialized
 */
// Setup route - only accessible when system is not initialized
router.post('/setup', strictRateLimiter, async (req, res) => {
  try {
    const initialized = await isInitialized();
    if (initialized) {
      return res.status(403).json({ error: 'System already initialized' });
    }

    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Validate and normalize email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    const normalizedEmail = normalizeEmail(email);

    // Validate name length
    const nameValidation = validateLength(name, 'Name', 1, 255);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }
    const sanitizedName = sanitizeString(name);

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if email already exists (use normalized email)
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create first admin user
    const userId = uuidv4();
    let userKey = await generateUserKey();
    
    // Retry logic for user_key collisions (should be extremely rare)
    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
      try {
        await execute(
          `INSERT INTO users (id, email, name, user_key, password_hash, is_admin) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, normalizedEmail, sanitizedName, userKey, passwordHash, true] // First user is always admin
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        // If user_key collision, generate new key and retry
        if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate')) 
            && error.message.includes('user_key')) {
          retries++;
          if (retries >= maxRetries) {
            return res.status(500).json({ error: 'Failed to complete setup. Please try again.' });
          }
          userKey = await generateUserKey();
          continue; // Retry with new key
        }
        // For other errors (like email duplicate), throw to outer catch
        throw error;
      }
    }

    res.json({ message: 'Setup completed successfully. You can now log in.' });
  } catch (error: any) {
    // Handle unique constraint violations
    if (error.message && (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate'))) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/setup/status:
 *   get:
 *     summary: Check system initialization status
 *     description: Returns whether the system has been initialized (has at least one user)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: System initialization status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 initialized:
 *                   type: boolean
 *                   example: false
 *                   description: true if system has been initialized, false otherwise
 */
router.get('/setup/status', async (req, res) => {
  try {
    const initialized = await isInitialized();
    res.json({ initialized });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
