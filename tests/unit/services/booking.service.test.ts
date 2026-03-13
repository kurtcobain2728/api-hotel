import { describe, it, expect } from 'vitest';
import { bookingService } from '../../../src/services/booking.service';
import { BookingStatus } from '../../../src/models/booking.model';
import { RoomModel, RoomStatus } from '../../../src/models/room.model';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/utils/apiError';
import { seedRoom, seedGuest, seedBooking } from '../../helpers/fixtures';
import mongoose from 'mongoose';

describe('BookingService', () => {
  const futureDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      const room = await seedRoom({ roomNumber: 'B101', price: 100 });
      const guest = await seedGuest({ email: 'book1@example.com' });

      const booking = await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(1),
        checkOutDate: futureDate(4),
        numberOfGuests: 2,
      });

      expect(booking).toBeDefined();
      expect(booking.status).toBe(BookingStatus.PENDING);
      expect(booking.totalPrice).toBe(300); // 100 * 3 nights
      expect(booking.numberOfGuests).toBe(2);
    });

    it('should calculate totalPrice correctly (price * nights)', async () => {
      const room = await seedRoom({ roomNumber: 'B102', price: 75 });
      const guest = await seedGuest({ email: 'book2@example.com' });

      const booking = await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(10),
        checkOutDate: futureDate(15),
        numberOfGuests: 1,
      });

      expect(booking.totalPrice).toBe(375); // 75 * 5 nights
    });

    it('should throw ValidationError if guest does not exist', async () => {
      const room = await seedRoom({ roomNumber: 'B103' });
      const fakeGuestId = new mongoose.Types.ObjectId().toString();

      await expect(
        bookingService.createBooking({
          guestId: fakeGuestId,
          roomId: room._id.toString(),
          checkInDate: futureDate(1),
          checkOutDate: futureDate(3),
          numberOfGuests: 1,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if room does not exist', async () => {
      const guest = await seedGuest({ email: 'book3@example.com' });
      const fakeRoomId = new mongoose.Types.ObjectId().toString();

      await expect(
        bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: fakeRoomId,
          checkInDate: futureDate(1),
          checkOutDate: futureDate(3),
          numberOfGuests: 1,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError for overlapping booking dates', async () => {
      const room = await seedRoom({ roomNumber: 'B104', price: 100 });
      const guest = await seedGuest({ email: 'book4@example.com' });

      // Create first booking
      await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(5),
        checkOutDate: futureDate(10),
        numberOfGuests: 1,
      });

      // Overlapping booking
      await expect(
        bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: futureDate(7),
          checkOutDate: futureDate(12),
          numberOfGuests: 1,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should allow non-overlapping bookings for same room', async () => {
      const room = await seedRoom({ roomNumber: 'B105', price: 100 });
      const guest = await seedGuest({ email: 'book5@example.com' });

      await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(1),
        checkOutDate: futureDate(3),
        numberOfGuests: 1,
      });

      // Non-overlapping: starts after first ends
      const second = await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(5),
        checkOutDate: futureDate(7),
        numberOfGuests: 1,
      });

      expect(second).toBeDefined();
    });

    it('should populate guest and room in returned booking', async () => {
      const room = await seedRoom({ roomNumber: 'B106', price: 100 });
      const guest = await seedGuest({ email: 'book6@example.com' });

      const booking = await bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: futureDate(1),
        checkOutDate: futureDate(3),
        numberOfGuests: 1,
      });

      // populated fields
      expect(booking.guest).toBeDefined();
      expect(booking.room).toBeDefined();
    });
  });

  describe('findBookingById', () => {
    it('should find existing booking by id', async () => {
      const room = await seedRoom({ roomNumber: 'BF101' });
      const guest = await seedGuest({ email: 'bf1@example.com' });
      const created = await seedBooking(guest._id.toString(), room._id.toString());

      const found = await bookingService.findBookingById(created._id.toString());
      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(created._id.toString());
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(bookingService.findBookingById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findBookings', () => {
    it('should return paginated results', async () => {
      const room = await seedRoom({ roomNumber: 'BL101', price: 50 });
      const guest = await seedGuest({ email: 'bl1@example.com' });

      // Create multiple bookings with non-overlapping dates
      for (let i = 0; i < 5; i++) {
        await seedBooking(guest._id.toString(), room._id.toString(), {
          checkInDate: futureDate(i * 10 + 1),
          checkOutDate: futureDate(i * 10 + 3),
          totalPrice: 100,
        });
      }

      const result = await bookingService.findBookings({}, { page: 1, limit: 3 });
      expect(result.data.length).toBeLessThanOrEqual(3);
      expect(result.pagination.total).toBe(5);
    });

    it('should filter by status', async () => {
      const room = await seedRoom({ roomNumber: 'BL102', price: 50 });
      const guest = await seedGuest({ email: 'bl2@example.com' });

      await seedBooking(guest._id.toString(), room._id.toString(), {
        status: BookingStatus.CONFIRMED,
        checkInDate: futureDate(1),
        checkOutDate: futureDate(3),
      });
      await seedBooking(guest._id.toString(), room._id.toString(), {
        status: BookingStatus.CANCELLED,
        checkInDate: futureDate(5),
        checkOutDate: futureDate(7),
      });

      const result = await bookingService.findBookings(
        { status: BookingStatus.CONFIRMED },
        { page: 1, limit: 100 },
      );

      result.data.forEach((b) => {
        expect(b.status).toBe(BookingStatus.CONFIRMED);
      });
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status', async () => {
      const room = await seedRoom({ roomNumber: 'BS101' });
      const guest = await seedGuest({ email: 'bs1@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      const updated = await bookingService.updateBookingStatus(
        booking._id.toString(),
        BookingStatus.CONFIRMED,
      );

      expect(updated.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should update room status to occupied on check-in', async () => {
      const room = await seedRoom({ roomNumber: 'BS102' });
      const guest = await seedGuest({ email: 'bs2@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      await bookingService.updateBookingStatus(booking._id.toString(), BookingStatus.CHECKED_IN);

      const updatedRoom = await RoomModel.findById(room._id);
      expect(updatedRoom!.status).toBe(RoomStatus.OCCUPIED);
    });

    it('should update room status to cleaning on check-out', async () => {
      const room = await seedRoom({ roomNumber: 'BS103' });
      const guest = await seedGuest({ email: 'bs3@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      await bookingService.updateBookingStatus(booking._id.toString(), BookingStatus.CHECKED_OUT);

      const updatedRoom = await RoomModel.findById(room._id);
      expect(updatedRoom!.status).toBe(RoomStatus.CLEANING);
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        bookingService.updateBookingStatus(fakeId, BookingStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancelBooking', () => {
    it('should soft-delete booking by setting status to cancelada', async () => {
      const room = await seedRoom({ roomNumber: 'BC101' });
      const guest = await seedGuest({ email: 'bc1@example.com' });
      const booking = await seedBooking(guest._id.toString(), room._id.toString());

      const cancelled = await bookingService.cancelBooking(booking._id.toString());

      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(bookingService.cancelBooking(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('checkRoomAvailability', () => {
    it('should return true when no conflicting bookings exist', async () => {
      const room = await seedRoom({ roomNumber: 'CA101' });

      const available = await bookingService.checkRoomAvailability(
        room._id.toString(),
        futureDate(1),
        futureDate(3),
      );

      expect(available).toBe(true);
    });

    it('should return false when overlapping booking exists', async () => {
      const room = await seedRoom({ roomNumber: 'CA102' });
      const guest = await seedGuest({ email: 'ca2@example.com' });

      await seedBooking(guest._id.toString(), room._id.toString(), {
        checkInDate: futureDate(5),
        checkOutDate: futureDate(10),
        status: BookingStatus.CONFIRMED,
      });

      const available = await bookingService.checkRoomAvailability(
        room._id.toString(),
        futureDate(7),
        futureDate(12),
      );

      expect(available).toBe(false);
    });

    it('should ignore cancelled bookings', async () => {
      const room = await seedRoom({ roomNumber: 'CA103' });
      const guest = await seedGuest({ email: 'ca3@example.com' });

      await seedBooking(guest._id.toString(), room._id.toString(), {
        checkInDate: futureDate(5),
        checkOutDate: futureDate(10),
        status: BookingStatus.CANCELLED,
      });

      const available = await bookingService.checkRoomAvailability(
        room._id.toString(),
        futureDate(7),
        futureDate(12),
      );

      expect(available).toBe(true);
    });
  });
});
