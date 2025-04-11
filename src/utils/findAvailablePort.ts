import { Server } from 'http';
import logger from '../config/logger';

/**
 * Finds an available port starting from the given port number
 * @param startPort - The port number to start checking from
 * @returns A promise that resolves to an available port number
 */
export const findAvailablePort = (startPort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = new Server();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        logger.info(`Port ${startPort} is in use, trying ${startPort + 1}`);
        server.close();
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(startPort);
    });

    server.listen(startPort);
  });
};
