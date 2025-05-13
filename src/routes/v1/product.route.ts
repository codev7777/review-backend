import express from 'express';
import productController from '../../controllers/product.controller';
import validate from '../../middlewares/validate';
import productValidation from '../../validations/product.validation';
import multer from 'multer';

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router
  .route('/')
  .post(
    validate(productValidation.createProduct),
    upload.single('image'),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(validate(productValidation.getProduct), productController.getProducts);

router
  .route('/:productId')
  .get(validate(productValidation.getProduct), productController.getProduct)
  .patch(
    validate(productValidation.getProduct),
    upload.single('image'),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(validate(productValidation.deleteProduct), productController.deleteProduct);

export default router;
