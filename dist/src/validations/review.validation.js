"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReviewUpdate = exports.reviewUpdateSchema = exports.validateCreateReview = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
const createReviewSchema = joi_1.default.object().keys({
    email: joi_1.default.string().required().email(),
    name: joi_1.default.string().required(),
    productId: joi_1.default.number().integer().required(),
    ratio: joi_1.default.number().min(1).max(5).required(),
    feedback: joi_1.default.string().required().min(10),
    marketplace: joi_1.default.string()
        .required()
        .valid(...Object.values(client_1.Marketplace)),
    orderNo: joi_1.default.string(),
    promotionId: joi_1.default.number().integer()
});
const validateCreateReview = (data) => {
    const { error, value } = createReviewSchema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((detail) => detail.message).join(', '));
    }
    return value;
};
exports.validateCreateReview = validateCreateReview;
exports.reviewUpdateSchema = joi_1.default.object({
    status: joi_1.default.string().valid('PENDING', 'PROCESSED', 'REJECTED').required()
});
const validateReviewUpdate = (data) => {
    const { error, value } = exports.reviewUpdateSchema.validate(data);
    if (error) {
        throw new Error(error.details[0].message);
    }
    return value;
};
exports.validateReviewUpdate = validateReviewUpdate;
exports.default = {
    validateCreateReview: exports.validateCreateReview,
    validateReviewUpdate: exports.validateReviewUpdate
};
//# sourceMappingURL=review.validation.js.map