"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const promotion_service_1 = __importDefault(require("../services/promotion.service"));
const user_service_1 = __importDefault(require("../services/user.service"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const createPromotion = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const user = await user_service_1.default.getUserById(userId);
    if (!user || !user.companyId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User must be associated with a company to create promotions');
    }
    const promotionData = {
        ...req.body,
        companyId: user.companyId
    };
    const promotion = await promotion_service_1.default.createPromotion(promotionData);
    res.status(http_status_1.default.CREATED).send(promotion);
});
const getPromotions = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const user = await user_service_1.default.getUserById(userId);
    if (!user || !user.companyId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User must be associated with a company to view promotions');
    }
    const filter = {
        ...req.query,
        companyId: req.query.companyId ? Number(req.query.companyId) : user.companyId
    };
    if (filter.companyId !== user.companyId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You do not have permission to access promotions from other companies');
    }
    const result = await promotion_service_1.default.queryPromotions(filter, req.query);
    res.send({
        data: result.results,
        totalPages: result.totalPages,
        totalCount: result.total
    });
});
const getPromotion = (0, catchAsync_1.default)(async (req, res) => {
    const promotion = await promotion_service_1.default.getPromotionById(Number(req.params.promotionId));
    if (!promotion) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Promotion not found');
    }
    const userId = req.user.id;
    const user = await user_service_1.default.getUserById(userId);
    if (!user || !user.companyId || promotion.companyId !== user.companyId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You do not have permission to access this promotion');
    }
    res.send(promotion);
});
const updatePromotion = (0, catchAsync_1.default)(async (req, res) => {
    const promotion = await promotion_service_1.default.getPromotionById(Number(req.params.promotionId));
    if (!promotion) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Promotion not found');
    }
    const userId = req.user.id;
    const user = await user_service_1.default.getUserById(userId);
    if (!user || !user.companyId || promotion.companyId !== user.companyId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You do not have permission to update this promotion');
    }
    const updatedPromotion = await promotion_service_1.default.updatePromotionById(Number(req.params.promotionId), req.body);
    res.send(updatedPromotion);
});
const deletePromotion = (0, catchAsync_1.default)(async (req, res) => {
    const promotion = await promotion_service_1.default.getPromotionById(Number(req.params.promotionId));
    if (!promotion) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Promotion not found');
    }
    const userId = req.user.id;
    const user = await user_service_1.default.getUserById(userId);
    if (!user || !user.companyId || promotion.companyId !== user.companyId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'You do not have permission to delete this promotion');
    }
    await promotion_service_1.default.deletePromotionById(Number(req.params.promotionId));
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    createPromotion,
    getPromotions,
    getPromotion,
    updatePromotion,
    deletePromotion
};
//# sourceMappingURL=promotion.controller.js.map