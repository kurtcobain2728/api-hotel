import dotenv from 'dotenv';
import { envSchema, EnvConfig } from '../validators/env.validator';

dotenv.config();

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    // eslint-disable-next-line no-console
    console.error(`\nEnvironment validation failed:\n${formatted}\n`);
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
