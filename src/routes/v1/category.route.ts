import express from 'express';
import { categoryController } from '../../controllers';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { categoryValidation } from '../../validations';

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageCategories'),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  )
  .get(validate(categoryValidation.getCategories), categoryController.getCategories);

router
  .route('/:categoryId')
  .get(validate(categoryValidation.getCategory), categoryController.getCategory)
  .patch(
    auth('manageCategories'),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    auth('manageCategories'),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

export default router;
