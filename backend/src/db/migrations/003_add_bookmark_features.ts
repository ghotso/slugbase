import { execute } from '../index.js';

export const migrationId = '003_add_bookmark_features';
export const migrationName = 'Add pinned, access_count, and last_accessed_at fields to bookmarks';

export async function up() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Add columns directly
    await execute('ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE', []);
    await execute('ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0', []);
    await execute('ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP', []);
  } else {
    // SQLite: Need to recreate table
    // Create new table with new columns
    await execute(`
      CREATE TABLE IF NOT EXISTS bookmarks_new (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        slug VARCHAR(255),
        forwarding_enabled BOOLEAN DEFAULT FALSE,
        pinned BOOLEAN DEFAULT FALSE,
        access_count INTEGER DEFAULT 0,
        last_accessed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, []);

    // Copy data from old table
    await execute(`
      INSERT INTO bookmarks_new (
        id, user_id, title, url, slug, forwarding_enabled, 
        pinned, access_count, last_accessed_at, created_at, updated_at
      )
      SELECT 
        id, user_id, title, url, slug, forwarding_enabled,
        FALSE as pinned, 0 as access_count, NULL as last_accessed_at,
        created_at, updated_at
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
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_pinned ON bookmarks(pinned)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_access_count ON bookmarks(access_count)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_last_accessed ON bookmarks(last_accessed_at)', []);
  }
}

export async function down() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Remove columns
    await execute('ALTER TABLE bookmarks DROP COLUMN IF EXISTS pinned', []);
    await execute('ALTER TABLE bookmarks DROP COLUMN IF EXISTS access_count', []);
    await execute('ALTER TABLE bookmarks DROP COLUMN IF EXISTS last_accessed_at', []);
  } else {
    // SQLite: Recreate table without new columns
    await execute(`
      CREATE TABLE IF NOT EXISTS bookmarks_old (
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

    // Copy data (excluding new columns)
    await execute(`
      INSERT INTO bookmarks_old (
        id, user_id, title, url, slug, forwarding_enabled, created_at, updated_at
      )
      SELECT 
        id, user_id, title, url, slug, forwarding_enabled, created_at, updated_at
      FROM bookmarks
    `, []);

    // Drop new table
    await execute('DROP TABLE bookmarks', []);

    // Rename old table
    await execute('ALTER TABLE bookmarks_old RENAME TO bookmarks', []);

    // Recreate indexes
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_slug ON bookmarks(slug)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_slug ON bookmarks(user_id, slug)', []);
  }
}
