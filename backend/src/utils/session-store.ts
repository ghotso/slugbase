import { Store } from 'express-session';
import { query, queryOne, execute } from '../db/index.js';

interface SessionData {
  sid: string;
  sess: string;
  expire: Date;
}

/**
 * Convert SQL with ? placeholders to PostgreSQL $1, $2, etc. format
 */
function convertToPostgresSQL(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Custom database-backed session store for express-session
 * Works with both SQLite and PostgreSQL
 */
export class DatabaseSessionStore extends Store {
  private DB_TYPE: string;

  constructor() {
    super();
    this.DB_TYPE = process.env.DB_TYPE || 'sqlite';
    this.initializeTable();
    // Clean up expired sessions periodically (every hour)
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupInterval() {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        let sql = 'DELETE FROM sessions WHERE expire < ?';
        if (this.DB_TYPE === 'postgresql') {
          sql = convertToPostgresSQL(sql);
        }
        await execute(sql, [new Date().toISOString()]);
      } catch (error) {
        // Silently fail - cleanup is not critical
        console.warn('Session cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Initialize the sessions table if it doesn't exist
   */
  private async initializeTable() {
    try {
      if (this.DB_TYPE === 'postgresql') {
        await execute(`
          CREATE TABLE IF NOT EXISTS sessions (
            sid VARCHAR(255) PRIMARY KEY,
            sess TEXT NOT NULL,
            expire TIMESTAMP NOT NULL
          )
        `, []);
        await execute(`
          CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)
        `, []);
      } else {
        await execute(`
          CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            sess TEXT NOT NULL,
            expire DATETIME NOT NULL
          )
        `, []);
        await execute(`
          CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)
        `, []);
      }
    } catch (error: any) {
      // Table might already exist, ignore
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.error('Error initializing sessions table:', error);
      }
    }
  }

  /**
   * Get session data
   */
  async get(sid: string, callback: (err?: any, session?: any) => void) {
    try {
      let sql = 'SELECT sess FROM sessions WHERE sid = ? AND expire > ?';
      if (this.DB_TYPE === 'postgresql') {
        sql = convertToPostgresSQL(sql);
      }
      const session = await queryOne(sql, [sid, new Date().toISOString()]);

      if (session) {
        const sess = (session as any).sess;
        // Parse JSON string to object
        const parsed = typeof sess === 'string' ? JSON.parse(sess) : sess;
        callback(null, parsed);
      } else {
        callback(null, null);
      }
    } catch (error: any) {
      callback(error);
    }
  }

  /**
   * Set session data
   */
  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const sess = JSON.stringify(session);
      const expire = new Date(Date.now() + (session.cookie?.maxAge || 600000)); // Default 10 minutes

      if (this.DB_TYPE === 'postgresql') {
        // PostgreSQL uses ON CONFLICT
        await execute(`
          INSERT INTO sessions (sid, sess, expire)
          VALUES ($1, $2, $3)
          ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3
        `, [sid, sess, expire.toISOString()]);
      } else {
        // SQLite uses INSERT OR REPLACE
        await execute(`
          INSERT OR REPLACE INTO sessions (sid, sess, expire)
          VALUES (?, ?, ?)
        `, [sid, sess, expire.toISOString()]);
      }

      if (callback) callback();
    } catch (error: any) {
      if (callback) callback(error);
    }
  }

  /**
   * Destroy session
   */
  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      let sql = 'DELETE FROM sessions WHERE sid = ?';
      if (this.DB_TYPE === 'postgresql') {
        sql = convertToPostgresSQL(sql);
      }
      await execute(sql, [sid]);
      if (callback) callback();
    } catch (error: any) {
      if (callback) callback(error);
    }
  }

  /**
   * Clear all sessions
   */
  async clear(callback?: (err?: any) => void) {
    try {
      await execute('DELETE FROM sessions', []);
      if (callback) callback();
    } catch (error: any) {
      if (callback) callback(error);
    }
  }

  /**
   * Get number of sessions
   */
  async length(callback: (err?: any, length?: number) => void) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM sessions WHERE expire > ?';
      if (this.DB_TYPE === 'postgresql') {
        sql = convertToPostgresSQL(sql);
      }
      const result = await queryOne(sql, [new Date().toISOString()]);
      const count = (result as any)?.count || 0;
      callback(null, typeof count === 'string' ? parseInt(count) : count);
    } catch (error: any) {
      callback(error);
    }
  }

  /**
   * Get all session IDs
   */
  async all(callback: (err?: any, sessions?: any[]) => void) {
    try {
      let sql = 'SELECT sid, sess FROM sessions WHERE expire > ?';
      if (this.DB_TYPE === 'postgresql') {
        sql = convertToPostgresSQL(sql);
      }
      const sessions = await query(sql, [new Date().toISOString()]);
      const parsed = (sessions as any[]).map((s: any) => ({
        sid: s.sid,
        session: typeof s.sess === 'string' ? JSON.parse(s.sess) : s.sess,
      }));
      callback(null, parsed);
    } catch (error: any) {
      callback(error);
    }
  }

  /**
   * Touch session (update expiration)
   */
  async touch(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const expire = new Date(Date.now() + (session.cookie?.maxAge || 600000));
      let sql = 'UPDATE sessions SET expire = ? WHERE sid = ?';
      if (this.DB_TYPE === 'postgresql') {
        sql = convertToPostgresSQL(sql);
      }
      await execute(sql, [expire.toISOString(), sid]);
      if (callback) callback();
    } catch (error: any) {
      if (callback) callback(error);
    }
  }
}
