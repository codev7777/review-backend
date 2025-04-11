import Joi from 'joi';

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string()
  })
};

const getCategories = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getCategory = {
  params: Joi.object().keys({
    categoryId: Joi.number().integer().required()
  })
};

const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string()
    })
    .min(1)
};

const deleteCategory = {
  params: Joi.object().keys({
    categoryId: Joi.number().integer().required()
  })
};

export default {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
};
