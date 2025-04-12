import express from 'express';
import productController from '../../controllers/product.controller';
import validate from '../../middlewares/validate';
import productValidation from '../../validations/product.validation';
import auth from '../../middlewares/auth';
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
    auth(),
    upload.single('image'),
    validate(productValidation.createProduct),
    productController.createProduct
  )
  .get(auth(), productController.getProducts);

router
  .route('/:productId')
  .get(auth(), validate(productValidation.getProduct), productController.getProduct)
  .patch(
    auth(),
    upload.single('image'),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(auth(), validate(productValidation.deleteProduct), productController.deleteProduct);

export default router;
