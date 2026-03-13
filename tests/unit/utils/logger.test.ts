import { describe, it, expect, vi } from 'vitest';
import winston from 'winston';

// We need to test the logger format functions directly.
// Since the logger module creates the logger at import time with test config,
// we test the format logic by creating similar formatters.

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

describe('Logger Formats', () => {
  describe('devFormat printf', () => {
    const devPrintf = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      if (stack) {
        return `${ts} [${level}]: ${message}\n${stack}${metaStr}`;
      }
      return `${ts} [${level}]: ${message}${metaStr}`;
    });

    it('should format message without stack and without meta', () => {
      const info = {
        level: 'info',
        message: 'Test message',
        timestamp: '2025-01-01 12:00:00.000',
        [Symbol.for('level')]: 'info',
        [Symbol.for('message')]: '',
      };
      const result = devPrintf.transform(info);
      expect(result[Symbol.for('message')]).toContain('Test message');
      expect(result[Symbol.for('message')]).not.toContain('\n');
    });

    it('should format message with stack trace', () => {
      const info = {
        level: 'error',
        message: 'Error occurred',
        timestamp: '2025-01-01 12:00:00.000',
        stack: 'Error: test\n    at Object.<anonymous>',
        [Symbol.for('level')]: 'error',
        [Symbol.for('message')]: '',
      };
      const result = devPrintf.transform(info);
      expect(result[Symbol.for('message')]).toContain('Error occurred');
      expect(result[Symbol.for('message')]).toContain('Error: test');
    });

    it('should format message with meta data', () => {
      const info = {
        level: 'info',
        message: 'Request received',
        timestamp: '2025-01-01 12:00:00.000',
        requestId: '123',
        [Symbol.for('level')]: 'info',
        [Symbol.for('message')]: '',
      };
      const result = devPrintf.transform(info);
      expect(result[Symbol.for('message')]).toContain('requestId');
    });

    it('should format message with stack and meta', () => {
      const info = {
        level: 'error',
        message: 'Error with context',
        timestamp: '2025-01-01 12:00:00.000',
        stack: 'Error: boom\n    at test',
        service: 'hotel-api',
        [Symbol.for('level')]: 'error',
        [Symbol.for('message')]: '',
      };
      const result = devPrintf.transform(info);
      expect(result[Symbol.for('message')]).toContain('Error with context');
      expect(result[Symbol.for('message')]).toContain('boom');
      expect(result[Symbol.for('message')]).toContain('hotel-api');
    });
  });

  describe('Logger creation', () => {
    it('should create logger in silent mode for test environment', async () => {
      const logger = (await import('../../../src/utils/logger')).default;
      expect(logger).toBeDefined();
      expect(logger.silent).toBe(true);
    });
  });
});
