import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { roomService } from '../../src/services/room.service';
import { guestService } from '../../src/services/guest.service';
import { bookingService } from '../../src/services/booking.service';
import { createRoomArb, createGuestArb, dateRangeArb } from '../helpers/generators';

describe('Serialization Property Tests', () => {
  // Feature: hotel-api, Property 38: Round-trip de parseo y serialización JSON (Bookings)
  it('should preserve booking data through JSON serialization round-trip', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(dateRangeArb, async (dateRange) => {
        idx++;
        const room = await roomService.createRoom({
          roomNumber: `SER-B-${idx}-${Date.now()}`,
          type: 'double',
          price: 150,
          capacity: 2,
          amenities: [],
        });
        const guest = await guestService.createGuest({
          firstName: 'Serial',
          lastName: 'Test',
          email: `ser-b-${idx}-${Date.now()}@example.com`,
          phone: '5551234567',
        });

        const booking = await bookingService.createBooking({
          guestId: guest._id.toString(),
          roomId: room._id.toString(),
          checkInDate: dateRange.checkIn,
          checkOutDate: dateRange.checkOut,
          numberOfGuests: 1,
        });

        const json = JSON.stringify(booking);
        const parsed = JSON.parse(json);

        expect(parsed.id).toBeDefined();
        expect(parsed._id).toBeUndefined();
        expect(parsed.__v).toBeUndefined();
        expect(parsed.totalPrice).toBe(150 * dateRange.nights);
        expect(parsed.numberOfGuests).toBe(1);
        expect(parsed.status).toBe('pendiente');
      }),
      { numRuns: 10 },
    );
  });

  // Feature: hotel-api, Property 40: Respuestas omiten campos internos de Mongoose (all entities)
  it('should omit __v and _id from room JSON output', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createRoomArb, async (roomData) => {
        idx++;
        const data = { ...roomData, roomNumber: `SER-R-${idx}-${Date.now()}` };
        const room = await roomService.createRoom(data);
        const json = room.toJSON();
        expect(json).toHaveProperty('id');
        expect(json).not.toHaveProperty('_id');
        expect(json).not.toHaveProperty('__v');
      }),
      { numRuns: 10 },
    );
  });

  it('should omit __v and _id from guest JSON output', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createGuestArb, async (guestData) => {
        idx++;
        const data = { ...guestData, email: `ser-g-${idx}-${Date.now()}-${guestData.email}` };
        const guest = await guestService.createGuest(data);
        const json = guest.toJSON();
        expect(json).toHaveProperty('id');
        expect(json).not.toHaveProperty('_id');
        expect(json).not.toHaveProperty('__v');
      }),
      { numRuns: 10 },
    );
  });

  it('should omit __v and _id from booking JSON output', async () => {
    const room = await roomService.createRoom({
      roomNumber: `SER-BJ-${Date.now()}`,
      type: 'single',
      price: 80,
      capacity: 1,
      amenities: [],
    });
    const guest = await guestService.createGuest({
      firstName: 'SerJ',
      lastName: 'Test',
      email: `ser-bj-${Date.now()}@example.com`,
      phone: '5559876543',
    });

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 100);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await bookingService.createBooking({
      guestId: guest._id.toString(),
      roomId: room._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: 1,
    });

    const json = booking.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });
});
