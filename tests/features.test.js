const request = require('supertest');
const TestDatabaseHelper = require('./helpers/db-helper');
const { createUserAndLogin } = require('./helpers/auth-helper');

describe('Wiki-Links, Backlinks, Search, and Tags', () => {
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

  describe('Backlinks - GET /api/notes/:id/backlinks', () => {
    it('should return notes that link to the target note', async () => {
      // Create target note
      const targetNoteId = dbHelper.createTestNote(userId, 'Target Note', 'This is the target');

      // Create notes with wiki-links to target
      dbHelper.createTestNote(
        userId,
        'Note 1',
        'This links to [[Target Note]] in the content'
      );
      dbHelper.createTestNote(
        userId,
        'Note 2',
        'Another link to [[Target Note]] here'
      );

      // Create note without link
      dbHelper.createTestNote(userId, 'Note 3', 'No links here');

      const response = await request(app)
        .get(`/api/notes/${targetNoteId}/backlinks`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should handle notes with link aliases', async () => {
      const targetNoteId = dbHelper.createTestNote(userId, 'Important Doc', 'Content');

      // Create note with link alias
      dbHelper.createTestNote(
        userId,
        'Referencing Note',
        'See [[Important Doc|this document]] for details'
      );

      const response = await request(app)
        .get(`/api/notes/${targetNoteId}/backlinks`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should be case-insensitive', async () => {
      const targetNoteId = dbHelper.createTestNote(userId, 'My Note', 'Content');

      // Create note with different case
      dbHelper.createTestNote(
        userId,
        'Reference',
        'Link to [[my note]] here'
      );

      const response = await request(app)
        .get(`/api/notes/${targetNoteId}/backlinks`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should return empty array if no backlinks', async () => {
      const noteId = dbHelper.createTestNote(userId, 'Lonely Note', 'No one links to me');

      const response = await request(app)
        .get(`/api/notes/${noteId}/backlinks`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  // TODO: Implement POST /api/tags endpoint before enabling these tests
  describe.skip('Tags - POST /api/tags', () => {
    it('should create a new tag', async () => {
      const response = await request(app)
        .post('/api/tags')
        .set('Cookie', userCookie)
        .send({
          name: 'important'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message', 'Tag created successfully');
    });

    it('should reject duplicate tag names', async () => {
      // Create first tag
      dbHelper.createTestTag('duplicate');

      // Try to create duplicate
      await request(app)
        .post('/api/tags')
        .set('Cookie', userCookie)
        .send({
          name: 'duplicate'
        })
        .expect(400);
    });

    it('should reject tag without name', async () => {
      await request(app)
        .post('/api/tags')
        .set('Cookie', userCookie)
        .send({})
        .expect(400);
    });
  });

  describe('Tags - GET /api/tags', () => {
    it('should return all tags', async () => {
      dbHelper.createTestTag('tag1');
      dbHelper.createTestTag('tag2');
      dbHelper.createTestTag('tag3');

      const response = await request(app)
        .get('/api/tags')
        .set('Cookie', userCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  });

  // TODO: Implement POST /api/notes/:id/tags endpoint before enabling these tests
  describe.skip('Note Tags - POST /api/notes/:id/tags', () => {
    it('should add tag to note', async () => {
      const noteId = dbHelper.createTestNote(userId, 'Tagged Note', 'Content');
      const tagId = dbHelper.createTestTag('important');

      const response = await request(app)
        .post(`/api/notes/${noteId}/tags`)
        .set('Cookie', userCookie)
        .send({
          tag_id: tagId
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tag added to note');

      // Verify tag was added
      const tags = dbHelper.db.getTagsForNote(noteId);
      expect(tags.some(t => t.id === tagId)).toBe(true);
    });

    it('should reject adding same tag twice', async () => {
      const noteId = dbHelper.createTestNote(userId, 'Note', 'Content');
      const tagId = dbHelper.createTestTag('tag');

      // Add tag first time
      dbHelper.db.addTagToNote(noteId, tagId);

      // Try to add again
      await request(app)
        .post(`/api/notes/${noteId}/tags`)
        .set('Cookie', userCookie)
        .send({
          tag_id: tagId
        })
        .expect(400);
    });
  });

  // TODO: Implement DELETE /api/notes/:noteId/tags/:tagId endpoint before enabling these tests
  describe.skip('Note Tags - DELETE /api/notes/:noteId/tags/:tagId', () => {
    it('should remove tag from note', async () => {
      const noteId = dbHelper.createTestNote(userId, 'Note', 'Content');
      const tagId = dbHelper.createTestTag('removeme');
      dbHelper.db.addTagToNote(noteId, tagId);

      const response = await request(app)
        .delete(`/api/notes/${noteId}/tags/${tagId}`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tag removed from note');

      // Verify tag was removed
      const tags = dbHelper.db.getTagsForNote(noteId);
      expect(tags.some(t => t.id === tagId)).toBe(false);
    });
  });

  describe('Search - GET /api/search', () => {
    it('should search notes by content', async () => {
      dbHelper.createTestNote(userId, 'First Note', 'This contains searchable content');
      dbHelper.createTestNote(userId, 'Second Note', 'This also has searchable text');
      dbHelper.createTestNote(userId, 'Third Note', 'Nothing special here');

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'searchable' })
        .set('Cookie', userCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should search notes by title', async () => {
      dbHelper.createTestNote(userId, 'Searchable Title', 'Content here');
      dbHelper.createTestNote(userId, 'Other Note', 'Content here');

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'Searchable' })
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const found = response.body.find(n => n.title === 'Searchable Title');
      expect(found).toBeDefined();
    });

    it('should return empty array for no matches', async () => {
      dbHelper.createTestNote(userId, 'Note', 'Content');

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'nonexistent' })
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should reject search without query', async () => {
      await request(app)
        .get('/api/search')
        .set('Cookie', userCookie)
        .expect(400);
    });

    it('should not search deleted notes', async () => {
      const noteId = dbHelper.createTestNote(userId, 'Deleted', 'searchterm');
      dbHelper.db.deleteNote(noteId);

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'searchterm' })
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('Tag Filter - GET /api/tags/:tagName/notes', () => {
    it('should return notes with specific tag', async () => {
      // Tags are created automatically from note content using #hashtags
      const note1 = dbHelper.createTestNote(userId, 'Important 1', 'Content with #important tag');
      const note2 = dbHelper.createTestNote(userId, 'Important 2', 'Also has #important tag');
      const note3 = dbHelper.createTestNote(userId, 'Regular Note', 'Content without tags');

      const response = await request(app)
        .get('/api/tags/important/notes')
        .set('Cookie', userCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('should return empty array for tag with no notes', async () => {
      dbHelper.createTestTag('unused');

      const response = await request(app)
        .get('/api/tags/unused/notes')
        .set('Cookie', userCookie)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should handle non-existent tags', async () => {
      await request(app)
        .get('/api/tags/nonexistent/notes')
        .set('Cookie', userCookie)
        .expect(200);
    });
  });
});
