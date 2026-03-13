import { z } from 'zod';

const rawEnvSchema = z.object({
  PORT: z
    .string()
    .default('8888')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535)),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty')
    .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
      message: 'DATABASE_URL must be a valid MongoDB URI (mongodb:// or mongodb+srv://)',
    }),

  CORS_ORIGIN: z.string().default('*'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const envSchema = rawEnvSchema.transform((env) => ({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
}));

export type EnvConfig = z.infer<typeof envSchema>;
