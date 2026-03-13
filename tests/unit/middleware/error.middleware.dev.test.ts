import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../../src/utils/apiError';

// Mock config with nodeEnv = 'development' to cover development branches
vi.mock('../../../src/config/env', () => ({
  config: {
    nodeEnv: 'development',
    port: 3000,
    databaseUrl: 'mongodb://localhost:27017/test',
    corsOrigin: '*',
    logLevel: 'info',
  },
}));

vi.mock('../../../src/utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createMockReq(): Request {
  return {
    originalUrl: '/api/v1/test',
    method: 'GET',
    id: 'test-req-id',
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

describe('Error Middleware - Development Mode', () => {
  let errorHandler: typeof import('../../../src/middleware/error.middleware').errorHandler;
  const next: NextFunction = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../../src/middleware/error.middleware');
    errorHandler = mod.errorHandler;
  });

  it('should include stack trace in AppError response in development', () => {
    const req = createMockReq();
    const res = createMockRes();
    const err = new AppError('Dev error', 500);

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(500);
    const body = res._json as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(error.stack).toBeDefined();
  });

  it('should include stack trace in generic error response in development', () => {
    const req = createMockReq();
    const res = createMockRes();
    const err = new Error('Unexpected dev error');

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(500);
    const body = res._json as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(error.stack).toBeDefined();
    expect(error.message).toBe('Unexpected dev error');
  });

  it('should include details in ValidationError with details in development', () => {
    const req = createMockReq();
    const res = createMockRes();
    const err = new ValidationError('Validation failed', [
      { field: 'price', message: 'must be positive' },
    ]);

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(400);
    const body = res._json as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(error.details).toBeDefined();
    expect(error.stack).toBeDefined();
  });

  it('should handle AppError without details (non-ValidationError)', () => {
    const req = createMockReq();
    const res = createMockRes();
    const err = new AppError('Something went wrong', 422);

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(422);
    const body = res._json as Record<string, unknown>;
    const error = body.error as Record<string, unknown>;
    expect(error.details).toBeUndefined();
    expect(error.stack).toBeDefined();
  });
});
