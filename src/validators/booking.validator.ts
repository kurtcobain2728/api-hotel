import { z } from 'zod';
import { BookingStatus } from '../models/booking.model';
import { paginationSchema, objectIdSchema, sortOrderSchema } from './common.validator';

export const createBookingSchema = z
  .object({
    guestId: objectIdSchema,
    roomId: objectIdSchema,
    checkInDate: z
      .string({ required_error: 'Check-in date is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid check-in date' })),
    checkOutDate: z
      .string({ required_error: 'Check-out date is required' })
      .transform((val) => new Date(val))
      .pipe(z.date({ invalid_type_error: 'Invalid check-out date' })),
    numberOfGuests: z
      .number({ required_error: 'Number of guests is required' })
      .int('Number of guests must be an integer')
      .min(1, 'Number of guests must be at least 1'),
    specialRequests: z.string().trim().optional(),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  });

export const updateBookingSchema = z.object({
  status: z
    .nativeEnum(BookingStatus, {
      errorMap: () => ({
        message: `Status must be one of: ${Object.values(BookingStatus).join(', ')}`,
      }),
    })
    .optional(),
  checkInDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .pipe(z.date().optional()),
  checkOutDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .pipe(z.date().optional()),
  numberOfGuests: z
    .number()
    .int('Number of guests must be an integer')
    .min(1, 'Number of guests must be at least 1')
    .optional(),
  specialRequests: z.string().trim().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus, {
    errorMap: () => ({
      message: `Status must be one of: ${Object.values(BookingStatus).join(', ')}`,
    }),
  }),
});

export const bookingFiltersSchema = paginationSchema.extend({
  guestId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  sortBy: z
    .enum(['checkInDate', 'checkOutDate', 'totalPrice', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: sortOrderSchema,
});

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
export type UpdateBookingDTO = z.infer<typeof updateBookingSchema>;
export type BookingFilters = z.infer<typeof bookingFiltersSchema>;
