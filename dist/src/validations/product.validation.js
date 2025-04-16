"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const createProduct = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().required(),
        description: joi_1.default.string().required(),
        image: joi_1.default.alternatives().try(joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }), joi_1.default.any()),
        companyId: joi_1.default.number().required(),
        categoryId: joi_1.default.number().required(),
        asin: joi_1.default.string()
            .pattern(/^[A-Z0-9]{10}$/)
            .messages({
            'string.pattern.base': 'ASIN must be a 10-character alphanumeric string'
        })
    })
};
const getProducts = {
    query: joi_1.default.object().keys({
        title: joi_1.default.string(),
        companyId: joi_1.default.number(),
        categoryId: joi_1.default.number(),
        asin: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer()
    })
};
const getProduct = {
    params: joi_1.default.object().keys({
        productId: joi_1.default.number().required()
    })
};
const updateProduct = {
    params: joi_1.default.object().keys({
        productId: joi_1.default.number().required()
    }),
    body: joi_1.default.object()
        .keys({
        title: joi_1.default.string(),
        description: joi_1.default.string(),
        image: joi_1.default.alternatives().try(joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }), joi_1.default.any()),
        companyId: joi_1.default.number(),
        categoryId: joi_1.default.number(),
        asin: joi_1.default.string()
            .pattern(/^[A-Z0-9]{10}$/)
            .messages({
            'string.pattern.base': 'ASIN must be a 10-character alphanumeric string'
        })
    })
        .min(1)
};
const deleteProduct = {
    params: joi_1.default.object().keys({
        productId: joi_1.default.number().required()
    })
};
exports.default = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
};
//# sourceMappingURL=product.validation.js.map