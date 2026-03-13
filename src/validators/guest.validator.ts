import { z } from 'zod';
import { paginationSchema, sortOrderSchema } from './common.validator';

export const createGuestSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .trim(),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name cannot be empty')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  phone: z.string({ required_error: 'Phone is required' }).min(1, 'Phone cannot be empty').trim(),
  address: z.string().trim().optional(),
  documentType: z.string().trim().optional(),
  documentNumber: z.string().trim().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .pipe(z.date().optional()),
  nationality: z.string().trim().optional(),
});

export const updateGuestSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').trim().optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').trim().optional(),
  email: z.string().email('Please provide a valid email address').toLowerCase().trim().optional(),
  phone: z.string().min(1, 'Phone cannot be empty').trim().optional(),
  address: z.string().trim().optional(),
  documentType: z.string().trim().optional(),
  documentNumber: z.string().trim().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .pipe(z.date().optional()),
  nationality: z.string().trim().optional(),
});

export const guestFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['lastName', 'email', 'createdAt']).optional().default('createdAt'),
  sortOrder: sortOrderSchema,
});

export type CreateGuestDTO = z.infer<typeof createGuestSchema>;
export type UpdateGuestDTO = z.infer<typeof updateGuestSchema>;
export type GuestFilters = z.infer<typeof guestFiltersSchema>;
