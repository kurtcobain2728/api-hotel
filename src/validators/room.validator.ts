import { z } from 'zod';
import { RoomType, RoomStatus } from '../models/room.model';
import { paginationSchema, sortOrderSchema } from './common.validator';

export const createRoomSchema = z.object({
  roomNumber: z
    .string({ required_error: 'Room number is required' })
    .min(1, 'Room number cannot be empty')
    .trim(),
  type: z.nativeEnum(RoomType, {
    errorMap: () => ({
      message: `Type must be one of: ${Object.values(RoomType).join(', ')}`,
    }),
  }),
  price: z.number({ required_error: 'Price is required' }).positive('Price must be greater than 0'),
  description: z.string().trim().optional(),
  capacity: z
    .number({ required_error: 'Capacity is required' })
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1'),
  amenities: z.array(z.string()).optional().default([]),
});

export const updateRoomSchema = z.object({
  type: z
    .nativeEnum(RoomType, {
      errorMap: () => ({
        message: `Type must be one of: ${Object.values(RoomType).join(', ')}`,
      }),
    })
    .optional(),
  price: z.number().positive('Price must be greater than 0').optional(),
  status: z
    .nativeEnum(RoomStatus, {
      errorMap: () => ({
        message: `Status must be one of: ${Object.values(RoomStatus).join(', ')}`,
      }),
    })
    .optional(),
  description: z.string().trim().optional(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateRoomStatusSchema = z.object({
  status: z.nativeEnum(RoomStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(RoomStatus).join(', ')}`,
    }),
  }),
});

export const roomFiltersSchema = paginationSchema.extend({
  type: z.nativeEnum(RoomType).optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().positive().optional()),
  available: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'roomNumber', 'createdAt']).optional().default('createdAt'),
  sortOrder: sortOrderSchema,
});

export type CreateRoomDTO = z.infer<typeof createRoomSchema>;
export type UpdateRoomDTO = z.infer<typeof updateRoomSchema>;
export type RoomFilters = z.infer<typeof roomFiltersSchema>;
