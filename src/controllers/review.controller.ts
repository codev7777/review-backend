import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import reviewService from '../services/review.service';
import ApiError from '../utils/ApiError';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.createReview({
    ...req.body,
    ratio: Number(req.body.rating), // Convert rating to ratio
    marketplace: req.body.country.toUpperCase() // Convert country to marketplace
  });
  res.status(httpStatus.CREATED).send(review);
});

export default {
  createReview
};
