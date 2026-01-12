module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'server.js',
    'database.js',
    '!node_modules/**',
    '!tests/**'
  ],

  // Coverage thresholds (optional - you can adjust these)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Setup and teardown
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',

  // Timeout for tests (10 seconds)
  testTimeout: 10000,

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/'
  ],

  // Module name mapper - mock ESM modules to avoid transformation issues
  moduleNameMapper: {
    '^marked$': '<rootDir>/tests/mocks/marked.js',
    '^jsdom$': '<rootDir>/tests/mocks/jsdom.js'
  }
};
