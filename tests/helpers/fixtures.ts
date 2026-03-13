import { RoomModel } from '../../src/models/room.model';
import { GuestModel } from '../../src/models/guest.model';
import { BookingModel, BookingStatus } from '../../src/models/booking.model';

/**
 * Test fixtures — reusable data factories for consistent test data.
 */

export const validRoom = (overrides: Record<string, unknown> = {}) => ({
  roomNumber: '101',
  type: 'single',
  price: 100,
  capacity: 1,
  amenities: ['WiFi'],
  ...overrides,
});

export const validGuest = (overrides: Record<string, unknown> = {}) => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  ...overrides,
});

export const validBookingBody = (
  guestId: string,
  roomId: string,
  overrides: Record<string, unknown> = {},
) => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 3);

  return {
    guestId,
    roomId,
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    numberOfGuests: 2,
    ...overrides,
  };
};

/**
 * Seed helpers — insert documents directly into DB for integration tests.
 */

export async function seedRoom(overrides: Record<string, unknown> = {}) {
  const data = validRoom(overrides);
  const room = new RoomModel(data);
  await room.save();
  return room;
}

export async function seedGuest(overrides: Record<string, unknown> = {}) {
  const data = validGuest(overrides);
  const guest = new GuestModel(data);
  await guest.save();
  return guest;
}

export async function seedBooking(
  guestId: string,
  roomId: string,
  overrides: Record<string, unknown> = {},
) {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 3);

  const data = {
    guest: guestId,
    room: roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    numberOfGuests: 2,
    totalPrice: 200,
    status: BookingStatus.PENDING,
    ...overrides,
  };
  const booking = new BookingModel(data);
  await booking.save();
  return booking;
}

/**
 * Seed multiple rooms with sequential room numbers.
 */
export async function seedRooms(count: number) {
  const rooms = [];
  const types = ['single', 'double', 'suite', 'deluxe'];
  for (let i = 0; i < count; i++) {
    rooms.push(
      await seedRoom({
        roomNumber: `${100 + i}`,
        type: types[i % types.length],
        price: 50 + i * 25,
        capacity: (i % 4) + 1,
      }),
    );
  }
  return rooms;
}

/**
 * Seed multiple guests with unique emails.
 */
export async function seedGuests(count: number) {
  const guests = [];
  for (let i = 0; i < count; i++) {
    guests.push(
      await seedGuest({
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: `guest${i}@example.com`,
        phone: `555000${i.toString().padStart(4, '0')}`,
      }),
    );
  }
  return guests;
}
