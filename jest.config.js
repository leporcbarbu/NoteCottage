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

  // Coverage thresholds - set to current levels to prevent regression
  // As more tests are added, these can be gradually increased
  coverageThreshold: {
    global: {
      branches: 25,    // Current: 27.44%
      functions: 40,   // Current: 45.96%
      lines: 35,       // Current: 39.71%
      statements: 35   // Current: 39.61%
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
