const fs = require('fs');
const path = require('path');

// Global teardown - runs once after all tests
module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...\n');

  // Wait a bit to ensure all database connections are closed
  await new Promise(resolve => setTimeout(resolve, 500));

  // Remove test database if it exists
  const testDbPath = path.join(__dirname, 'test.db');
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('  ✓ Test database removed');
    }
  } catch (error) {
    console.log('  ⚠ Could not remove test database (may still be in use)');
  }

  // Remove test sessions database if it exists
  const sessionsDbPath = path.join(__dirname, 'sessions.db');
  try {
    if (fs.existsSync(sessionsDbPath)) {
      fs.unlinkSync(sessionsDbPath);
      console.log('  ✓ Test sessions database removed');
    }
  } catch (error) {
    console.log('  ⚠ Could not remove sessions database (may still be in use)');
  }

  // Remove WAL and SHM files if they exist
  const walFiles = [
    path.join(__dirname, 'test.db-wal'),
    path.join(__dirname, 'test.db-shm'),
    path.join(__dirname, 'sessions.db-wal'),
    path.join(__dirname, 'sessions.db-shm')
  ];

  for (const walFile of walFiles) {
    try {
      if (fs.existsSync(walFile)) {
        fs.unlinkSync(walFile);
      }
    } catch (error) {
      // Ignore errors for WAL files
    }
  }

  // Remove test uploads directory if it exists
  const testUploadsPath = path.join(__dirname, 'test-uploads');
  try {
    if (fs.existsSync(testUploadsPath)) {
      fs.rmSync(testUploadsPath, { recursive: true, force: true });
      console.log('  ✓ Test uploads directory removed');
    }
  } catch (error) {
    console.log('  ⚠ Could not remove test uploads directory');
  }
};
