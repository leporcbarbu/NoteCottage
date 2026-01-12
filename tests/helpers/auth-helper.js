/**
 * Authentication helper for tests
 * Provides utilities for logging in and managing sessions
 */

/**
 * Login a user and return the session cookie
 * @param {object} request - Supertest request object
 * @param {string} username - Username to login with
 * @param {string} password - Password to login with
 * @returns {Promise<string>} Session cookie
 */
async function loginUser(request, username = 'testuser', password = 'password123') {
  const response = await request
    .post('/api/auth/login')
    .send({ username, password })
    .expect(200);

  // Extract cookie from response
  const cookies = response.headers['set-cookie'];
  if (!cookies || cookies.length === 0) {
    throw new Error('No session cookie returned from login');
  }

  return cookies[0].split(';')[0]; // Return just the cookie value
}

/**
 * Create a user and login, returning the session cookie
 * @param {object} dbHelper - Database helper instance (TestDatabaseHelper)
 * @param {object} request - Supertest request object
 * @param {string} username - Username for new user
 * @param {string} password - Password for new user
 * @param {string} role - Role for new user (user or admin)
 * @returns {Promise<{userId: number, cookie: string}>}
 */
async function createUserAndLogin(dbHelper, request, username = 'testuser', password = 'password123', role = 'user') {
  // Create user in database (this will hash the password)
  const userId = await dbHelper.createTestUser(username, password, role);

  // Login and get session cookie
  const cookie = await loginUser(request, username, password);

  return { userId, cookie };
}

/**
 * Extract user ID from session cookie
 * This is useful for assertions
 */
function extractUserIdFromCookie(cookie) {
  // This is a simplified version - in reality you'd need to decode the session
  // For now, we'll just return null and rely on the database user ID
  return null;
}

module.exports = {
  loginUser,
  createUserAndLogin,
  extractUserIdFromCookie
};
