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
  if (DB_TYPE === 'postgresql') {
    const pool = db as Pool;
    const result = await pool.query(sql, params);
    return { changes: result.rowCount || 0, lastInsertRowid: null };
  } else {
    const sqlite = db as Database.Database;
    return sqlite.prepare(sql).run(...params);
  }
}

export async function isInitialized(): Promise<boolean> {
  try {
    if (DB_TYPE === 'postgresql') {
      const result = await queryOne("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users'");
      return result && parseInt((result as any).count) > 0;
    } else {
      const result = await queryOne("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'");
      return result && parseInt((result as any).count) > 0;
    }
  } catch {
    return false;
  }
}

export { db };
