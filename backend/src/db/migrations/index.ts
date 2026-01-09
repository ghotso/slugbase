/**
 * Auto-registered migrations
 * All migration files in this directory should export:
 * - migrationId: string (unique identifier)
 * - migrationName: string (human-readable name)
 * - up: () => Promise<void> (migration function)
 * - down?: () => Promise<void> (optional rollback function)
 * 
 * To add a new migration:
 * 1. Create a new file with format: NNN_migration_name.ts
 * 2. Export migrationId, migrationName, up, and optionally down
 * 3. Import it below and add to the migrations array
 */

import { execute, query } from '../index.js';
import * as migration001 from './001_migrate_slug_nullable.js';

export interface Migration {
  migrationId: string;
  migrationName: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

// Register all migrations here (sorted by migrationId)
const migrations: Migration[] = [
  {
    migrationId: migration001.migrationId,
    migrationName: migration001.migrationName,
    up: migration001.up,
    down: migration001.down,
  },
  // Add new migrations here following the pattern above
];

// Ensure migrations table exists
async function ensureMigrationsTable() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    await execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id VARCHAR(255) PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, []);
  } else {
    await execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id TEXT PRIMARY KEY,
        migration_name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, []);
  }
}

// Get applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  try {
    const results = await query('SELECT migration_id FROM schema_migrations ORDER BY migration_id', []);
    return results.map((r: any) => r.migration_id);
  } catch (error: any) {
    // Table might not exist yet
    if (error.message?.includes('no such table') || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

// Record migration as applied
async function recordMigration(migrationId: string, migrationName: string) {
  await execute(
    'INSERT INTO schema_migrations (migration_id, migration_name) VALUES (?, ?)',
    [migrationId, migrationName]
  );
}

// Run all pending migrations
export async function runMigrations() {
  console.log('Checking for pending migrations...');
  
  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();
  
  // Sort migrations by migrationId to ensure correct order
  const sortedMigrations = migrations.sort((a, b) => 
    a.migrationId.localeCompare(b.migrationId)
  );
  
  const pendingMigrations = sortedMigrations.filter(
    m => !appliedMigrations.includes(m.migrationId)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations.');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migration(s):`);
  
  for (const migration of pendingMigrations) {
    try {
      console.log(`Running migration: ${migration.migrationId} - ${migration.migrationName}`);
      await migration.up();
      await recordMigration(migration.migrationId, migration.migrationName);
      console.log(`✓ Migration ${migration.migrationId} applied successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.migrationId} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully.');
}

// Get all migrations (for listing)
export function getAllMigrations(): Migration[] {
  return migrations.sort((a, b) => a.migrationId.localeCompare(b.migrationId));
}