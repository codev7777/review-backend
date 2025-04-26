import { Company, Prisma, PlanType } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import pick from '../utils/pick';
import { saveCompanyLogo, deleteImage } from '../utils/fileUpload';

/**
 * Create a company
 * @param {Object} companyBody
 * @returns {Promise<Company>}
 */
const createCompany = async (companyBody: Prisma.CompanyCreateInput): Promise<Company> => {
  const { logo, Plan, metaPixelId, ...rest } = companyBody;

  // Validate Meta Pixel ID if provided
  if (metaPixelId && Plan) {
    const plan = await prisma.plan.findUnique({
      where: { id: Number(Plan.connect?.id) }
    });

    if (plan && plan.planType !== 'GOLD' && plan.planType !== 'PLATINUM') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Meta Pixel ID is only available for GOLD and PLATINUM plans'
      );
    }
  }

  // Handle logo upload if provided
  let logoPath = null;
  if (typeof logo === 'string' && logo.startsWith('data:image')) {
    logoPath = await saveCompanyLogo(logo);
  }

  // Ensure required fields have default values if not provided
  const data: Prisma.CompanyCreateInput = {
    ...rest,
    ratio: rest.ratio ?? 0,
    reviews: rest.reviews ?? 0,
    Plan: undefined, // Remove Plan from create input
    logo: logoPath,
    metaPixelId: metaPixelId as string | undefined
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
): Promise<{ companies: Company[]; totalCount: number }> => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy;
  const sortType = options.sortType || 'desc';

  const where = { ...filter };

  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
      include: {
        campaigns: true,
        Products: true
      }
    }),
    prisma.company.count({ where })
  ]);

  return { companies, totalCount };
};

/**
 * Get company by id
 * @param {ObjectId} id
 * @returns {Promise<Company | null>}
 */
const getCompanyById = async (id: number): Promise<Company | null> => {
  const company = await prisma.company.findUnique({
    where: { id }
  });
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }
  return company;
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
): Promise<Company> => {
  const company = await getCompanyById(companyId);
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Company not found');
  }

  const { logo, metaPixelId, ...updateData } = updateBody;

  // Validate Meta Pixel ID if provided
  if (metaPixelId) {
    const plan = await prisma.plan.findUnique({
      where: { id: company.planId || 0 }
    });

    if (!plan || (plan.planType !== 'GOLD' && plan.planType !== 'PLATINUM')) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Meta Pixel ID is only available for GOLD and PLATINUM plans'
      );
    }
  }

  // Handle logo update if provided
  let logoPath = company.logo;
  if (logo) {
    if (typeof logo === 'string' && logo.startsWith('data:image')) {
      // Delete old logo if exists
      if (company.logo) {
        await deleteImage(company.logo);
      }
      logoPath = await saveCompanyLogo(logo);
    } else if (logo === null) {
      // Delete old logo if exists
      if (company.logo) {
        await deleteImage(company.logo);
      }
      logoPath = null;
    }
  }

  return prisma.company.update({
    where: { id: companyId },
    data: {
      ...updateData,
      logo: logoPath,
      metaPixelId: metaPixelId as string | undefined
    }
  });
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

  // Delete logo if exists
  if (company.logo) {
    await deleteImage(company.logo);
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
