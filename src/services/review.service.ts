import { Review, Customer, Prisma } from '@prisma/client';
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
  const existingCustomer = await prisma.customer.findUnique({
    where: { email: customerData.email }
  });

  if (existingCustomer) {
    // Update existing customer
    return prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        reviews: existingCustomer.reviews + 1,
        ratio: (existingCustomer.ratio + customerData.ratio) / (existingCustomer.reviews + 1)
      }
    });
  }

  // Create new customer
  return prisma.customer.create({
    data: {
      email: customerData.email,
      name: customerData.name,
      reviews: 1,
      ratio: customerData.ratio
    }
  });
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
    // Create or update customer first
    const customer = await createOrUpdateCustomer({
      email: reviewData.email,
      name: reviewData.name,
      ratio: reviewData.ratio
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        email: reviewData.email,
        name: reviewData.name,
        productId: reviewData.productId,
        ratio: reviewData.ratio,
        feedback: reviewData.feedback,
        marketplace: reviewData.marketplace,
        orderNo: reviewData.orderNo,
        promotionId: reviewData.promotionId,
        customerId: customer.id,
        status: 'PENDING'
      }
    });

    // Update product ratio
    await prisma.product.update({
      where: { id: reviewData.productId },
      data: {
        ratio: {
          increment: reviewData.ratio
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
            increment: reviewData.ratio
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create review');
  }
};

export default {
  createReview,
  createOrUpdateCustomer
};
