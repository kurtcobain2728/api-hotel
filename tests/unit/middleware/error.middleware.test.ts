import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { errorHandler } from '../../../src/middleware/error.middleware';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from '../../../src/utils/apiError';

// Mock logger to avoid actual logging during tests
vi.mock('../../../src/utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../src/config/env', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'mongodb://localhost:27017/test',
    corsOrigin: '*',
    logLevel: 'info',
  },
}));

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    originalUrl: '/api/v1/test',
    method: 'GET',
    id: 'test-request-id',
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { _status: number; _json: unknown } {
  const res = {
    _status: 0,
    _json: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
  } as unknown as Response & { _status: number; _json: unknown };
  return res;
}

describe('Error Middleware', () => {
  const next: NextFunction = vi.fn();
  let req: Request;
  let res: ReturnType<typeof createMockRes>;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    vi.clearAllMocks();
  });

  it('should handle ZodError (validation)', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['price'],
        message: 'Expected number, received string',
      },
    ];
    const err = new ZodError(issues);

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(400);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Validation failed');
    expect(Array.isArray(error.details)).toBe(true);
  });

  it('should handle CastError (invalid ObjectId)', () => {
    const err = new Error('Cast to ObjectId failed');
    err.name = 'CastError';

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(400);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('INVALID_ID');
  });

  it('should handle MongoDB duplicate key error (code 11000)', () => {
    const err = new Error('E11000 duplicate key error') as Error & {
      code: number;
    };
    (err as unknown as Record<string, unknown>).code = 11000;

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(409);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('CONFLICT');
  });

  it('should handle NotFoundError (AppError subclass)', () => {
    const err = new NotFoundError('Room', '123');

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(404);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
  });

  it('should handle ValidationError with details (AppError subclass)', () => {
    const err = new ValidationError('Validation failed', [
      { field: 'price', message: 'must be positive' },
    ]);

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(400);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.details).toBeDefined();
  });

  it('should handle ConflictError (AppError subclass)', () => {
    const err = new ConflictError('Room already booked');

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(409);
  });

  it('should handle DatabaseError (AppError subclass, 500-level)', () => {
    const err = new DatabaseError('Connection lost');

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(500);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
  });

  it('should handle SyntaxError from JSON parsing', () => {
    const err = new SyntaxError('Unexpected token');
    Object.defineProperty(err, 'body', { value: true });

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(400);
    const body = res._json as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('INVALID_JSON');
  });

  it('should handle generic unknown errors with 500', () => {
    const err = new Error('Something unexpected happened');

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(500);
    const body = res._json as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});
