import { PrismaClient, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient() as any;

/**
 * Create a campaign
 * @param {Object} campaignBody
 * @returns {Promise<any>}
 */
const createCampaign = async (campaignBody: any): Promise<any> => {
  console.log('Received campaign body:', JSON.stringify(campaignBody, null, 2));

  // Handle productIds - convert string to array if needed
  let productIds = campaignBody.productIds;
  if (typeof productIds === 'string') {
    productIds = productIds.split(',').map((id) => parseInt(id.trim(), 10));
    console.log('Converted productIds string to array:', productIds);
  } else if (!Array.isArray(productIds)) {
    console.error('productIds is not an array or string:', productIds);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      '"productIds" must be an array or comma-separated string'
    );
  }

  // Handle marketplaces - convert string to array if needed
  let marketplaces = campaignBody.marketplaces;
  if (typeof marketplaces === 'string') {
    marketplaces = marketplaces.split(',').map((m) => m.trim());
    console.log('Converted marketplaces string to array:', marketplaces);
  } else if (!Array.isArray(marketplaces)) {
    console.error('marketplaces is not an array or string:', marketplaces);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      '"marketplaces" must be an array or comma-separated string'
    );
  }

  const { ...rest } = campaignBody;

  console.log('Final productIds:', productIds);
  console.log('Final marketplaces:', marketplaces);
  console.log('Rest of the data:', rest);

  try {
    const result = await prisma.campaign.create({
      data: {
        ...rest,
        products: {
          connect: productIds.map((id: number) => ({ id }))
        },
        marketplaces: marketplaces
      },
      include: {
        promotion: true,
        products: true
      }
    });

    console.log('Campaign created successfully:', result);
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
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCampaigns = async (
  filter: any,
  options: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }
) => {
  const { sortBy, sortOrder, limit = 10, page = 1 } = options;

  const orderBy = sortBy ? { [sortBy]: sortOrder || 'desc' } : undefined;

  const campaigns = await prisma.campaign.findMany({
    where: filter,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    include: {
      promotion: true,
      products: true
    }
  });

  const total = await prisma.campaign.count({ where: filter });

  return {
    results: campaigns,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total
  };
};

/**
 * Get campaign by id
 * @param {ObjectId} id
 * @returns {Promise<any>}
 */
const getCampaignById = async (id: number): Promise<any> => {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      promotion: true,
      products: true
    }
  });
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
  if (productIds && typeof productIds === 'string') {
    productIds = productIds.split(',').map((id: string) => parseInt(id.trim(), 10));
    console.log('Converted productIds string to array:', productIds);
  }

  // Handle marketplaces - convert string to array if needed
  let marketplaces = updateBody.marketplaces;
  if (marketplaces && typeof marketplaces === 'string') {
    marketplaces = marketplaces.split(',').map((m: string) => m.trim());
    console.log('Converted marketplaces string to array:', marketplaces);
  }

  const { ...rest } = updateBody;

  const data: any = { ...rest };

  if (productIds) {
    data.products = {
      set: [], // Clear existing connections
      connect: productIds.map((id: number) => ({ id }))
    };
  }

  if (marketplaces) {
    data.marketplaces = marketplaces;
  }

  return prisma.campaign.update({
    where: { id: campaignId },
    data,
    include: {
      promotion: true,
      products: true
    }
  });
};

/**
 * Delete campaign by id
 * @param {ObjectId} campaignId
 * @returns {Promise<any>}
 */
const deleteCampaignById = async (campaignId: number): Promise<any> => {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }

  return prisma.campaign.delete({
    where: { id: campaignId }
  });
};

export default {
  createCampaign,
  queryCampaigns,
  getCampaignById,
  updateCampaignById,
  deleteCampaignById
};
