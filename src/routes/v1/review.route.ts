import express from 'express';
import reviewController from '../../controllers/review.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/', auth(), reviewController.createReview);
router.get('/company/:companyId', auth(), reviewController.getCompanyReviews);
router.patch('/:reviewId/status', auth(), reviewController.updateReviewStatus);
export default router;
