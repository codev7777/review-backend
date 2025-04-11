import express from 'express';
import productController from '../../controllers/product.controller';
import validate from '../../middlewares/validate';
import productValidation from '../../validations/product.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(productValidation.createProduct), productController.createProduct)
  .get(auth(), productController.getProducts);

router
  .route('/:productId')
  .get(auth(), validate(productValidation.getProduct), productController.getProduct)
  .patch(auth(), validate(productValidation.updateProduct), productController.updateProduct)
  .delete(auth(), validate(productValidation.deleteProduct), productController.deleteProduct);

export default router;
