import express from 'express';
import auth from '../../middlewares/auth';
import { getAdminDashboard } from '../../controllers/admin.controller';

const router = express.Router();

router.get('/dashboard', auth(), getAdminDashboard);

export default router;
