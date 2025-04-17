import { Request, Response } from 'express';
import { getAdminStatistics } from '../services/admin.service';

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const statistics = await getAdminStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching admin dashboard statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
