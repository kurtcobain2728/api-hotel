import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { seedRoom, seedRooms } from '../helpers/fixtures';

describe('Rooms API - Integration', () => {
  describe('POST /api/v1/rooms', () => {
    it('should create a room and return 201', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({
          roomNumber: '201',
          type: 'suite',
          price: 300,
          capacity: 4,
          amenities: ['WiFi', 'TV', 'Minibar'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.roomNumber).toBe('201');
      expect(response.body.data.type).toBe('suite');
      expect(response.body.data.status).toBe('disponible');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data._id).toBeUndefined();
      expect(response.body.data.__v).toBeUndefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({
          roomNumber: '202',
          type: 'invalid-type',
          price: -100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .send({ roomNumber: '203' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate room number', async () => {
      await seedRoom({ roomNumber: '204' });

      const response = await request(app)
        .post('/api/v1/rooms')
        .send({
          roomNumber: '204',
          type: 'single',
          price: 100,
          capacity: 1,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/CONFLICT/);
    });
  });

  describe('GET /api/v1/rooms', () => {
    beforeEach(async () => {
      await seedRooms(8);
    });

    it('should return paginated list of rooms', async () => {
      const response = await request(app)
        .get('/api/v1/rooms')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(8);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/v1/rooms')
        .query({ type: 'single' })
        .expect(200);

      response.body.data.forEach((room: Record<string, unknown>) => {
        expect(room.type).toBe('single');
      });
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/rooms')
        .query({ minPrice: '100', maxPrice: '200' })
        .expect(200);

      response.body.data.forEach((room: Record<string, unknown>) => {
        expect(room.price as number).toBeGreaterThanOrEqual(100);
        expect(room.price as number).toBeLessThanOrEqual(200);
      });
    });
  });

  describe('GET /api/v1/rooms/:id', () => {
    it('should return room by id', async () => {
      const room = await seedRoom({ roomNumber: '301' });

      const response = await request(app).get(`/api/v1/rooms/${room._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roomNumber).toBe('301');
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 404 for non-existent room', async () => {
      const response = await request(app).get('/api/v1/rooms/507f1f77bcf86cd799439011').expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/api/v1/rooms/invalid-id').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/rooms/:id', () => {
    it('should update room', async () => {
      const room = await seedRoom({ roomNumber: '401', price: 100 });

      const response = await request(app)
        .put(`/api/v1/rooms/${room._id}`)
        .send({ price: 250 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(250);
      expect(response.body.data.roomNumber).toBe('401');
    });

    it('should return 404 for non-existent room', async () => {
      await request(app)
        .put('/api/v1/rooms/507f1f77bcf86cd799439011')
        .send({ price: 250 })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/rooms/:id', () => {
    it('should delete room and return 204', async () => {
      const room = await seedRoom({ roomNumber: '501' });

      await request(app).delete(`/api/v1/rooms/${room._id}`).expect(204);

      // Verify it's gone
      await request(app).get(`/api/v1/rooms/${room._id}`).expect(404);
    });

    it('should return 404 for non-existent room', async () => {
      await request(app).delete('/api/v1/rooms/507f1f77bcf86cd799439011').expect(404);
    });
  });

  describe('PATCH /api/v1/rooms/:id/status', () => {
    it('should update room status', async () => {
      const room = await seedRoom({ roomNumber: '601' });

      const response = await request(app)
        .patch(`/api/v1/rooms/${room._id}/status`)
        .send({ status: 'mantenimiento' })
        .expect(200);

      expect(response.body.data.status).toBe('mantenimiento');
    });

    it('should reject invalid status', async () => {
      const room = await seedRoom({ roomNumber: '602' });

      await request(app)
        .patch(`/api/v1/rooms/${room._id}/status`)
        .send({ status: 'invalid' })
        .expect(400);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/rooms')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent').expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
