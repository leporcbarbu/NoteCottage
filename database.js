// Database module for NoteCottage
// Similar to creating a SQLAlchemy setup in Flask

const Database = require('better-sqlite3');
const path = require('path');

// Create/open database file
// Use DATABASE_PATH environment variable if set (for Docker), otherwise use local path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'notecottage.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency and corruption resistance
db.pragma('journal_mode = WAL');

// Set synchronous mode to NORMAL for better performance while maintaining safety
db.pragma('synchronous = NORMAL');

// Initialize database schema
function initializeDatabase() {
    // Create users table for multi-user support
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            is_admin BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Create system settings table
    const createSystemSettingsTable = `
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Create notes table
    const createNotesTable = `
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Create tags table (stores unique tag names)
    const createTagsTable = `
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Create note_tags junction table (many-to-many relationship)
    const createNoteTagsTable = `
        CREATE TABLE IF NOT EXISTS note_tags (
            note_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
    `;

    // Create folders table for hierarchical organization
    const createFoldersTable = `
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER DEFAULT NULL,
            color TEXT DEFAULT NULL,
            icon TEXT DEFAULT NULL,
            position INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
        )
    `;

    // Create full-text search virtual table for searching notes
    const createSearchTable = `
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            title,
            content,
            content='notes',
            content_rowid='id'
        )
    `;

    // Trigger to keep FTS table in sync with notes table
    const createInsertTrigger = `
        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, content)
            VALUES (new.id, new.title, new.content);
        END
    `;

    const createUpdateTrigger = `
        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
            UPDATE notes_fts
            SET title = new.title, content = new.content
            WHERE rowid = new.id;
        END
    `;

    const createDeleteTrigger = `
        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
            DELETE FROM notes_fts WHERE rowid = old.id;
        END
    `;

    // Execute schema creation
    db.exec(createUsersTable);
    db.exec(createSystemSettingsTable);
    db.exec(createNotesTable);
    db.exec(createTagsTable);
    db.exec(createNoteTagsTable);
    db.exec(createFoldersTable);
    db.exec(createSearchTable);
    db.exec(createInsertTrigger);
    db.exec(createUpdateTrigger);
    db.exec(createDeleteTrigger);

    // Initialize default system settings if not exists
    const defaultSettings = [
        { key: 'registration_enabled', value: 'true' },
        { key: 'max_users', value: '5' },
        { key: 'app_name', value: 'NoteCottage' }
    ];

    const insertSetting = db.prepare(`
        INSERT OR IGNORE INTO system_settings (key, value)
        VALUES (?, ?)
    `);

    defaultSettings.forEach(setting => {
        insertSetting.run(setting.key, setting.value);
    });

    // Add folder_id column to notes table if it doesn't exist
    try {
        db.exec('ALTER TABLE notes ADD COLUMN folder_id INTEGER DEFAULT NULL');
        console.log('Added folder_id column to notes table');
    } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    // Create default 'Uncategorized' folder if not exists
    const ensureUncategorizedFolder = db.prepare(`
        INSERT OR IGNORE INTO folders (id, name, parent_id, color, icon, position)
        VALUES (1, 'Uncategorized', NULL, '#95a5a6', '📂', 0)
    `);
    ensureUncategorizedFolder.run();

    // Migrate existing notes without folder_id to Uncategorized
    const migrateNotes = db.prepare(`
        UPDATE notes SET folder_id = 1 WHERE folder_id IS NULL
    `);
    migrateNotes.run();

    // Add position column to notes table if it doesn't exist
    try {
        db.exec('ALTER TABLE notes ADD COLUMN position INTEGER DEFAULT 0');
        console.log('Added position column to notes table');

        // Initialize positions for existing notes (grouped by folder, ordered by updated_at DESC)
        const initializePositions = db.prepare(`
            WITH ranked_notes AS (
                SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY folder_id ORDER BY updated_at DESC) - 1 AS pos
                FROM notes
            )
            UPDATE notes
            SET position = (SELECT pos FROM ranked_notes WHERE ranked_notes.id = notes.id)
        `);
        initializePositions.run();
        console.log('Initialized note positions');
    } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    // Add deleted_at column to notes table for soft delete (recycle bin)
    try {
        db.exec('ALTER TABLE notes ADD COLUMN deleted_at DATETIME DEFAULT NULL');
        console.log('Added deleted_at column to notes table');
    } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    // Add user_id column to notes table for multi-user support
    try {
        db.exec('ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
        console.log('Added user_id column to notes table');
    } catch (error) {
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    // Add user_id column to folders table for multi-user support
    try {
        db.exec('ALTER TABLE folders ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
        console.log('Added user_id column to folders table');
    } catch (error) {
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    // Add is_public column to folders table for privacy control
    try {
        db.exec('ALTER TABLE folders ADD COLUMN is_public BOOLEAN DEFAULT 0');
        console.log('Added is_public column to folders table');
    } catch (error) {
        if (!error.message.includes('duplicate column name')) {
            throw error;
        }
    }

    console.log('Database initialized successfully');
}

// Initialize database BEFORE creating prepared statements
initializeDatabase();

// Health check for database and FTS table
function healthCheck() {
    try {
        // Check if tables exist and are accessible
        const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
        const ftsCount = db.prepare('SELECT COUNT(*) as count FROM notes_fts').get().count;

        if (noteCount !== ftsCount) {
            console.warn(`⚠ Warning: FTS table out of sync (notes: ${noteCount}, fts: ${ftsCount})`);
            console.warn('  Run: node fix-database.js to repair');
            return false;
        }

        // Quick FTS integrity check
        db.prepare("INSERT INTO notes_fts(notes_fts) VALUES('integrity-check')").run();

        console.log(`✓ Database health check passed (${noteCount} notes)`);
        return true;
    } catch (error) {
        console.error('✗ Database health check failed:', error.message);
        console.error('  Run: node fix-database.js to repair');
        return false;
    }
}

// Run health check on startup
healthCheck();

// Prepared statements (similar to parameterized queries in Python)
// These prevent SQL injection and are more efficient

const statements = {
    // Get all notes (excluding deleted)
    getAllNotes: db.prepare(`
        SELECT id, title,
               substr(content, 1, 100) as preview,
               folder_id,
               created_at, updated_at
        FROM notes
        WHERE deleted_at IS NULL
        ORDER BY updated_at DESC
    `),

    // Get a single note by ID (including deleted for restore purposes)
    getNoteById: db.prepare(`
        SELECT id, title, content, folder_id, user_id, created_at, updated_at, deleted_at
        FROM notes
        WHERE id = ?
    `),

    // Insert a new note
    insertNote: db.prepare(`
        INSERT INTO notes (title, content)
        VALUES (?, ?)
    `),

    // Update a note
    updateNote: db.prepare(`
        UPDATE notes
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    // Soft delete a note (move to trash)
    deleteNote: db.prepare(`
        UPDATE notes
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    // Permanently delete a note
    permanentlyDeleteNote: db.prepare(`
        DELETE FROM notes
        WHERE id = ?
    `),

    // Restore a note from trash
    restoreNote: db.prepare(`
        UPDATE notes
        SET deleted_at = NULL
        WHERE id = ?
    `),

    // Get all deleted notes (trash)
    getDeletedNotes: db.prepare(`
        SELECT id, title,
               substr(content, 1, 100) as preview,
               folder_id,
               created_at, updated_at, deleted_at
        FROM notes
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
    `),

    // Empty trash (permanently delete all notes in trash)
    emptyTrash: db.prepare(`
        DELETE FROM notes
        WHERE deleted_at IS NOT NULL
    `),

    // Search notes using full-text search (excluding deleted)
    searchNotes: db.prepare(`
        SELECT notes.id, notes.title,
               substr(notes.content, 1, 100) as preview,
               notes.folder_id,
               notes.created_at, notes.updated_at
        FROM notes_fts
        JOIN notes ON notes.id = notes_fts.rowid
        WHERE notes_fts MATCH ? AND notes.deleted_at IS NULL
        ORDER BY rank
    `),

    // Tag-related statements
    findOrCreateTag: db.prepare(`
        INSERT INTO tags (name) VALUES (?)
        ON CONFLICT(name) DO UPDATE SET name=name
        RETURNING id
    `),

    getTagByName: db.prepare(`
        SELECT id, name FROM tags WHERE name = ?
    `),

    linkNoteToTag: db.prepare(`
        INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)
    `),

    unlinkNoteFromTag: db.prepare(`
        DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?
    `),

    clearNoteTags: db.prepare(`
        DELETE FROM note_tags WHERE note_id = ?
    `),

    getTagsForNote: db.prepare(`
        SELECT tags.id, tags.name
        FROM tags
        JOIN note_tags ON tags.id = note_tags.tag_id
        WHERE note_tags.note_id = ?
        ORDER BY tags.name
    `),

    getAllTags: db.prepare(`
        SELECT tags.id, tags.name, COUNT(note_tags.note_id) as count
        FROM tags
        LEFT JOIN note_tags ON tags.id = note_tags.tag_id
        GROUP BY tags.id, tags.name
        ORDER BY tags.name
    `),

    getNotesByTag: db.prepare(`
        SELECT notes.id, notes.title,
               substr(notes.content, 1, 100) as preview,
               notes.folder_id,
               notes.created_at, notes.updated_at
        FROM notes
        JOIN note_tags ON notes.id = note_tags.note_id
        JOIN tags ON note_tags.tag_id = tags.id
        WHERE tags.name = ? AND notes.deleted_at IS NULL
        ORDER BY notes.updated_at DESC
    `),

    deleteTag: db.prepare(`
        DELETE FROM tags WHERE name = ?
    `),

    // Folder statements (without permission filtering - use getAllFoldersForUser instead)
    getAllFolders: db.prepare(`
        SELECT id, name, parent_id, color, icon, position, user_id, is_public, created_at, updated_at
        FROM folders
        ORDER BY parent_id ASC, position ASC, name ASC
    `),

    // Get folders visible to a specific user (public folders + user's private folders)
    getFoldersForUser: db.prepare(`
        SELECT id, name, parent_id, color, icon, position, user_id, is_public, created_at, updated_at
        FROM folders
        WHERE is_public = 1 OR user_id = ?
        ORDER BY parent_id ASC, position ASC, name ASC
    `),

    getFolderById: db.prepare(`
        SELECT id, name, parent_id, color, icon, position, user_id, is_public, created_at, updated_at
        FROM folders
        WHERE id = ?
    `),

    createFolder: db.prepare(`
        INSERT INTO folders (name, parent_id, color, icon, user_id, is_public, position)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT MAX(position) + 1 FROM folders WHERE parent_id IS ?), 0))
    `),

    updateFolder: db.prepare(`
        UPDATE folders
        SET name = ?, parent_id = ?, color = ?, icon = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    deleteFolder: db.prepare(`
        DELETE FROM folders WHERE id = ?
    `),

    getNotesByFolder: db.prepare(`
        SELECT id, title,
               substr(content, 1, 100) as preview,
               folder_id,
               created_at, updated_at
        FROM notes
        WHERE folder_id = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
    `),

    getNoteCountByFolder: db.prepare(`
        SELECT COUNT(*) as count FROM notes WHERE folder_id = ? AND deleted_at IS NULL
    `),

    moveNoteToFolder: db.prepare(`
        UPDATE notes
        SET folder_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    getFolderAncestors: db.prepare(`
        WITH RECURSIVE ancestors(id, parent_id) AS (
            SELECT id, parent_id FROM folders WHERE id = ?
            UNION ALL
            SELECT f.id, f.parent_id FROM folders f
            JOIN ancestors a ON f.id = a.parent_id
        )
        SELECT id FROM ancestors WHERE id = ?
    `),

    // Reordering statements
    getFoldersByParent: db.prepare(`
        SELECT id, position
        FROM folders
        WHERE parent_id IS ?
        ORDER BY position ASC
    `),

    updateFolderPosition: db.prepare(`
        UPDATE folders
        SET position = ?
        WHERE id = ?
    `),

    reorderFolder: db.prepare(`
        UPDATE folders
        SET position = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    reorderNote: db.prepare(`
        UPDATE notes
        SET folder_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    // User management statements
    createUser: db.prepare(`
        INSERT INTO users (username, email, password_hash, display_name, is_admin)
        VALUES (?, ?, ?, ?, ?)
    `),

    getUserById: db.prepare(`
        SELECT id, username, email, display_name, is_admin, created_at, updated_at
        FROM users
        WHERE id = ?
    `),

    getUserByUsername: db.prepare(`
        SELECT id, username, email, password_hash, display_name, is_admin, created_at, updated_at
        FROM users
        WHERE username = ?
    `),

    getUserByEmail: db.prepare(`
        SELECT id, username, email, password_hash, display_name, is_admin, created_at, updated_at
        FROM users
        WHERE email = ?
    `),

    getAllUsers: db.prepare(`
        SELECT id, username, email, display_name, is_admin, created_at, updated_at
        FROM users
        ORDER BY created_at ASC
    `),

    updateUserProfile: db.prepare(`
        UPDATE users
        SET display_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    updateUserPassword: db.prepare(`
        UPDATE users
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    updateUserAdmin: db.prepare(`
        UPDATE users
        SET is_admin = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),

    deleteUser: db.prepare(`
        DELETE FROM users WHERE id = ?
    `),

    getUserCount: db.prepare(`
        SELECT COUNT(*) as count FROM users
    `),

    getAdminCount: db.prepare(`
        SELECT COUNT(*) as count FROM users WHERE is_admin = 1
    `),

    // System settings statements
    getSetting: db.prepare(`
        SELECT value FROM system_settings WHERE key = ?
    `),

    updateSetting: db.prepare(`
        UPDATE system_settings
        SET value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
    `),

    getAllSettings: db.prepare(`
        SELECT key, value, updated_at FROM system_settings
    `)
};

// Database operations (these are like your Flask route handlers would call)

function getAllNotes() {
    return statements.getAllNotes.all();
}

function getNoteById(id) {
    return statements.getNoteById.get(id);
}

function createNote(title, content, folderId = 1, userId = null) {
    try {
        const insertNoteWithFolder = db.prepare(`
            INSERT INTO notes (title, content, folder_id, user_id)
            VALUES (?, ?, ?, ?)
        `);

        const result = insertNoteWithFolder.run(title, content, folderId, userId);
        const noteId = result.lastInsertRowid;

        // Automatically extract and save tags
        updateNoteTags(noteId, content);

        return {
            id: noteId,
            title,
            content,
            folder_id: folderId,
            user_id: userId
        };
    } catch (error) {
        // Check if this is an FTS corruption error
        if (error.code === 'SQLITE_CORRUPT_VTAB' || error.message.includes('malformed')) {
            console.error('FTS table corruption detected! Run: node fix-database.js');
            throw new Error('Database corruption detected. Please contact administrator.');
        }
        throw error;
    }
}

function canUserAccessNote(noteId, userId) {
    const note = getNoteById(noteId);
    if (!note) return false;

    // Legacy notes (no folder or no user_id) are accessible to all users
    if (!note.folder_id) {
        return true; // Notes without folders are accessible (legacy or uncategorized)
    }

    // Note is accessible if its parent folder is accessible
    return canUserAccessFolder(note.folder_id, userId);
}

function canUserModifyNote(noteId, userId) {
    const note = getNoteById(noteId);
    if (!note) return false;

    // If note has no folder (or folder doesn't exist), check note ownership
    if (!note.folder_id) {
        return note.user_id === userId || note.user_id === null; // Allow if user owns it or it's legacy (no owner)
    }

    const folder = getFolderById(note.folder_id);
    if (!folder) {
        // Folder doesn't exist - allow if user owns the note or it's legacy
        return note.user_id === userId || note.user_id === null;
    }

    // Can modify if: note is in public folder OR user owns the note
    if (folder.is_public === 1) return true;
    return note.user_id === userId || note.user_id === null; // Allow legacy notes (created before multi-user)
}

function updateNote(id, content) {
    try {
        const result = statements.updateNote.run(content, id);

        // Update tags whenever note content changes
        if (result.changes > 0) {
            updateNoteTags(id, content);
        }

        return result.changes > 0;
    } catch (error) {
        // Check if this is an FTS corruption error
        if (error.code === 'SQLITE_CORRUPT_VTAB' || error.message.includes('malformed')) {
            console.error('FTS table corruption detected! Run: node fix-database.js');
            throw new Error('Database corruption detected. Please contact administrator.');
        }
        throw error;
    }
}

function deleteNote(id) {
    const result = statements.deleteNote.run(id);
    return result.changes > 0;
}

function searchNotes(query) {
    // Escape and format query for FTS5
    const ftsQuery = query.split(' ').map(term => `${term}*`).join(' ');
    return statements.searchNotes.all(ftsQuery);
}

// Tag utility functions

// Extract hashtags from text (e.g., "#javascript #nodejs" => ["javascript", "nodejs"])
function extractTagsFromContent(content) {
    // Regex: #[letter][word characters]* - tags must start with a letter
    // This prevents "#1" from being a tag but allows "#nodejs2" or "#javascript"
    const tagRegex = /#([a-zA-Z]\w*)/g;
    const matches = content.matchAll(tagRegex);
    const tags = new Set(); // Use Set to avoid duplicates

    for (const match of matches) {
        tags.add(match[1].toLowerCase()); // Store tags in lowercase
    }

    return Array.from(tags);
}

// Update tags for a note (removes old tags, adds new ones)
function updateNoteTags(noteId, content) {
    const tagNames = extractTagsFromContent(content);

    // Start a transaction for atomicity
    const updateTags = db.transaction(() => {
        // Clear existing tags for this note
        statements.clearNoteTags.run(noteId);

        // Add new tags
        for (const tagName of tagNames) {
            // Find or create tag
            const tag = statements.findOrCreateTag.get(tagName);

            // Link note to tag
            statements.linkNoteToTag.run(noteId, tag.id);
        }
    });

    updateTags();
    return tagNames;
}

// Get all tags for a specific note
function getTagsForNote(noteId) {
    return statements.getTagsForNote.all(noteId);
}

// Get all tags with their usage counts
function getAllTags() {
    return statements.getAllTags.all();
}

// Get notes filtered by tag
function getNotesByTag(tagName) {
    return statements.getNotesByTag.all(tagName.toLowerCase());
}

// Delete a tag
function deleteTag(tagName) {
    return statements.deleteTag.run(tagName.toLowerCase());
}

// Folder operations

function getAllFolders() {
    return statements.getAllFolders.all();
}

function getAllFoldersForUser(userId) {
    if (!userId) {
        // No user logged in - return only public folders
        return statements.getAllFolders.all().filter(f => f.is_public === 1);
    }
    return statements.getFoldersForUser.all(userId);
}

function getFolderById(id) {
    return statements.getFolderById.get(id);
}

function createFolder(name, parentId, color = null, icon = '📁', userId = null, isPublic = false) {
    const result = statements.createFolder.run(
        name,
        parentId || null,
        color,
        icon,
        userId,
        isPublic ? 1 : 0,
        parentId || null  // for COALESCE position calculation
    );

    return {
        id: result.lastInsertRowid,
        name,
        parent_id: parentId,
        color,
        icon,
        user_id: userId,
        is_public: isPublic
    };
}

function updateFolder(id, name, parentId, color, icon, isPublic) {
    const result = statements.updateFolder.run(
        name,
        parentId || null,
        color,
        icon,
        isPublic ? 1 : 0,
        id
    );
    return result.changes > 0;
}

function updateFolderField(folderId, field, value) {
    // Whitelist allowed fields to prevent SQL injection
    const allowedFields = ['name', 'parent_id', 'color', 'icon', 'is_public', 'position'];
    if (!allowedFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }

    const stmt = db.prepare(`
        UPDATE folders
        SET ${field} = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    const result = stmt.run(value, folderId);
    return result.changes > 0;
}

function canUserAccessFolder(folderId, userId) {
    const folder = getFolderById(folderId);
    if (!folder) return false;

    // Public folders are accessible to everyone
    if (folder.is_public === 1) return true;

    // Private folders are only accessible to owner
    return folder.user_id === userId;
}

function canUserModifyFolder(folderId, userId) {
    const folder = getFolderById(folderId);
    if (!folder) return false;

    // Only the owner can modify a folder
    return folder.user_id === userId;
}

function deleteFolder(id) {
    // CASCADE will handle subfolders and notes
    const result = statements.deleteFolder.run(id);
    return result.changes > 0;
}

function getNotesByFolder(folderId) {
    return statements.getNotesByFolder.all(folderId);
}

function getNoteCountByFolder(folderId) {
    const result = statements.getNoteCountByFolder.get(folderId);
    return result.count;
}

function moveNoteToFolder(noteId, folderId) {
    const result = statements.moveNoteToFolder.run(folderId, noteId);
    return result.changes > 0;
}

function isDescendant(potentialDescendantId, ancestorId) {
    const result = statements.getFolderAncestors.get(potentialDescendantId, ancestorId);
    return result !== undefined;
}

// Reorder folder with position recalculation
function reorderFolderFunc(folderId, newPosition, newParentId = null) {
    const transaction = db.transaction(() => {
        // Get current folder state
        const folder = statements.getFolderById.get(folderId);
        if (!folder) {
            throw new Error('Folder not found');
        }

        const oldParentId = folder.parent_id;

        // Validate circular dependency if reparenting
        if (newParentId !== null && newParentId !== oldParentId) {
            if (isDescendant(newParentId, folderId)) {
                throw new Error('Cannot move folder into its descendant');
            }
        }

        // If moving to a different parent, recalculate positions in old parent
        if (newParentId !== oldParentId && oldParentId !== null) {
            const oldSiblings = statements.getFoldersByParent
                .all(oldParentId)
                .filter(f => f.id !== folderId);

            // Reassign sequential positions
            oldSiblings.forEach((sibling, index) => {
                statements.updateFolderPosition.run(index, sibling.id);
            });
        }

        // Get siblings in new parent
        const newSiblings = statements.getFoldersByParent
            .all(newParentId)
            .filter(f => f.id !== folderId);

        // Insert target folder at new position
        newSiblings.splice(newPosition, 0, { id: folderId, position: newPosition });

        // Reassign sequential positions for all siblings including target
        newSiblings.forEach((sibling, index) => {
            if (sibling.id === folderId) {
                statements.reorderFolder.run(index, newParentId, folderId);
            } else {
                statements.updateFolderPosition.run(index, sibling.id);
            }
        });
    });

    transaction();
    return true;
}

// Reorder note (move to folder and set position)
function reorderNote(noteId, folderId, position) {
    const result = statements.reorderNote.run(folderId, position, noteId);
    return result.changes > 0;
}

// Get all note titles with their IDs for wiki-link resolution (excluding deleted)
// Returns Map with lowercase title as key
function getNotesTitleMap() {
    const stmt = db.prepare(`
        SELECT id, title, updated_at
        FROM notes
        WHERE deleted_at IS NULL
        ORDER BY updated_at DESC
    `);

    const notes = stmt.all();
    const titleMap = new Map();

    // Build map with case-insensitive keys
    // First occurrence wins (most recently updated due to ORDER BY)
    notes.forEach(note => {
        const key = note.title.toLowerCase();
        if (!titleMap.has(key)) {
            titleMap.set(key, {
                id: note.id,
                title: note.title,  // Original case for display
                updated_at: note.updated_at
            });
        }
    });

    return titleMap;
}

// Build hierarchical tree structure from flat folder list
function buildFolderTree(folders) {
    const folderMap = new Map();

    // Create virtual root folders for Private and Shared
    const privateRoot = {
        id: 'private',
        name: 'Private',
        parent_id: null,
        color: null,
        icon: '🔒',
        position: 0,
        user_id: null,
        is_public: 0,
        noteCount: 0,
        children: [],
        isVirtual: true
    };

    const sharedRoot = {
        id: 'shared',
        name: 'Shared',
        parent_id: null,
        color: null,
        icon: '👥',
        position: 1,
        user_id: null,
        is_public: 1,
        noteCount: 0,
        children: [],
        isVirtual: true
    };

    // Create map of all folders with note counts
    folders.forEach(folder => {
        const noteCount = getNoteCountByFolder(folder.id);
        folderMap.set(folder.id, {
            ...folder,
            id: folder.id.toString(),
            parent_id: folder.parent_id ? folder.parent_id.toString() : null,
            noteCount: noteCount,
            children: []
        });
    });

    // Build tree structure
    folderMap.forEach(folder => {
        if (folder.parent_id === null) {
            // Top-level folders go under Private or Shared based on is_public flag
            if (folder.is_public === 1) {
                sharedRoot.children.push(folder);
                sharedRoot.noteCount += folder.noteCount;
            } else {
                privateRoot.children.push(folder);
                privateRoot.noteCount += folder.noteCount;
            }
        } else {
            // Child folders go under their parent as before
            const parent = folderMap.get(parseInt(folder.parent_id));
            if (parent) {
                parent.children.push(folder);
            }
        }
    });

    // Return Private and Shared as the only root folders
    return [privateRoot, sharedRoot];
}

// Trash/Recycle Bin operations

function getDeletedNotes() {
    return statements.getDeletedNotes.all();
}

function restoreNote(id) {
    const result = statements.restoreNote.run(id);
    return result.changes > 0;
}

function permanentlyDeleteNote(id) {
    const result = statements.permanentlyDeleteNote.run(id);
    return result.changes > 0;
}

function emptyTrash() {
    const result = statements.emptyTrash.run();
    return result.changes;
}

// User management operations

function createUser(username, email, passwordHash, displayName = null, isAdmin = false) {
    const result = statements.createUser.run(username, email, passwordHash, displayName, isAdmin ? 1 : 0);
    return result.lastInsertRowid;
}

function getUserById(id) {
    return statements.getUserById.get(id);
}

function getUserByUsername(username) {
    return statements.getUserByUsername.get(username);
}

function getUserByEmail(email) {
    return statements.getUserByEmail.get(email);
}

function getAllUsers() {
    return statements.getAllUsers.all();
}

function updateUserProfile(id, displayName) {
    const result = statements.updateUserProfile.run(displayName, id);
    return result.changes > 0;
}

function updateUserPassword(id, passwordHash) {
    const result = statements.updateUserPassword.run(passwordHash, id);
    return result.changes > 0;
}

function updateUserAdmin(id, isAdmin) {
    const result = statements.updateUserAdmin.run(isAdmin ? 1 : 0, id);
    return result.changes > 0;
}

function updateUserField(id, field, value) {
    // Whitelist of allowed fields to prevent SQL injection
    const allowedFields = ['username', 'email', 'display_name', 'password_hash', 'is_admin'];
    if (!allowedFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
    }

    const stmt = db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`);
    const result = stmt.run(value, id);
    return result.changes > 0;
}

function deleteUserFunc(id) {
    const result = statements.deleteUser.run(id);
    return result.changes > 0;
}

function getUserCount() {
    return statements.getUserCount.get().count;
}

function getAdminCount() {
    return statements.getAdminCount.get().count;
}

// System settings operations

function getSetting(key) {
    const result = statements.getSetting.get(key);
    return result ? result.value : null;
}

function updateSetting(key, value) {
    const result = statements.updateSetting.run(value, key);
    return result.changes > 0;
}

function getAllSettings() {
    const settings = statements.getAllSettings.all();
    // Convert array to object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
    });
    return settingsObj;
}

