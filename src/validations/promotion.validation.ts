import Joi from 'joi';

const createPromotion = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    image: Joi.string().required(),
    promotionType: Joi.string()
      .valid('GIFT_CARD', 'DISCOUNT_CODE', 'FREE_PRODUCT', 'DIGITAL_DOWNLOAD')
      .required(),
    description: Joi.string().required()
  })
};

const getPromotions = {
  query: Joi.object().keys({
    title: Joi.string(),
    promotionType: Joi.string().valid(
      'GIFT_CARD',
      'DISCOUNT_CODE',
      'FREE_PRODUCT',
      'DIGITAL_DOWNLOAD'
    ),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getPromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().required()
  })
};

const updatePromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().required()
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      image: Joi.string(),
      promotionType: Joi.string().valid(
        'GIFT_CARD',
        'DISCOUNT_CODE',
        'FREE_PRODUCT',
        'DIGITAL_DOWNLOAD'
      ),
      description: Joi.string()
    })
    .min(1)
};

const deletePromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().required()
  })
};

export default {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion
};
