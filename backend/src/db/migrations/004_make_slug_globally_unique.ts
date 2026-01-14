/**
 * Migration 004: Make slug globally unique
 * 
 * Changes the UNIQUE constraint on bookmarks.slug from (user_id, slug) to just (slug)
 * This ensures that when bookmarks are shared, slugs are unique across the entire system,
 * allowing any user's user_key to work with shared bookmarks via forwarding.
 */

import { execute, query } from '../index.js';

export const migrationId = '004';
export const migrationName = 'Make slug globally unique';

export async function up() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';

  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Drop the old unique constraint and add a new one
    try {
      // Drop the old unique constraint
      await execute(
        'ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_slug_key',
        []
      );
    } catch (error: any) {
      // Constraint might not exist or have a different name, try alternative
      try {
        await execute(
          'ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_slug_unique',
          []
        );
      } catch (e) {
        // Try to find and drop the constraint
        const constraints = await query(
          `SELECT constraint_name 
           FROM information_schema.table_constraints 
           WHERE table_name = 'bookmarks' 
           AND constraint_type = 'UNIQUE' 
           AND constraint_name LIKE '%slug%'`,
          []
        );
        for (const constraint of constraints as any[]) {
          try {
            await execute(
              `ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`,
              []
            );
          } catch (e) {
            // Ignore errors
          }
        }
      }
    }

    // Add global unique constraint on slug (NULL values are allowed and don't violate uniqueness)
    await execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_slug_unique ON bookmarks (slug) WHERE slug IS NOT NULL',
      []
    );
  } else {
    // SQLite: Need to recreate the table
    // First, check if there are any duplicate slugs (excluding NULL)
    const duplicates = await query(
      `SELECT slug, COUNT(*) as count 
       FROM bookmarks 
       WHERE slug IS NOT NULL AND slug != ''
       GROUP BY slug 
       HAVING COUNT(*) > 1`,
      []
    );

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      // For duplicates, keep the oldest bookmark (by created_at) and nullify slugs for others
      console.log(`Found ${duplicates.length} duplicate slug(s). Resolving by keeping oldest bookmark for each slug...`);
      
      for (const dup of duplicates as any[]) {
        const slug = dup.slug;
        // Get all bookmarks with this slug, ordered by created_at
        const bookmarksWithSlug = await query(
          `SELECT id, created_at FROM bookmarks 
           WHERE slug = ? 
           ORDER BY created_at ASC`,
          [slug]
        );
        
        if (Array.isArray(bookmarksWithSlug) && bookmarksWithSlug.length > 1) {
          // Keep the first one (oldest), nullify slugs for the rest
          const toKeep = bookmarksWithSlug[0];
          const toNullify = bookmarksWithSlug.slice(1);
          
          for (const bm of toNullify) {
            await execute(
              `UPDATE bookmarks SET slug = NULL, forwarding_enabled = FALSE WHERE id = ?`,
              [bm.id]
            );
            console.log(`  - Nullified slug for bookmark ${bm.id} (duplicate of ${toKeep.id})`);
          }
        }
      }
      
      console.log('Duplicate slugs resolved. Continuing migration...');
    }

    // Create new table with global unique constraint
    await execute(`
      CREATE TABLE bookmarks_new (
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(slug)
      )
    `, []);

    // Copy data
    await execute(`
      INSERT INTO bookmarks_new 
      SELECT * FROM bookmarks
    `, []);

    // Drop old table
    await execute('DROP TABLE bookmarks', []);

    // Rename new table
    await execute('ALTER TABLE bookmarks_new RENAME TO bookmarks', []);

    // Recreate indexes
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_slug ON bookmarks(slug)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_pinned ON bookmarks(pinned)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_access_count ON bookmarks(access_count)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_last_accessed ON bookmarks(last_accessed_at)', []);
  }
}

export async function down() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';

  if (DB_TYPE === 'postgresql') {
    // Drop the global unique index
    await execute('DROP INDEX IF EXISTS idx_bookmarks_slug_unique', []);

    // Restore the per-user unique constraint
    await execute(
      'ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_slug_key UNIQUE (user_id, slug)',
      []
    );
  } else {
    // SQLite: Recreate table with per-user unique constraint
    await execute(`
      CREATE TABLE bookmarks_old (
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, slug)
      )
    `, []);

    // Copy data
    await execute(`
      INSERT INTO bookmarks_old 
      SELECT * FROM bookmarks
    `, []);

    // Drop current table
    await execute('DROP TABLE bookmarks', []);

    // Rename old table
    await execute('ALTER TABLE bookmarks_old RENAME TO bookmarks', []);

    // Recreate indexes
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_slug ON bookmarks(slug)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_pinned ON bookmarks(pinned)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_access_count ON bookmarks(access_count)', []);
    await execute('CREATE INDEX IF NOT EXISTS idx_bookmarks_last_accessed ON bookmarks(last_accessed_at)', []);
  }
}
