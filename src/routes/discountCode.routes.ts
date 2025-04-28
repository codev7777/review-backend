import { Router } from 'express';
import {
  createDiscountCode,
  getDiscountCodes,
  getDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from '../controllers/discountCode.controller';
import { isAdmin } from '../middlewares/auth.middleware';
const router = Router();

// All routes require admin authentication
router.use(isAdmin);

router.post('/', createDiscountCode);
router.get('/', getDiscountCodes);
router.get('/:id', getDiscountCode);
router.put('/:id', updateDiscountCode);
router.delete('/:id', deleteDiscountCode);

export default router; 