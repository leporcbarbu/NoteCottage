// Import the database module (it will use the test database path set in setup.js)
let db = null;

class TestDatabaseHelper {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize test database with fresh schema
   * The database module reads from process.env.DATABASE_PATH which is set in setup.js
   */
  async initialize() {
    // Import database module (it will automatically use the test database path)
    // Only delete cache if this is the first initialization
    if (!this.db) {
      delete require.cache[require.resolve('../../database')];
      this.db = require('../../database');
    }

    return this.db;
  }

  /**
   * Clear all data from tables (but keep schema)
   */
  clearAllData() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Use the existing database instance from the module
    // The database module exports 'db' which is the better-sqlite3 instance
    const dbInstance = this.db.db;

    // Disable foreign key constraints temporarily
    dbInstance.exec('PRAGMA foreign_keys = OFF;');

    // Clear all tables in reverse dependency order
    // (sessions are in a separate database managed by connect-sqlite3)
    try {
      dbInstance.exec('DELETE FROM note_tags;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM attachments;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM notes;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM folders;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM tags;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM users;');
    } catch (e) { /* Table might not exist yet */ }

    try {
      dbInstance.exec('DELETE FROM system_settings;');
    } catch (e) { /* Table might not exist yet */ }

    // Re-enable foreign key constraints
    dbInstance.exec('PRAGMA foreign_keys = ON;');

    // Reset autoincrement counters
    try {
      dbInstance.exec('DELETE FROM sqlite_sequence;');
    } catch (e) { /* Table might not exist yet */ }
  }

  /**
   * Create a test user
   * Note: db.createUser expects a hashed password, but for tests we hash it here
   */
  async createTestUser(username = 'testuser', password = 'password123', role = 'user') {
    const bcrypt = require('bcrypt');
    const SALT_ROUNDS = 12;

    // Hash the password just like the server does
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // First user is admin
    const isAdmin = role === 'admin';

    return this.db.createUser(username, `${username}@test.com`, passwordHash, null, isAdmin);
  }

  /**
   * Create a test note
   */
  createTestNote(userId, title = 'Test Note', content = 'Test content', folderId = null, type = 'markdown') {
    // Database createNote signature: (title, content, folderId, userId, type)
    const result = this.db.createNote(title, content, folderId, userId, type);
    return result.id; // Return just the ID for simpler test assertions
  }

  /**
   * Create a test folder
   */
  createTestFolder(userId, name = 'Test Folder', isShared = false, parentId = null, icon = '📁') {
    // Database createFolder signature: (name, parentId, color, icon, userId, isPublic)
    const result = this.db.createFolder(name, parentId, null, icon, userId, isShared);
    return result.id; // Return just the ID for simpler test assertions
  }

  /**
   * Create a test tag
   */
  createTestTag(name = 'test-tag') {
    // Tags are created via findOrCreateTag statement in database
    // We need to access the database instance directly
    const stmt = this.db.db.prepare('INSERT INTO tags (name) VALUES (?) RETURNING id');
    const result = stmt.get(name);
    return result.id;
  }

  /**
   * Delete a note (soft delete to trash)
   */
  deleteNote(noteId) {
    // Directly execute the delete via SQL to avoid any prepared statement issues
    // Use a fresh prepared statement each time to avoid caching issues
    const sql = `UPDATE notes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${noteId}`;
    this.db.db.exec(sql);
    return true;
  }

  /**
   * Close database connection
   */
  close() {
    // The database connection is managed by the database module
    // We don't need to close it here as it will be closed by the global teardown
  }
}

module.exports = TestDatabaseHelper;
