import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { bookingService } from '../../src/services/booking.service';
import { roomService } from '../../src/services/room.service';
import { guestService } from '../../src/services/guest.service';
import { BookingStatus } from '../../src/models/booking.model';
import { RoomModel, RoomStatus } from '../../src/models/room.model';
import { NotFoundError, ConflictError, ValidationError } from '../../src/utils/apiError';
import { dateRangeArb, numberOfGuestsArb } from '../helpers/generators';
import mongoose from 'mongoose';

// Helper to create a room + guest pair for each test iteration
async function createRoomAndGuest(idx: number) {
  const room = await roomService.createRoom({
    roomNumber: `BK-${idx}-${Date.now()}`,
    type: 'single',
    price: 100,
    capacity: 2,
    amenities: [],
  });
  const guest = await guestService.createGuest({
    firstName: 'Test',
    lastName: 'Guest',
    email: `bk-${idx}-${Date.now()}@example.com`,
    phone: '1234567890',
  });
  return { room, guest };
}

describe('Booking Property Tests', () => {
  // Feature: hotel-api, Property 17: Round-trip de creación y lectura de reservas
  it('should preserve booking data through create and read cycle', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(dateRangeArb, numberOfGuestsArb, async (dateRange, numGuests) => {
        idx++;
        const { room, guest } = await createRoomAndGuest(idx);

        const created = await bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: dateRange.checkIn,
          checkOutDate: dateRange.checkOut,
          numberOfGuests: numGuests,
        });

        const retrieved = await bookingService.findBookingById(created._id.toString());

        expect(retrieved.checkInDate.getTime()).toBe(dateRange.checkIn.getTime());
        expect(retrieved.checkOutDate.getTime()).toBe(dateRange.checkOut.getTime());
        expect(retrieved.numberOfGuests).toBe(numGuests);
        expect(retrieved.status).toBe(BookingStatus.PENDING);
        expect(retrieved.totalPrice).toBe(room.price * dateRange.nights);
      }),
      { numRuns: 15 },
    );
  });

  // Feature: hotel-api, Property 18: Actualización de estado de reserva
  it('should correctly update booking status', async () => {
    const statuses = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT];

    let idx = 0;
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...statuses), async (newStatus) => {
        idx++;
        const { room, guest } = await createRoomAndGuest(idx + 1000);

        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 30 + idx);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 2);

        const booking = await bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: 1,
        });

        const updated = await bookingService.updateBookingStatus(booking._id.toString(), newStatus);

        expect(updated.status).toBe(newStatus);
        expect(updated._id.toString()).toBe(booking._id.toString());
      }),
      { numRuns: 10 },
    );
  });

  // Feature: hotel-api, Property 19: Cancelación de reserva actualiza estado
  it('should set booking status to cancelada on cancel', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(dateRangeArb, async (dateRange) => {
        idx++;
        const { room, guest } = await createRoomAndGuest(idx + 2000);

        const booking = await bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: dateRange.checkIn,
          checkOutDate: dateRange.checkOut,
          numberOfGuests: 1,
        });

        const cancelled = await bookingService.cancelBooking(booking._id.toString());
        expect(cancelled.status).toBe(BookingStatus.CANCELLED);
      }),
      { numRuns: 10 },
    );
  });

  // Feature: hotel-api, Property 20: Validación de fechas de reserva
  it('should reject bookings where checkOut is before or equal to checkIn', async () => {
    const { createBookingSchema } = await import('../../src/validators/booking.validator');

    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }),
        fc.integer({ min: 0, max: 30 }),
        (daysFromNow, backOffset) => {
          const checkIn = new Date();
          checkIn.setDate(checkIn.getDate() + daysFromNow + 1);
          const checkOut = new Date(checkIn);
          checkOut.setDate(checkOut.getDate() - backOffset); // checkOut <= checkIn

          const result = createBookingSchema.safeParse({
            guestId: new mongoose.Types.ObjectId().toString(),
            roomId: new mongoose.Types.ObjectId().toString(),
            checkInDate: checkIn.toISOString(),
            checkOutDate: checkOut.toISOString(),
            numberOfGuests: 1,
          });

          // checkOut <= checkIn should fail
          if (checkOut <= checkIn) {
            expect(result.success).toBe(false);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 21: Validación de existencia de referencias
  it('should reject bookings with non-existent guest or room ids', async () => {
    const fakeGuestId = new mongoose.Types.ObjectId().toString();
    const fakeRoomId = new mongoose.Types.ObjectId().toString();

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    // Non-existent guest
    await expect(
      bookingService.createBooking({
        guestId: fakeGuestId,
        roomId: fakeRoomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 1,
      }),
    ).rejects.toThrow(ValidationError);

    // Create a real guest but use fake room
    const guest = await guestService.createGuest({
      firstName: 'Ref',
      lastName: 'Test',
      email: `ref-test-${Date.now()}@example.com`,
      phone: '9999999999',
    });

    await expect(
      bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: fakeRoomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 1,
      }),
    ).rejects.toThrow(ValidationError);
  });

  // Feature: hotel-api, Property 22: Detección de conflictos de disponibilidad
  it('should reject overlapping bookings for the same room', async () => {
    const { room, guest } = await createRoomAndGuest(5000);

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 50);
    checkIn.setHours(0, 0, 0, 0);

    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 5);

    // First booking should succeed
    await bookingService.createBooking({
      guestId: guest._id.toString(),
      roomId: room._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 1,
    });

    // Overlapping booking for same room should fail
    const overlapCheckIn = new Date(checkIn);
    overlapCheckIn.setDate(overlapCheckIn.getDate() + 2); // mid-stay
    const overlapCheckOut = new Date(overlapCheckIn);
    overlapCheckOut.setDate(overlapCheckOut.getDate() + 3);

    await expect(
      bookingService.createBooking({
        guestId: guest._id.toString(),
        roomId: room._id.toString(),
        checkInDate: overlapCheckIn,
        checkOutDate: overlapCheckOut,
        numberOfGuests: 1,
      }),
    ).rejects.toThrow(ConflictError);
  });

  // Feature: hotel-api, Property 23: Check-in actualiza estado de habitación a ocupada
  it('should update room status to ocupada on check-in', async () => {
    const { room, guest } = await createRoomAndGuest(6000);

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 60);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await bookingService.createBooking({
      guestId: guest._id.toString(),
      roomId: room._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 1,
    });

    await bookingService.updateBookingStatus(booking._id.toString(), BookingStatus.CHECKED_IN);

    const updatedRoom = await RoomModel.findById(room._id);
    expect(updatedRoom!.status).toBe(RoomStatus.OCCUPIED);
  });

  // Feature: hotel-api, Property 24: Check-out actualiza estado de habitación a limpieza
  it('should update room status to limpieza on check-out', async () => {
    const { room, guest } = await createRoomAndGuest(7000);

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 70);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await bookingService.createBooking({
      guestId: guest._id.toString(),
      roomId: room._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 1,
    });

    // First check-in, then check-out
    await bookingService.updateBookingStatus(booking._id.toString(), BookingStatus.CHECKED_IN);
    await bookingService.updateBookingStatus(booking._id.toString(), BookingStatus.CHECKED_OUT);

    const updatedRoom = await RoomModel.findById(room._id);
    expect(updatedRoom!.status).toBe(RoomStatus.CLEANING);
  });
});
