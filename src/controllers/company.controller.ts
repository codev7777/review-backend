import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { companyService } from '../services';
import catchAsync from '../utils/catchAsync';
import prisma from '../client';
import pick from '../utils/pick';
import mailService from '../services/mail.service';
import ApiError from '../utils/ApiError';
import { encryptPassword } from '../utils/encryption';

const createCompany = catchAsync(async (req: Request, res: Response) => {
  const company = await companyService.createCompany(req.body);
  res.status(httpStatus.CREATED).send(company);
});

const getCompanies = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['search']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await companyService.queryCompanies(filter, options);
  res.send(result);
});

const getCompany = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  const company = await companyService.getCompanyById(companyId);
  res.send(company);
});

const updateCompany = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  const company = await companyService.updateCompanyById(companyId, req.body);
  res.send(company);
});

const deleteCompany = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  await companyService.deleteCompanyById(companyId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getCompanyUsers = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  const users = await prisma.user.findMany({
    where: {
      companyId: companyId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  res.send(users);
});

const inviteUser = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  const { email } = req.body;
  const requestingUser = req.user as any;

  // Get company and its plan
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      planId: true,
      Plan: {
        select: {
          planType: true
        }
      },
      Users: {
        orderBy: {
          createdAt: 'asc'
        },
        take: 1,
        select: {
          id: true
        }
      }
    }
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  // Check if company has PLATINUM plan
  if (!company.Plan || company.Plan.planType !== 'PLATINUM') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'User invitation is only available for PLATINUM plan subscribers'
    );
  }

  // Check if requesting user is the first member of the company
  if (!company.Users[0] || company.Users[0].id !== requestingUser.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only the company owner can manage users'
    );
  }

  const companyName = company.name || 'your company';

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    // If user exists, update their company
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { companyId }
    });
    // Send invitation email to existing user
    await mailService.sendInvitationEmail(email, 'Use your existing password', companyName);
  } else {
    // If user doesn't exist, create a new user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await encryptPassword(tempPassword);

    await prisma.user.create({
      data: {
        email,
        companyId,
        role: 'USER',
        password: hashedPassword,
        isEmailVerified: true
      }
    });
    // Send invitation email with temporary password
    await mailService.sendInvitationEmail(email, tempPassword, companyName);
  }

  res.status(httpStatus.CREATED).send({ message: 'User invited successfully' });
});

const removeUser = catchAsync(async (req: Request, res: Response) => {
  const companyId = Number(req.params.companyId);
  const userId = Number(req.params.userId);
  const requestingUser = req.user as any;

  // Prevent users from deleting their own account
  if (userId === requestingUser.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You cannot delete your own account'
    );
  }

  // Get company with its first user
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      Users: {
        orderBy: {
          createdAt: 'asc'
        },
        take: 1,
        select: {
          id: true
        }
      }
    }
  });

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  // Check if requesting user is the first member of the company
  if (!company.Users[0] || company.Users[0].id !== requestingUser.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only the company owner can manage users'
    );
  }

  // Check if user belongs to the company
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: companyId
    },
    include: {
      subscriptions: {
        where: {
          status: 'ACTIVE'
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found in company');
  }

  // Prevent removing the company owner
  if (user.id === company.Users[0].id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Cannot remove the company owner'
    );
  }

  // Check if user has active subscriptions
  if (user.subscriptions.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot remove user with active subscriptions. Please cancel subscriptions first.'
    );
  }

  // Start a transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Remove user from company
    await tx.user.update({
      where: { id: userId },
      data: {
        companyId: null,
        role: 'USER' // Reset role to basic user
      }
    });
  });

  res.status(httpStatus.NO_CONTENT).send();
});

export const companyController = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers,
  inviteUser,
  removeUser
};
