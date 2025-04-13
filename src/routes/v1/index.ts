import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import companyRoute from './company.route';
import categoryRoute from './category.route';
import docsRoute from './docs.route';
import config from '../../config/config';
import productRoute from './product.route';
import promotionRoute from './promotion.route';
import campaignRoute from './campaign.route';
import healthRoute from './health.route';
import imageRoute from './image.route';
import reviewRoute from './review.route';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRoute);

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/users',
    route: userRoute
  },
  {
    path: '/companies',
    route: companyRoute
  },
  {
    path: '/categories',
    route: categoryRoute
  },
  {
    path: '/products',
    route: productRoute
  },
  {
    path: '/promotions',
    route: promotionRoute
  },
  {
    path: '/campaigns',
    route: campaignRoute
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

// Documentation route
if (config.env === 'development') {
  router.use('/docs', docsRoute);
}

// API routes
router.use('/images', imageRoute);

// Review routes
router.use('/reviews', reviewRoute);

export default router;
