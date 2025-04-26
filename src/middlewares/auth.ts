import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';
import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import { userService } from '../services';
import prisma from '../client';

const verifyCallback =
  (
    req: any,
    resolve: (value?: unknown) => void,
    reject: (reason?: unknown) => void,
    requiredRights: string[]
  ) =>
  async (err: unknown, user: User | false, info: unknown) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = await userService.getUserById(user.id);
    if (requiredRights.length) {
      const userRights = roleRights.get(req.user.role) ?? [];
      const hasRequiredRights = requiredRights.every((requiredRight) =>
        userRights.includes(requiredRight)
      );

      // Check if user is trying to delete themselves
      if (req.params.userId == req.user.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'You cannot delete yourself'));
      }

      // Check if user has required rights
      if (!hasRequiredRights) {
        // If user is trying to manage company users, check if they are a company admin with PLATINUM plan
        if (requiredRights.includes('manageCompanyUsers')) {
          const company = await prisma.company.findUnique({
            where: { id: req.user.companyId || 0 },
            include: { Plan: true }
          });

          if (!company || !company.Plan || company.Plan.planType !== 'PLATINUM') {
            return reject(
              new ApiError(
                httpStatus.FORBIDDEN,
                'User management is only available for PLATINUM plan subscribers'
              )
            );
          }

          // Check if the target user belongs to the same company
          const targetUser = await prisma.user.findUnique({
            where: { id: Number(req.params.userId) }
          });

          if (!targetUser || targetUser.companyId !== req.user.companyId) {
            return reject(
              new ApiError(httpStatus.FORBIDDEN, 'You can only manage users in your company')
            );
          }

          return resolve();
        }

        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
