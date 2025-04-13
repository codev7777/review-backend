import Joi from 'joi';
import { Marketplace } from '@prisma/client';

const createReview = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required(),
    productId: Joi.number().integer().required(),
    rating: Joi.number().min(1).max(5).required(),
    feedback: Joi.string().required().min(40),
    country: Joi.string().required(),
    orderNo: Joi.string(),
    promotionId: Joi.number().integer()
  })
};

export default {
  createReview
};
