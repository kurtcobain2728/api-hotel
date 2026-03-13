import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../../src/middleware/validate.middleware';

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response {
  return {
    locals: {},
  } as unknown as Response;
}

describe('Validate Middleware', () => {
  it('should validate body and set parsed data', () => {
    const schema = z.object({ name: z.string() });
    const middleware = validateRequest({ body: schema });
    const req = createMockReq({ body: { name: 'Test' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Test' });
  });

  it('should validate query and set in res.locals.validatedQuery', () => {
    const schema = z.object({ page: z.coerce.number().default(1) });
    const middleware = validateRequest({ query: schema });
    const req = createMockReq({ query: { page: '2' } as unknown as Request['query'] });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.validatedQuery).toEqual({ page: 2 });
  });

  it('should validate params', () => {
    const schema = z.object({ id: z.string().min(1) });
    const middleware = validateRequest({ params: schema });
    const req = createMockReq({
      params: { id: 'abc123' } as unknown as Request['params'],
    });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with error when validation fails', () => {
    const schema = z.object({ name: z.string() });
    const middleware = validateRequest({ body: schema });
    const req = createMockReq({ body: { name: 123 } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('should handle when no schemas are provided', () => {
    const middleware = validateRequest({});
    const req = createMockReq();
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should validate body, query, and params together', () => {
    const bodySchema = z.object({ name: z.string() });
    const querySchema = z.object({ page: z.coerce.number().default(1) });
    const paramsSchema = z.object({ id: z.string() });

    const middleware = validateRequest({
      body: bodySchema,
      query: querySchema,
      params: paramsSchema,
    });

    const req = createMockReq({
      body: { name: 'Test' },
      query: {} as unknown as Request['query'],
      params: { id: 'abc' } as unknown as Request['params'],
    });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Test' });
    expect(res.locals.validatedQuery).toEqual({ page: 1 });
  });
});
