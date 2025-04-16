"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const createCampaign = {
    body: joi_1.default.object().keys({
        title: joi_1.default.string().required(),
        isActive: joi_1.default.string().valid('YES', 'NO').default('YES'),
        promotionId: joi_1.default.number().required(),
        productIds: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.number()).required(), joi_1.default.string().required()),
        marketplaces: joi_1.default.alternatives().try(joi_1.default.array()
            .items(joi_1.default.string().valid('US', 'CA', 'MX', 'GB', 'FR', 'DE', 'IT', 'ES', 'IN', 'JP', 'NL', 'SE', 'AU', 'BR', 'SG', 'TR', 'SA', 'AE', 'PL', 'EG', 'ZA'))
            .required(), joi_1.default.string().required()),
        claims: joi_1.default.number().default(0),
        image: joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        })
    })
};
const getCampaigns = {
    query: joi_1.default.object().keys({
        title: joi_1.default.string(),
        isActive: joi_1.default.string().valid('YES', 'NO'),
        promotionId: joi_1.default.number(),
        companyId: joi_1.default.number(),
        sortBy: joi_1.default.string(),
        sortOrder: joi_1.default.string().valid('asc', 'desc'),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer()
    })
};
const getCampaign = {
    params: joi_1.default.object().keys({
        campaignId: joi_1.default.number().required()
    })
};
const updateCampaign = {
    params: joi_1.default.object().keys({
        campaignId: joi_1.default.number().required()
    }),
    body: joi_1.default.object()
        .keys({
        title: joi_1.default.string(),
        isActive: joi_1.default.string().valid('YES', 'NO'),
        promotionId: joi_1.default.number(),
        productIds: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.number()), joi_1.default.string()),
        marketplaces: joi_1.default.alternatives().try(joi_1.default.array().items(joi_1.default.string().valid('US', 'CA', 'MX', 'GB', 'FR', 'DE', 'IT', 'ES', 'IN', 'JP', 'NL', 'SE', 'AU', 'BR', 'SG', 'TR', 'SA', 'AE', 'PL', 'EG', 'ZA')), joi_1.default.string()),
        claims: joi_1.default.number(),
        image: joi_1.default.string()
            .pattern(/^data:image\/(jpeg|png|gif|webp);base64,/)
            .messages({
            'string.pattern.base': 'Image must be a valid base64 encoded image (JPEG, PNG, GIF, or WebP)'
        })
    })
        .min(1)
};
const deleteCampaign = {
    params: joi_1.default.object().keys({
        campaignId: joi_1.default.number().required()
    })
};
exports.default = {
    createCampaign,
    getCampaigns,
    getCampaign,
    updateCampaign,
    deleteCampaign
};
//# sourceMappingURL=campaign.validation.js.map