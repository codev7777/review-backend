import express from 'express';
import promotionController from '../../controllers/promotion.controller';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import promotionValidation from '../../validations/promotion.validation';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(promotionValidation.createPromotion), promotionController.createPromotion)
  .get(auth(), validate(promotionValidation.getPromotions), promotionController.getPromotions);

router
  .route('/:promotionId')
  .get(auth(), validate(promotionValidation.getPromotion), promotionController.getPromotion)
  .patch(auth(), validate(promotionValidation.updatePromotion), promotionController.updatePromotion)
  .delete(
    auth(),
    validate(promotionValidation.deletePromotion),
    promotionController.deletePromotion
  );

export default router;
