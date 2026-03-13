import { setupTestDb, teardownTestDb, clearTestDb } from './testDb';

// Global setup: connect to in-memory MongoDB before all tests
beforeAll(async () => {
  await setupTestDb();
});

// Clean all collections between tests for isolation
afterEach(async () => {
  await clearTestDb();
});

// Disconnect and stop after all tests
afterAll(async () => {
  await teardownTestDb();
});
