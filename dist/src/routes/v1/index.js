"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = __importDefault(require("./auth.route"));
const user_route_1 = __importDefault(require("./user.route"));
const company_route_1 = __importDefault(require("./company.route"));
const category_route_1 = __importDefault(require("./category.route"));
const docs_route_1 = __importDefault(require("./docs.route"));
const config_1 = __importDefault(require("../../config/config"));
const product_route_1 = __importDefault(require("./product.route"));
const promotion_route_1 = __importDefault(require("./promotion.route"));
const campaign_route_1 = __importDefault(require("./campaign.route"));
const health_route_1 = __importDefault(require("./health.route"));
const image_route_1 = __importDefault(require("./image.route"));
const review_route_1 = __importDefault(require("./review.route"));
const public_route_1 = __importDefault(require("./public.route"));
const router = express_1.default.Router();
router.use('/health', health_route_1.default);
router.use('/public', public_route_1.default);
const defaultRoutes = [
    {
        path: '/auth',
        route: auth_route_1.default
    },
    {
        path: '/users',
        route: user_route_1.default
    },
    {
        path: '/companies',
        route: company_route_1.default
    },
    {
        path: '/categories',
        route: category_route_1.default
    },
    {
        path: '/products',
        route: product_route_1.default
    },
    {
        path: '/promotions',
        route: promotion_route_1.default
    },
    {
        path: '/campaigns',
        route: campaign_route_1.default
    }
];
const devRoutes = [
    {
        path: '/docs',
        route: docs_route_1.default
    }
];
defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
if (config_1.default.env === 'development') {
    devRoutes.forEach((route) => {
        router.use(route.path, route.route);
    });
}
if (config_1.default.env === 'development') {
    router.use('/docs', docs_route_1.default);
}
router.use('/images', image_route_1.default);
router.use('/reviews', review_route_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map