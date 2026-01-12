import crypto from 'crypto';
import { queryOne } from '../db/index.js';

/**
 * Character set for user keys: URL-safe, easy to type, no ambiguous characters
 * Excludes: 0, O, I, l (to avoid confusion)
 */
const USER_KEY_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';

/**
 * Get optimal user key length based on current user count
 * This ensures shorter keys for smaller userbases
 */
async function getOptimalKeyLength(): Promise<number> {
  try {
    const result = await queryOne('SELECT COUNT(*) as count FROM users', []);
    const userCount = result ? parseInt((result as any).count) : 0;
    
    // Start with 4 characters for small userbases
    // Increase length as userbase grows to maintain low collision probability
    if (userCount < 10) return 4;        // ~1.8M combinations
    if (userCount < 100) return 5;       // ~100M combinations
    if (userCount < 1000) return 6;      // ~5.6B combinations
    if (userCount < 10000) return 7;     // ~315B combinations
    if (userCount < 100000) return 8;   // ~17.7T combinations
    return 9;                            // ~1 quadrillion combinations
  } catch (error) {
    // If query fails, default to safe length
    return 6;
  }
}

/**
 * Generate a random user key of specified length
 */
function generateRandomKey(length: number): string {
  const chars = USER_KEY_CHARS;
  let key = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    key += chars[randomIndex];
  }
  
  return key;
}

/**
 * Check if a user key already exists in the database
 */
async function userKeyExists(userKey: string): Promise<boolean> {
  try {
    const existing = await queryOne('SELECT id FROM users WHERE user_key = ?', [userKey]);
    return existing !== null;
  } catch (error) {
    // On error, assume it exists to be safe
    return true;
  }
}

/**
 * Generate a unique user key with automatic length adjustment
 * 
 * Strategy:
 * 1. Start with optimal length based on user count
 * 2. Generate random key
 * 3. Check for collision
 * 4. If collision, retry with same length (up to maxRetries)
 * 5. If still collision, increase length and retry
 * 6. Continue until unique key is found
 * 
 * Key length progression:
 * - 4 chars: ~1.8M combinations (good for <10 users)
 * - 5 chars: ~100M combinations (good for <100 users)
 * - 6 chars: ~5.6B combinations (good for <1000 users)
 * - 7 chars: ~315B combinations (good for <10K users)
 * - 8 chars: ~17.7T combinations (good for <100K users)
 * - 9+ chars: For very large userbases
 * 
 * @param maxRetries - Maximum number of retries at each length before increasing (default: 3)
 * @returns A unique user key
 */
export async function generateUserKey(maxRetries: number = 3): Promise<string> {
  let baseLength = await getOptimalKeyLength();
  let currentLength = baseLength;
  let attempts = 0;
  let retriesAtCurrentLength = 0;
  const maxAttempts = 20; // Prevent infinite loops (should never reach this)
  
  while (attempts < maxAttempts) {
    const key = generateRandomKey(currentLength);
    const exists = await userKeyExists(key);
    
    if (!exists) {
      return key;
    }
    
    attempts++;
    retriesAtCurrentLength++;
    
    // After maxRetries attempts at current length, increase length
    if (retriesAtCurrentLength > maxRetries) {
      currentLength++;
      retriesAtCurrentLength = 0;
    }
  }
  
  // Fallback: if we've exhausted attempts (extremely rare), use a longer key with timestamp
  // This ensures uniqueness even in edge cases
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = generateRandomKey(Math.max(currentLength, 8));
  const fallbackKey = randomPart + timestamp;
  
  // Verify fallback key is unique (should always be due to timestamp)
  const fallbackExists = await userKeyExists(fallbackKey);
  if (!fallbackExists) {
    return fallbackKey;
  }
  
  // Last resort: add more randomness (should never reach here)
  const extraRandom = crypto.randomBytes(4).toString('hex');
  return fallbackKey + extraRandom;
}
