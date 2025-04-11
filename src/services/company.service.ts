import { Company, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import pick from '../utils/pick';

/**
 * Create a company
 * @param {Object} companyBody
 * @returns {Promise<Company>}
 */
const createCompany = async (companyBody: Prisma.CompanyCreateInput): Promise<Company> => {
  // Create a new object without the Plan relation
  const { Plan, ...rest } = companyBody;

  // Ensure required fields have default values if not provided
  const data = {
    ...rest,
    ratio: rest.ratio ?? 0,
    reviews: rest.reviews ?? 0,
    planId: null // Explicitly set planId to null
  };

  return prisma.company.create({
    data
  });
};

/**
 * Query for companies
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCompanies = async (
  filter: object,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<Company[]> => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy;
  const sortType = options.sortType || 'desc';

  const where = { ...filter };

  const companies = await prisma.company.findMany({
    where,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortType } : undefined
  });

  return companies;
};

/**
 * Get company by id
 * @param {ObjectId} id
 * @returns {Promise<Company | null>}
 */
const getCompanyById = async (id: number): Promise<Company | null> => {
  return prisma.company.findUnique({
    where: { id }
  });
};

/**
 * Update company by id
 * @param {ObjectId} companyId
 * @param {Object} updateBody
 * @returns {Promise<Company>}
 */
const updateCompanyById = async (
  companyId: number,
  updateBody: Prisma.CompanyUpdateInput
): Promise<Company | null> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  await prisma.company.update({
    where: { id: companyId },
    data: updateBody
  });
  return getCompanyById(companyId);
};

/**
 * Delete company by id
 * @param {ObjectId} companyId
 * @returns {Promise<Company>}
 */
const deleteCompanyById = async (companyId: number): Promise<Company> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  await prisma.company.delete({ where: { id: companyId } });
  return company;
};

export default {
  createCompany,
  queryCompanies,
  getCompanyById,
  updateCompanyById,
  deleteCompanyById
};
