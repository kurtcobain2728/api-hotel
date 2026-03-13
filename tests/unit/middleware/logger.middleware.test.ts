import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../../../src/middleware/logger.middleware';

vi.mock('../../../src/utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/config/env', () => ({
  config: {
    nodeEnv: 'test',
    port: 3000,
    databaseUrl: 'mongodb://localhost:27017/test',
    corsOrigin: '*',
    logLevel: 'info',
  },
}));

function createMockReqRes(statusCode: number) {
  const req = {
    method: 'GET',
    originalUrl: '/api/v1/rooms',
    ip: '127.0.0.1',
    id: undefined as string | undefined,
  } as unknown as Request;

  const resEmitter = new EventEmitter();
  const res = Object.assign(resEmitter, {
    statusCode,
    setHeader: vi.fn(),
  }) as unknown as Response;

  return { req, res };
}

describe('Logger Middleware', () => {
  it('should set X-Request-ID header and call next', () => {
    const { req, res } = createMockReqRes(200);
    const next: NextFunction = vi.fn();

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.id).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
  });

  it('should log info level for 2xx responses', async () => {
    const logger = (await import('../../../src/utils/logger')).default;
    const { req, res } = createMockReqRes(200);
    const next: NextFunction = vi.fn();

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(logger.info).toHaveBeenCalled();
  });

  it('should log warn level for 4xx responses', async () => {
    const logger = (await import('../../../src/utils/logger')).default;
    const { req, res } = createMockReqRes(404);
    const next: NextFunction = vi.fn();

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log error level for 5xx responses', async () => {
    const logger = (await import('../../../src/utils/logger')).default;
    const { req, res } = createMockReqRes(500);
    const next: NextFunction = vi.fn();

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    expect(logger.error).toHaveBeenCalled();
  });
});
