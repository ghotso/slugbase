import { Router } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validateEmail, normalizeEmail, validatePassword } from '../utils/validation.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email to the user if the email exists and SMTP is configured
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent (if user exists and SMTP configured)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "If an account with this email exists, a password reset link has been sent."
 *       400:
 *         description: Invalid email format
 */
router.post('/request', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    
    // Always return success message to prevent email enumeration
    // Only send email if user exists and has a password (not OIDC-only)
    if (user && (user as any).password_hash) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      // Store token in database
      await execute(
        'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [tokenId, (user as any).id, token, expiresAt.toISOString()]
      );

      // Build reset URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email (don't fail if email fails, just log)
      await sendPasswordResetEmail(normalizedEmail, token, resetUrl);
    }

    // Always return same message to prevent email enumeration
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    // Still return success to prevent information disclosure
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  }
});

/**
 * @swagger
 * /api/password-reset/verify:
 *   get:
 *     summary: Verify password reset token
 *     description: Checks if a password reset token is valid and not expired
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Token is invalid or expired
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    // Find token
    const resetToken = await queryOne(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE',
      [token]
    );

    if (!resetToken) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired token' });
    }

    // Check expiration
    const expiresAt = new Date((resetToken as any).expires_at);
    if (expiresAt < new Date()) {
      // Mark as used
      await execute('UPDATE password_reset_tokens SET used = TRUE WHERE token = ?', [token]);
      return res.status(400).json({ valid: false, error: 'Token has expired' });
    }

    res.json({ valid: true });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(400).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Reset password with token
 *     description: Resets the user's password using a valid reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password (must meet complexity requirements)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Invalid token, expired token, or weak password
 */
router.post('/reset', authRateLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Find token
    const resetToken = await queryOne(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE',
      [token]
    );

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check expiration
    const expiresAt = new Date((resetToken as any).expires_at);
    if (expiresAt < new Date()) {
      // Mark as used
      await execute('UPDATE password_reset_tokens SET used = TRUE WHERE token = ?', [token]);
      return res.status(400).json({ error: 'Token has expired' });
    }

    // Get user
    const userId = (resetToken as any).user_id;
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

    // Mark token as used
    await execute('UPDATE password_reset_tokens SET used = TRUE WHERE token = ?', [token]);

    // Invalidate all other reset tokens for this user
    await execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE',
      [userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
