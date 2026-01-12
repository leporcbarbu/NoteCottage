const request = require('supertest');
const TestDatabaseHelper = require('./helpers/db-helper');
const { loginUser, createUserAndLogin } = require('./helpers/auth-helper');

describe('Authentication API', () => {
  let app;
  let dbHelper;

  beforeAll(async () => {
    // Initialize test database
    dbHelper = new TestDatabaseHelper();
    await dbHelper.initialize();

    // Import app after database is initialized
    app = require('../server');
  });

  beforeEach(() => {
    // Clear database before each test
    dbHelper.clearAllData();
  });

  afterAll(() => {
    // Close database connection
    dbHelper.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('userId');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser'
          // Missing email and password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with duplicate username', async () => {
      // Create first user
      await dbHelper.createTestUser('existinguser', 'password123');

      // Try to create another user with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'different@test.com',
          password: 'password456'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should make first user an admin', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'firstuser',
          email: 'first@test.com',
          password: 'password123'
        })
        .expect(201);

      // Check that user is admin
      const user = dbHelper.db.getUserById(response.body.userId);
      expect(user.is_admin).toBe(1); // SQLite stores boolean as 0/1
    });

    it('should make subsequent users regular users', async () => {
      // Create first user (admin)
      await dbHelper.createTestUser('admin', 'password123', 'admin');

      // Register second user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'regularuser',
          email: 'regular@test.com',
          password: 'password123'
        })
        .expect(201);

      // Check that user is regular user
      const user = dbHelper.db.getUserById(response.body.userId);
      expect(user.is_admin).toBe(0); // SQLite stores boolean as 0/1
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await dbHelper.createTestUser('testuser', 'password123');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info when authenticated', async () => {
      // Create user and login
      const { userId, cookie } = await createUserAndLogin(
        dbHelper,
        request(app),
        'testuser',
        'password123'
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      // Create user and login
      const { cookie } = await createUserAndLogin(
        dbHelper,
        request(app),
        'testuser',
        'password123'
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logged out successfully');

      // Verify session is destroyed by trying to access protected route
      await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('should handle logout when not authenticated', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(200);
    });
  });
});
