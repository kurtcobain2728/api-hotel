import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from '../../../src/utils/apiError';

describe('ApiError Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const err = new AppError('Test error', 500);
      expect(err.message).toBe('Test error');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('should create with message only (no details)', () => {
      const err = new ValidationError('Validation failed');
      expect(err.statusCode).toBe(400);
      expect(err.details).toBeUndefined();
    });

    it('should create with message and details', () => {
      const details = [{ field: 'price', message: 'must be positive' }];
      const err = new ValidationError('Validation failed', details);
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource and id', () => {
      const err = new NotFoundError('Room', '123');
      expect(err.message).toBe('Room with id 123 not found');
      expect(err.statusCode).toBe(404);
    });

    it('should create with resource only (no id)', () => {
      const err = new NotFoundError('Room');
      expect(err.message).toBe('Room not found');
      expect(err.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create with 409 status', () => {
      const err = new ConflictError('Already exists');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Already exists');
    });
  });

  describe('DatabaseError', () => {
    it('should create with 500 status', () => {
      const err = new DatabaseError('Connection lost');
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Connection lost');
    });
  });
});
