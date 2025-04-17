import Joi from 'joi';
import { Marketplace } from '@prisma/client';

const createReviewSchema = Joi.object().keys({
  email: Joi.string().required().email(),
  name: Joi.string().required(),
  productId: Joi.number().integer().required(),
  ratio: Joi.number().min(1).max(5).required(),
  feedback: Joi.string().required().min(10),
  marketplace: Joi.string()
    .required()
    .valid(...Object.values(Marketplace)),
  orderNo: Joi.string(),
  promotionId: Joi.number().integer(),
  campaignId: Joi.number().integer()
});

export const validateCreateReview = (data: any) => {
  const { error, value } = createReviewSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(', '));
  }
  return value;
};

export const reviewUpdateSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSED', 'REJECTED').required()
});

export const validateReviewUpdate = (data: any) => {
  const { error, value } = reviewUpdateSchema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return value;
};

export default {
  validateCreateReview,
  validateReviewUpdate
};
