import { NextFunction, Request, Response } from 'express';
import auth from './auth';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  auth('getUsers', 'manageUsers')(req, res, next);
}; 