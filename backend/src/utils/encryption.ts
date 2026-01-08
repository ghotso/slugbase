import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * ENCRYPTION_KEY is validated at startup via validateEnvironmentVariables()
 * This will throw if not set, preventing insecure defaults
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required. Please set it before starting the server.');
  }
  
  // If key is provided as hex string (64 chars = 32 bytes), convert it
  if (key.length === 64) {
    try {
      return Buffer.from(key, 'hex');
    } catch (error) {
      throw new Error('ENCRYPTION_KEY must be a valid hex string (64 characters) or a string of at least 32 characters');
    }
  }
  
  // Otherwise, derive key from the provided string
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  
  return crypto.scryptSync(key, 'slugbase-salt', KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    return text;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // Derive key from master key and salt
  const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Return format: salt:iv:tag:encryptedData
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param encryptedText - Encrypted string in format: salt:iv:tag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  // Check if this is already decrypted (for migration purposes)
  // Encrypted strings have the format: salt:iv:tag:data (all hex, separated by colons)
  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    // Assume it's plain text (for backward compatibility during migration)
    return encryptedText;
  }

  try {
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const key = getEncryptionKey();
    const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, assume it's plain text (for migration)
    console.warn('Decryption failed, assuming plain text:', error);
    return encryptedText;
  }
}

/**
 * Generate a secure encryption key (for use in ENCRYPTION_KEY env var)
 * @returns Hex-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
