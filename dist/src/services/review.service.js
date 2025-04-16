"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const client_2 = __importDefault(require("../client"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const createOrUpdateCustomer = async (customerData) => {
    try {
        const existingCustomer = await client_2.default.customer.findUnique({
            where: { email: customerData.email }
        });
        if (existingCustomer) {
            const totalReviews = existingCustomer.reviews + 1;
            const newRatio = (existingCustomer.ratio * existingCustomer.reviews + customerData.ratio) / totalReviews;
            return client_2.default.customer.update({
                where: { id: existingCustomer.id },
                data: {
                    reviews: totalReviews,
                    ratio: newRatio
                }
            });
        }
        return client_2.default.customer.create({
            data: {
                email: customerData.email,
                name: customerData.name,
                reviews: 1,
                ratio: customerData.ratio || 0
            }
        });
    }
    catch (error) {
        console.error('Error creating/updating customer:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create/update customer');
    }
};
const createReview = async (reviewData) => {
    try {
        if (!reviewData.email ||
            !reviewData.name ||
            !reviewData.productId ||
            !reviewData.feedback ||
            !reviewData.marketplace) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Missing required fields');
        }
        let ratio = 0;
        if (reviewData.ratio !== undefined && reviewData.ratio !== null) {
            ratio = parseFloat(String(reviewData.ratio));
            if (isNaN(ratio)) {
                ratio = 0;
            }
        }
        const marketplace = reviewData.marketplace.toUpperCase();
        const validMarketplaces = Object.values(client_1.Marketplace);
        if (!validMarketplaces.includes(marketplace)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Invalid marketplace value. Must be one of: ${validMarketplaces.join(', ')}`);
        }
        const customer = await createOrUpdateCustomer({
            email: reviewData.email,
            name: reviewData.name,
            ratio: ratio
        });
        const review = await client_2.default.review.create({
            data: {
                email: reviewData.email,
                name: reviewData.name,
                productId: reviewData.productId,
                ratio: ratio,
                feedback: reviewData.feedback,
                marketplace: marketplace,
                orderNo: reviewData.orderNo,
                promotionId: reviewData.promotionId,
                customerId: customer.id,
                status: 'PENDING'
            },
            include: {
                Product: true,
                Customer: true
            }
        });
        await client_2.default.product.update({
            where: { id: reviewData.productId },
            data: {
                ratio: {
                    increment: ratio
                }
            }
        });
        const product = await client_2.default.product.findUnique({
            where: { id: reviewData.productId },
            include: { company: true }
        });
        if (product === null || product === void 0 ? void 0 : product.company) {
            await client_2.default.company.update({
                where: { id: product.company.id },
                data: {
                    ratio: {
                        increment: ratio
                    },
                    reviews: {
                        increment: 1
                    }
                }
            });
        }
        return review;
    }
    catch (error) {
        console.error('Error creating review:', error);
        if (error instanceof ApiError_1.default) {
            throw error;
        }
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create review');
    }
};
const getCompanyReviews = async (companyId, status, page = 1, limit = 10, sortBy = 'feedbackDate', sortOrder = 'desc') => {
    try {
        const where = {
            Product: {
                companyId: companyId
            }
        };
        if (status) {
            where.status = status;
        }
        const [reviews, total] = await Promise.all([
            client_2.default.review.findMany({
                where,
                include: {
                    Product: {
                        select: {
                            title: true,
                            image: true,
                            asin: true
                        }
                    },
                    Customer: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    feedbackDate: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            client_2.default.review.count({ where })
        ]);
        return { reviews, total };
    }
    catch (error) {
        console.error('Error getting company reviews:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to get reviews');
    }
};
const updateReviewStatus = async (reviewId, status) => {
    try {
        const review = await client_2.default.review.update({
            where: { id: reviewId },
            data: { status }
        });
        return review;
    }
    catch (error) {
        console.error('Error updating review status:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to update review status');
    }
};
exports.reviewService = {
    createReview,
    createOrUpdateCustomer,
    getCompanyReviews,
    updateReviewStatus
};
//# sourceMappingURL=review.service.js.map