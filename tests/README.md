# NoteCottage Testing Guide

This directory contains the automated test suite for NoteCottage. Tests are written using Jest and Supertest for comprehensive backend API testing.

## Quick Start

Run all tests:
```bash
npm test
```

Run tests with coverage report:
```bash
npm run test:coverage
```

Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

Run tests with verbose output:
```bash
npm run test:verbose
```

## Test Structure

```
tests/
├── README.md                 # This file
├── setup.js                  # Global test setup
├── teardown.js               # Global test cleanup
├── helpers/
│   ├── db-helper.js          # Database utilities for tests
│   └── auth-helper.js        # Authentication utilities
├── auth.test.js              # Authentication & authorization tests
├── notes.test.js             # Note CRUD operations tests
├── folders.test.js           # Folder operations tests
└── features.test.js          # Wiki-links, search, tags tests
```

## Test Coverage

The test suite covers:

### Authentication (`auth.test.js`)
- User registration (first user as admin, duplicate username handling)
- Login/logout
- Session management
- Permission checks

### Notes (`notes.test.js`)
- Create notes (markdown and text types)
- Read notes (single and list)
- Update note content
- Delete notes (soft delete to trash)
- Restore from trash
- Permission checks (private vs shared folders)

### Folders (`folders.test.js`)
- Create folders (private and shared)
- Nested folder structures
- Update folder properties
- Delete folders (with cascade handling)
- Move notes between folders

### Features (`features.test.js`)
- Wiki-link backlinks (with aliases, case-insensitive)
- Tag creation and management
- Add/remove tags to notes
- Full-text search (FTS5)
- Filter notes by tag

## Writing Tests

### Basic Test Structure

```javascript
const request = require('supertest');
const TestDatabaseHelper = require('./helpers/db-helper');
const { createUserAndLogin } = require('./helpers/auth-helper');

describe('Feature Name', () => {
  let app;
  let dbHelper;
  let userCookie;
  let userId;

  beforeAll(async () => {
    // Initialize test database
    dbHelper = new TestDatabaseHelper();
    await dbHelper.initialize();

    // Import app after database is initialized
    app = require('../server');
  });

  beforeEach(async () => {
    // Clear database before each test
    dbHelper.clearAllData();

    // Create test user and login
    const user = await createUserAndLogin(
      dbHelper.db,
      request(app),
      'testuser',
      'password123'
    );
    userId = user.userId;
    userCookie = user.cookie;
  });

  afterAll(() => {
    // Close database connection
    dbHelper.close();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Cookie', userCookie)
      .expect(200);

    expect(response.body).toHaveProperty('someKey');
  });
});
```

### Helper Functions

**Database Helper:**
```javascript
// Create test user
const userId = dbHelper.createTestUser('username', 'password', 'role');

// Create test note
const noteId = dbHelper.createTestNote(userId, 'Title', 'Content', folderId);

// Create test folder
const folderId = dbHelper.createTestFolder(userId, 'Folder Name', isShared);

// Create test tag
const tagId = dbHelper.createTestTag('tag-name');

// Clear all data
dbHelper.clearAllData();
```

**Authentication Helper:**
```javascript
// Create user and login (returns userId and cookie)
const { userId, cookie } = await createUserAndLogin(
  dbHelper.db,
  request(app),
  'username',
  'password',
  'role'
);

// Just login (user must exist)
const cookie = await loginUser(request(app), 'username', 'password');
```

## Test Database

Tests use a separate SQLite database (`tests/test.db`) that is:
- Created fresh for each test run
- Automatically cleaned up after tests complete
- Isolated from production data

The database is automatically initialized with the same schema as production.

## Best Practices

1. **Isolation:** Each test should be independent and not rely on other tests
2. **Cleanup:** Use `beforeEach` to clear data between tests
3. **Descriptive:** Use clear test names that describe what they test
4. **Coverage:** Test both success and failure cases
5. **Permissions:** Test authorization for multi-user scenarios

## Continuous Integration

To add GitHub Actions CI, create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Troubleshooting

**Tests fail to start:**
- Ensure `NODE_ENV=test` is set (done automatically by setup.js)
- Check that test database path is writable

**Database locked errors:**
- Make sure to call `dbHelper.close()` in `afterAll`
- Ensure no other process is using the test database

**Session issues:**
- Verify cookie is being set in login response
- Check that cookie is passed with `.set('Cookie', cookie)`

## Next Steps

Consider adding:
- Frontend/E2E tests with Playwright or Cypress
- Performance tests for large datasets
- API load testing
- Snapshot testing for HTML rendering
