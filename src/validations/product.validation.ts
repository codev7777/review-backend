import Joi from 'joi';

const createProduct = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.alternatives().try(
      Joi.string()
        .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
        .messages({
          'string.pattern.base':
            'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
      // Allow the image to be provided as a file (handled by multer)
      Joi.any()
    ),
    companyId: Joi.number().required(),
    categoryId: Joi.number().required(),
    asin: Joi.string()
      .pattern(/^[A-Z0-9]{10}$/)
      .messages({
        'string.pattern.base': 'ASIN must be a 10-character alphanumeric string'
      })
  })
};

const getProducts = {
  query: Joi.object().keys({
    title: Joi.string(),
    companyId: Joi.number(),
    categoryId: Joi.number(),
    asin: Joi.string(),
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
      image: Joi.alternatives().try(
        Joi.string()
          .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
          .messages({
            'string.pattern.base':
              'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
          }),
        // Allow the image to be provided as a file (handled by multer)
        Joi.any()
      ),
      companyId: Joi.number(),
      categoryId: Joi.number(),
      asin: Joi.string()
        .pattern(/^[A-Z0-9]{10}$/)
        .messages({
          'string.pattern.base': 'ASIN must be a 10-character alphanumeric string'
        })
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
