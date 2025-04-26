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
    description: Joi.string().required(),

    // Gift Card specific fields
    giftCardDeliveryMethod: Joi.when('promotionType', {
      is: 'GIFT_CARD',
      then: Joi.string().valid('SHIP', 'DIGITAL').required(),
      otherwise: Joi.forbidden()
    }),

    // Discount Code specific fields
    approvalMethod: Joi.when('promotionType', {
      is: 'DISCOUNT_CODE',
      then: Joi.string().valid('MANUAL', 'AUTOMATIC').required(),
      otherwise: Joi.forbidden()
    }),
    codeType: Joi.when('promotionType', {
      is: 'DISCOUNT_CODE',
      then: Joi.string().valid('SAME_FOR_ALL', 'SINGLE_USE').required(),
      otherwise: Joi.forbidden()
    }),
    couponCodes: Joi.when('promotionType', {
      is: 'DISCOUNT_CODE',
      then: Joi.array().items(Joi.string()).min(1).required(),
      otherwise: Joi.forbidden()
    }),

    // Free Product specific fields (fixed values)
    freeProductDeliveryMethod: Joi.when('promotionType', {
      is: 'FREE_PRODUCT',
      then: Joi.string().valid('SHIP').default('SHIP'),
      otherwise: Joi.forbidden()
    }),
    freeProductApprovalMethod: Joi.when('promotionType', {
      is: 'FREE_PRODUCT',
      then: Joi.string().valid('MANUAL').default('MANUAL'),
      otherwise: Joi.forbidden()
    }),

    // Digital Download specific fields
    downloadableFileUrl: Joi.when('promotionType', {
      is: 'DIGITAL_DOWNLOAD',
      then: Joi.alternatives()
        .try(Joi.string().uri(), Joi.string().pattern(/^data:application\/pdf;base64,/))
        .required(),
      otherwise: Joi.forbidden()
    }),
    digitalApprovalMethod: Joi.when('promotionType', {
      is: 'DIGITAL_DOWNLOAD',
      then: Joi.string().valid('MANUAL', 'AUTOMATIC').required(),
      otherwise: Joi.forbidden()
    })
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
      description: Joi.string(),

      // Gift Card specific fields
      giftCardDeliveryMethod: Joi.when('promotionType', {
        is: 'GIFT_CARD',
        then: Joi.string().valid('SHIP', 'DIGITAL'),
        otherwise: Joi.forbidden()
      }),

      // Discount Code specific fields
      approvalMethod: Joi.when('promotionType', {
        is: 'DISCOUNT_CODE',
        then: Joi.string().valid('MANUAL', 'AUTOMATIC'),
        otherwise: Joi.forbidden()
      }),
      codeType: Joi.when('promotionType', {
        is: 'DISCOUNT_CODE',
        then: Joi.string().valid('SAME_FOR_ALL', 'SINGLE_USE'),
        otherwise: Joi.forbidden()
      }),
      couponCodes: Joi.when('promotionType', {
        is: 'DISCOUNT_CODE',
        then: Joi.array().items(Joi.string()).min(1),
        otherwise: Joi.forbidden()
      }),

      // Free Product specific fields (fixed values)
      freeProductDeliveryMethod: Joi.when('promotionType', {
        is: 'FREE_PRODUCT',
        then: Joi.string().valid('SHIP').default('SHIP'),
        otherwise: Joi.forbidden()
      }),
      freeProductApprovalMethod: Joi.when('promotionType', {
        is: 'FREE_PRODUCT',
        then: Joi.string().valid('MANUAL').default('MANUAL'),
        otherwise: Joi.forbidden()
      }),

      // Digital Download specific fields
      downloadableFileUrl: Joi.when('promotionType', {
        is: 'DIGITAL_DOWNLOAD',
        then: Joi.alternatives()
          .try(Joi.string().uri(), Joi.string().pattern(/^data:application\/pdf;base64,/))
          .required(),
        otherwise: Joi.forbidden()
      }),
      digitalApprovalMethod: Joi.when('promotionType', {
        is: 'DIGITAL_DOWNLOAD',
        then: Joi.string().valid('MANUAL', 'AUTOMATIC'),
        otherwise: Joi.forbidden()
      })
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
