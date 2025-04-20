import { Review, Customer, Prisma, Marketplace } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { PrismaClient, CampaignStatus, ReviewStatus } from '@prisma/client';

const prismaClient = new PrismaClient();

/**
 * Create a customer or update if exists
 * @param {Object} customerData
 * @returns {Promise<Customer>}
 */
const createOrUpdateCustomer = async (customerData: {
  email: string;
  name: string;
  ratio: number;
}): Promise<Customer> => {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: customerData.email }
    });

    if (existingCustomer) {
      // Update existing customer with weighted average ratio
      const totalReviews = existingCustomer.reviews + 1;
      const newRatio =
        (existingCustomer.ratio * existingCustomer.reviews + customerData.ratio) / totalReviews;

      return prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          reviews: totalReviews,
          ratio: newRatio
        }
      });
    }

    // Create new customer with initial ratio
    return prisma.customer.create({
      data: {
        email: customerData.email,
        name: customerData.name,
        reviews: 1,
        ratio: customerData.ratio || 0 // Ensure ratio has a default value
      }
    });
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create/update customer');
  }
};

type ReviewInput = Omit<Prisma.ReviewUncheckedCreateInput, 'id' | 'customerId' | 'feedbackDate'>;

/**
 * Create a review
 * @param {Object} reviewData
 * @returns {Promise<Review>}
 */
const createReview = async (reviewBody: ReviewInput): Promise<Review> => {
  try {
    const product = await prismaClient.product.findUnique({
      where: { id: reviewBody.productId },
      include: {
        Campaigns: {
          where: { isActive: CampaignStatus.YES },
          select: { id: true }
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Create or update customer
    const customer = await prismaClient.customer.upsert({
      where: { email: reviewBody.email },
      create: {
        email: reviewBody.email,
        name: reviewBody.name,
        reviews: 1,
        ratio: reviewBody.ratio
      },
      update: {
        reviews: { increment: 1 },
        ratio: reviewBody.ratio
      }
    });

    const review = await prismaClient.review.create({
      data: {
        email: reviewBody.email,
        name: reviewBody.name,
        productId: reviewBody.productId,
        ratio: reviewBody.ratio,
        feedback: reviewBody.feedback,
        marketplace: reviewBody.marketplace,
        orderNo: reviewBody.orderNo,
        promotionId: reviewBody.promotionId,
        campaignId: product.Campaigns?.[0]?.id,
        customerId: customer.id,
        status: ReviewStatus.PENDING
      }
    });

    return review;
  } catch (error) {
    throw error;
  }
};

/**
 * Get reviews for a company with pagination and filtering
 * @param {number} companyId
 * @param {string} status
 * @param {number} page
 * @param {number} limit
 * @param {string} sortBy
 * @param {string} sortOrder
 * @returns {Promise<{ reviews: Review[]; total: number }>}
 */
const getCompanyReviews = async (
  companyId: number,
  status?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'feedbackDate',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ reviews: Review[]; total: number }> => {
  try {
    const where: Prisma.ReviewWhereInput = {
      Product: {
        companyId: companyId
      }
    };

    if (status) {
      where.status = status as Review['status'];
    }

    // Validate and set sort field
    const validSortFields = ['feedbackDate', 'ratio', 'status', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'feedbackDate';

    // Special handling for ratio sorting
    let orderBy: Prisma.ReviewOrderByWithRelationInput;
    if (sortField === 'ratio') {
      // For ratio sorting, we'll use a compound sort to handle nulls
      orderBy = {
        ratio: sortOrder,
        feedbackDate: 'desc' // Secondary sort by feedback date
      };
    } else {
      orderBy = {
        [sortField]: sortOrder
      };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          Product: {
            select: {
              title: true,
              image: true,
              asin: true,
              Campaigns: {
                select: {
                  title: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          },
          Customer: {
            select: {
              name: true,
              email: true
            }
          },
          Promotion: {
            select: {
              title: true,
              description: true
            }
          },
          Campaign: {
            select: {
              title: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    // Post-process the results to handle null ratios
    if (sortField === 'ratio') {
      reviews.sort((a, b) => {
        if (a.ratio === null && b.ratio === null) return 0;
        if (a.ratio === null) return 1;
        if (b.ratio === null) return -1;
        return sortOrder === 'desc' ? b.ratio - a.ratio : a.ratio - b.ratio;
      });
    }

    return { reviews, total };
  } catch (error) {
    console.error('Error getting company reviews:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get reviews');
  }
};

/**
 * Update review status
 * @param {number} reviewId
 * @param {string} status
 * @returns {Promise<Review>}
 */
const updateReviewStatus = async (
  reviewId: number,
  status: 'PENDING' | 'PROCESSED' | 'REJECTED'
): Promise<Review> => {
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status }
    });

    return review;
  } catch (error) {
    console.error('Error updating review status:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update review status');
  }
};

const updateProductRatio = async (productId: number): Promise<void> => {
  const reviews = await prisma.review.findMany({
    where: { Product: { id: productId } },
    select: { ratio: true }
  });

  const totalRatio = reviews.reduce((sum, review) => sum + review.ratio, 0);
  const averageRatio = reviews.length > 0 ? totalRatio / reviews.length : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { ratio: averageRatio }
  });
};

const updateCompanyStatistics = async (companyId: number): Promise<void> => {
  const reviews = await prisma.review.findMany({
    where: { Product: { companyId } },
    select: { ratio: true }
  });

  const totalRatio = reviews.reduce((sum, review) => sum + review.ratio, 0);
  const averageRatio = reviews.length > 0 ? totalRatio / reviews.length : 0;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      ratio: averageRatio,
      reviews: { increment: 1 }
    }
  });
};
const updateCampaignStatistics = async (campaignId: number): Promise<void> => {
  const reviews = await prisma.review.findMany({
    where: {
      campaignId: campaignId
    },
    select: {
      ratio: true
    }
  });
  const totalRatio = reviews.reduce((sum, review) => sum + review.ratio, 0);
  const totalReviews = reviews.length;
  const averageRatio = reviews.length > 0 ? totalRatio / reviews.length : 0;
  console.log(reviews.length);
  console.log(totalRatio);
  console.log(averageRatio);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ratio: averageRatio,
      claims: totalReviews
    }
  });
};
export const reviewService = {
  createReview,
  createOrUpdateCustomer,
  getCompanyReviews,
  updateReviewStatus,
  updateCampaignStatistics,
  updateCompanyStatistics
};
