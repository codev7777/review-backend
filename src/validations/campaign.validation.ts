import Joi from 'joi';

const createCampaign = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    isActive: Joi.string().valid('YES', 'NO').default('YES'),
    promotionId: Joi.number().required(),
    productIds: Joi.alternatives().try(
      Joi.array().items(Joi.number()).required(),
      Joi.string().required()
    ),
    marketplaces: Joi.alternatives().try(
      Joi.array()
        .items(
          Joi.string().valid(
            'US',
            'CA',
            'MX',
            'GB',
            'FR',
            'DE',
            'IT',
            'ES',
            'IN',
            'JP',
            'NL',
            'SE',
            'AU',
            'BR',
            'SG',
            'TR',
            'SA',
            'AE',
            'PL',
            'EG',
            'ZA'
          )
        )
        .required(),
      Joi.string().required()
    ),
    claims: Joi.number().default(0)
  })
};

const getCampaigns = {
  query: Joi.object().keys({
    title: Joi.string(),
    isActive: Joi.string().valid('YES', 'NO'),
    promotionId: Joi.number(),
    companyId: Joi.number(),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getCampaign = {
  params: Joi.object().keys({
    campaignId: Joi.number().required()
  })
};

const updateCampaign = {
  params: Joi.object().keys({
    campaignId: Joi.number().required()
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      isActive: Joi.string().valid('YES', 'NO'),
      promotionId: Joi.number(),
      productIds: Joi.alternatives().try(Joi.array().items(Joi.number()), Joi.string()),
      marketplaces: Joi.alternatives().try(
        Joi.array().items(
          Joi.string().valid(
            'US',
            'CA',
            'MX',
            'GB',
            'FR',
            'DE',
            'IT',
            'ES',
            'IN',
            'JP',
            'NL',
            'SE',
            'AU',
            'BR',
            'SG',
            'TR',
            'SA',
            'AE',
            'PL',
            'EG',
            'ZA'
          )
        ),
        Joi.string()
      ),
      claims: Joi.number()
    })
    .min(1)
};

const deleteCampaign = {
  params: Joi.object().keys({
    campaignId: Joi.number().required()
  })
};

export default {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign
};
