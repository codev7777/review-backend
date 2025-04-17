import { Review, Customer, Prisma, Marketplace } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';

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

/**
 * Create a review
 * @param {Object} reviewData
 * @returns {Promise<Review>}
 */
const createReview = async (reviewBody: any): Promise<any> => {
  try {
    if (
      !reviewBody.email ||
      !reviewBody.name ||
      !reviewBody.productId ||
      !reviewBody.feedback ||
      !reviewBody.marketplace
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    let ratio = 0;
    if (reviewBody.ratio !== undefined && reviewBody.ratio !== null) {
      ratio = parseFloat(String(reviewBody.ratio));
      if (isNaN(ratio)) {
        ratio = 0;
      }
    }

    const marketplace = reviewBody.marketplace.toUpperCase();
    const validMarketplaces = Object.values(Marketplace);
    if (!validMarketplaces.includes(marketplace)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid marketplace value. Must be one of: ${validMarketplaces.join(', ')}`
      );
    }

    // Create or update customer with the correct data structure
    const customer = await createOrUpdateCustomer({
      email: reviewBody.email,
      name: reviewBody.name,
      ratio: ratio
    });

    // Get product with active campaigns
    const product = await prisma.product.findUnique({
      where: { id: reviewBody.productId },
      include: {
        Campaigns: {
          where: {
            isActive: 'YES'
          }
        }
      }
    });

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        email: reviewBody.email,
        name: reviewBody.name,
        productId: reviewBody.productId,
        ratio: ratio,
        feedback: reviewBody.feedback,
        marketplace: marketplace,
        orderNo: reviewBody.orderNo,
        promotionId: reviewBody.promotionId,
        customerId: customer.id,
        status: 'PENDING'
      },
      include: {
        Product: true,
        Customer: true
      }
    });

    // Update product ratio
    await prisma.product.update({
      where: { id: reviewBody.productId },
      data: {
        ratio: {
          increment: ratio
        }
      }
    });

    // Update company statistics
    if (product.companyId) {
      await updateCompanyStatistics(product.companyId);
    }

    // Update campaign statistics if review is associated with a campaign
    if (reviewBody.campaignId) {
      await prisma.campaign.update({
        where: { id: reviewBody.campaignId },
        data: {
          claims: {
            increment: 1
          }
        }
      });
    }

    // Update any active campaigns associated with the product
    if (product.Campaigns && product.Campaigns.length > 0) {
      for (const campaign of product.Campaigns) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            claims: {
              increment: 1
            }
          }
        });
      }
    }

    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create review');
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
          }
        },
        orderBy: {
          feedbackDate: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

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

export const reviewService = {
  createReview,
  createOrUpdateCustomer,
  getCompanyReviews,
  updateReviewStatus
};
