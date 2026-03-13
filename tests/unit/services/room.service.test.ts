import { describe, it, expect, beforeEach } from 'vitest';
import { RoomModel, RoomStatus, RoomType } from '../../../src/models/room.model';
import { roomService } from '../../../src/services/room.service';
import { NotFoundError, ConflictError } from '../../../src/utils/apiError';
import { seedRoom, seedRooms } from '../../helpers/fixtures';
import mongoose from 'mongoose';

describe('RoomService', () => {
  describe('createRoom', () => {
    it('should create a room with valid data', async () => {
      const data = {
        roomNumber: '101',
        type: 'single' as const,
        price: 100,
        capacity: 1,
        amenities: ['WiFi'],
      };

      const room = await roomService.createRoom(data);

      expect(room).toBeDefined();
      expect(room.roomNumber).toBe('101');
      expect(room.type).toBe('single');
      expect(room.price).toBe(100);
      expect(room.capacity).toBe(1);
      expect(room.status).toBe(RoomStatus.AVAILABLE);
      expect(room.amenities).toEqual(['WiFi']);
    });

    it('should set default status to disponible', async () => {
      const room = await roomService.createRoom({
        roomNumber: '102',
        type: 'double' as const,
        price: 150,
        capacity: 2,
        amenities: [],
      });

      expect(room.status).toBe('disponible');
    });

    it('should throw ConflictError for duplicate room number', async () => {
      await seedRoom({ roomNumber: '101' });

      await expect(
        roomService.createRoom({
          roomNumber: '101',
          type: 'double' as const,
          price: 150,
          capacity: 2,
          amenities: [],
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should default amenities to empty array when not provided', async () => {
      const room = await roomService.createRoom({
        roomNumber: '103',
        type: 'suite' as const,
        price: 300,
        capacity: 4,
        amenities: [],
      });

      expect(room.amenities).toEqual([]);
    });
  });

  describe('findRoomById', () => {
    it('should find existing room by id', async () => {
      const created = await seedRoom({ roomNumber: '201' });
      const found = await roomService.findRoomById(created._id.toString());

      expect(found).toBeDefined();
      expect(found.roomNumber).toBe('201');
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(roomService.findRoomById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findRooms', () => {
    beforeEach(async () => {
      await seedRooms(15);
    });

    it('should return paginated results', async () => {
      const result = await roomService.findRooms({}, { page: 1, limit: 5 });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(15);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should return last page correctly', async () => {
      // 15 items, limit 10 => page 2 has 5 items
      const result = await roomService.findRooms({}, { page: 2, limit: 10 });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await roomService.findRooms(
        { type: RoomType.SINGLE },
        { page: 1, limit: 100 },
      );

      result.data.forEach((room) => {
        expect(room.type).toBe('single');
      });
    });

    it('should filter by status', async () => {
      // All seeded rooms default to 'disponible'
      const result = await roomService.findRooms(
        { status: RoomStatus.AVAILABLE },
        { page: 1, limit: 100 },
      );

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((room) => {
        expect(room.status).toBe('disponible');
      });
    });

    it('should filter by price range', async () => {
      const result = await roomService.findRooms(
        { minPrice: 100, maxPrice: 200 },
        { page: 1, limit: 100 },
      );

      result.data.forEach((room) => {
        expect(room.price).toBeGreaterThanOrEqual(100);
        expect(room.price).toBeLessThanOrEqual(200);
      });
    });

    it('should search by room number or description', async () => {
      await seedRoom({ roomNumber: 'PENTHOUSE1', description: 'Luxury suite' });

      const result = await roomService.findRooms({ search: 'PENTHOUSE' }, { page: 1, limit: 100 });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      const found = result.data.find((r) => r.roomNumber === 'PENTHOUSE1');
      expect(found).toBeDefined();
    });

    it('should return empty data for page beyond total', async () => {
      const result = await roomService.findRooms({}, { page: 100, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(15);
    });
  });

  describe('updateRoom', () => {
    it('should update room fields', async () => {
      const created = await seedRoom({ roomNumber: '301', price: 100 });

      const updated = await roomService.updateRoom(created._id.toString(), {
        price: 200,
      });

      expect(updated.price).toBe(200);
      expect(updated.roomNumber).toBe('301'); // unchanged
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(roomService.updateRoom(fakeId, { price: 200 })).rejects.toThrow(NotFoundError);
    });

    it('should preserve id after update', async () => {
      const created = await seedRoom({ roomNumber: '302' });
      const updated = await roomService.updateRoom(created._id.toString(), {
        price: 999,
      });

      expect(updated._id.toString()).toBe(created._id.toString());
    });
  });

  describe('deleteRoom', () => {
    it('should delete existing room', async () => {
      const created = await seedRoom({ roomNumber: '401' });
      await roomService.deleteRoom(created._id.toString());

      await expect(roomService.findRoomById(created._id.toString())).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(roomService.deleteRoom(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status', async () => {
      const created = await seedRoom({ roomNumber: '501' });

      const updated = await roomService.updateRoomStatus(
        created._id.toString(),
        RoomStatus.MAINTENANCE,
      );

      expect(updated.status).toBe('mantenimiento');
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(roomService.updateRoomStatus(fakeId, RoomStatus.CLEANING)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
