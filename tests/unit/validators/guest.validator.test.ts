import { describe, it, expect } from 'vitest';
import { createGuestSchema, updateGuestSchema } from '../../../src/validators/guest.validator';

describe('Guest Validators', () => {
  describe('createGuestSchema', () => {
    it('should accept valid guest data', () => {
      const result = createGuestSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing firstName', () => {
      const result = createGuestSchema.safeParse({
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = createGuestSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = createGuestSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should lowercase email', () => {
      const result = createGuestSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN@EXAMPLE.COM',
        phone: '1234567890',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should accept optional fields', () => {
      const result = createGuestSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        documentType: 'DNI',
        documentNumber: '12345678',
        nationality: 'AR',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty firstName', () => {
      const result = createGuestSchema.safeParse({
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateGuestSchema', () => {
    it('should accept partial update', () => {
      const result = updateGuestSchema.safeParse({ firstName: 'Updated' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateGuestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in update', () => {
      const result = updateGuestSchema.safeParse({ email: 'bad-email' });
      expect(result.success).toBe(false);
    });
  });
});
