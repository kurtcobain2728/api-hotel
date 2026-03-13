import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/apiError';
import { config } from '../config/env';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log the error
  const logMeta = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    requestId: req.id,
  };

  // Handle ZodError (validation)
  if (err instanceof ZodError) {
    logger.warn('Validation error', logMeta);
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          received: (e as unknown as Record<string, unknown>).received,
        })),
      },
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    logger.warn('Invalid ID format', logMeta);
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        code: 'INVALID_ID',
      },
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as unknown as Record<string, unknown>).code === 11000) {
    logger.warn('Duplicate key error', logMeta);
    res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate value for unique field',
        code: 'CONFLICT',
      },
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? 'error' : 'warn';
    logger[level](err.message, logMeta);

    const response: Record<string, unknown> = {
      success: false,
      error: {
        message: err.message,
        code: err.constructor.name
          .replace(/Error$/, '_ERROR')
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toUpperCase(),
        ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
        ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle SyntaxError from JSON parsing
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON', logMeta);
    res.status(400).json({
      success: false,
      error: {
        message: 'Malformed JSON in request body',
        code: 'INVALID_JSON',
      },
    });
    return;
  }

  // Generic error (500)
  logger.error('Unhandled error', logMeta);
  res.status(500).json({
    success: false,
    error: {
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    },
  });
};
