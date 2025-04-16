"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_service_1 = require("../../services/review.service");
const client_1 = __importDefault(require("../../client"));
const router = express_1.default.Router();
router.get('/campaigns/:campaignId', async (req, res, next) => {
    try {
        const campaignId = parseInt(req.params.campaignId);
        const campaign = await client_1.default.campaign.findUnique({
            where: { id: campaignId },
            include: {
                promotion: true
            }
        });
        if (!campaign) {
            res.status(404).json({ message: 'Campaign not found' });
            return;
        }
        res.json(campaign);
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/products/:productId', async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId);
        const product = await client_1.default.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }
        res.json(product);
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
router.get('/products', async (req, res, next) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            res.status(400).json({ message: 'Product IDs are required' });
            return;
        }
        const productIds = String(ids)
            .split(',')
            .map((id) => parseInt(id));
        const products = await client_1.default.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            }
        });
        res.json({
            results: products,
            total: products.length,
            totalPages: 1
        });
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
router.post('/reviews', async (req, res, next) => {
    try {
        const review = await review_service_1.reviewService.createReview(req.body);
        res.status(201).json(review);
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=public.route.js.map