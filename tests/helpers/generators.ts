import fc from 'fast-check';

/**
 * Custom fast-check arbitraries for generating valid test data.
 */

// Room number: alphanumeric, 1-10 chars
export const roomNumberArb = fc.stringMatching(/^[A-Za-z0-9]+$/, { minLength: 1, maxLength: 10 });

// Room type
export const roomTypeArb = fc.constantFrom('single', 'double', 'suite', 'deluxe');

// Room status
export const roomStatusArb = fc.constantFrom('disponible', 'ocupada', 'mantenimiento', 'limpieza');

// Positive price: between 0.01 and 10000
export const priceArb = fc
  .double({ min: 0.01, max: 10000, noNaN: true })
  .map((v) => Math.round(v * 100) / 100);

// Capacity: integer 1–10
export const capacityArb = fc.integer({ min: 1, max: 10 });

// Amenities: array of short strings
export const amenitiesArb = fc.array(
  fc.stringMatching(/^[A-Za-z ]+$/, { minLength: 1, maxLength: 20 }),
  { maxLength: 5 },
);

// Valid room data for creation
export const createRoomArb = fc.record({
  roomNumber: roomNumberArb,
  type: roomTypeArb,
  price: priceArb,
  capacity: capacityArb,
  amenities: amenitiesArb,
});

// Unique room data (adds index suffix to roomNumber to avoid collisions)
export function uniqueRoomArb(index: number) {
  return createRoomArb.map((r) => ({
    ...r,
    roomNumber: `R${index}-${r.roomNumber}`,
  }));
}

// Valid first/last name
export const nameArb = fc.stringMatching(/^[A-Za-z]+$/, {
  minLength: 1,
  maxLength: 30,
});

// Valid email
export const emailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]+$/, { minLength: 1, maxLength: 10 }),
    fc.stringMatching(/^[a-z0-9]+$/, { minLength: 1, maxLength: 8 }),
  )
  .map(([user, domain]) => `${user}@${domain}.com`);

// Valid phone
export const phoneArb = fc.stringMatching(/^[0-9]+$/, {
  minLength: 10,
  maxLength: 15,
});

// Valid guest data for creation
export const createGuestArb = fc.record({
  firstName: nameArb,
  lastName: nameArb,
  email: emailArb,
  phone: phoneArb,
});

// Unique guest data
export function uniqueGuestArb(index: number) {
  return createGuestArb.map((g) => ({
    ...g,
    email: `test${index}-${g.email}`,
  }));
}

// Date range: checkIn at least tomorrow, checkOut 1-30 days after checkIn
export const dateRangeArb = fc.integer({ min: 1, max: 365 }).chain((daysFromNow) =>
  fc.integer({ min: 1, max: 30 }).map((nights) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + daysFromNow);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);
    return { checkIn, checkOut, nights };
  }),
);

// Number of guests
export const numberOfGuestsArb = fc.integer({ min: 1, max: 10 });

// Pagination params
export const pageArb = fc.integer({ min: 1, max: 20 });
export const limitArb = fc.integer({ min: 1, max: 100 });
