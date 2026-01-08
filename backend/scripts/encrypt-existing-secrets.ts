/**
 * Migration script to encrypt existing plain-text OIDC client secrets
 * Run this once after setting up encryption to encrypt existing secrets
 * 
 * Usage: tsx scripts/encrypt-existing-secrets.ts
 */

import dotenv from 'dotenv';
import { query, execute } from '../src/db/index.js';
import { encrypt, decrypt } from '../src/utils/encryption.js';

dotenv.config();

async function migrateSecrets() {
  try {
    console.log('Starting migration of OIDC client secrets...');
    
    const providers = await query('SELECT id, client_secret FROM oidc_providers', []);
    const providersList = Array.isArray(providers) ? providers : (providers ? [providers] : []);
    
    if (providersList.length === 0) {
      console.log('No OIDC providers found. Nothing to migrate.');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    
    for (const provider of providersList) {
      const secret = (provider as any).client_secret;
      
      // Check if already encrypted (encrypted format: salt:iv:tag:data)
      if (secret && secret.split(':').length === 4) {
        // Try to decrypt to verify it's encrypted
        try {
          const testDecrypt = decrypt(secret);
          // If decryption succeeds and result is different, it's encrypted
          if (testDecrypt !== secret) {
            console.log(`Provider ${(provider as any).id}: Already encrypted, skipping`);
            skipped++;
            continue;
          }
        } catch {
          // Decryption failed, might be encrypted with different key or corrupted
          console.log(`Provider ${(provider as any).id}: Appears encrypted but decryption failed, skipping`);
          skipped++;
          continue;
        }
      }
      
      // Encrypt the secret
      const encryptedSecret = encrypt(secret);
      await execute('UPDATE oidc_providers SET client_secret = ? WHERE id = ?', [
        encryptedSecret,
        (provider as any).id
      ]);
      
      console.log(`Provider ${(provider as any).id}: Secret encrypted successfully`);
      migrated++;
    }
    
    console.log(`\nMigration complete!`);
    console.log(`- Migrated: ${migrated}`);
    console.log(`- Skipped (already encrypted): ${skipped}`);
    console.log(`- Total: ${providersList.length}`);
    
  } catch (error: any) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSecrets();
