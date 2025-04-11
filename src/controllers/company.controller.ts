import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { companyService, userService } from '../services';
import { User } from '@prisma/client';

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

const getCompanies = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await companyService.queryCompanies(filter, options);
  res.send(result);
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
