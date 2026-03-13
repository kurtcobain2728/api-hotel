import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Error Handling - Integration', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent').expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for malformed JSON body', async () => {
    const response = await request(app)
      .post('/api/v1/rooms')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should include X-Request-ID header', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-request-id']).toBeDefined();
    // UUID v4 format check
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should return 400 for invalid ObjectId on rooms/:id', async () => {
    const response = await request(app).get('/api/v1/rooms/not-a-valid-id').expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 400 for invalid ObjectId on guests/:id', async () => {
    const response = await request(app).get('/api/v1/guests/invalid-id').expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 404 for non-existent room', async () => {
    const response = await request(app).get('/api/v1/rooms/507f1f77bcf86cd799439011').expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toContain('NOT_FOUND');
  });
});
