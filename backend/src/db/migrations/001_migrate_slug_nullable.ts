/**
 * Migration: Make slug column nullable in bookmarks table
 * Date: 2024-01-01
 * Description: Makes the slug column nullable and converts all _internal_ placeholder slugs to NULL
 */

import { execute } from '../index.js';

export const migrationId = '001_migrate_slug_nullable';
export const migrationName = 'Make slug column nullable';

export async function up() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Just alter the column
    await execute('ALTER TABLE bookmarks ALTER COLUMN slug DROP NOT NULL', []);
  } else {
    // SQLite: Need to recreate table
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
  }

  // Clean up any remaining _internal_ slugs (set to NULL)
  await execute(
    `UPDATE bookmarks SET slug = NULL WHERE slug LIKE '_internal_%' OR slug = ''`,
    []
  );
}

export async function down() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // For PostgreSQL, we can't easily make it NOT NULL if there are NULL values
    // So we'll set a default value first, then make it NOT NULL
    await execute(`UPDATE bookmarks SET slug = '_internal_' || id WHERE slug IS NULL`, []);
    await execute('ALTER TABLE bookmarks ALTER COLUMN slug SET NOT NULL', []);
  } else {
    // SQLite: Need to recreate table
    await execute(`
      CREATE TABLE IF NOT EXISTS bookmarks_new (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        slug VARCHAR(255) NOT NULL,
        forwarding_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, []);

    await execute(`
      INSERT INTO bookmarks_new (id, user_id, title, url, slug, forwarding_enabled, created_at, updated_at)
      SELECT 
        id, 
        user_id, 
        title, 
        url, 
        COALESCE(slug, '_internal_' || id) as slug,
        forwarding_enabled,
        created_at,
        updated_at
      FROM bookmarks
    `, []);

    await execute('DROP TABLE bookmarks', []);
    await execute('ALTER TABLE bookmarks_new RENAME TO bookmarks', []);

    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_slug ON bookmarks(slug)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_slug ON bookmarks(user_id, slug)', []);
  }
}