import mongoose from 'mongoose';
import { config } from './env';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export async function connectDatabase(): Promise<void> {
  let retries = 0;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(config.databaseUrl, {
        serverSelectionTimeoutMS: 5000,
      });
      return;
    } catch (error) {
      retries++;
      const delay = BASE_DELAY_MS * Math.pow(2, retries - 1);
      logger.warn(
        `MongoDB connection attempt ${retries}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`,
        { error: error instanceof Error ? error.message : String(error) },
      );

      if (retries >= MAX_RETRIES) {
        logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Exiting.`);
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed cleanly');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
