import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, printf, json, colorize, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `${ts} [${level}]: ${message}\n${stack}${metaStr}`;
    }
    return `${ts} [${level}]: ${message}${metaStr}`;
  }),
);

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json(),
);

const logger = winston.createLogger({
  level: config.logLevel,
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'hotel-api' },
  transports: [new winston.transports.Console()],
  silent: config.nodeEnv === 'test',
});

export default logger;
