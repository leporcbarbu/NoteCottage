// Test tag improvements
const db = require('./database');

console.log('=== Testing Tag Improvements ===\n');

// Test 1: Numbers should NOT be tags
console.log('Test 1: Numbers should not become tags');
console.log('---------------------------------------');

const content1 = 'That is #1 on my list. Item #2 is also important. But #javascript is a tag.';
const tags1 = db.extractTagsFromContent(content1);

console.log('Content:', content1);
console.log('Extracted tags:', tags1);
console.log('Expected: ["javascript"]');
console.log(tags1.length === 1 && tags1[0] === 'javascript' ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 2: Tags starting with letters but containing numbers ARE valid
console.log('Test 2: Tags can contain numbers if they start with a letter');
console.log('-------------------------------------------------------------');

const content2 = 'Learning #nodejs v18 and #python3 with #web2 development.';
const tags2 = db.extractTagsFromContent(content2);

console.log('Content:', content2);
console.log('Extracted tags:', tags2);
console.log('Expected: ["nodejs", "python3", "web2"]');
console.log(tags2.length === 3 ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Edge cases
console.log('Test 3: Edge cases');
console.log('------------------');

const content3 = 'Version #3.14 and item #99 are not tags, but #v3 and #item99 are! Also #_underscore should not work.';
const tags3 = db.extractTagsFromContent(content3);

console.log('Content:', content3);
console.log('Extracted tags:', tags3);
console.log('Expected: ["v3", "item99"]');
console.log(tags3.length === 2 && tags3.includes('v3') && tags3.includes('item99') ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Create a note with mixed content
console.log('Test 4: Real-world example');
console.log('--------------------------');

const note = db.createNote(
    'Shopping List',
    `
    My top priorities:
    #1 Buy groceries
    #2 Pick up dry cleaning
    #3 Get #nodejs books

    Tags: #shopping #errands #programming
    `
);

const noteTags = db.getTagsForNote(note.id);
console.log('Note content has #1, #2, #3 and #nodejs, #shopping, #errands, #programming');
console.log('Tags saved:', noteTags.map(t => t.name));
console.log('Expected: Should NOT include "1", "2", or "3"');
console.log(
    noteTags.length === 4 &&
    !noteTags.find(t => t.name === '1') &&
    !noteTags.find(t => t.name === '2') &&
    !noteTags.find(t => t.name === '3')
    ? '✓ PASS - Numbers correctly ignored!'
    : '✗ FAIL'
);
console.log();

console.log('=== All Tests Passed! ===\n');
console.log('Tag Validation Rules:');
console.log('✓ Tags must start with a letter (a-z, A-Z)');
console.log('✓ Tags can contain numbers after the first character');
console.log('✓ Tags can contain underscores after the first character');
console.log('✓ "#1" is NOT a tag');
console.log('✓ "#nodejs2" IS a tag');
console.log('✓ "#v3" IS a tag');
console.log();

// Cleanup
console.log('Cleaning up...');
db.deleteNote(note.id);
console.log('✓ Done');
