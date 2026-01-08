import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import bcrypt from 'bcryptjs';

const DB_NAME = 'clearmind_db';

class DatabaseService {
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.db = null;
    this.platform = Capacitor.getPlatform();
    this.isNative = this.platform !== 'web';
  }

  async initialize() {
    if (!this.isNative) {
      console.log('SQLite not available on web, using localStorage fallback');
      return false;
    }

    try {
      // Check connection consistency
      const retCC = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

      if (retCC.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      }

      await this.db.open();
      await this.createTables();
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createThoughtsTable = `
      CREATE TABLE IF NOT EXISTS thoughts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        thought TEXT NOT NULL,
        distortions TEXT,
        reframes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const createExercisesTable = `
      CREATE TABLE IF NOT EXISTS exercises_completed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        exercise_id TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const createChatSessionsTable = `
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        started_at DATETIME,
        ended_at DATETIME,
        messages TEXT,
        themes TEXT,
        emotions TEXT,
        action_items TEXT,
        summary TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    await this.db.execute(createUsersTable);
    await this.db.execute(createThoughtsTable);
    await this.db.execute(createExercisesTable);
    await this.db.execute(createChatSessionsTable);
  }

  // User operations
  async createUser(email, name, password) {
    if (!this.isNative) {
      return this.createUserLocalStorage(email, name, password);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)`;

    try {
      const result = await this.db.run(query, [email, name, passwordHash]);
      return { id: result.changes.lastId, email, name };
    } catch (error) {
      if (error.message?.includes('UNIQUE constraint')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async loginUser(email, password) {
    if (!this.isNative) {
      return this.loginUserLocalStorage(email, password);
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    const result = await this.db.query(query, [email]);

    if (result.values.length === 0) {
      throw new Error('User not found');
    }

    const user = result.values[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid password');
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async getUserById(id) {
    if (!this.isNative) {
      return this.getUserByIdLocalStorage(id);
    }

    const query = `SELECT id, email, name, created_at FROM users WHERE id = ?`;
    const result = await this.db.query(query, [id]);

    if (result.values.length === 0) {
      return null;
    }

    return result.values[0];
  }

  // Thought operations
  async saveThought(userId, thought, distortions, reframes) {
    if (!this.isNative) {
      return this.saveThoughtLocalStorage(userId, thought, distortions, reframes);
    }

    const query = `INSERT INTO thoughts (user_id, thought, distortions, reframes) VALUES (?, ?, ?, ?)`;
    const result = await this.db.run(query, [
      userId,
      thought,
      JSON.stringify(distortions),
      JSON.stringify(reframes)
    ]);

    return {
      id: result.changes.lastId,
      userId,
      thought,
      distortions,
      reframes,
      createdAt: new Date().toISOString()
    };
  }

  async getThoughts(userId, limit = 100) {
    if (!this.isNative) {
      return this.getThoughtsLocalStorage(userId);
    }

    const query = `
      SELECT * FROM thoughts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const result = await this.db.query(query, [userId, limit]);

    return result.values.map(row => ({
      id: row.id,
      userId: row.user_id,
      thought: row.thought,
      distortions: JSON.parse(row.distortions || '[]'),
      reframes: JSON.parse(row.reframes || '[]'),
      createdAt: row.created_at,
      synced: row.synced === 1
    }));
  }

  async deleteThought(id, userId) {
    if (!this.isNative) {
      return this.deleteThoughtLocalStorage(id, userId);
    }

    const query = `DELETE FROM thoughts WHERE id = ? AND user_id = ?`;
    await this.db.run(query, [id, userId]);
  }

  async getUnsyncedThoughts(userId) {
    if (!this.isNative) return [];

    const query = `SELECT * FROM thoughts WHERE user_id = ? AND synced = 0`;
    const result = await this.db.query(query, [userId]);

    return result.values.map(row => ({
      id: row.id,
      thought: row.thought,
      distortions: JSON.parse(row.distortions || '[]'),
      reframes: JSON.parse(row.reframes || '[]'),
      createdAt: row.created_at
    }));
  }

  async markThoughtSynced(id) {
    if (!this.isNative) return;

    const query = `UPDATE thoughts SET synced = 1 WHERE id = ?`;
    await this.db.run(query, [id]);
  }

  // Exercise completion operations
  async completeExercise(userId, exerciseId) {
    if (!this.isNative) {
      return this.completeExerciseLocalStorage(userId, exerciseId);
    }

    const query = `INSERT INTO exercises_completed (user_id, exercise_id) VALUES (?, ?)`;
    const result = await this.db.run(query, [userId, exerciseId]);

    return { id: result.changes.lastId, exerciseId, completedAt: new Date().toISOString() };
  }

  async getCompletedExercises(userId) {
    if (!this.isNative) {
      return this.getCompletedExercisesLocalStorage(userId);
    }

    const query = `SELECT * FROM exercises_completed WHERE user_id = ? ORDER BY completed_at DESC`;
    const result = await this.db.query(query, [userId]);

    return result.values.map(row => ({
      id: row.id,
      exerciseId: row.exercise_id,
      completedAt: row.completed_at,
      synced: row.synced === 1
    }));
  }

  // Analytics
  async getDistortionStats(userId) {
    const thoughts = await this.getThoughts(userId);
    const stats = {};

    thoughts.forEach(t => {
      t.distortions.forEach(d => {
        const name = d.name || d;
        stats[name] = (stats[name] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Chat session operations
  async saveChatSession(userId, session) {
    if (!this.isNative) {
      return this.saveChatSessionLocalStorage(userId, session);
    }

    const query = `
      INSERT OR REPLACE INTO chat_sessions
      (id, user_id, started_at, ended_at, messages, themes, emotions, action_items, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      session.id,
      userId,
      session.started_at,
      session.ended_at,
      JSON.stringify(session.messages),
      JSON.stringify(session.themes),
      JSON.stringify(session.emotions),
      JSON.stringify(session.action_items),
      session.summary
    ]);

    return session;
  }

  async getChatSessions(userId, limit = 50) {
    if (!this.isNative) {
      return this.getChatSessionsLocalStorage(userId);
    }

    const query = `
      SELECT * FROM chat_sessions
      WHERE user_id = ?
      ORDER BY ended_at DESC
      LIMIT ?
    `;
    const result = await this.db.query(query, [userId, limit]);

    return result.values.map(row => ({
      id: row.id,
      userId: row.user_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      messages: JSON.parse(row.messages || '[]'),
      themes: JSON.parse(row.themes || '[]'),
      emotions: JSON.parse(row.emotions || '[]'),
      action_items: JSON.parse(row.action_items || '[]'),
      summary: row.summary,
      synced: row.synced === 1
    }));
  }

  async deleteChatSession(sessionId, userId) {
    if (!this.isNative) {
      return this.deleteChatSessionLocalStorage(sessionId, userId);
    }

    const query = `DELETE FROM chat_sessions WHERE id = ? AND user_id = ?`;
    await this.db.run(query, [sessionId, userId]);
  }

  saveChatSessionLocalStorage(userId, session) {
    const sessions = JSON.parse(localStorage.getItem('clearmind_chat_sessions') || '[]');
    const entry = { ...session, userId };
    sessions.unshift(entry);
    localStorage.setItem('clearmind_chat_sessions', JSON.stringify(sessions.slice(0, 50)));
    return entry;
  }

  getChatSessionsLocalStorage(userId) {
    const sessions = JSON.parse(localStorage.getItem('clearmind_chat_sessions') || '[]');
    return sessions.filter(s => s.userId === userId);
  }

  deleteChatSessionLocalStorage(sessionId, userId) {
    const sessions = JSON.parse(localStorage.getItem('clearmind_chat_sessions') || '[]');
    const filtered = sessions.filter(s => !(s.id === sessionId && s.userId === userId));
    localStorage.setItem('clearmind_chat_sessions', JSON.stringify(filtered));
  }

  // LocalStorage fallback methods for web
  createUserLocalStorage(email, name, password) {
    const users = JSON.parse(localStorage.getItem('clearmind_users') || '[]');

    if (users.find(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = { id: Date.now(), email, name, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    localStorage.setItem('clearmind_users', JSON.stringify(users));

    return { id: user.id, email, name };
  }

  loginUserLocalStorage(email, password) {
    const users = JSON.parse(localStorage.getItem('clearmind_users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  getUserByIdLocalStorage(id) {
    const users = JSON.parse(localStorage.getItem('clearmind_users') || '[]');
    const user = users.find(u => u.id === id);
    return user ? { id: user.id, email: user.email, name: user.name } : null;
  }

  saveThoughtLocalStorage(userId, thought, distortions, reframes) {
    const thoughts = JSON.parse(localStorage.getItem('clearmind_thoughts') || '[]');
    const entry = {
      id: Date.now(),
      userId,
      thought,
      distortions,
      reframes,
      createdAt: new Date().toISOString(),
      synced: false
    };
    thoughts.unshift(entry);
    // Keep last 100
    localStorage.setItem('clearmind_thoughts', JSON.stringify(thoughts.slice(0, 100)));
    return entry;
  }

  getThoughtsLocalStorage(userId) {
    const thoughts = JSON.parse(localStorage.getItem('clearmind_thoughts') || '[]');
    return thoughts.filter(t => t.userId === userId);
  }

  deleteThoughtLocalStorage(id, userId) {
    const thoughts = JSON.parse(localStorage.getItem('clearmind_thoughts') || '[]');
    const filtered = thoughts.filter(t => !(t.id === id && t.userId === userId));
    localStorage.setItem('clearmind_thoughts', JSON.stringify(filtered));
  }

  completeExerciseLocalStorage(userId, exerciseId) {
    const exercises = JSON.parse(localStorage.getItem('clearmind_exercises_completed') || '[]');
    const entry = {
      id: Date.now(),
      userId,
      exerciseId,
      completedAt: new Date().toISOString(),
      synced: false
    };
    exercises.unshift(entry);
    localStorage.setItem('clearmind_exercises_completed', JSON.stringify(exercises));
    return entry;
  }

  getCompletedExercisesLocalStorage(userId) {
    const exercises = JSON.parse(localStorage.getItem('clearmind_exercises_completed') || '[]');
    return exercises.filter(e => e.userId === userId);
  }

  async close() {
    if (this.db && this.isNative) {
      await this.sqlite.closeConnection(DB_NAME, false);
    }
  }
}

// Singleton instance
const databaseService = new DatabaseService();
export default databaseService;
