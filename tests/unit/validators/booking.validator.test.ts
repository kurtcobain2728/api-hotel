import { describe, it, expect } from 'vitest';
import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  bookingFiltersSchema,
} from '../../../src/validators/booking.validator';

describe('Booking Validators', () => {
  describe('createBookingSchema', () => {
    it('should accept valid booking data', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 3);

      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        numberOfGuests: 2,
      });
      expect(result.success).toBe(true);
    });

    it('should reject checkOut before checkIn', () => {
      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-05T00:00:00.000Z',
        numberOfGuests: 2,
      });
      expect(result.success).toBe(false);
    });

    it('should reject checkOut equal to checkIn', () => {
      const sameDate = '2025-04-10T00:00:00.000Z';
      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: sameDate,
        checkOutDate: sameDate,
        numberOfGuests: 2,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero numberOfGuests', () => {
      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-15T00:00:00.000Z',
        numberOfGuests: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer numberOfGuests', () => {
      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-15T00:00:00.000Z',
        numberOfGuests: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing guestId', () => {
      const result = createBookingSchema.safeParse({
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-15T00:00:00.000Z',
        numberOfGuests: 2,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid guestId format', () => {
      const result = createBookingSchema.safeParse({
        guestId: 'not-an-object-id',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-15T00:00:00.000Z',
        numberOfGuests: 2,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional specialRequests', () => {
      const result = createBookingSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
        roomId: '507f1f77bcf86cd799439012',
        checkInDate: '2025-04-10T00:00:00.000Z',
        checkOutDate: '2025-04-15T00:00:00.000Z',
        numberOfGuests: 2,
        specialRequests: 'Late checkout please',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateBookingStatusSchema', () => {
    it('should accept valid booking status', () => {
      const result = updateBookingStatusSchema.safeParse({ status: 'confirmada' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateBookingStatusSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid statuses', () => {
      const statuses = ['pendiente', 'confirmada', 'check-in', 'check-out', 'cancelada'];
      statuses.forEach((status) => {
        const result = updateBookingStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateBookingSchema', () => {
    it('should accept valid update with status', () => {
      const result = updateBookingSchema.safeParse({ status: 'confirmada' });
      expect(result.success).toBe(true);
    });

    it('should accept update with checkInDate string and transform to Date', () => {
      const result = updateBookingSchema.safeParse({
        checkInDate: '2025-05-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkInDate).toBeInstanceOf(Date);
      }
    });

    it('should accept update with checkOutDate string and transform to Date', () => {
      const result = updateBookingSchema.safeParse({
        checkOutDate: '2025-05-05T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkOutDate).toBeInstanceOf(Date);
      }
    });

    it('should handle undefined checkInDate (optional)', () => {
      const result = updateBookingSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.checkInDate).toBeUndefined();
        expect(result.data.checkOutDate).toBeUndefined();
      }
    });

    it('should accept update with numberOfGuests', () => {
      const result = updateBookingSchema.safeParse({ numberOfGuests: 3 });
      expect(result.success).toBe(true);
    });

    it('should reject numberOfGuests < 1', () => {
      const result = updateBookingSchema.safeParse({ numberOfGuests: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer numberOfGuests', () => {
      const result = updateBookingSchema.safeParse({ numberOfGuests: 1.5 });
      expect(result.success).toBe(false);
    });

    it('should accept specialRequests', () => {
      const result = updateBookingSchema.safeParse({
        specialRequests: 'Need extra towels',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateBookingSchema.safeParse({ status: 'invalid-status' });
      expect(result.success).toBe(false);
    });
  });

  describe('bookingFiltersSchema', () => {
    it('should accept empty filters with defaults', () => {
      const result = bookingFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('createdAt');
      }
    });

    it('should accept guestId filter', () => {
      const result = bookingFiltersSchema.safeParse({
        guestId: '507f1f77bcf86cd799439011',
      });
      expect(result.success).toBe(true);
    });

    it('should accept roomId filter', () => {
      const result = bookingFiltersSchema.safeParse({
        roomId: '507f1f77bcf86cd799439012',
      });
      expect(result.success).toBe(true);
    });

    it('should accept status filter', () => {
      const result = bookingFiltersSchema.safeParse({ status: 'pendiente' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status filter', () => {
      const result = bookingFiltersSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept checkInDate filter', () => {
      const result = bookingFiltersSchema.safeParse({
        checkInDate: '2025-04-01',
      });
      expect(result.success).toBe(true);
    });

    it('should accept checkOutDate filter', () => {
      const result = bookingFiltersSchema.safeParse({
        checkOutDate: '2025-04-05',
      });
      expect(result.success).toBe(true);
    });

    it('should accept sortBy options', () => {
      const sortOptions = ['checkInDate', 'checkOutDate', 'totalPrice', 'createdAt'];
      sortOptions.forEach((sortBy) => {
        const result = bookingFiltersSchema.safeParse({ sortBy });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid sortBy', () => {
      const result = bookingFiltersSchema.safeParse({ sortBy: 'invalidField' });
      expect(result.success).toBe(false);
    });

    it('should accept sortOrder asc and desc', () => {
      expect(bookingFiltersSchema.safeParse({ sortOrder: 'asc' }).success).toBe(true);
      expect(bookingFiltersSchema.safeParse({ sortOrder: 'desc' }).success).toBe(true);
    });
  });
});
