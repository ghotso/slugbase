/**
 * Migration script to:
 * 1. Make slug column nullable
 * 2. Convert all _internal_ placeholder slugs to NULL
 * 3. Remove UNIQUE constraint issues with NULL slugs
 * 
 * Run this once to migrate existing database
 */

import { query, execute } from './index.js';

export async function migrateSlugNullable() {
  try {
    console.log('Starting slug migration...');

    // For SQLite, we need to recreate the table to make slug nullable
    // For PostgreSQL, we can use ALTER TABLE
    
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    
    if (DB_TYPE === 'postgresql') {
      // PostgreSQL: Just alter the column
      await execute('ALTER TABLE bookmarks ALTER COLUMN slug DROP NOT NULL', []);
      console.log('Made slug column nullable');
    } else {
      // SQLite: Need to recreate table
      console.log('SQLite detected - recreating bookmarks table...');
      
      // Create new table with nullable slug
      await execute(`
        CREATE TABLE IF NOT EXISTS bookmarks_new (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          slug VARCHAR(255),
          forwarding_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, []);

      // Copy data, converting _internal_ slugs to NULL
      await execute(`
        INSERT INTO bookmarks_new (id, user_id, title, url, slug, forwarding_enabled, created_at, updated_at)
        SELECT 
          id, 
          user_id, 
          title, 
          url, 
          CASE 
            WHEN slug IS NULL OR slug = '' OR slug LIKE '_internal_%' THEN NULL
            ELSE slug
          END as slug,
          forwarding_enabled,
          created_at,
          updated_at
        FROM bookmarks
      `, []);

      // Drop old table
      await execute('DROP TABLE bookmarks', []);

      // Rename new table
      await execute('ALTER TABLE bookmarks_new RENAME TO bookmarks', []);

      // Recreate indexes
      await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)', []);
      await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_slug ON bookmarks(slug)', []);
      await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_slug ON bookmarks(user_id, slug)', []);

      console.log('Recreated bookmarks table with nullable slug');
    }

    // Clean up any remaining _internal_ slugs (set to NULL)
    const result = await execute(
      `UPDATE bookmarks SET slug = NULL WHERE slug LIKE '_internal_%' OR slug = ''`,
      []
    );
    console.log(`Cleaned up ${result.changes || 0} internal placeholder slugs`);

    console.log('Slug migration completed successfully!');
  } catch (error: any) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSlugNullable()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
