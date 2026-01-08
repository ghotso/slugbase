#!/usr/bin/env node
/**
 * Generate a secure encryption key for ENCRYPTION_KEY environment variable
 * Usage: node scripts/generate-encryption-key.js
 */

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');
console.log('Generated encryption key (64 hex characters):');
console.log(key);
console.log('\nAdd this to your .env file as:');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('\n⚠️  IMPORTANT: Keep this key secure and backed up!');
console.log('   If you lose this key, encrypted data cannot be decrypted.');
