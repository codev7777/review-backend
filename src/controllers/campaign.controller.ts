import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import campaignService from '../services/campaign.service';
import ApiError from '../utils/ApiError';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    companyId?: number;
  };
}

const createCampaign = catchAsync(async (req: Request, res: Response) => {
  // console.log('Controller received request body:', JSON.stringify(req.body, null, 2));
  // Get the authenticated user's company ID
  if (!req.user || !('companyId' in req.user)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User must be associated with a company');
  }

  // Handle productIds - convert string to array if needed
  if (req.body.productIds && typeof req.body.productIds === 'string') {
    req.body.productIds = req.body.productIds
      .split(',')
      .map((id: string) => parseInt(id.trim(), 10));
    // console.log('Controller: Converted productIds string to array:', req.body.productIds);
  }

  // Handle marketplaces - convert string to array if needed
  if (req.body.marketplaces && typeof req.body.marketplaces === 'string') {
    req.body.marketplaces = req.body.marketplaces.split(',').map((m: string) => m.trim());
    // console.log('Controller: Converted marketplaces string to array:', req.body.marketplaces);
  }

  // Set the company ID from the authenticated user
  const campaignData = {
    ...req.body,
    companyId: req.user.companyId
  };

  const campaign = await campaignService.createCampaign(campaignData);
  res.status(httpStatus.CREATED).send(campaign);
});

const getCampaigns = catchAsync(async (req: Request, res: Response) => {
  // Process query parameters to ensure proper types
  const query: Record<string, any> = {};

  // Copy and convert query parameters
  if (req.query.title) query.title = req.query.title;
  if (req.query.isActive) query.isActive = req.query.isActive;
  if (req.query.promotionId) query.promotionId = Number(req.query.promotionId);
  if (req.query.companyId) query.companyId = Number(req.query.companyId);
  if (req.query.claims) query.claims = Number(req.query.claims);

  // Ensure limit and page are valid numbers
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const page = req.query.page ? Number(req.query.page) : undefined;

  const result = await campaignService.queryCampaigns(query, {
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    limit,
    page
  });
  res.send(result);
});

const getCampaign = catchAsync(async (req: Request, res: Response) => {
  const campaign = await campaignService.getCampaignById(Number(req.params.campaignId));
  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }
  res.send(campaign);
});

const updateCampaign = catchAsync(async (req: Request, res: Response) => {
  const campaign = await campaignService.updateCampaignById(
    Number(req.params.campaignId),
    req.body
  );
  res.send(campaign);
});

const deleteCampaign = catchAsync(async (req: Request, res: Response) => {
  await campaignService.deleteCampaignById(Number(req.params.campaignId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign
};
