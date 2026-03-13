import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { roomService } from '../../src/services/room.service';
import { buildPaginatedResult, calcSkip } from '../../src/utils/pagination';
import { pageArb, limitArb } from '../helpers/generators';
import { seedRooms } from '../helpers/fixtures';

describe('Pagination Property Tests', () => {
  // Feature: hotel-api, Property 8: Motor de paginación retorna subconjunto correcto
  it('should return correct pagination metadata for any page/limit', async () => {
    // Seed a known number of rooms
    const totalSeeded = 25;
    await seedRooms(totalSeeded);

    await fc.assert(
      fc.asyncProperty(pageArb, limitArb, async (page, limit) => {
        const result = await roomService.findRooms({}, { page, limit });

        const { pagination } = result;

        // total should be the total number of rooms in DB
        expect(pagination.total).toBe(totalSeeded);

        // totalPages = ceil(total / limit)
        const expectedTotalPages = Math.ceil(totalSeeded / limit) || 1;
        expect(pagination.totalPages).toBe(expectedTotalPages);

        // page and limit should match input
        expect(pagination.page).toBe(page);
        expect(pagination.limit).toBe(limit);

        // hasNextPage: page < totalPages
        expect(pagination.hasNextPage).toBe(page < expectedTotalPages);

        // hasPrevPage: page > 1
        expect(pagination.hasPrevPage).toBe(page > 1);

        // data length should be min(limit, max(total - skip, 0))
        const skip = calcSkip(page, limit);
        const expectedDataLength = Math.max(Math.min(limit, totalSeeded - skip), 0);
        expect(result.data.length).toBe(expectedDataLength);
      }),
      { numRuns: 30 },
    );
  });

  // Additional: buildPaginatedResult pure function correctness
  it('should produce consistent metadata from buildPaginatedResult', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // total
        fc.integer({ min: 1, max: 50 }), // page
        fc.integer({ min: 1, max: 100 }), // limit
        (total, page, limit) => {
          const data = Array(Math.min(limit, Math.max(total - (page - 1) * limit, 0))).fill(null);
          const result = buildPaginatedResult(data, total, page, limit);

          expect(result.pagination.total).toBe(total);
          expect(result.pagination.page).toBe(page);
          expect(result.pagination.limit).toBe(limit);

          const expectedTotalPages = Math.ceil(total / limit) || 1;
          expect(result.pagination.totalPages).toBe(expectedTotalPages);
          expect(result.pagination.hasNextPage).toBe(page < expectedTotalPages);
          expect(result.pagination.hasPrevPage).toBe(page > 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  // calcSkip correctness
  it('should calculate correct skip value for any page/limit combination', () => {
    fc.assert(
      fc.property(pageArb, limitArb, (page, limit) => {
        const skip = calcSkip(page, limit);
        expect(skip).toBe((page - 1) * limit);
        expect(skip).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});
