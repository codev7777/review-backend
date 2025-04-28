import express from 'express';
import auth from '../../middlewares/auth';
import { getAdminDashboard } from '../../controllers/admin.controller';
import discountCodeRoutes from '../../routes/discountCode.routes';

const router = express.Router();

router.get('/dashboard', auth(), getAdminDashboard);
router.use('/discount-codes', discountCodeRoutes);

export default router;
