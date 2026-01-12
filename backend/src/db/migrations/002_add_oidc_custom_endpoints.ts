/**
 * Migration: Add custom OIDC endpoint fields
 * Date: 2026-01-12
 * Description: Adds optional custom endpoint fields (authorization_url, token_url, userinfo_url) to oidc_providers table
 *              to allow providers with non-standard endpoint paths
 */

import { execute } from '../index.js';

export const migrationId = '002_add_oidc_custom_endpoints';
export const migrationName = 'Add custom OIDC endpoint fields';

export async function up() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Add columns
    await execute('ALTER TABLE oidc_providers ADD COLUMN IF NOT EXISTS authorization_url TEXT', []);
    await execute('ALTER TABLE oidc_providers ADD COLUMN IF NOT EXISTS token_url TEXT', []);
    await execute('ALTER TABLE oidc_providers ADD COLUMN IF NOT EXISTS userinfo_url TEXT', []);
  } else {
    // SQLite: Need to recreate table
    // Create new table with new columns
    await execute(`
      CREATE TABLE IF NOT EXISTS oidc_providers_new (
        id VARCHAR(255) PRIMARY KEY,
        provider_key VARCHAR(255) UNIQUE NOT NULL,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        issuer_url TEXT NOT NULL,
        authorization_url TEXT,
        token_url TEXT,
        userinfo_url TEXT,
        scopes TEXT NOT NULL,
        auto_create_users BOOLEAN DEFAULT TRUE,
        default_role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, []);

    // Copy data from old table
    await execute(`
      INSERT INTO oidc_providers_new (
        id, provider_key, client_id, client_secret, issuer_url, 
        scopes, auto_create_users, default_role, created_at
      )
      SELECT 
        id, provider_key, client_id, client_secret, issuer_url,
        scopes, auto_create_users, default_role, created_at
      FROM oidc_providers
    `, []);

    // Drop old table
    await execute('DROP TABLE oidc_providers', []);

    // Rename new table
    await execute('ALTER TABLE oidc_providers_new RENAME TO oidc_providers', []);
  }
}

export async function down() {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL: Drop columns
    await execute('ALTER TABLE oidc_providers DROP COLUMN IF EXISTS authorization_url', []);
    await execute('ALTER TABLE oidc_providers DROP COLUMN IF EXISTS token_url', []);
    await execute('ALTER TABLE oidc_providers DROP COLUMN IF EXISTS userinfo_url', []);
  } else {
    // SQLite: Need to recreate table without new columns
    await execute(`
      CREATE TABLE IF NOT EXISTS oidc_providers_new (
        id VARCHAR(255) PRIMARY KEY,
        provider_key VARCHAR(255) UNIQUE NOT NULL,
        client_id TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        issuer_url TEXT NOT NULL,
        scopes TEXT NOT NULL,
        auto_create_users BOOLEAN DEFAULT TRUE,
        default_role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, []);

    // Copy data (excluding new columns)
    await execute(`
      INSERT INTO oidc_providers_new (
        id, provider_key, client_id, client_secret, issuer_url,
        scopes, auto_create_users, default_role, created_at
      )
      SELECT 
        id, provider_key, client_id, client_secret, issuer_url,
        scopes, auto_create_users, default_role, created_at
      FROM oidc_providers
    `, []);

    await execute('DROP TABLE oidc_providers', []);
    await execute('ALTER TABLE oidc_providers_new RENAME TO oidc_providers', []);
  }
}
