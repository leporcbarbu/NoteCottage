const request = require('supertest');
const TestDatabaseHelper = require('./helpers/db-helper');
const { createUserAndLogin } = require('./helpers/auth-helper');

describe('Notes API', () => {
  let app;
  let dbHelper;
  let user1Cookie;
  let user1Id;
  let user2Cookie;
  let user2Id;

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

    // Create two test users and get their session cookies
    const user1 = await createUserAndLogin(dbHelper, request(app), 'user1', 'password123');
    user1Id = user1.userId;
    user1Cookie = user1.cookie;

    const user2 = await createUserAndLogin(dbHelper, request(app), 'user2', 'password123');
    user2Id = user2.userId;
    user2Cookie = user2.cookie;
  });

  afterAll(() => {
    // Close database connection
    dbHelper.close();
  });

  describe('POST /api/notes', () => {
    it('should create a new markdown note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Cookie', user1Cookie)
        .send({
          title: 'My First Note',
          content: '# Hello World\n\nThis is my first note!',
          type: 'markdown'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Note created successfully');

      // Verify note was created in database
      const note = dbHelper.db.getNoteById(parseInt(response.body.id));
      expect(note.title).toBe('My First Note');
      expect(note.content).toContain('Hello World');
      expect(note.type).toBe('markdown');
    });

    it('should create a new text note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Plain Text Note',
          content: 'This is plain text content',
          type: 'text'
        })
        .expect(201);

      const note = dbHelper.db.getNoteById(parseInt(response.body.id));
      expect(note.type).toBe('text');
    });

    it('should create note in folder when folder_id provided', async () => {
      // Create a folder first
      const folderId = dbHelper.createTestFolder(user1Id, 'Test Folder');

      const response = await request(app)
        .post('/api/notes')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Note in Folder',
          content: 'Content',
          type: 'markdown',
          folder_id: folderId
        })
        .expect(201);

      const note = dbHelper.db.getNoteById(parseInt(response.body.id));
      expect(note.folder_id).toBe(folderId);
    });

    it('should reject note creation without title', async () => {
      await request(app)
        .post('/api/notes')
        .set('Cookie', user1Cookie)
        .send({
          content: 'Content without title',
          type: 'markdown'
        })
        .expect(400);
    });

    it('should reject note creation without content', async () => {
      await request(app)
        .post('/api/notes')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Title without content',
          type: 'markdown'
        })
        .expect(400);
    });

    it('should reject note creation when not authenticated', async () => {
      await request(app)
        .post('/api/notes')
        .send({
          title: 'Unauthorized Note',
          content: 'Should fail',
          type: 'markdown'
        })
        .expect(401);
    });
  });

  describe('GET /api/notes', () => {
    it('should return all notes for authenticated user', async () => {
      // Create notes for user1
      dbHelper.createTestNote(user1Id, 'Note 1', 'Content 1');
      dbHelper.createTestNote(user1Id, 'Note 2', 'Content 2');

      const response = await request(app)
        .get('/api/notes')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('type');
    });

    it('should not return notes from other users', async () => {
      // Create notes for both users
      dbHelper.createTestNote(user1Id, 'User 1 Note', 'Content');
      dbHelper.createTestNote(user2Id, 'User 2 Note', 'Content');

      const response = await request(app)
        .get('/api/notes')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('User 1 Note');
    });

    it('should return notes from shared folders', async () => {
      // Create a shared folder and note
      const sharedFolderId = dbHelper.createTestFolder(user1Id, 'Shared Folder', true);
      dbHelper.createTestNote(user1Id, 'Shared Note', 'Content', sharedFolderId);

      // User2 should see the shared note
      const response = await request(app)
        .get('/api/notes')
        .set('Cookie', user2Cookie)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const sharedNote = response.body.find(n => n.title === 'Shared Note');
      expect(sharedNote).toBeDefined();
    });

    it('should exclude deleted notes', async () => {
      // Create and delete a note
      const noteId = dbHelper.createTestNote(user1Id, 'Deleted Note', 'Content');
      dbHelper.deleteNote(noteId);

      const response = await request(app)
        .get('/api/notes')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a specific note', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'My Note', 'My Content');

      const response = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveProperty('id', noteId.toString());
      expect(response.body).toHaveProperty('title', 'My Note');
      expect(response.body).toHaveProperty('content', 'My Content');
      expect(response.body).toHaveProperty('html'); // Rendered markdown
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should return 404 for non-existent note', async () => {
      await request(app)
        .get('/api/notes/99999')
        .set('Cookie', user1Cookie)
        .expect(404);
    });

    it('should return 400 for invalid note ID', async () => {
      await request(app)
        .get('/api/notes/invalid')
        .set('Cookie', user1Cookie)
        .expect(400);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note content', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'Original Title', 'Original Content');

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Cookie', user1Cookie)
        .send({
          content: 'Updated Content'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Note updated successfully');

      // Verify update in database
      const note = dbHelper.db.getNoteById(noteId);
      expect(note.content).toBe('Updated Content');
      expect(note.title).toBe('Original Title'); // Title should not change
    });

    it('should reject update without content', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'Title', 'Content');

      await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Cookie', user1Cookie)
        .send({})
        .expect(400);
    });

    it('should reject update to note user does not have permission for', async () => {
      // User1 creates note
      const noteId = dbHelper.createTestNote(user1Id, 'User1 Note', 'Content');

      // User2 tries to update it
      await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Cookie', user2Cookie)
        .send({
          content: 'Hacked content'
        })
        .expect(403);
    });

    it('should allow update to note in shared folder', async () => {
      // Create shared folder and note
      const sharedFolderId = dbHelper.createTestFolder(user1Id, 'Shared', true);
      const noteId = dbHelper.createTestNote(user1Id, 'Shared Note', 'Original', sharedFolderId);

      // User2 should be able to update
      await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Cookie', user2Cookie)
        .send({
          content: 'Updated by user2'
        })
        .expect(200);

      const note = dbHelper.db.getNoteById(noteId);
      expect(note.content).toBe('Updated by user2');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should move note to trash (soft delete)', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'To Delete', 'Content');

      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Note moved to trash');

      // Verify note is soft deleted
      const note = dbHelper.db.getNoteById(noteId);
      expect(note.deleted_at).not.toBeNull();
    });

    it('should reject delete without permission', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'User1 Note', 'Content');

      await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Cookie', user2Cookie)
        .expect(403);
    });

    it('should return 404 for non-existent note', async () => {
      await request(app)
        .delete('/api/notes/99999')
        .set('Cookie', user1Cookie)
        .expect(404);
    });
  });

  describe('GET /api/trash', () => {
    it('should return deleted notes for user', async () => {
      // Create and delete notes
      const note1Id = dbHelper.createTestNote(user1Id, 'Deleted 1', 'Content');
      const note2Id = dbHelper.createTestNote(user1Id, 'Deleted 2', 'Content');
      dbHelper.deleteNote(note1Id);
      dbHelper.deleteNote(note2Id);

      const response = await request(app)
        .get('/api/trash')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should not return non-deleted notes', async () => {
      dbHelper.createTestNote(user1Id, 'Active Note', 'Content');

      const response = await request(app)
        .get('/api/trash')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PUT /api/trash/:id/restore', () => {
    it('should restore a deleted note', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'Deleted Note', 'Content');
      dbHelper.deleteNote(noteId);

      const response = await request(app)
        .put(`/api/trash/${noteId}/restore`)
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Note restored successfully');

      // Verify note is restored
      const note = dbHelper.db.getNoteById(noteId);
      expect(note.deleted_at).toBeNull();
    });

    it('should reject restore without permission', async () => {
      const noteId = dbHelper.createTestNote(user1Id, 'Note', 'Content');
      dbHelper.deleteNote(noteId);

      await request(app)
        .put(`/api/trash/${noteId}/restore`)
        .set('Cookie', user2Cookie)
        .expect(403);
    });
  });
});
