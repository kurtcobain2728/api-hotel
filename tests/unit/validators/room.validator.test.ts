import { describe, it, expect } from 'vitest';
import {
  createRoomSchema,
  updateRoomSchema,
  updateRoomStatusSchema,
} from '../../../src/validators/room.validator';

describe('Room Validators', () => {
  describe('createRoomSchema', () => {
    it('should accept valid room data', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: 100,
        capacity: 1,
        amenities: ['WiFi'],
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing roomNumber', () => {
      const result = createRoomSchema.safeParse({
        type: 'single',
        price: 100,
        capacity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty roomNumber', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '',
        type: 'single',
        price: 100,
        capacity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid room type', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'penthouse',
        price: 100,
        capacity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: -100,
        capacity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject zero price', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: 0,
        capacity: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer capacity', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: 100,
        capacity: 1.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject zero capacity', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: 100,
        capacity: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should default amenities to empty array', () => {
      const result = createRoomSchema.safeParse({
        roomNumber: '101',
        type: 'single',
        price: 100,
        capacity: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amenities).toEqual([]);
      }
    });
  });

  describe('updateRoomSchema', () => {
    it('should accept partial update', () => {
      const result = updateRoomSchema.safeParse({ price: 200 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateRoomSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateRoomSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateRoomStatusSchema', () => {
    it('should accept valid status', () => {
      const result = updateRoomStatusSchema.safeParse({ status: 'disponible' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateRoomStatusSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
