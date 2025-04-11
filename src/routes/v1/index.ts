import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import companyRoute from './company.route';
import categoryRoute from './category.route';
import docsRoute from './docs.route';
import config from '../../config/config';
import productRoute from './product.route';
import promotionRoute from './promotion.route';

const router = express.Router();

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

export default router;
