import { PrismaClient } from '@prisma/client';
import type { Prisma, PromotionType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();

interface QueryOptions {
  sortBy?: string;
  limit?: number;
  page?: number;
}

interface FilterOptions {
  title?: string;
  promotionType?: PromotionType;
  companyId?: number;
}

interface QueryResult {
  results: Array<Prisma.PromotionGetPayload<{ include: { company: true } }>>;
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

/**
 * Create a promotion
 * @param {Prisma.PromotionCreateInput} promotionBody
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const createPromotion = async (
  promotionBody: Prisma.PromotionCreateInput
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  return prisma.promotion.create({
    data: promotionBody,
    include: {
      company: true
    }
  });
};

/**
 * Query for promotions
 * @param {FilterOptions} filter - Mongo filter
 * @param {QueryOptions} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPromotions = async (
  filter: FilterOptions,
  options: QueryOptions
): Promise<QueryResult> => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.PromotionWhereInput = {
    ...(filter.title && { title: { contains: filter.title } }),
    ...(filter.promotionType && { promotionType: filter.promotionType as PromotionType }),
    ...(filter.companyId && { companyId: filter.companyId })
  };

  const orderBy: Prisma.PromotionOrderByWithRelationInput = sortBy
    ? { [sortBy.split(':')[0]]: sortBy.split(':')[1] as Prisma.SortOrder }
    : { id: 'desc' };

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        company: true
      }
    }),
    prisma.promotion.count({ where })
  ]);

  return {
    results: promotions,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total
  };
};

/**
 * Get promotion by id
 * @param {number} id
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }> | null>}
 */
const getPromotionById = async (
  id: number
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }> | null> => {
  return prisma.promotion.findUnique({
    where: { id },
    include: {
      company: true
    }
  });
};

/**
 * Update promotion by id
 * @param {number} promotionId
 * @param {Prisma.PromotionUpdateInput} updateBody
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const updatePromotionById = async (
  promotionId: number,
  updateBody: Prisma.PromotionUpdateInput
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  const promotion = await getPromotionById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }
  return prisma.promotion.update({
    where: { id: promotionId },
    data: updateBody,
    include: {
      company: true
    }
  });
};

/**
 * Delete promotion by id
 * @param {number} promotionId
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const deletePromotionById = async (
  promotionId: number
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  const promotion = await getPromotionById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }
  return prisma.promotion.delete({
    where: { id: promotionId },
    include: {
      company: true
    }
  });
};

export default {
  createPromotion,
  queryPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById
};
