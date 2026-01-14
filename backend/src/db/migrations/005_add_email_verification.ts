import { execute, query } from '../index.js';

export const migrationId = '005';
export const migrationName = 'Add email verification system';

export async function up() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';

  if (DB_TYPE === 'postgresql') {
    // Add email_pending column to users table
    await execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_pending VARCHAR(255)
    `, []);

    // Create email verification tokens table
    await execute(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        new_email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, []);

    // Create indexes
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
      ON email_verification_tokens(token)
    `, []);
    
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user 
      ON email_verification_tokens(user_id)
    `, []);
    
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires 
      ON email_verification_tokens(expires_at)
    `, []);
  } else {
    // SQLite: Check if column exists before adding
    const tableInfo = await query("PRAGMA table_info(users)", []);
    const hasEmailPending = (tableInfo as any[]).some((col: any) => col.name === 'email_pending');
    
    if (!hasEmailPending) {
      // SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we need to recreate
      // But we'll use a safer approach: just add the column (it will fail if exists, but that's ok)
      try {
        await execute(`ALTER TABLE users ADD COLUMN email_pending VARCHAR(255)`, []);
      } catch (error: any) {
        // Column might already exist, ignore
        if (!error.message?.includes('duplicate column name')) {
          throw error;
        }
      }
    }

    // Create email verification tokens table
    await execute(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        new_email TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, []);

    // Create indexes
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
      ON email_verification_tokens(token)
    `, []);
    
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user 
      ON email_verification_tokens(user_id)
    `, []);
    
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires 
      ON email_verification_tokens(expires_at)
    `, []);
  }
}

export async function down() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';

  if (DB_TYPE === 'postgresql') {
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_expires`, []);
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_user`, []);
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_token`, []);
    await execute(`DROP TABLE IF EXISTS email_verification_tokens`, []);
    await execute(`ALTER TABLE users DROP COLUMN IF EXISTS email_pending`, []);
  } else {
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_expires`, []);
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_user`, []);
    await execute(`DROP INDEX IF EXISTS idx_email_verification_tokens_token`, []);
    await execute(`DROP TABLE IF EXISTS email_verification_tokens`, []);
    // SQLite doesn't support DROP COLUMN easily, so we'll leave email_pending
    // It won't cause issues if it exists
  }
}
