import { Review, Customer, Prisma, Marketplace } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../client';
import ApiError from '../utils/ApiError';
import { PrismaClient, CampaignStatus, ReviewStatus } from '@prisma/client';
import { sendDigitalDownloadEmail, sendCouponCodeEmail } from './mail.service';

const prismaClient = new PrismaClient();
const SELLER_PROFILE_ASIN = 'SELLER-PROFILE';

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

type ReviewInput = {
  email: string;
  name: string;
  asin: string;
  ratio: number;
  feedback: string;
  marketplace: string;
  orderNo?: string;
  promotionId?: number;
  campaignId?: number;
  isSeller?: boolean;
};

/**
 * Create a review
 * @param {Object} reviewData
 * @returns {Promise<Review>}
 */
const createReview = async (reviewBody: ReviewInput): Promise<Review> => {
  try {
    let product;
    console.log('Starting review creation with body:', { ...reviewBody, email: '***' });
    
    if (reviewBody.isSeller) {
      console.log('Creating seller review...');
      // For seller reviews, find the company's seller profile product
      product = await prismaClient.product.findFirst({
        where: {
          Campaigns: {
            some: {
              id: reviewBody.campaignId,
              isActive: CampaignStatus.YES
            }
          },
          asin: SELLER_PROFILE_ASIN
        },
        include: {
          Campaigns: {
            where: { isActive: CampaignStatus.YES },
            select: { id: true }
          }
        }
      });

      console.log('Existing seller profile product:', product);

      if (!product) {
        console.log('No existing seller profile product found, creating new one...');
        // Create a seller profile product if it doesn't exist
        const campaign = await prismaClient.campaign.findUnique({
          where: { id: reviewBody.campaignId },
          select: { companyId: true }
        });

        console.log('Found campaign:', campaign);

        if (!campaign) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
        }

        try {
          // First try to find the global seller profile product
          product = await prismaClient.product.findUnique({
            where: {
              asin: SELLER_PROFILE_ASIN
            }
          });

          if (!product) {
            // If no existing seller profile, create a new one
            const productData = {
              title: 'Seller REVIEW',
              description: 'Global Seller Profile for Reviews',
              image: '/images/seller-profile.png',
              asin: SELLER_PROFILE_ASIN,
              companyId: campaign.companyId
            } as Prisma.ProductUncheckedCreateInput;

            console.log('Creating new seller profile product with data:', productData);
            product = await prismaClient.product.create({
              data: productData,
              include: {
                Campaigns: {
                  where: { isActive: CampaignStatus.YES },
                  select: { id: true }
                }
              }
            });
            console.log('Successfully created seller profile product:', product);
          } else {
            console.log('Found existing global seller profile product:', product);
          }
        } catch (error) {
          console.error('Error creating/finding seller profile product:', error);
          throw error;
        }

        console.log('Linking product to campaign...');
        try {
          // Link the product to the campaign if not already linked
          await prismaClient.campaign.update({
            where: { id: reviewBody.campaignId },
            data: {
              products: {
                connect: { id: product.id }
              }
            }
          });
          console.log('Successfully linked product to campaign');
        } catch (error) {
          console.error('Error linking product to campaign:', error);
          throw error;
        }
      }
    } else {
      console.log('Creating regular product review...');
      // For regular product reviews, find by ASIN
      product = await prismaClient.product.findUnique({
        where: { asin: reviewBody.asin },
        include: {
          Campaigns: {
            where: { isActive: CampaignStatus.YES },
            select: { id: true }
          }
        }
      });
    }

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found with the given ASIN');
    }

    console.log('Found product:', { ...product, description: '***' });

    // If campaignId is provided, verify the product belongs to the campaign
    if (reviewBody.campaignId) {
      console.log('Verifying campaign...');
      const campaign = await prismaClient.campaign.findUnique({
        where: { id: reviewBody.campaignId },
        include: {
          products: {
            where: { id: product.id },
            select: { id: true }
          }
        }
      });

      if (!campaign) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
      }

      if (campaign.isActive !== CampaignStatus.YES) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Campaign is not active');
      }

      if (campaign.products.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This product is not part of the specified campaign');
      }
      console.log('Campaign verification successful');
    }
    
    console.log('Creating or updating customer...');
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
    console.log('Customer created/updated:', { ...customer, email: '***' });

    console.log('Creating review...');
    // Create the review using the found product's ID
    const review = await prismaClient.review.create({
      data: {
        email: reviewBody.email,
        name: reviewBody.name,
        productId: product.id,
        ratio: reviewBody.ratio,
        feedback: reviewBody.feedback,
        marketplace: reviewBody.marketplace,
        orderNo: reviewBody.orderNo,
        promotionId: reviewBody.promotionId,
        campaignId: reviewBody.campaignId,
        customerId: customer.id,
        status: ReviewStatus.PENDING
      },
      include: {
        Promotion: true
      }
    });
    console.log('Review created successfully:', { ...review, email: '***', feedback: '***' });

    // Handle digital download promotions
    if (
      review.Promotion?.promotionType === 'DIGITAL_DOWNLOAD' &&
      review.Promotion.digitalApprovalMethod === 'AUTOMATIC' &&
      review.Promotion.downloadableFileUrl
    ) {
      try {
        await sendDigitalDownloadEmail(
          review.email,
          review.name,
          review.Promotion.title,
          review.Promotion.downloadableFileUrl
        );

        await prismaClient.review.update({
          where: { id: review.id },
          data: { status: ReviewStatus.PROCESSED }
        });
      } catch (error) {
        console.error('Error sending digital download email for review:', review.id, error);
      }
    }

    // Handle discount code promotions
    if (
      review.Promotion?.promotionType === 'DISCOUNT_CODE' &&
      review.Promotion.approvalMethod === 'AUTOMATIC' &&
      review.Promotion.couponCodes &&
      review.Promotion.couponCodes.length > 0
    ) {
      try {
        const couponCode = review.Promotion.couponCodes[0];
        await sendCouponCodeEmail(review.email, review.name, review.Promotion.title, couponCode);

        await prismaClient.review.update({
          where: { id: review.id },
          data: { status: ReviewStatus.PROCESSED }
        });

        if (review.Promotion.codeType === 'SINGLE_USE') {
          const updatedCodes = review.Promotion.couponCodes.filter((code) => code !== couponCode);
          await prismaClient.promotion.update({
            where: { id: review.Promotion.id },
            data: {
              couponCodes: {
                set: updatedCodes
              }
            }
          });
        }
      } catch (error) {
        console.error('Error in coupon code email process:', {
          reviewId: review.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return review;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating review');
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
 * @returns {Promise<{ reviews: Review[]; total: number; totalPages: number; currentPage: number; hasNextPage: boolean; hasPrevPage: boolean; limit: number }>}
 */
const getCompanyReviews = async (
  companyId: number,
  status?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'feedbackDate',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  reviews: Review[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}> => {
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

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      reviews,
      total,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPrevPage,
      limit
    };
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
      data: { status },
      include: {
        Product: {
          select: {
            companyId: true
          }
        },
        Campaign: true
      }
    });

    // If review is being processed, update company and campaign statistics
    if (status === 'PROCESSED' && review.Product?.companyId) {
      await updateCompanyStatistics(review.Product.companyId);
      if (review.Campaign) {
        await updateCampaignStatistics(review.Campaign.id);
      }
    }

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
  try {
    // First check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      console.error(`Company with ID ${companyId} not found`);
      return;
    }

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
  } catch (error) {
    console.error('Error updating company statistics:', error);
    // Don't throw the error to prevent review creation from failing
  }
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