// Export database operations
module.exports = {
    db,
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    // Tag operations
    extractTagsFromContent,
    updateNoteTags,
    getTagsForNote,
    getAllTags,
    getNotesByTag,
    deleteTag,
    // Folder operations
    getAllFolders,
    getAllFoldersForUser,
    getFolderById,
    createFolder,
    updateFolder,
    updateFolderField,
    deleteFolder,
    getNotesByFolder,
    getNoteCountByFolder,
    moveNoteToFolder,
    isDescendant,
    buildFolderTree,
    canUserAccessFolder,
    canUserModifyFolder,
    // Note permission checks
    canUserAccessNote,
    canUserModifyNote,
    // Reordering operations
    reorderFolderFunc,
    reorderNote,
    // Wiki-link operations
    getNotesTitleMap,
    // Trash/Recycle Bin operations
    getDeletedNotes,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    // User management operations
    createUser,
    getUserById,
    getUserByUsername,
    getUserByEmail,
    getAllUsers,
    updateUserProfile,
    updateUserPassword,
    updateUserAdmin,
    updateUserField,
    deleteUser: deleteUserFunc,
    getUserCount,
    getAdminCount,
    // System settings operations
    getSetting,
    updateSetting,
    getAllSettings
};

// Graceful shutdown handlers to prevent FTS corruption
function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Closing database connection...`);
    try {
        db.close();
        console.log('Database closed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database:', error.message);
        process.exit(1);
    }
}

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kill command
process.on('exit', () => {
    // Ensure database is closed on any exit
    if (db.open) {
        console.log('Closing database on exit...');
        db.close();
    }
});
