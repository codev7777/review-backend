import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { reviewService } from '../services/review.service';
import { validateCreateReview, validateReviewUpdate } from '../validations/review.validation';
import { Marketplace } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map country codes to marketplace enum values
const COUNTRY_TO_MARKETPLACE: { [key: string]: Marketplace } = {
  us: 'US',
  ca: 'CA',
  mx: 'MX',
  gb: 'GB',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  es: 'ES',
  in: 'IN',
  jp: 'JP',
  nl: 'NL',
  se: 'SE',
  au: 'AU',
  br: 'BR',
  sg: 'SG',
  tr: 'TR',
  sa: 'SA',
  ae: 'AE',
  pl: 'PL',
  eg: 'EG',
  za: 'ZA',
  be: 'BE'
};

/**
 * Create a review
 * @param {Request} req
 * @param {Response} res
 */
const createReview = async (req: Request, res: Response) => {
  try {
    // Convert country to valid marketplace value
    const country = (req.body.country || '').toLowerCase();
    const marketplace = COUNTRY_TO_MARKETPLACE[country];

    if (!marketplace) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid country. Must be one of: ${Object.keys(COUNTRY_TO_MARKETPLACE)
          .join(', ')
          .toUpperCase()}`
      );
    }

    // Map frontend field names to backend field names
    const mappedData = {
      ...req.body,
      ratio: req.body.rating,
      marketplace: marketplace
    };

    // Remove the original fields to pass validation
    delete mappedData.rating;
    delete mappedData.country;

    // Validate the mapped data
    const validatedData = validateCreateReview(mappedData);

    // Create the review with validated data
    const review = await reviewService.createReview(validatedData);

    // Get the product to find the company ID
    const product = await prisma.product.findUnique({
      where: { id: review.productId },
      select: { companyId: true }
    });

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }

    await reviewService.updateCampaignStatistics(parseInt(req.body.campaignId, 10));
    await reviewService.updateCompanyStatistics(product.companyId);
    res.status(httpStatus.CREATED).send(review);
  } catch (error) {
    console.error('Error creating review:', error);
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create review');
  }
};

/**
 * Get reviews for a company (paginated)
 * @param {Request} req
 * @param {Response} res
 * @returns {Object} { reviews, total, totalPages, currentPage, hasNextPage, hasPrevPage, limit }
 */
const getCompanyReviews = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { status, page = 1, limit = 10, sortBy = 'feedbackDate', sortOrder = 'desc' } = req.query;

    const result = await reviewService.getCompanyReviews(
      Number(companyId),
      status as string,
      Number(page),
      Number(limit),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    // result now contains: reviews, total, totalPages, currentPage, hasNextPage, hasPrevPage, limit
    res.json(result);
  } catch (error) {
    console.error('Error getting company reviews:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get reviews');
  }
};

/**
 * Update review status
 * @param {Request} req
 * @param {Response} res
 */
const updateReviewStatus = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { status } = validateReviewUpdate(req.body);

    const review = await reviewService.updateReviewStatus(Number(reviewId), status);
    console.log(req.body.campaignId);
    res.json(review);
  } catch (error) {
    console.error('Error updating review status:', error);
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update review status');
  }
};

export default {
  createReview,
  getCompanyReviews,
  updateReviewStatus
};
