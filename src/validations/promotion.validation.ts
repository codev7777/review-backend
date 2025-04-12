import Joi from 'joi';

const createPromotion = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    image: Joi.string()
      .required()
      .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
      .messages({
        'string.pattern.base':
          'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
      }),
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
    companyId: Joi.number().integer(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
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
      image: Joi.string()
        .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
        .messages({
          'string.pattern.base':
            'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
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
