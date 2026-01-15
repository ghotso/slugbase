/**
 * Database seeding functionality for DEMO_MODE
 * Creates demo users, folders, tags, and bookmarks
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute } from './index.js';
import { generateUserKey } from '../utils/user-key.js';
import { DEMO_DATA } from './seed-data.js';
import { normalizeEmail, sanitizeString } from '../utils/validation.js';

/**
 * Seed the database with demo data
 * This should only be called when DEMO_MODE is enabled
 */
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding for DEMO_MODE...');

  try {
    // Create users and their data
    for (const userData of DEMO_DATA) {
      const { user, folders, tags, bookmarks } = userData;

      // Normalize email
      const normalizedEmail = normalizeEmail(user.email);

      // Check if user already exists
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE email = ?',
        [normalizedEmail]
      );

      let userId: string;
      let userKey: string;

      if (existingUser) {
        // User exists, use existing ID and key
        const existing = existingUser as any;
        userId = existing.id;
        const userRecord = await queryOne(
          'SELECT user_key FROM users WHERE id = ?',
          [userId]
        );
        userKey = (userRecord as any).user_key;
        console.log(`   Using existing user: ${user.email}`);
      } else {
        // Create new user
        userId = uuidv4();
        userKey = await generateUserKey();

        // Hash password
        const passwordHash = await bcrypt.hash(user.password, 10);

        // Retry logic for user_key collisions
        let retries = 0;
        const maxRetries = 3;
        while (retries < maxRetries) {
          try {
            await execute(
              `INSERT INTO users (id, email, name, user_key, password_hash, is_admin) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                userId,
                normalizedEmail,
                sanitizeString(user.name),
                userKey,
                passwordHash,
                user.isAdmin,
              ]
            );
            break;
          } catch (error: any) {
            if (
              error.message &&
              (error.message.includes('UNIQUE constraint') ||
                error.message.includes('duplicate')) &&
              error.message.includes('user_key')
            ) {
              retries++;
              if (retries >= maxRetries) {
                throw new Error(`Failed to create user ${user.email} after retries`);
              }
              userKey = await generateUserKey();
              continue;
            }
            throw error;
          }
        }

        console.log(`   ✓ Created user: ${user.email} (${userKey})`);
      }

      // Create folders
      const folderMap = new Map<string, string>(); // name -> id
      for (const folder of folders) {
        const existingFolder = await queryOne(
          'SELECT id FROM folders WHERE user_id = ? AND name = ?',
          [userId, folder.name]
        );

        let folderId: string;
        if (existingFolder) {
          folderId = (existingFolder as any).id;
        } else {
          folderId = uuidv4();
          await execute(
            'INSERT INTO folders (id, user_id, name, icon) VALUES (?, ?, ?, ?)',
            [folderId, userId, sanitizeString(folder.name), folder.icon || null]
          );
          console.log(`     ✓ Created folder: ${folder.name}`);
        }
        folderMap.set(folder.name, folderId);
      }

      // Create tags
      const tagMap = new Map<string, string>(); // name -> id
      for (const tag of tags) {
        const existingTag = await queryOne(
          'SELECT id FROM tags WHERE user_id = ? AND name = ?',
          [userId, tag.name]
        );

        let tagId: string;
        if (existingTag) {
          tagId = (existingTag as any).id;
        } else {
          tagId = uuidv4();
          await execute(
            'INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)',
            [tagId, userId, sanitizeString(tag.name)]
          );
          console.log(`     ✓ Created tag: ${tag.name}`);
        }
        tagMap.set(tag.name, tagId);
      }

      // Create bookmarks
      for (const bookmark of bookmarks) {
        // Check if bookmark with this slug already exists
        let existingBookmark: any = null;
        if (bookmark.slug) {
          existingBookmark = await queryOne(
            'SELECT id FROM bookmarks WHERE slug = ?',
            [bookmark.slug]
          );
        }

        let bookmarkId: string;
        if (existingBookmark) {
          bookmarkId = existingBookmark.id;
        } else {
          bookmarkId = uuidv4();

          // Generate slug if not provided
          let slug = bookmark.slug || null;

          await execute(
            `INSERT INTO bookmarks (
              id, user_id, title, url, slug, forwarding_enabled, pinned,
              access_count, last_accessed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bookmarkId,
              userId,
              sanitizeString(bookmark.title),
              bookmark.url,
              slug,
              bookmark.forwardingEnabled || false,
              bookmark.pinned || false,
              0,
              null,
            ]
          );
          console.log(`     ✓ Created bookmark: ${bookmark.title}`);

          // Link bookmark to folders
          if (bookmark.folderNames && bookmark.folderNames.length > 0) {
            for (const folderName of bookmark.folderNames) {
              const folderId = folderMap.get(folderName);
              if (folderId) {
                try {
                  await execute(
                    'INSERT INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
                    [bookmarkId, folderId]
                  );
                } catch (error: any) {
                  // Ignore duplicate key errors
                  if (
                    !error.message ||
                    (!error.message.includes('UNIQUE constraint') &&
                      !error.message.includes('duplicate'))
                  ) {
                    throw error;
                  }
                }
              }
            }
          }

          // Link bookmark to tags
          if (bookmark.tagNames && bookmark.tagNames.length > 0) {
            for (const tagName of bookmark.tagNames) {
              const tagId = tagMap.get(tagName);
              if (tagId) {
                try {
                  await execute(
                    'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
                    [bookmarkId, tagId]
                  );
                } catch (error: any) {
                  // Ignore duplicate key errors
                  if (
                    !error.message ||
                    (!error.message.includes('UNIQUE constraint') &&
                      !error.message.includes('duplicate'))
                  ) {
                    throw error;
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log('✅ Database seeding completed successfully');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Reset the database by dropping all user data and reseeding
 * This will:
 * 1. Delete all user-related data (bookmarks, folders, tags, shares, teams)
 * 2. Delete all users
 * 3. Reseed with fresh demo data
 */
export async function resetDatabase(): Promise<void> {
  console.log('🔄 Starting database reset...');

  try {
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';

    // Get all user IDs first (for cleanup)
    const allUsers = await query('SELECT id FROM users', []);

    // Delete all user-related data
    // Order matters due to foreign key constraints

    // Delete bookmark relationships
    await execute('DELETE FROM bookmark_folders', []);
    await execute('DELETE FROM bookmark_tags', []);
    await execute('DELETE FROM bookmark_user_shares', []);
    await execute('DELETE FROM bookmark_team_shares', []);

    // Delete folder relationships
    await execute('DELETE FROM folder_user_shares', []);
    await execute('DELETE FROM folder_team_shares', []);

    // Delete team memberships
    await execute('DELETE FROM team_members', []);

    // Delete bookmarks
    await execute('DELETE FROM bookmarks', []);

    // Delete folders
    await execute('DELETE FROM folders', []);

    // Delete tags
    await execute('DELETE FROM tags', []);

    // Delete teams
    await execute('DELETE FROM teams', []);

    // Delete password reset tokens
    await execute('DELETE FROM password_reset_tokens', []);

    // Delete users (this will cascade delete any remaining references)
    await execute('DELETE FROM users', []);

    // Delete sessions (if using database session store)
    try {
      await execute('DELETE FROM sessions', []);
    } catch (error: any) {
      // Ignore if sessions table doesn't exist
      if (!error.message || !error.message.includes("doesn't exist") && !error.message.includes('does not exist')) {
        console.warn('Could not delete sessions:', error.message);
      }
    }

    // Note: We keep schema_migrations and system_config tables intact
    // OIDC providers are also kept (they're system-wide configuration)

    console.log('   ✓ Cleared all user data');

    // Reseed the database
    await seedDatabase();

    console.log('✅ Database reset completed successfully');
  } catch (error: any) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}
