import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { companyService, userService } from '../services';
import { User } from '@prisma/client';
import { Request, Response } from 'express';

const createCompany = catchAsync(async (req, res) => {
  // Extract planId from request body if it exists
  const { planId, ...rest } = req.body;

  // Create company with the rest of the data
  const company = await companyService.createCompany(rest);

  // Update the user's companyId to the newly created company's ID
  if (req.user) {
    const user = req.user as User;
    await userService.updateUserById(user.id, {
      company: { connect: { id: company.id } }
    });
  }

  res.status(httpStatus.CREATED).send(company);
});

const getCompanies = catchAsync(async (req: Request, res: Response) => {
  // Build filter manually to support 'search'
  const filter: any = {};

  // If 'search' is provided, use it to filter by company name (case-insensitive, partial match)
  if (req.query.search) {
    filter.name = { contains: req.query.search as string, mode: 'insensitive' };
  }

  // Add additional filters if needed (e.g., role)
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Pagination, sorting, etc.
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const { companies, totalCount } = await companyService.queryCompanies(filter, options);

  const limit = Number(options.limit) || 10;
  const totalPages = Math.ceil(totalCount / limit);

  res.send({
    data: companies,
    totalPages,
    totalCount
  });
});

const getCompany = catchAsync(async (req, res) => {
  const company = await companyService.getCompanyById(Number(req.params.companyId));
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  res.send(company);
});

const updateCompany = catchAsync(async (req, res) => {
  const company = await companyService.updateCompanyById(Number(req.params.companyId), req.body);

  // Update the user's companyId to the updated company's ID if it's different
  if (req.user && company) {
    const user = req.user as User;
    if (user.companyId !== company.id) {
      await userService.updateUserById(user.id, {
        company: { connect: { id: company.id } }
      });
    }
  }

  res.send(company);
});

const deleteCompany = catchAsync(async (req, res) => {
  await companyService.deleteCompanyById(Number(req.params.companyId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany
};
