"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const fileUpload_1 = require("../utils/fileUpload");
const prisma = new client_1.PrismaClient();
const createCampaign = async (campaignBody) => {
    let productIds = campaignBody.productIds;
    if (typeof productIds === 'string') {
        productIds = productIds.split(',').map((id) => parseInt(id.trim(), 10));
    }
    else if (!Array.isArray(productIds)) {
        console.error('productIds is not an array or string:', productIds);
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, '"productIds" must be an array or comma-separated string');
    }
    let marketplaces = campaignBody.marketplaces;
    if (typeof marketplaces === 'string') {
        marketplaces = marketplaces.split(',').map((m) => m.trim());
    }
    else if (!Array.isArray(marketplaces)) {
        console.error('marketplaces is not an array or string:', marketplaces);
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, '"marketplaces" must be an array or comma-separated string');
    }
    let imageUrl = campaignBody.image;
    if (campaignBody.image && campaignBody.image.startsWith('data:image')) {
        imageUrl = (0, fileUpload_1.saveCampaignImage)(campaignBody.image);
    }
    const { ...rest } = campaignBody;
    try {
        const result = await prisma.campaign.create({
            data: {
                ...rest,
                image: imageUrl,
                productIds: productIds,
                marketplaces: marketplaces,
                products: {
                    connect: productIds.map((id) => ({ id }))
                }
            },
            include: {
                promotion: true,
                products: true,
                company: true
            }
        });
        console.log('Campaign created successfully:', result);
        return result;
    }
    catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
};
const queryCampaigns = async (filter, options) => {
    const { limit = 10, page = 1, sortBy, sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const where = {};
    if (filter.title)
        where.title = { contains: filter.title };
    if (filter.isActive)
        where.isActive = filter.isActive;
    if (filter.promotionId)
        where.promotionId = filter.promotionId;
    if (filter.companyId)
        where.companyId = filter.companyId;
    if (filter.claims)
        where.claims = filter.claims;
    const orderBy = {};
    if (sortBy) {
        const fieldMap = {
            name: 'title',
            status: 'isActive',
            reviews: 'claims',
            updatedAt: 'updatedAt'
        };
        const dbField = fieldMap[sortBy] || sortBy;
        orderBy[dbField] = sortOrder;
    }
    else {
        orderBy.id = 'desc';
    }
    const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                promotion: true,
                company: true
            }
        }),
        prisma.campaign.count({ where })
    ]);
    return {
        results: campaigns,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
    };
};
const getCampaignById = async (id) => {
    return prisma.campaign.findUnique({
        where: { id },
        include: {
            promotion: true,
            products: true,
            company: true
        }
    });
};
const updateCampaignById = async (campaignId, updateBody) => {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Campaign not found');
    }
    let productIds = updateBody.productIds;
    if (productIds) {
        if (typeof productIds === 'string') {
            productIds = productIds.split(',').map((id) => parseInt(id.trim(), 10));
        }
        else if (!Array.isArray(productIds)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, '"productIds" must be an array or comma-separated string');
        }
    }
    let marketplaces = updateBody.marketplaces;
    if (marketplaces) {
        if (typeof marketplaces === 'string') {
            marketplaces = marketplaces.split(',').map((m) => m.trim());
        }
        else if (!Array.isArray(marketplaces)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, '"marketplaces" must be an array or comma-separated string');
        }
    }
    let imageUrl = updateBody.image;
    if (updateBody.image && updateBody.image.startsWith('data:image')) {
        if (campaign.image) {
            (0, fileUpload_1.deleteImage)(campaign.image);
        }
        imageUrl = (0, fileUpload_1.saveCampaignImage)(updateBody.image);
    }
    const { ...rest } = updateBody;
    const updatedCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
            ...rest,
            image: imageUrl,
            ...(productIds && { productIds }),
            ...(marketplaces && { marketplaces })
        },
        include: {
            promotion: true,
            products: true,
            company: true
        }
    });
    return updatedCampaign;
};
const deleteCampaignById = async (campaignId) => {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Campaign not found');
    }
    if (campaign.image) {
        (0, fileUpload_1.deleteImage)(campaign.image);
    }
    await prisma.campaign.delete({
        where: { id: campaignId }
    });
};
exports.default = {
    createCampaign,
    queryCampaigns,
    getCampaignById,
    updateCampaignById,
    deleteCampaignById
};
//# sourceMappingURL=campaign.service.js.map