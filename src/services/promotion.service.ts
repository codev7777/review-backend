import { PrismaClient } from '@prisma/client';
import type { Prisma, PromotionType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { savePromotionImage, deleteImage } from '../utils/fileUpload';

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
 * @param {any} promotionBody
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const createPromotion = async (
  promotionBody: any
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  // Handle image upload
  let imageUrl = promotionBody.image;
  if (promotionBody.image && promotionBody.image.startsWith('data:image')) {
    imageUrl = savePromotionImage(promotionBody.image);
  }

  return prisma.promotion.create({
    data: {
      ...promotionBody,
      image: imageUrl
    },
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
 * @param {any} updateBody
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const updatePromotionById = async (
  promotionId: number,
  updateBody: any
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  const promotion = await getPromotionById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  // Handle image upload if a new image is provided
  let imageUrl = updateBody.image;
  if (updateBody.image && updateBody.image.startsWith('data:image')) {
    // Delete the old image if it exists
    if (promotion.image) {
      deleteImage(promotion.image);
    }
    imageUrl = savePromotionImage(updateBody.image);
  }

  return prisma.promotion.update({
    where: { id: promotionId },
    data: {
      ...updateBody,
      image: imageUrl
    },
    include: {
      company: true
    }
  });
};

/**
 * Delete promotion by id
 * @param {number} promotionId
 * @returns {Promise<void>}
 */
const deletePromotionById = async (promotionId: number): Promise<void> => {
  const promotion = await getPromotionById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  // Delete the promotion image if it exists
  if (promotion.image) {
    deleteImage(promotion.image);
  }

  await prisma.promotion.delete({
    where: { id: promotionId }
  });
};

export default {
  createPromotion,
  queryPromotions,
  getPromotionById,
  updatePromotionById,
  deletePromotionById
};
