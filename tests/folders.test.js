const request = require('supertest');
const TestDatabaseHelper = require('./helpers/db-helper');
const { createUserAndLogin } = require('./helpers/auth-helper');

describe('Folders API', () => {
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

    // Create test user and get session cookie
    const user = await createUserAndLogin(dbHelper, request(app), 'testuser', 'password123');
    userId = user.userId;
    userCookie = user.cookie;
  });

  afterAll(() => {
    // Close database connection
    dbHelper.close();
  });

  describe('POST /api/folders', () => {
    it('should create a new private folder', async () => {
      const response = await request(app)
        .post('/api/folders')
        .set('Cookie', userCookie)
        .send({
          name: 'My Folder',
          is_public: false,
          icon: '📁'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Folder created successfully');

      // Verify in database
      const folder = dbHelper.db.getFolderById(parseInt(response.body.id));
      expect(folder.name).toBe('My Folder');
      expect(folder.is_public).toBe(0); // SQLite stores boolean as 0/1
      expect(folder.icon).toBe('📁');
    });

    it('should create a shared folder', async () => {
      const response = await request(app)
        .post('/api/folders')
        .set('Cookie', userCookie)
        .send({
          name: 'Shared Folder',
          is_public: true,
          icon: '🌍'
        })
        .expect(201);

      const folder = dbHelper.db.getFolderById(parseInt(response.body.id));
      expect(folder.is_public).toBe(1);
    });

    it('should create a nested folder', async () => {
      // Create parent folder
      const parentId = dbHelper.createTestFolder(userId, 'Parent');

      // Create child folder
      const response = await request(app)
        .post('/api/folders')
        .set('Cookie', userCookie)
        .send({
          name: 'Child',
          parent_id: parentId,
          is_public: false
        })
        .expect(201);

      const folder = dbHelper.db.getFolderById(parseInt(response.body.id));
      expect(folder.parent_id).toBe(parentId);
    });

    it('should reject folder creation without name', async () => {
      await request(app)
        .post('/api/folders')
        .set('Cookie', userCookie)
        .send({
          is_public: false
        })
        .expect(400);
    });

    it('should reject folder creation when not authenticated', async () => {
      await request(app)
        .post('/api/folders')
        .send({
          name: 'Unauthorized Folder',
          is_public: false
        })
        .expect(401);
    });
  });

  describe('GET /api/folders', () => {
    it('should return all folders for user', async () => {
      // Create folders
      dbHelper.createTestFolder(userId, 'Folder 1');
      dbHelper.createTestFolder(userId, 'Folder 2');

      const response = await request(app)
        .get('/api/folders')
        .set('Cookie', userCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should include shared folders from other users', async () => {
      // Create another user
      const user2 = await createUserAndLogin(dbHelper, request(app), 'user2', 'password123');

      // User2 creates a shared folder
      const sharedFolderId = dbHelper.createTestFolder(user2.userId, 'Shared Folder', true);

      // User1 should see it
      const response = await request(app)
        .get('/api/folders')
        .set('Cookie', userCookie)
        .expect(200);

      // The folder should be in the "Shared" virtual folder's children
      const sharedRoot = response.body.find(f => f.id === 'shared');
      expect(sharedRoot).toBeDefined();

      const sharedFolder = sharedRoot.children.find(f => f.id === sharedFolderId.toString());
      expect(sharedFolder).toBeDefined();
      expect(sharedFolder.is_public).toBe(1);
    });

    it('should not include private folders from other users', async () => {
      // Create another user
      const user2 = await createUserAndLogin(dbHelper, request(app), 'user2', 'password123');

      // User2 creates a private folder
      dbHelper.createTestFolder(user2.userId, 'Private Folder', false);

      // User1 should not see it
      const response = await request(app)
        .get('/api/folders')
        .set('Cookie', userCookie)
        .expect(200);

      const privateFolder = response.body.find(f => f.name === 'Private Folder');
      expect(privateFolder).toBeUndefined();
    });
  });

  describe('PUT /api/folders/:id', () => {
    it('should update folder name and icon', async () => {
      const folderId = dbHelper.createTestFolder(userId, 'Old Name', false, null, '📁');

      const response = await request(app)
        .put(`/api/folders/${folderId}`)
        .set('Cookie', userCookie)
        .send({
          name: 'New Name',
          icon: '🎯'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Folder updated successfully');

      // Verify in database
      const folder = dbHelper.db.getFolderById(folderId);
      expect(folder.name).toBe('New Name');
      expect(folder.icon).toBe('🎯');
    });

    it('should reject update without permission', async () => {
      // Create another user
      const user2 = await createUserAndLogin(dbHelper, request(app), 'user2', 'password123');

      // User1 creates private folder
      const folderId = dbHelper.createTestFolder(userId, 'My Folder', false);

      // User2 tries to update it
      await request(app)
        .put(`/api/folders/${folderId}`)
        .set('Cookie', user2.cookie)
        .send({
          name: 'Hacked Name'
        })
        .expect(403);
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should delete an empty folder', async () => {
      const folderId = dbHelper.createTestFolder(userId, 'Empty Folder');

      const response = await request(app)
        .delete(`/api/folders/${folderId}`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Folder deleted successfully');

      // Verify deletion
      const folder = dbHelper.db.getFolderById(folderId);
      expect(folder).toBeUndefined();
    });

    it('should delete folder with notes', async () => {
      const folderId = dbHelper.createTestFolder(userId, 'Folder with Notes');
      dbHelper.createTestNote(userId, 'Note 1', 'Content', folderId);
      dbHelper.createTestNote(userId, 'Note 2', 'Content', folderId);

      await request(app)
        .delete(`/api/folders/${folderId}`)
        .set('Cookie', userCookie)
        .expect(200);

      // Verify notes were moved to root (folder_id = null)
      const notes = dbHelper.db.getAllNotes().filter(n => n.title.startsWith('Note'));
      notes.forEach(note => {
        expect(note.folder_id).toBeNull();
      });
    });

    it('should delete folder with subfolders', async () => {
      const parentId = dbHelper.createTestFolder(userId, 'Parent');
      const childId = dbHelper.createTestFolder(userId, 'Child', false, parentId);

      await request(app)
        .delete(`/api/folders/${parentId}`)
        .set('Cookie', userCookie)
        .expect(200);

      // Verify child folder was also moved to root
      const childFolder = dbHelper.db.getFolderById(childId);
      expect(childFolder.parent_id).toBeNull();
    });

    it('should reject delete without permission', async () => {
      const user2 = await createUserAndLogin(dbHelper, request(app), 'user2', 'password123');
      const folderId = dbHelper.createTestFolder(userId, 'My Folder');

      await request(app)
        .delete(`/api/folders/${folderId}`)
        .set('Cookie', user2.cookie)
        .expect(403);
    });
  });

  describe('PUT /api/notes/:id/move', () => {
    it('should move note to different folder', async () => {
      const folder1 = dbHelper.createTestFolder(userId, 'Folder 1');
      const folder2 = dbHelper.createTestFolder(userId, 'Folder 2');
      const noteId = dbHelper.createTestNote(userId, 'Note', 'Content', folder1);

      const response = await request(app)
        .put(`/api/notes/${noteId}/move`)
        .set('Cookie', userCookie)
        .send({
          folder_id: folder2
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Note moved successfully');

      // Verify move
      const note = dbHelper.db.getNoteById(noteId);
      expect(note.folder_id).toBe(folder2);
    });

    it('should move note to root (null folder)', async () => {
      const folderId = dbHelper.createTestFolder(userId, 'Folder');
      const noteId = dbHelper.createTestNote(userId, 'Note', 'Content', folderId);

      await request(app)
        .put(`/api/notes/${noteId}/move`)
        .set('Cookie', userCookie)
        .send({
          folder_id: null
        })
        .expect(200);

      const note = dbHelper.db.getNoteById(noteId);
      expect(note.folder_id).toBeNull();
    });
  });
});
