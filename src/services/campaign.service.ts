import { PrismaClient, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { saveCampaignImage, deleteImage } from '../utils/fileUpload';

const prisma = new PrismaClient() as any;

/**
 * Check if a company can create more campaigns based on their subscription plan
 * @param {number} companyId - The company ID
 * @returns {Promise<boolean>} - Returns true if the company can create more campaigns
 */
const canCreateMoreCampaigns = async (companyId: number): Promise<boolean> => {
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

  // Get the current number of active campaigns
  const activeCampaignsCount = await prisma.campaign.count({
    where: {
      companyId,
      isActive: 'YES'
    }
  });

  // Check limits based on plan
  switch (company.Plan.planType) {
    case 'SILVER':
      return activeCampaignsCount < 1;
    case 'GOLD':
    case 'PLATINUM':
    case 'PLATIUM': // Handle both spellings
      return true; // Unlimited campaigns
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subscription plan');
  }
};

/**
 * Check if a company can select more marketplaces based on their subscription plan
 * @param {number} companyId - The company ID
 * @param {number} selectedMarketplacesCount - Number of marketplaces being selected
 * @returns {Promise<boolean>} - Returns true if the company can select more marketplaces
 */
const canSelectMoreMarketplaces = async (
  companyId: number,
  selectedMarketplacesCount: number
): Promise<boolean> => {
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

  // Check limits based on plan
  switch (company.Plan.planType) {
    case 'SILVER':
      return selectedMarketplacesCount <= 1; // SILVER plan: 1 marketplace
    case 'GOLD':
    case 'PLATINUM':
      return true; // GOLD and PLATINUM plans: unlimited marketplaces
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subscription plan');
  }
};

/**
 * Create a campaign
 * @param {Object} campaignBody
 * @returns {Promise<any>}
 */
const createCampaign = async (campaignBody: any): Promise<any> => {
  // Check if company can create more campaigns
  const canCreate = await canCreateMoreCampaigns(campaignBody.companyId);
  if (!canCreate) {
    const company = await prisma.company.findUnique({
      where: { id: campaignBody.companyId },
      include: { Plan: true }
    });

    let upgradeMessage = '';
    if (company?.Plan?.planType === 'SILVER') {
      upgradeMessage = 'Upgrade to GOLD or PLATINUM plan for unlimited campaigns.';
    } else if (company?.Plan?.planType === 'GOLD') {
      upgradeMessage = 'Upgrade to PLATINUM plan for additional features.';
    }

    throw new ApiError(
      httpStatus.FORBIDDEN,
      `You have reached the maximum number of campaigns allowed by your ${company?.Plan?.planType} plan. ${upgradeMessage}`
    );
  }

  // Handle productIds - convert string to array if needed
  let productIds = campaignBody.productIds;
  if (typeof productIds === 'string') {
    productIds = productIds.split(',').map((id) => parseInt(id.trim(), 10));
  } else if (!Array.isArray(productIds)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      '"productIds" must be an array or comma-separated string'
    );
  }

  // Handle marketplaces - convert string to array if needed
  let marketplaces = campaignBody.marketplaces;
  if (typeof marketplaces === 'string') {
    marketplaces = marketplaces.split(',').map((m) => m.trim());
  } else if (!Array.isArray(marketplaces)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      '"marketplaces" must be an array or comma-separated string'
    );
  }

  // Check marketplace limits
  const canSelectMore = await canSelectMoreMarketplaces(
    campaignBody.companyId,
    marketplaces.length
  );
  if (!canSelectMore) {
    const company = await prisma.company.findUnique({
      where: { id: campaignBody.companyId },
      include: { Plan: true }
    });

    let upgradeMessage = '';
    if (company?.Plan?.planType === 'SILVER') {
      upgradeMessage = 'Upgrade to GOLD or PLATINUM plan for unlimited marketplaces.';
    }

    throw new ApiError(
      httpStatus.FORBIDDEN,
      `You have reached the maximum number of marketplaces allowed by your ${company?.Plan?.planType} plan. ${upgradeMessage}`
    );
  }

  // Handle image upload
  // let imageUrl = campaignBody.image;
  // if (campaignBody.image && campaignBody.image.startsWith('data:image')) {
  //   imageUrl = saveCampaignImage(campaignBody.image);
  // }

  const { ...rest } = campaignBody;

  try {
    const result = await prisma.campaign.create({
      data: {
        ...rest,
        // image: imageUrl,
        productIds: productIds,
        marketplaces: marketplaces,
        products: {
          connect: productIds.map((id: number) => ({ id }))
        }
      },
      include: {
        promotion: true,
        products: true,
        company: true
      }
    });

    return result;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

/**
 * Query for campaigns
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {string} [options.sortOrder] - Sort order (asc or desc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCampaigns = async (filter: any, options: any) => {
  const { limit = 10, page = 1, sortBy, sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filter.title) where.title = { contains: filter.title };
  if (filter.isActive) where.isActive = filter.isActive;
  if (filter.promotionId) where.promotionId = filter.promotionId;
  if (filter.companyId) where.companyId = filter.companyId;
  if (filter.claims) where.claims = filter.claims;

  const orderBy: any = {};
  if (sortBy) {
    // Map frontend field names to database field names
    const fieldMap: Record<string, string> = {
      name: 'title',
      status: 'isActive',
      reviews: 'claims',
      updatedAt: 'updatedAt'
    };

    const dbField = fieldMap[sortBy] || sortBy;
    orderBy[dbField] = sortOrder;
  } else {
    orderBy.id = 'desc';
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        promotion: true,
        company: true
      }
    }),
    prisma.campaign.count({ where })
  ]);

  return {
    results: campaigns,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total
  };
};

/**
 * Get campaign by id
 * @param {ObjectId} id
 * @returns {Promise<any>}
 */
const getCampaignById = async (id: number): Promise<any> => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        Reviews: {
          include: {
            Product: {
              select: {
                title: true,
                image: true,
                asin: true
              }
            },
            Customer: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            feedbackDate: 'desc'
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            image: true,
            asin: true
          }
        },
        promotion: {
          select: {
            id: true,
            title: true,
            image: true,
            promotionType: true
          }
        }
      }
    });

    if (!campaign) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
    }

    return campaign;
  } catch (error) {
    console.error('Error getting campaign:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get campaign');
  }
};

