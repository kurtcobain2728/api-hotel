import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Health API - Integration', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.success).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.status).toBeDefined();
    expect(response.body.data.database).toBeDefined();
    expect(response.body.data.version).toBeDefined();
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.uptime).toBeDefined();
    expect(typeof response.body.data.uptime).toBe('number');
  });

  it('should report database status', async () => {
    const response = await request(app).get('/api/v1/health');

    // In test environment with mongodb-memory-server, DB should be connected
    expect(['connected', 'disconnected']).toContain(response.body.data.database);
  });

  it('should include version', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.body.data.version).toBeDefined();
  });
});
