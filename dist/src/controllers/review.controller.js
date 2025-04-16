"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const review_service_1 = require("../services/review.service");
const review_validation_1 = require("../validations/review.validation");
const COUNTRY_TO_MARKETPLACE = {
    us: 'US',
    ca: 'CA',
    mx: 'MX',
    gb: 'GB',
    fr: 'FR',
    de: 'DE',
    it: 'IT',
    es: 'ES',
    in: 'IN',
    jp: 'JP',
    nl: 'NL',
    se: 'SE',
    au: 'AU',
    br: 'BR',
    sg: 'SG',
    tr: 'TR',
    sa: 'SA',
    ae: 'AE',
    pl: 'PL',
    eg: 'EG',
    za: 'ZA'
};
const createReview = async (req, res) => {
    try {
        const country = (req.body.country || '').toLowerCase();
        const marketplace = COUNTRY_TO_MARKETPLACE[country];
        if (!marketplace) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Invalid country. Must be one of: ${Object.keys(COUNTRY_TO_MARKETPLACE)
                .join(', ')
                .toUpperCase()}`);
        }
        const mappedData = {
            ...req.body,
            ratio: req.body.rating,
            marketplace: marketplace
        };
        delete mappedData.rating;
        delete mappedData.country;
        const validatedData = (0, review_validation_1.validateCreateReview)(mappedData);
        const review = await review_service_1.reviewService.createReview(validatedData);
        res.status(http_status_1.default.CREATED).send(review);
    }
    catch (error) {
        console.error('Error creating review:', error);
        if (error instanceof Error) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, error.message);
        }
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create review');
    }
};
const getCompanyReviews = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, page = 1, limit = 10, sortBy = 'feedbackDate', sortOrder = 'desc' } = req.query;
        const reviews = await review_service_1.reviewService.getCompanyReviews(Number(companyId), status, Number(page), Number(limit), sortBy, sortOrder);
        res.json(reviews);
    }
    catch (error) {
        console.error('Error getting company reviews:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to get reviews');
    }
};
const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = (0, review_validation_1.validateReviewUpdate)(req.body);
        const review = await review_service_1.reviewService.updateReviewStatus(Number(reviewId), status);
        res.json(review);
    }
    catch (error) {
        console.error('Error updating review status:', error);
        if (error instanceof Error) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, error.message);
        }
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to update review status');
    }
};
exports.default = {
    createReview,
    getCompanyReviews,
    updateReviewStatus
};
//# sourceMappingURL=review.controller.js.map