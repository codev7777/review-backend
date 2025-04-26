import express from 'express';
import { reviewService } from '../../services/review.service';
import prisma from '../../client';
import validate from '../../middlewares/validate';
import { reviewValidation } from '../../validations';

const router = express.Router();

/**
 * @route GET /v1/public/campaigns/:campaignId
 * @desc Get campaign by ID
 * @access Public
 */
router.get('/campaigns/:campaignId', async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.campaignId);

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        promotion: true,
        company: {
          include: {
            Plan: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Only include Meta Pixel ID if company has GOLD or PLATINUM plan
    const response = {
      ...campaign,
      company: campaign.company
        ? {
            ...campaign.company,
            metaPixelId:
              campaign.company.Plan?.planType === 'GOLD' ||
              campaign.company.Plan?.planType === 'PLATINUM'
                ? campaign.company.metaPixelId
                : null
          }
        : null
    };

    return res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /v1/public/products/:productId
 * @desc Get product by ID
 * @access Public
 */
router.get('/products/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /v1/public/products
 * @desc Get products by IDs
 * @access Public
 */
router.get('/products', async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }

    const productIds = String(ids)
      .split(',')
      .map((id) => parseInt(id));

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });

    return res.json({
      results: products,
      total: products.length,
      totalPages: 1
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /v1/public/reviews
 * @desc Create a review
 * @access Public
 */
router.post('/reviews', async (req, res, next) => {
  try {
    // Validate the request body manually since we can't access createReview method directly
    const review = await reviewService.createReview(req.body);
    return res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

export default router;
