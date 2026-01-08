import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db: Database.Database | Pool;

/**
 * Convert boolean to database-compatible value
 * SQLite needs 0/1, PostgreSQL can use true/false
 */
function boolToDb(value: boolean | undefined | null): number | boolean | null {
  if (value === null || value === undefined) return null;
  if (DB_TYPE === 'postgresql') {
    return value;
  }
  return value ? 1 : 0;
}

if (DB_TYPE === 'postgresql') {
  db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'slugbase',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });
} else {
  const dbPath = process.env.DB_PATH || join(__dirname, '../../data/slugbase.db');
  db = new Database(dbPath);
}

export async function initDatabase() {
  let schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  
  // Clean up any existing _internal_ placeholder slugs
  try {
    if (DB_TYPE === 'postgresql') {
      const pool = db as Pool;
      await pool.query(`UPDATE bookmarks SET slug = NULL WHERE slug LIKE '_internal_%' OR slug = ''`);
    } else {
      const sqlite = db as Database.Database;
      sqlite.prepare(`UPDATE bookmarks SET slug = NULL WHERE slug LIKE '_internal_%' OR slug = ''`).run();
    }
  } catch (error: any) {
    // Ignore errors (table might not exist yet)
    if (!error.message.includes('no such table')) {
      console.warn('Could not clean up internal slugs:', error.message);
    }
  }
  
  if (DB_TYPE === 'postgresql') {
    const pool = db as Pool;
    // Convert to PostgreSQL-compatible syntax
    schema = schema
      .replace(/VARCHAR\((\d+)\)/g, 'VARCHAR($1)')
      .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // Split schema by semicolons and execute each statement
    const statements = schema.split(';').filter((s: string) => s.trim().length > 0);
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.error('Schema error:', error.message, 'Statement:', statement.substring(0, 100));
          }
        }
      }
    }
  } else {
    const sqlite = db as Database.Database;
    // Convert to SQLite-compatible syntax
    schema = schema
      .replace(/VARCHAR\((\d+)\)/g, 'TEXT')
      .replace(/TIMESTAMP/g, 'DATETIME');
    sqlite.exec(schema);
  }
}

export async function query(sql: string, params: any[] = []) {
  if (DB_TYPE === 'postgresql') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).all(...params);
  }
}

export async function queryOne(sql: string, params: any[] = []) {
  if (DB_TYPE === 'postgresql') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).get(...params) || null;
  }
}

export async function execute(sql: string, params: any[] = []) {
  // Convert boolean values for SQLite compatibility
  const processedParams = params.map(param => {
    if (typeof param === 'boolean') {
      return boolToDb(param);
    }
    return param;
  });

  if (DB_TYPE === 'postgresql') {
    const pool = db as Pool;
    const result = await pool.query(sql, processedParams);
    return { changes: result.rowCount || 0, lastInsertRowid: null };
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).run(...processedParams);
  }
}

export async function isInitialized(): Promise<boolean> {
  try {
    // Check if there are any users in the system
    // System is initialized only after at least one user exists
    const result = await queryOne("SELECT COUNT(*) as count FROM users", []);
    return result && parseInt((result as any).count) > 0;
  } catch {
    // If table doesn't exist or query fails, system is not initialized
    return false;
  }
}

export { db };
