// Jest setup file
// This file can be used to configure Jest and set up testing environment

// Mock console.log for cleaner test output if needed
const originalLog = console.log;
const originalError = console.error;

// Only show logs in verbose mode
if (!process.env.VERBOSE_TESTS) {
  console.log = jest.fn();
  console.error = jest.fn();
}

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after tests
afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});
