import { Request, Response } from 'express';
import httpStatus from 'http-status';
import promotionService from '../services/promotion.service';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

const createPromotion = catchAsync(async (req: Request, res: Response) => {
  // Get the user's company ID
  const userId = (req.user as any).id;
  const user = await userService.getUserById(userId);

  if (!user || !user.companyId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User must be associated with a company to create promotions'
    );
  }

  // Add the company ID to the promotion data
  const promotionData = {
    ...req.body,
    companyId: user.companyId
  };

  const promotion = await promotionService.createPromotion(promotionData);
  res.status(httpStatus.CREATED).send(promotion);
});

const getPromotions = catchAsync(async (req: Request, res: Response) => {
  // Get the user's company ID
  const userId = (req.user as any).id;
  const user = await userService.getUserById(userId);

  if (!user || !user.companyId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User must be associated with a company to view promotions'
    );
  }

  // Use companyId from query params if provided, otherwise use user's companyId
  const filter = {
    ...req.query,
    companyId: req.query.companyId ? Number(req.query.companyId) : user.companyId
  };

  // Ensure the user can only access promotions from their company
  if (filter.companyId !== user.companyId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to access promotions from other companies'
    );
  }

  const result = await promotionService.queryPromotions(filter, req.query);

  // Format response to match frontend expectations
  res.send({
    data: result.results,
    totalPages: result.totalPages,
    totalCount: result.total
  });
});

const getPromotion = catchAsync(async (req: Request, res: Response) => {
  const promotion = await promotionService.getPromotionById(Number(req.params.promotionId));
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  // Check if the promotion belongs to the user's company
  const userId = (req.user as any).id;
  const user = await userService.getUserById(userId);

  if (!user || !user.companyId || promotion.companyId !== user.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this promotion');
  }

  res.send(promotion);
});

const updatePromotion = catchAsync(async (req: Request, res: Response) => {
  const promotion = await promotionService.getPromotionById(Number(req.params.promotionId));
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  // Check if the promotion belongs to the user's company
  const userId = (req.user as any).id;
  const user = await userService.getUserById(userId);

  if (!user || !user.companyId || promotion.companyId !== user.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this promotion');
  }

  const updatedPromotion = await promotionService.updatePromotionById(
    Number(req.params.promotionId),
    req.body
  );
  res.send(updatedPromotion);
});

const deletePromotion = catchAsync(async (req: Request, res: Response) => {
  const promotion = await promotionService.getPromotionById(Number(req.params.promotionId));
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  // Check if the promotion belongs to the user's company
  const userId = (req.user as any).id;
  const user = await userService.getUserById(userId);

  if (!user || !user.companyId || promotion.companyId !== user.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this promotion');
  }

  await promotionService.deletePromotionById(Number(req.params.promotionId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion
};
