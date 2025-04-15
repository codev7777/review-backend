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
const createReview = async (reviewData: {
  email: string;
  name: string;
  productId: number;
  ratio: number;
  feedback: string;
  marketplace: string;
  orderNo?: string;
  promotionId?: number;
}): Promise<Review> => {
  try {
    // Validate required fields
    if (
      !reviewData.email ||
      !reviewData.name ||
      !reviewData.productId ||
      !reviewData.feedback ||
      !reviewData.marketplace
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    // Validate and normalize ratio
    let ratio = 0;
    if (reviewData.ratio !== undefined && reviewData.ratio !== null) {
      ratio = parseFloat(String(reviewData.ratio));
      if (isNaN(ratio)) {
        ratio = 0;
      }
    }

    // Validate marketplace format
    const marketplace = reviewData.marketplace.toUpperCase();
    const validMarketplaces = Object.values(Marketplace);
    if (!validMarketplaces.includes(marketplace as Marketplace)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid marketplace value. Must be one of: ${validMarketplaces.join(', ')}`
      );
    }

    // Create or update customer first
    const customer = await createOrUpdateCustomer({
      email: reviewData.email,
      name: reviewData.name,
      ratio: ratio
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        email: reviewData.email,
        name: reviewData.name,
        productId: reviewData.productId,
        ratio: ratio,
        feedback: reviewData.feedback,
        marketplace: marketplace,
        orderNo: reviewData.orderNo,
        promotionId: reviewData.promotionId,
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
      where: { id: reviewData.productId },
      data: {
        ratio: {
          increment: ratio
        }
      }
    });

    // Update company ratio if product has a company
    const product = await prisma.product.findUnique({
      where: { id: reviewData.productId },
      include: { company: true }
    });

    if (product?.company) {
      await prisma.company.update({
        where: { id: product.company.id },
        data: {
          ratio: {
            increment: ratio
          },
          reviews: {
            increment: 1
          }
        }
      });
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

export const reviewService = {
  createReview,
  createOrUpdateCustomer,
  getCompanyReviews,
  updateReviewStatus
};
