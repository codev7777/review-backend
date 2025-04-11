import Joi from 'joi';

const createProduct = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().required(),
    companyId: Joi.number().required(),
    categoryId: Joi.number().required()
  })
};

const getProducts = {
  query: Joi.object().keys({
    title: Joi.string(),
    companyId: Joi.number(),
    categoryId: Joi.number(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.number().required()
  })
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.number().required()
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      image: Joi.string(),
      companyId: Joi.number(),
      categoryId: Joi.number()
    })
    .min(1)
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.number().required()
  })
};

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};
