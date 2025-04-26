import { Server } from 'http';
import app from './app';
import prisma from './client';
import config from './config/config';
import logger from './config/logger';
import { findAvailablePort } from './utils/findAvailablePort';
import cron from 'node-cron';
import axios from 'axios';

let server: Server;
prisma.$connect().then(async () => {
  logger.info('Connected to SQL Database');

  try {
    // Find an available port starting from the configured port
    const availablePort = await findAvailablePort(config.port);

    // If the available port is different from the configured port, log it
    if (availablePort !== config.port) {
      logger.info(`Default port ${config.port} is in use, using port ${availablePort} instead`);
    }

    // Start the server on the available port
    server = app.listen(availablePort, () => {
      logger.info(`Listening to port ${availablePort}`);
    });

    // Schedule subscription expiration check to run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        const response = await axios.post(
          `${process.env.API_URL}/v1/billing/check-expired-subscriptions`
        );
        console.log('Subscription expiration check completed:', response.data);
      } catch (error) {
        console.error('Failed to check expired subscriptions:', error);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
