import { PrismaClient } from '@prisma/client';
import type { Prisma, PromotionType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { savePromotionImage, savePdfFile, deleteImage } from '../utils/fileUpload';

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
 * Check if a company can create more promotions based on their subscription plan
 * @param {number} companyId - The company ID
 * @returns {Promise<boolean>} - Returns true if the company can create more promotions
 */
const canCreateMorePromotions = async (companyId: number): Promise<boolean> => {
  // Get the company's subscription
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      Plan: true
    }
  });

  if (!company || !company.Plan) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Company does not have an active subscription plan');
  }

  // Get the current number of promotions
  const promotionsCount = await prisma.promotion.count({
    where: {
      companyId
    }
  });

  // Check limits based on plan
  switch (company.Plan.planType) {
    case 'SILVER':
      return promotionsCount < 1;
    case 'GOLD':
      return promotionsCount < 10;
    case 'PLATINUM':
      return true; // Unlimited promotions
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subscription plan');
  }
};

/**
 * Create a promotion
 * @param {any} promotionBody
 * @returns {Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>>}
 */
const createPromotion = async (
  promotionBody: any
): Promise<Prisma.PromotionGetPayload<{ include: { company: true } }>> => {
  // Check if company can create more promotions
  const canCreate = await canCreateMorePromotions(promotionBody.companyId);
  if (!canCreate) {
    const company = await prisma.company.findUnique({
      where: { id: promotionBody.companyId },
      include: { Plan: true }
    });

    let upgradeMessage = '';
    if (company?.Plan?.planType === 'SILVER') {
      upgradeMessage =
        'Upgrade to GOLD plan for up to 10 promotions or PLATINUM plan for unlimited promotions.';
    } else if (company?.Plan?.planType === 'GOLD') {
      upgradeMessage = 'Upgrade to PLATINUM plan for unlimited promotions.';
    }

    throw new ApiError(
      httpStatus.FORBIDDEN,
      `You have reached the maximum number of promotions allowed by your ${company?.Plan?.planType} plan. ${upgradeMessage}`
    );
  }

  // Handle image upload
  let imageUrl = promotionBody.image;
  if (promotionBody.image && promotionBody.image.startsWith('data:image')) {
    imageUrl = savePromotionImage(promotionBody.image);
  }

  // Handle PDF file upload for digital downloads
  let downloadableFileUrl = promotionBody.downloadableFileUrl;
  if (
    promotionBody.promotionType === 'DIGITAL_DOWNLOAD' &&
    promotionBody.downloadableFileUrl &&
    promotionBody.downloadableFileUrl.startsWith('data:application/pdf')
  ) {
    downloadableFileUrl = savePdfFile(promotionBody.downloadableFileUrl);
  }

  // Prepare promotion data based on type
  const promotionData: any = {
    title: promotionBody.title,
    description: promotionBody.description,
    promotionType: promotionBody.promotionType,
    image: imageUrl,
    companyId: promotionBody.companyId
  };

  // Add type-specific fields
  switch (promotionBody.promotionType) {
    case 'GIFT_CARD':
      promotionData.giftCardDeliveryMethod = promotionBody.giftCardDeliveryMethod;
      break;
    case 'DISCOUNT_CODE':
      promotionData.approvalMethod = promotionBody.approvalMethod;
      promotionData.codeType = promotionBody.codeType;
      promotionData.couponCodes = promotionBody.couponCodes;
      break;
    case 'FREE_PRODUCT':
      promotionData.freeProductDeliveryMethod = 'SHIP';
      promotionData.freeProductApprovalMethod = 'MANUAL';
      break;
    case 'DIGITAL_DOWNLOAD':
      promotionData.downloadableFileUrl = downloadableFileUrl;
      promotionData.digitalApprovalMethod = promotionBody.digitalApprovalMethod;
      break;
  }

  return prisma.promotion.create({
    data: promotionData,
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

  // Create a new object to store only the changed fields
  const updateData: any = {};

  // Handle image upload if a new image is provided
  if (updateBody.image && updateBody.image.startsWith('data:image')) {
    // Delete the old image if it exists
    if (promotion.image) {
      deleteImage(promotion.image);
    }
    updateData.image = savePromotionImage(updateBody.image);
  } else if (updateBody.image !== undefined) {
    updateData.image = updateBody.image;
  }

  // Handle PDF file upload for digital downloads if changed
  if (
    promotion.promotionType === 'DIGITAL_DOWNLOAD' &&
    updateBody.downloadableFileUrl &&
    updateBody.downloadableFileUrl.startsWith('data:application/pdf')
  ) {
    updateData.downloadableFileUrl = savePdfFile(updateBody.downloadableFileUrl);
  } else if (updateBody.downloadableFileUrl !== undefined) {
    updateData.downloadableFileUrl = updateBody.downloadableFileUrl;
  }

  // Add other fields only if they are different from current values
  if (updateBody.title !== undefined && updateBody.title !== promotion.title) {
    updateData.title = updateBody.title;
  }
  if (updateBody.description !== undefined && updateBody.description !== promotion.description) {
    updateData.description = updateBody.description;
  }
  if (
    updateBody.promotionType !== undefined &&
    updateBody.promotionType !== promotion.promotionType
  ) {
    updateData.promotionType = updateBody.promotionType;
  }

  // Add type-specific fields only if they are different
  switch (promotion.promotionType) {
    case 'GIFT_CARD':
      if (
        updateBody.giftCardDeliveryMethod !== undefined &&
        updateBody.giftCardDeliveryMethod !== promotion.giftCardDeliveryMethod
      ) {
        updateData.giftCardDeliveryMethod = updateBody.giftCardDeliveryMethod;
      }
      break;
    case 'DISCOUNT_CODE':
      if (
        updateBody.approvalMethod !== undefined &&
        updateBody.approvalMethod !== promotion.approvalMethod
      ) {
        updateData.approvalMethod = updateBody.approvalMethod;
      }
      if (updateBody.codeType !== undefined && updateBody.codeType !== promotion.codeType) {
        updateData.codeType = updateBody.codeType;
      }
      if (
        updateBody.couponCodes !== undefined &&
        JSON.stringify(updateBody.couponCodes) !== JSON.stringify(promotion.couponCodes)
      ) {
        updateData.couponCodes = updateBody.couponCodes;
      }
      break;
    case 'FREE_PRODUCT':
      if (
        updateBody.freeProductDeliveryMethod !== undefined &&
        updateBody.freeProductDeliveryMethod !== promotion.freeProductDeliveryMethod
      ) {
        updateData.freeProductDeliveryMethod = updateBody.freeProductDeliveryMethod;
      }
      if (
        updateBody.freeProductApprovalMethod !== undefined &&
        updateBody.freeProductApprovalMethod !== promotion.freeProductApprovalMethod
      ) {
        updateData.freeProductApprovalMethod = updateBody.freeProductApprovalMethod;
      }
      break;
    case 'DIGITAL_DOWNLOAD':
      if (
        updateBody.digitalApprovalMethod !== undefined &&
        updateBody.digitalApprovalMethod !== promotion.digitalApprovalMethod
      ) {
        updateData.digitalApprovalMethod = updateBody.digitalApprovalMethod;
      }
      break;
  }

  // Only perform update if there are changes
  if (Object.keys(updateData).length === 0) {
    return promotion;
  }

  return prisma.promotion.update({
    where: { id: promotionId },
    data: updateData,
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
