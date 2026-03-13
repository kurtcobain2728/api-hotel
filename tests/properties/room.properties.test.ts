import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { roomService } from '../../src/services/room.service';
import { RoomModel, RoomStatus } from '../../src/models/room.model';
import { NotFoundError } from '../../src/utils/apiError';
import { createRoomArb, roomTypeArb, priceArb } from '../helpers/generators';
import mongoose from 'mongoose';

describe('Room Property Tests', () => {
  // Feature: hotel-api, Property 1: Round-trip de creación y lectura de habitaciones
  it('should preserve room data through create and read cycle', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createRoomArb, async (roomData) => {
        idx++;
        // Ensure unique roomNumber per iteration
        const data = { ...roomData, roomNumber: `P1-${idx}-${roomData.roomNumber}` };
        const created = await roomService.createRoom(data);
        const retrieved = await roomService.findRoomById(created._id.toString());

        expect(retrieved.roomNumber).toBe(data.roomNumber);
        expect(retrieved.type).toBe(data.type);
        expect(retrieved.price).toBe(data.price);
        expect(retrieved.capacity).toBe(data.capacity);
      }),
      { numRuns: 50 },
    );
  });

  // Feature: hotel-api, Property 2: Actualización de habitación preserva identidad
  it('should preserve room id after update', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(priceArb, async (newPrice) => {
        idx++;
        const room = await roomService.createRoom({
          roomNumber: `P2-${idx}`,
          type: 'single',
          price: 100,
          capacity: 1,
          amenities: [],
        });

        const updated = await roomService.updateRoom(room._id.toString(), {
          price: newPrice,
        });

        expect(updated._id.toString()).toBe(room._id.toString());
        expect(updated.price).toBe(newPrice);
        expect(updated.roomNumber).toBe(`P2-${idx}`);
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 3: Eliminación de habitación la remueve del sistema
  it('should remove room from system after delete', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createRoomArb, async (roomData) => {
        idx++;
        const data = { ...roomData, roomNumber: `P3-${idx}` };
        const created = await roomService.createRoom(data);
        await roomService.deleteRoom(created._id.toString());

        await expect(roomService.findRoomById(created._id.toString())).rejects.toThrow(
          NotFoundError,
        );
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 4: Recursos no existentes retornan 404
  it('should throw NotFoundError for non-existent room ids', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        await expect(roomService.findRoomById(fakeId)).rejects.toThrow(NotFoundError);
        await expect(roomService.updateRoom(fakeId, { price: 1 })).rejects.toThrow(NotFoundError);
        await expect(roomService.deleteRoom(fakeId)).rejects.toThrow(NotFoundError);
      }),
      { numRuns: 20 },
    );
  });

  // Feature: hotel-api, Property 6: Validación de precio positivo
  it('should reject rooms with non-positive price at model level', async () => {
    await fc.assert(
      fc.asyncProperty(fc.double({ min: -10000, max: 0, noNaN: true }), async (badPrice) => {
        const room = new RoomModel({
          roomNumber: `P6-${Date.now()}-${Math.random()}`,
          type: 'single',
          price: badPrice,
          capacity: 1,
        });

        await expect(room.validate()).rejects.toThrow();
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 9: Filtros retornan solo elementos que cumplen criterio
  it('should return only rooms matching type filter', async () => {
    // Seed some rooms
    for (let i = 0; i < 10; i++) {
      const types = ['single', 'double', 'suite', 'deluxe'] as const;
      await roomService.createRoom({
        roomNumber: `P9-${i}`,
        type: types[i % 4],
        price: 100,
        capacity: 1,
        amenities: [],
      });
    }

    await fc.assert(
      fc.asyncProperty(roomTypeArb, async (filterType) => {
        const result = await roomService.findRooms(
          { type: filterType as any },
          { page: 1, limit: 100 },
        );

        result.data.forEach((room) => {
          expect(room.type).toBe(filterType);
        });
      }),
      { numRuns: 20 },
    );
  });

  // Feature: hotel-api, Property 25: Validación de estados de enum
  it('should reject invalid room status values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string()
          .filter(
            (s) =>
              !['disponible', 'ocupada', 'mantenimiento', 'limpieza'].includes(s) && s.length > 0,
          ),
        async (badStatus) => {
          const room = new RoomModel({
            roomNumber: `P25-${Date.now()}`,
            type: 'single',
            price: 100,
            capacity: 1,
            status: badStatus,
          });

          await expect(room.validate()).rejects.toThrow();
        },
      ),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 38: Round-trip de parseo y serialización JSON
  it('should preserve data through JSON serialization round-trip', async () => {
    let idx = 0;
    await fc.assert(
      fc.asyncProperty(createRoomArb, async (roomData) => {
        idx++;
        const data = { ...roomData, roomNumber: `P38-${idx}` };
        const room = await roomService.createRoom(data);

        const json = JSON.stringify(room);
        const parsed = JSON.parse(json);

        expect(parsed.roomNumber).toBe(data.roomNumber);
        expect(parsed.type).toBe(data.type);
        expect(parsed.price).toBe(data.price);
        expect(parsed._id).toBeUndefined();
        expect(parsed.__v).toBeUndefined();
        expect(parsed.id).toBeDefined();
      }),
      { numRuns: 30 },
    );
  });

  // Feature: hotel-api, Property 40: Respuestas omiten campos internos de Mongoose
  it('should omit __v and _id from JSON output', async () => {
    const room = await roomService.createRoom({
      roomNumber: 'P40-test',
      type: 'single',
      price: 100,
      capacity: 1,
      amenities: [],
    });

    const json = room.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });
});
