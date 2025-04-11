import Joi from 'joi';

const createCompany = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    detail: Joi.string(),
    logo: Joi.string(),
    websiteUrl: Joi.string().uri(),
    planId: Joi.number().integer().optional(),
    // These fields are optional in the request but will have default values (0)
    ratio: Joi.number().default(0),
    reviews: Joi.number().integer().default(0)
  })
};

const getCompanies = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getCompany = {
  params: Joi.object().keys({
    companyId: Joi.number().integer()
  })
};

const updateCompany = {
  params: Joi.object().keys({
    companyId: Joi.number().integer()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      detail: Joi.string(),
      logo: Joi.string(),
      websiteUrl: Joi.string().uri(),
      planId: Joi.number().integer(),
      ratio: Joi.number(),
      reviews: Joi.number().integer()
    })
    .min(1)
};

const deleteCompany = {
  params: Joi.object().keys({
    companyId: Joi.number().integer()
  })
};

export default {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany
};
