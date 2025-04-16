"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const createPromotion = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().required(),
        image: joi_1.default.string()
            .required()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
        promotionType: joi_1.default.string()
            .valid('GIFT_CARD', 'DISCOUNT_CODE', 'FREE_PRODUCT', 'DIGITAL_DOWNLOAD')
            .required(),
        description: joi_1.default.string().required(),
        giftCardDeliveryMethod: joi_1.default.when('promotionType', {
            is: 'GIFT_CARD',
            then: joi_1.default.string().valid('SHIP', 'DIGITAL').required(),
            otherwise: joi_1.default.forbidden()
        }),
        approvalMethod: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.string().valid('MANUAL', 'AUTOMATIC').required(),
            otherwise: joi_1.default.forbidden()
        }),
        codeType: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.string().valid('SAME_FOR_ALL', 'SINGLE_USE').required(),
            otherwise: joi_1.default.forbidden()
        }),
        couponCodes: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
            otherwise: joi_1.default.forbidden()
        }),
        freeProductDeliveryMethod: joi_1.default.when('promotionType', {
            is: 'FREE_PRODUCT',
            then: joi_1.default.string().valid('SHIP').default('SHIP'),
            otherwise: joi_1.default.forbidden()
        }),
        freeProductApprovalMethod: joi_1.default.when('promotionType', {
            is: 'FREE_PRODUCT',
            then: joi_1.default.string().valid('MANUAL').default('MANUAL'),
            otherwise: joi_1.default.forbidden()
        }),
        downloadableFileUrl: joi_1.default.when('promotionType', {
            is: 'DIGITAL_DOWNLOAD',
            then: joi_1.default.string().uri().required(),
            otherwise: joi_1.default.forbidden()
        }),
        digitalApprovalMethod: joi_1.default.when('promotionType', {
            is: 'DIGITAL_DOWNLOAD',
            then: joi_1.default.string().valid('MANUAL', 'AUTOMATIC').required(),
            otherwise: joi_1.default.forbidden()
        })
    })
};
const getPromotions = {
    query: joi_1.default.object().keys({
        title: joi_1.default.string(),
        promotionType: joi_1.default.string().valid('GIFT_CARD', 'DISCOUNT_CODE', 'FREE_PRODUCT', 'DIGITAL_DOWNLOAD'),
        companyId: joi_1.default.number().integer(),
        sortBy: joi_1.default.string(),
        sortOrder: joi_1.default.string().valid('asc', 'desc'),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer()
    })
};
const getPromotion = {
    params: joi_1.default.object().keys({
        promotionId: joi_1.default.number().required()
    })
};
const updatePromotion = {
    params: joi_1.default.object().keys({
        promotionId: joi_1.default.number().required()
    }),
    body: joi_1.default.object()
        .keys({
        title: joi_1.default.string(),
        image: joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
        promotionType: joi_1.default.string().valid('GIFT_CARD', 'DISCOUNT_CODE', 'FREE_PRODUCT', 'DIGITAL_DOWNLOAD'),
        description: joi_1.default.string(),
        giftCardDeliveryMethod: joi_1.default.when('promotionType', {
            is: 'GIFT_CARD',
            then: joi_1.default.string().valid('SHIP', 'DIGITAL'),
            otherwise: joi_1.default.forbidden()
        }),
        approvalMethod: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.string().valid('MANUAL', 'AUTOMATIC'),
            otherwise: joi_1.default.forbidden()
        }),
        codeType: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.string().valid('SAME_FOR_ALL', 'SINGLE_USE'),
            otherwise: joi_1.default.forbidden()
        }),
        couponCodes: joi_1.default.when('promotionType', {
            is: 'DISCOUNT_CODE',
            then: joi_1.default.array().items(joi_1.default.string()).min(1),
            otherwise: joi_1.default.forbidden()
        }),
        freeProductDeliveryMethod: joi_1.default.when('promotionType', {
            is: 'FREE_PRODUCT',
            then: joi_1.default.string().valid('SHIP').default('SHIP'),
            otherwise: joi_1.default.forbidden()
        }),
        freeProductApprovalMethod: joi_1.default.when('promotionType', {
            is: 'FREE_PRODUCT',
            then: joi_1.default.string().valid('MANUAL').default('MANUAL'),
            otherwise: joi_1.default.forbidden()
        }),
        downloadableFileUrl: joi_1.default.when('promotionType', {
            is: 'DIGITAL_DOWNLOAD',
            then: joi_1.default.string().uri(),
            otherwise: joi_1.default.forbidden()
        }),
        digitalApprovalMethod: joi_1.default.when('promotionType', {
            is: 'DIGITAL_DOWNLOAD',
            then: joi_1.default.string().valid('MANUAL', 'AUTOMATIC'),
            otherwise: joi_1.default.forbidden()
        })
    })
        .min(1)
};
const deletePromotion = {
    params: joi_1.default.object().keys({
        promotionId: joi_1.default.number().required()
    })
};
exports.default = {
    createPromotion,
    getPromotions,
    getPromotion,
    updatePromotion,
    deletePromotion
};
//# sourceMappingURL=promotion.validation.js.map