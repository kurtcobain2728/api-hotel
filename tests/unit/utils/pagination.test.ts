import { describe, it, expect } from 'vitest';
import { calcSkip, buildPaginatedResult } from '../../../src/utils/pagination';

describe('Pagination Utils', () => {
  describe('calcSkip', () => {
    it('should return 0 for page 1', () => {
      expect(calcSkip(1, 10)).toBe(0);
    });

    it('should calculate skip correctly', () => {
      expect(calcSkip(2, 10)).toBe(10);
      expect(calcSkip(3, 10)).toBe(20);
      expect(calcSkip(1, 25)).toBe(0);
      expect(calcSkip(5, 20)).toBe(80);
    });
  });

  describe('buildPaginatedResult', () => {
    it('should build correct metadata for single page', () => {
      const result = buildPaginatedResult(['a', 'b', 'c'], 3, 1, 10);

      expect(result.data).toEqual(['a', 'b', 'c']);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should build correct metadata for multiple pages', () => {
      const result = buildPaginatedResult([1, 2, 3], 25, 2, 3);

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(9);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle empty results', () => {
      const result = buildPaginatedResult([], 0, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should set hasPrevPage false for page 1', () => {
      const result = buildPaginatedResult([1], 50, 1, 10);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should set hasNextPage false for last page', () => {
      const result = buildPaginatedResult([1], 10, 1, 10);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });
});
