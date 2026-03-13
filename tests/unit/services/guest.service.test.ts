import { describe, it, expect, beforeEach } from 'vitest';
import { guestService } from '../../../src/services/guest.service';
import { NotFoundError, ConflictError } from '../../../src/utils/apiError';
import { seedGuest, seedGuests } from '../../helpers/fixtures';
import mongoose from 'mongoose';

describe('GuestService', () => {
  describe('createGuest', () => {
    it('should create a guest with valid data', async () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '5551234567',
      };

      const guest = await guestService.createGuest(data);

      expect(guest).toBeDefined();
      expect(guest.firstName).toBe('Jane');
      expect(guest.lastName).toBe('Smith');
      expect(guest.email).toBe('jane.smith@example.com');
    });

    it('should throw ConflictError for duplicate email', async () => {
      await seedGuest({ email: 'dup@example.com' });

      await expect(
        guestService.createGuest({
          firstName: 'Another',
          lastName: 'Person',
          email: 'dup@example.com',
          phone: '5559999999',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const guest = await guestService.createGuest({
        firstName: 'Test',
        lastName: 'User',
        email: 'test.ts@example.com',
        phone: '5550000000',
      });

      expect(guest.createdAt).toBeInstanceOf(Date);
      expect(guest.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findGuestById', () => {
    it('should find existing guest', async () => {
      const created = await seedGuest({
        firstName: 'Find',
        lastName: 'Me',
        email: 'find.me@example.com',
      });
      const found = await guestService.findGuestById(created._id.toString());

      expect(found.firstName).toBe('Find');
      expect(found.lastName).toBe('Me');
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(guestService.findGuestById(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findGuests', () => {
    beforeEach(async () => {
      await seedGuests(12);
    });

    it('should return paginated results', async () => {
      const result = await guestService.findGuests({}, { page: 1, limit: 5 });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(12);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should search by firstName, lastName or email', async () => {
      await seedGuest({
        firstName: 'UniqueFirst',
        lastName: 'UniqueTest',
        email: 'unique.search@example.com',
      });

      const result = await guestService.findGuests(
        { search: 'UniqueFirst' },
        { page: 1, limit: 100 },
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      const found = result.data.find((g) => g.firstName === 'UniqueFirst');
      expect(found).toBeDefined();
    });

    it('should search by email', async () => {
      await seedGuest({
        firstName: 'EmailSearch',
        lastName: 'Test',
        email: 'email-search-unique@example.com',
      });

      const result = await guestService.findGuests(
        { search: 'email-search-unique' },
        { page: 1, limit: 100 },
      );

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateGuest', () => {
    it('should update guest fields', async () => {
      const created = await seedGuest({ email: 'update.test@example.com' });

      const updated = await guestService.updateGuest(created._id.toString(), {
        firstName: 'Updated',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.email).toBe('update.test@example.com'); // unchanged
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(guestService.updateGuest(fakeId, { firstName: 'X' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ConflictError when updating to duplicate email', async () => {
      await seedGuest({ email: 'existing@example.com', firstName: 'Existing', lastName: 'One' });
      const second = await seedGuest({
        email: 'second@example.com',
        firstName: 'Second',
        lastName: 'One',
      });

      await expect(
        guestService.updateGuest(second._id.toString(), {
          email: 'existing@example.com',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should preserve id after update', async () => {
      const created = await seedGuest({ email: 'preserve.id@example.com' });
      const updated = await guestService.updateGuest(created._id.toString(), {
        phone: '9999999999',
      });

      expect(updated._id.toString()).toBe(created._id.toString());
    });
  });

  describe('deleteGuest', () => {
    it('should delete existing guest', async () => {
      const created = await seedGuest({ email: 'delete.me@example.com' });
      await guestService.deleteGuest(created._id.toString());

      await expect(guestService.findGuestById(created._id.toString())).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(guestService.deleteGuest(fakeId)).rejects.toThrow(NotFoundError);
    });
  });
});
