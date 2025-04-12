import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Health check controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(httpStatus.OK).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      status: 'error',
      message: 'Server is running but database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {
  healthCheck
};
