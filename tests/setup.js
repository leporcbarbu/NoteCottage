// Global setup - runs once before all tests
module.exports = async () => {
  console.log('\n🧪 Setting up test environment...\n');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_PATH = './tests/test.db';
  process.env.PORT = '3001'; // Use different port for tests
};
