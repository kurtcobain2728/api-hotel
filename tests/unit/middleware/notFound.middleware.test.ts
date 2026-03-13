import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { notFoundHandler } from '../../../src/middleware/notFound.middleware';

vi.mock('../../../src/config/env', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'mongodb://localhost:27017/test',
    corsOrigin: '*',
    logLevel: 'info',
  },
}));

describe('Not Found Middleware', () => {
  it('should respond with 404 and proper error format', () => {
    const req = {
      originalUrl: '/api/v1/unknown',
      method: 'GET',
    } as Request;

    let statusCode = 0;
    let responseBody: unknown = null;

    const res = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(body: unknown) {
        responseBody = body;
        return res;
      },
    } as unknown as Response;

    const next: NextFunction = vi.fn();

    notFoundHandler(req, res, next);

    expect(statusCode).toBe(404);
    const body = responseBody as Record<string, unknown>;
    expect(body.success).toBe(false);
    const error = body.error as Record<string, unknown>;
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Route not found');
  });
});
