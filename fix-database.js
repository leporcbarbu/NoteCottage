// Fix database corruption by rebuilding FTS5 table
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('=== Database Repair Script ===\n');

// Paths
const dbPath = path.join(__dirname, 'nodenotes.db');
const backupPath = path.join(__dirname, 'nodenotes.db.backup');
const badDbPath = path.join(__dirname, 'scriptsNodeTestnodenotes.db');

// 1. Delete the corrupted zero-byte file if it exists
if (fs.existsSync(badDbPath)) {
    console.log('Removing corrupted zero-byte database file...');
    fs.unlinkSync(badDbPath);
    console.log('✓ Removed scriptsNodeTestnodenotes.db\n');
}

// 2. Create backup of current database
console.log('Creating backup of current database...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✓ Backup created: ${backupPath}\n`);

// 3. Open database
const db = new Database(dbPath);

// 4. Check current state
console.log('Checking database state...');
const noteCount = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
const ftsCount = db.prepare('SELECT COUNT(*) as count FROM notes_fts').get().count;
console.log(`Notes table: ${noteCount} rows`);
console.log(`FTS table: ${ftsCount} rows\n`);

if (noteCount !== ftsCount) {
    console.log('⚠ FTS table is out of sync with notes table!\n');
}

// 5. Rebuild FTS5 table
console.log('Rebuilding FTS5 table...');

try {
    // Drop existing FTS table and triggers
    console.log('  Dropping triggers...');
    db.exec('DROP TRIGGER IF EXISTS notes_ai');
    db.exec('DROP TRIGGER IF EXISTS notes_au');
    db.exec('DROP TRIGGER IF EXISTS notes_ad');

    console.log('  Dropping FTS table...');
    db.exec('DROP TABLE IF EXISTS notes_fts');

    // Recreate FTS table
    console.log('  Creating new FTS table...');
    db.exec(`
        CREATE VIRTUAL TABLE notes_fts USING fts5(
            title,
            content,
            content='notes',
            content_rowid='id'
        )
    `);

    // Populate FTS table from notes
    console.log('  Populating FTS table...');
    db.exec(`
        INSERT INTO notes_fts(rowid, title, content)
        SELECT id, title, content FROM notes
    `);

    // Recreate triggers
    console.log('  Creating triggers...');
    db.exec(`
        CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, content)
            VALUES (new.id, new.title, new.content);
        END
    `);

    db.exec(`
        CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
            UPDATE notes_fts
            SET title = new.title, content = new.content
            WHERE rowid = new.id;
        END
    `);

    db.exec(`
        CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
            DELETE FROM notes_fts WHERE rowid = old.id;
        END
    `);

    console.log('✓ FTS table rebuilt successfully\n');

    // 6. Verify rebuild
    console.log('Verifying rebuild...');
    const newFtsCount = db.prepare('SELECT COUNT(*) as count FROM notes_fts').get().count;
    console.log(`FTS table now has: ${newFtsCount} rows`);

    if (newFtsCount === noteCount) {
        console.log('✓ FTS table is now in sync!\n');
    } else {
        console.log('⚠ Warning: FTS table count still doesn\'t match\n');
    }

    // 7. Run integrity check on FTS
    console.log('Running FTS integrity check...');
    db.exec("INSERT INTO notes_fts(notes_fts) VALUES('integrity-check')");
    console.log('✓ FTS integrity check passed\n');

    console.log('=== Repair Complete ===');
    console.log('Your database has been repaired!');
    console.log(`Backup saved at: ${backupPath}`);
    console.log('\nYou can now restart your server and try saving notes again.');

} catch (error) {
    console.error('Error during repair:', error);
    console.log('\nRestoring from backup...');
    fs.copyFileSync(backupPath, dbPath);
    console.log('Database restored from backup.');
    process.exit(1);
} finally {
    db.close();
}
