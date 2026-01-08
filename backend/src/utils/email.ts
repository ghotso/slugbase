import nodemailer from 'nodemailer';
import { queryOne } from '../db/index.js';
import { decrypt } from './encryption.js';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    password: string;
  };
  from: string;
  fromName: string;
}

/**
 * Get SMTP configuration from system settings
 */
async function getSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    const enabled = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_enabled']);
    if (!enabled || (enabled as any).value !== 'true') {
      return null; // SMTP not enabled
    }

    const host = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_host']);
    const port = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_port']);
    const secure = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_secure']);
    const user = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_user']);
    const password = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_password']);
    const from = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_from']);
    const fromName = await queryOne('SELECT value FROM system_config WHERE key = ?', ['smtp_from_name']);

    if (!host || !port || !user || !password || !from) {
      return null; // Missing required settings
    }

    // Decrypt password if it's encrypted
    let decryptedPassword = (password as any).value;
    try {
      // Try to decrypt (will return original if not encrypted)
      decryptedPassword = decrypt(decryptedPassword);
    } catch {
      // If decryption fails, use as-is (plain text)
      decryptedPassword = (password as any).value;
    }

    return {
      host: String((host as any).value),
      port: parseInt(String((port as any).value)) || 587,
      secure: (secure as any)?.value === 'true' || false,
      auth: {
        user: String((user as any).value),
        password: String(decryptedPassword),
      },
      from: String((from as any).value),
      fromName: String((fromName as any)?.value || 'SlugBase'),
    };
  } catch (error) {
    console.error('Error getting SMTP config:', error);
    return null;
  }
}

/**
 * Send email using configured SMTP settings
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  try {
    const config = await getSMTPConfig();
    if (!config) {
      console.error('SMTP not configured or not enabled');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
  const subject = 'Password Reset Request - SlugBase';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .button:hover { background-color: #0056b3; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .warning { color: #d32f2f; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password for your SlugBase account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p class="warning">This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <div class="footer">
          <p>This is an automated message from SlugBase. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
}

/**
 * Test SMTP configuration
 */
export async function testSMTPConfig(testEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSMTPConfig();
    if (!config) {
      return { success: false, error: 'SMTP not configured or not enabled' };
    }

    const subject = 'SMTP Test Email - SlugBase';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>SMTP Configuration Test</h1>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;

    const success = await sendEmail(testEmail, subject, html);
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send test email' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}
