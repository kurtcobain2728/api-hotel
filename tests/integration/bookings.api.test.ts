import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { seedRoom, seedGuest, seedBooking } from '../helpers/fixtures';
import { BookingStatus } from '../../src/models/booking.model';

describe('Bookings API - Integration', () => {
  const futureISO = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  describe('POST /api/v1/bookings', () => {
    it('should create a booking and return 201', async () => {
      const room = await seedRoom({ roomNumber: 'INT101', price: 100 });
      const guest = await seedGuest({ email: 'int1@example.com' });

      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: futureISO(1),
          checkOutDate: futureISO(4),
          numberOfGuests: 2,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPrice).toBe(300);
      expect(response.body.data.status).toBe('pendiente');
    });

    it('should return 400 for missing required fields', async () => {
      await request(app).post('/api/v1/bookings').send({ numberOfGuests: 2 }).expect(400);
    });

    it('should return 400 for checkOut before checkIn', async () => {
      const room = await seedRoom({ roomNumber: 'INT102' });
      const guest = await seedGuest({ email: 'int2@example.com' });

      await request(app)
        .post('/api/v1/bookings')
        .send({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: futureISO(5),
          checkOutDate: futureISO(2),
          numberOfGuests: 1,
        })
        .expect(400);
    });

    it('should return 400 for non-existent guest', async () => {
      const room = await seedRoom({ roomNumber: 'INT103' });

      const response = await request(app)
        .post('/api/v1/bookings')
        .send({
          guestId: '507f1f77bcf86cd799439011',
          roomId: room._id.toString(),
          checkInDate: futureISO(1),
          checkOutDate: futureISO(3),
          numberOfGuests: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for overlapping dates', async () => {
      const room = await seedRoom({ roomNumber: 'INT104', price: 100 });
      const guest = await seedGuest({ email: 'int4@example.com' });

      // First booking
      await request(app)
        .post('/api/v1/bookings')
        .send({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: futureISO(5),
          checkOutDate: futureISO(10),
          numberOfGuests: 1,
        })
        .expect(201);

      // Overlapping
      await request(app)
        .post('/api/v1/bookings')
        .send({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: futureISO(7),
          checkOutDate: futureISO(12),
          numberOfGuests: 1,
        })
        .expect(409);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking with populated guest and room', async () => {
      const room = await seedRoom({ roomNumber: 'INT201' });
      const guest = await seedGuest({ email: 'int5@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      const response = await request(app).get(`/api/v1/bookings/${booking._id}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.guest).toBeDefined();
      expect(response.body.data.room).toBeDefined();
    });

    it('should return 404 for non-existent booking', async () => {
      await request(app).get('/api/v1/bookings/507f1f77bcf86cd799439011').expect(404);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should return paginated list', async () => {
      const room = await seedRoom({ roomNumber: 'INT301', price: 50 });
      const guest = await seedGuest({ email: 'int6@example.com' });

      for (let i = 0; i < 4; i++) {
        await seedBooking(guest._id.toString(), room._id.toString(), {
          checkInDate: new Date(Date.now() + (i * 10 + 1) * 86400000),
          checkOutDate: new Date(Date.now() + (i * 10 + 3) * 86400000),
          totalPrice: 100,
        });
      }

      const response = await request(app)
        .get('/api/v1/bookings')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.total).toBe(4);
    });

    it('should filter by status', async () => {
      const room = await seedRoom({ roomNumber: 'INT302', price: 50 });
      const guest = await seedGuest({ email: 'int7@example.com' });

      await seedBooking(guest._id.toString(), room._id.toString(), {
        status: BookingStatus.CONFIRMED,
      });

      const response = await request(app)
        .get('/api/v1/bookings')
        .query({ status: 'confirmada' })
        .expect(200);

      response.body.data.forEach((b: Record<string, unknown>) => {
        expect(b.status).toBe('confirmada');
      });
    });
  });

  describe('DELETE /api/v1/bookings/:id', () => {
    it('should soft-delete booking (set status to cancelada)', async () => {
      const room = await seedRoom({ roomNumber: 'INT401' });
      const guest = await seedGuest({ email: 'int8@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      const response = await request(app).delete(`/api/v1/bookings/${booking._id}`).expect(200);

      expect(response.body.data.status).toBe('cancelada');
    });
  });

  describe('PATCH /api/v1/bookings/:id/status', () => {
    it('should update booking status', async () => {
      const room = await seedRoom({ roomNumber: 'INT501' });
      const guest = await seedGuest({ email: 'int9@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      const response = await request(app)
        .patch(`/api/v1/bookings/${booking._id}/status`)
        .send({ status: 'confirmada' })
        .expect(200);

      expect(response.body.data.status).toBe('confirmada');
    });

    it('should update room to occupied on check-in', async () => {
      const room = await seedRoom({ roomNumber: 'INT502' });
      const guest = await seedGuest({ email: 'int10@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      await request(app)
        .patch(`/api/v1/bookings/${booking._id}/status`)
        .send({ status: 'check-in' })
        .expect(200);

      // Verify room status
      const roomRes = await request(app).get(`/api/v1/rooms/${room._id}`).expect(200);

      expect(roomRes.body.data.status).toBe('ocupada');
    });

    it('should update room to cleaning on check-out', async () => {
      const room = await seedRoom({ roomNumber: 'INT503' });
      const guest = await seedGuest({ email: 'int11@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      await request(app)
        .patch(`/api/v1/bookings/${booking._id}/status`)
        .send({ status: 'check-out' })
        .expect(200);

      const roomRes = await request(app).get(`/api/v1/rooms/${room._id}`).expect(200);

      expect(roomRes.body.data.status).toBe('limpieza');
    });

    it('should reject invalid status value', async () => {
      const room = await seedRoom({ roomNumber: 'INT504' });
      const guest = await seedGuest({ email: 'int12@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      await request(app)
        .patch(`/api/v1/bookings/${booking._id}/status`)
        .send({ status: 'invalid' })
        .expect(400);
    });
  });
});
