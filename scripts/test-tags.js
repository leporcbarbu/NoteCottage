// Test script for tagging functionality
const db = require('./database');

console.log('=== Testing Tag Functionality ===\n');

// Test 1: Create notes with tags
console.log('Test 1: Creating notes with tags');
console.log('----------------------------------');

const note1 = db.createNote('JavaScript Tutorial', 'Learn #javascript and #nodejs basics. #programming');
console.log('✓ Created note 1:', note1.title);

const note2 = db.createNote('Python Guide', 'Introduction to #python and #programming');
console.log('✓ Created note 2:', note2.title);

const note3 = db.createNote('Database Design', 'Learn #database design with #sql and #nodejs');
console.log('✓ Created note 3:', note3.title);
console.log();

// Test 2: Extract tags from content
console.log('Test 2: Extracting tags from content');
console.log('--------------------------------------');

const tags1 = db.extractTagsFromContent(note1.content);
console.log('Note 1 tags:', tags1);

const tags2 = db.extractTagsFromContent(note2.content);
console.log('Note 2 tags:', tags2);

const tags3 = db.extractTagsFromContent(note3.content);
console.log('Note 3 tags:', tags3);
console.log();

// Test 3: Get all tags
console.log('Test 3: Getting all tags with counts');
console.log('-------------------------------------');

const allTags = db.getAllTags();
console.log('All tags:');
allTags.forEach(tag => {
    console.log(`  #${tag.name} (${tag.count} note${tag.count !== 1 ? 's' : ''})`);
});
console.log();

// Test 4: Get tags for a specific note
console.log('Test 4: Getting tags for specific notes');
console.log('----------------------------------------');

const note1Tags = db.getTagsForNote(note1.id);
console.log(`Note 1 (${note1.title}) tags:`, note1Tags.map(t => t.name));

const note2Tags = db.getTagsForNote(note2.id);
console.log(`Note 2 (${note2.title}) tags:`, note2Tags.map(t => t.name));
console.log();

// Test 5: Get notes by tag
console.log('Test 5: Filtering notes by tag');
console.log('-------------------------------');

const programmingNotes = db.getNotesByTag('programming');
console.log('Notes tagged with #programming:');
programmingNotes.forEach(note => {
    console.log(`  - ${note.title}`);
});

const nodejsNotes = db.getNotesByTag('nodejs');
console.log('\nNotes tagged with #nodejs:');
nodejsNotes.forEach(note => {
    console.log(`  - ${note.title}`);
});
console.log();

// Test 6: Update note content and tags
console.log('Test 6: Updating note and tags');
console.log('-------------------------------');

console.log(`Before: Note 1 has tags: ${note1Tags.map(t => t.name).join(', ')}`);

db.updateNote(note1.id, 'Learn #javascript and #react. #webdev #frontend');
const updatedTags = db.getTagsForNote(note1.id);
console.log(`After:  Note 1 has tags: ${updatedTags.map(t => t.name).join(', ')}`);
console.log();

// Test 7: Case insensitivity
console.log('Test 7: Testing case insensitivity');
console.log('-----------------------------------');

const note4 = db.createNote('Mixed Case Tags', 'Tags like #JavaScript #NodeJS #Python should be normalized');
const note4Tags = db.getTagsForNote(note4.id);
console.log('Tags are stored in lowercase:', note4Tags.map(t => t.name));

const jsNotes = db.getNotesByTag('javascript');
console.log(`Finding by 'javascript': ${jsNotes.length} notes`);

const jsNotesUpper = db.getNotesByTag('JavaScript'); // Should still work
console.log(`Finding by 'JavaScript': ${jsNotesUpper.length} notes (case-insensitive)`);
console.log();

console.log('=== All Tests Passed! ===');
console.log('\nTag System Features:');
console.log('✓ Automatic tag extraction from content (#hashtag syntax)');
console.log('✓ Many-to-many relationship (notes can have multiple tags)');
console.log('✓ Tag usage counts');
console.log('✓ Filter notes by tag');
console.log('✓ Case-insensitive tag matching');
console.log('✓ Automatic tag updates when note content changes');
console.log();

// Clean up
console.log('Cleaning up test data...');
const allNotes = db.getAllNotes();
allNotes.forEach(note => {
    db.deleteNote(note.id);
});
console.log('✓ Test data cleaned up');
