import Joi from 'joi';

const createCompany = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    websiteUrl: Joi.string().required(),
    detail: Joi.string().required(),
    logo: Joi.string().allow(null),
    metaPixelId: Joi.string().allow(null)
  })
};

const getCompanies = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    search: Joi.string().allow(''),
    sortBy: Joi.string().valid('createdAt', 'name', 'role'),
    sortType: Joi.string().valid('asc', 'desc')
  })
};

const getCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().required()
  })
};

const updateCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().required()
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    websiteUrl: Joi.string(),
    detail: Joi.string(),
    logo: Joi.string().allow(null),
    metaPixelId: Joi.string().allow(null),
    ratio: Joi.number().allow(null),
    reviews: Joi.array()
      .items(
        Joi.object({
          id: Joi.number(),
          rating: Joi.number(),
          comment: Joi.string(),
          createdAt: Joi.date(),
          updatedAt: Joi.date()
        })
      )
      .allow(null)
  })
};

const deleteCompany = {
  params: Joi.object().keys({
    companyId: Joi.string().required()
  })
};

const inviteUser = {
  params: Joi.object().keys({
    companyId: Joi.number().required()
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required()
  })
};

export const companyValidation = {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  inviteUser
};
