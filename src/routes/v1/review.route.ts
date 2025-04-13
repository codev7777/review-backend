import express from 'express';
import reviewController from '../../controllers/review.controller';
import validate from '../../middlewares/validate';
import reviewValidation from '../../validations/review.validation';

const router = express.Router();

router.route('/').post(validate(reviewValidation.createReview), reviewController.createReview);

export default router;