/**
 * Update campaign by id
 * @param {ObjectId} campaignId
 * @param {Object} updateBody
 * @returns {Promise<any>}
 */
const updateCampaignById = async (campaignId: number, updateBody: any): Promise<any> => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }

  // Handle productIds - convert string to array if needed
  let productIds = updateBody.productIds;
  if (productIds) {
    if (typeof productIds === 'string') {
      productIds = productIds.split(',').map((id) => parseInt(id.trim(), 10));
    } else if (!Array.isArray(productIds)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        '"productIds" must be an array or comma-separated string'
      );
    }
  }

  // Handle marketplaces - convert string to array if needed
  let marketplaces = updateBody.marketplaces;
  if (marketplaces) {
    if (typeof marketplaces === 'string') {
      marketplaces = marketplaces.split(',').map((m) => m.trim());
    } else if (!Array.isArray(marketplaces)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        '"marketplaces" must be an array or comma-separated string'
      );
    }
  }

  // Handle image upload if a new image is provided
  let imageUrl = updateBody.image;
  if (updateBody.image && updateBody.image.startsWith('data:image')) {
    // Delete the old image if it exists
    if (campaign.image) {
      deleteImage(campaign.image);
    }
    imageUrl = saveCampaignImage(updateBody.image);
  }

  const { ...rest } = updateBody;

  // Update the campaign
  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...rest,
      image: imageUrl,
      ...(productIds && { productIds }),
      ...(marketplaces && { marketplaces })
    },
    include: {
      promotion: true,
      products: true,
      company: true
    }
  });

  return updatedCampaign;
};

/**
 * Delete campaign by id
 * @param {ObjectId} campaignId
 * @returns {Promise<any>}
 */
const deleteCampaignById = async (campaignId: number): Promise<void> => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }

  // Delete the campaign image if it exists
  if (campaign.image) {
    deleteImage(campaign.image);
  }

  await prisma.campaign.delete({
    where: { id: campaignId }
  });
};

/**
 * Get campaigns for a company
 * @param {number} companyId
 * @returns {Promise<Campaign[]>}
 */
const getCompanyCampaigns = async (companyId: number): Promise<any[]> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { companyId },
      include: {
        Reviews: {
          include: {
            Product: {
              select: {
                title: true,
                image: true,
                asin: true
              }
            },
            Customer: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            feedbackDate: 'desc'
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            image: true,
            asin: true
          }
        },
        promotion: {
          select: {
            id: true,
            title: true,
            image: true,
            promotionType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return campaigns;
  } catch (error) {
    console.error('Error getting company campaigns:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get campaigns');
  }
};

export default {
  createCampaign,
  queryCampaigns,
  getCampaignById,
  updateCampaignById,
  deleteCampaignById,
  getCompanyCampaigns
};
