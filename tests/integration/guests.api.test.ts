import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { seedGuest, seedGuests } from '../helpers/fixtures';

describe('Guests API - Integration', () => {
  describe('POST /api/v1/guests', () => {
    it('should create a guest and return 201', async () => {
      const response = await request(app)
        .post('/api/v1/guests')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.email).toBe('john.doe@example.com');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data._id).toBeUndefined();
      expect(response.body.data.__v).toBeUndefined();
    });

    it('should return 400 for missing required fields', async () => {
      await request(app).post('/api/v1/guests').send({ firstName: 'John' }).expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/guests')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email',
          phone: '1234567890',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await seedGuest({ email: 'dup@example.com' });

      await request(app)
        .post('/api/v1/guests')
        .send({
          firstName: 'Another',
          lastName: 'Person',
          email: 'dup@example.com',
          phone: '5559999999',
        })
        .expect(409);
    });
  });

  describe('GET /api/v1/guests', () => {
    beforeEach(async () => {
      await seedGuests(6);
    });

    it('should return paginated list', async () => {
      const response = await request(app)
        .get('/api/v1/guests')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(6);
    });

    it('should search by name', async () => {
      await seedGuest({
        firstName: 'UniqueSearchName',
        lastName: 'Test',
        email: 'unique-search@example.com',
      });

      const response = await request(app)
        .get('/api/v1/guests')
        .query({ search: 'UniqueSearchName' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/guests/:id', () => {
    it('should return guest by id with booking history', async () => {
      const guest = await seedGuest({ email: 'get-by-id@example.com' });

      const response = await request(app).get(`/api/v1/guests/${guest._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('get-by-id@example.com');
      expect(response.body.data.bookings).toBeDefined();
    });

    it('should return 404 for non-existent guest', async () => {
      await request(app).get('/api/v1/guests/507f1f77bcf86cd799439011').expect(404);
    });
  });

  describe('PUT /api/v1/guests/:id', () => {
    it('should update guest', async () => {
      const guest = await seedGuest({ email: 'update-guest@example.com' });

      const response = await request(app)
        .put(`/api/v1/guests/${guest._id}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(response.body.data.firstName).toBe('Updated');
    });

    it('should return 404 for non-existent guest', async () => {
      await request(app)
        .put('/api/v1/guests/507f1f77bcf86cd799439011')
        .send({ firstName: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/guests/:id', () => {
    it('should delete guest and return 204', async () => {
      const guest = await seedGuest({ email: 'delete-me@example.com' });

      await request(app).delete(`/api/v1/guests/${guest._id}`).expect(204);

      await request(app).get(`/api/v1/guests/${guest._id}`).expect(404);
    });
  });
});
