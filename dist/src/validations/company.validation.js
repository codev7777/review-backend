"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const createCompany = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        detail: joi_1.default.string(),
        logo: joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Logo must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
        websiteUrl: joi_1.default.string().uri(),
        planId: joi_1.default.number().integer().optional(),
        ratio: joi_1.default.number().default(0),
        reviews: joi_1.default.number().integer().default(0)
    })
};
const getCompanies = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer()
    })
};
const getCompany = {
    params: joi_1.default.object().keys({
        companyId: joi_1.default.number().integer()
    })
};
const updateCompany = {
    params: joi_1.default.object().keys({
        companyId: joi_1.default.number().integer()
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string(),
        detail: joi_1.default.string(),
        logo: joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Logo must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        }),
        websiteUrl: joi_1.default.string().uri(),
        planId: joi_1.default.number().integer(),
        ratio: joi_1.default.number(),
        reviews: joi_1.default.number().integer()
    })
        .min(1)
};
const deleteCompany = {
    params: joi_1.default.object().keys({
        companyId: joi_1.default.number().integer()
    })
};
exports.default = {
    createCompany,
    getCompanies,
    getCompany,
    updateCompany,
    deleteCompany
};
//# sourceMappingURL=company.validation.js.map