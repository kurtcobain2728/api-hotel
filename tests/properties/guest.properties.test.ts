import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { guestService } from '../../src/services/guest.service';
import { NotFoundError } from '../../src/utils/apiError';
import { createGuestArb, emailArb, nameArb } from '../helpers/generators';
import mongoose from 'mongoose';

describe('Guest Property Tests', () => {
  // Feature: hotel-api, Property 12: Round-trip de creación y lectura de huéspedes
  it('should preserve guest data through create and read cycle', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createGuestArb, async (guestData) => {
        idx++;
        const data = { ...guestData, email: `p12-${idx}-${guestData.email}` };
        const created = await guestService.createGuest(data);
        const retrieved = await guestService.findGuestById(created._id.toString());

        expect(retrieved.firstName).toBe(data.firstName);
        expect(retrieved.lastName).toBe(data.lastName);
        expect(retrieved.email).toBe(data.email.toLowerCase());
        expect(retrieved.phone).toBe(data.phone);
      }),
      { numRuns: 50 },
    );
  });

  // Feature: hotel-api, Property 13: Actualización de huésped preserva identidad
  it('should preserve guest id after update', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(nameArb, async (newFirstName) => {
        idx++;
        const guest = await guestService.createGuest({
          firstName: 'Original',
          lastName: 'Test',
          email: `p13-${idx}@example.com`,
          phone: '1234567890',
        });

        const updated = await guestService.updateGuest(guest._id.toString(), {
          firstName: newFirstName,
        });

        expect(updated._id.toString()).toBe(guest._id.toString());
        expect(updated.firstName).toBe(newFirstName);
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 14: Eliminación de huésped lo remueve del sistema
  it('should remove guest from system after delete', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createGuestArb, async (guestData) => {
        idx++;
        const data = { ...guestData, email: `p14-${idx}-${guestData.email}` };
        const created = await guestService.createGuest(data);
        await guestService.deleteGuest(created._id.toString());

        await expect(guestService.findGuestById(created._id.toString())).rejects.toThrow(
          NotFoundError,
        );
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 4: Recursos no existentes retornan 404
  it('should throw NotFoundError for non-existent guest ids', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(guestService.findGuestById(fakeId)).rejects.toThrow(NotFoundError);
        await expect(guestService.updateGuest(fakeId, { firstName: 'X' })).rejects.toThrow(
          NotFoundError,
        );
        await expect(guestService.deleteGuest(fakeId)).rejects.toThrow(NotFoundError);
      }),
      { numRuns: 20 },
    );
  });

  // Feature: hotel-api, Property 15: Validación de formato de email
  it('should reject invalid email formats via Zod validator', async () => {
    const { createGuestSchema } = await import('../../src/validators/guest.validator');

    await fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@') || !s.includes('.')),
        (badEmail) => {
          const result = createGuestSchema.safeParse({
            firstName: 'Test',
            lastName: 'User',
            email: badEmail,
            phone: '1234567890',
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });

  // Feature: hotel-api, Property 10: Búsqueda de texto retorna elementos relevantes
  it('should return guests matching search term', async () => {
    // Seed data
    await guestService.createGuest({
      firstName: 'SearchableAlpha',
      lastName: 'Test',
      email: 'alpha-search@example.com',
      phone: '1111111111',
    });
    await guestService.createGuest({
      firstName: 'Other',
      lastName: 'Person',
      email: 'other-person@example.com',
      phone: '2222222222',
    });

    const result = await guestService.findGuests(
      { search: 'SearchableAlpha' },
      { page: 1, limit: 100 },
    );

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    result.data.forEach((guest) => {
      const matchesSearch =
        guest.firstName.includes('SearchableAlpha') ||
        guest.lastName.includes('SearchableAlpha') ||
        guest.email.includes('searchablealpha');
      expect(matchesSearch).toBe(true);
    });
  });

  // Feature: hotel-api, Property 38: Round-trip de parseo y serialización JSON
  it('should preserve guest data through JSON serialization round-trip', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createGuestArb, async (guestData) => {
        idx++;
        const data = { ...guestData, email: `p38g-${idx}-${guestData.email}` };
        const guest = await guestService.createGuest(data);

        const json = JSON.stringify(guest);
        const parsed = JSON.parse(json);

        expect(parsed.firstName).toBe(data.firstName);
        expect(parsed.lastName).toBe(data.lastName);
        expect(parsed._id).toBeUndefined();
        expect(parsed.__v).toBeUndefined();
        expect(parsed.id).toBeDefined();
      }),
      { numRuns: 30 },
    );
  });
});
