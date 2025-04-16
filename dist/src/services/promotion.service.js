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
const createPromotion = async (promotionBody) => {
    let imageUrl = promotionBody.image;
    if (promotionBody.image && promotionBody.image.startsWith('data:image')) {
        imageUrl = (0, fileUpload_1.savePromotionImage)(promotionBody.image);
    }
    const promotionData = {
        title: promotionBody.title,
        description: promotionBody.description,
        promotionType: promotionBody.promotionType,
        image: imageUrl,
        companyId: promotionBody.companyId
    };
    switch (promotionBody.promotionType) {
        case 'GIFT_CARD':
            promotionData.giftCardDeliveryMethod = promotionBody.giftCardDeliveryMethod;
            break;
        case 'DISCOUNT_CODE':
            promotionData.approvalMethod = promotionBody.approvalMethod;
            promotionData.codeType = promotionBody.codeType;
            promotionData.couponCodes = promotionBody.couponCodes;
            break;
        case 'FREE_PRODUCT':
            promotionData.freeProductDeliveryMethod = 'SHIP';
            promotionData.freeProductApprovalMethod = 'MANUAL';
            break;
        case 'DIGITAL_DOWNLOAD':
            promotionData.downloadableFileUrl = promotionBody.downloadableFileUrl;
            promotionData.digitalApprovalMethod = promotionBody.digitalApprovalMethod;
            break;
    }
    return prisma.promotion.create({
        data: promotionData,
        include: {
            company: true
        }
    });
};
const queryPromotions = async (filter, options) => {
    const { limit = 10, page = 1, sortBy } = options;
    const skip = (page - 1) * limit;
    const where = {
        ...(filter.title && { title: { contains: filter.title } }),
        ...(filter.promotionType && { promotionType: filter.promotionType }),
        ...(filter.companyId && { companyId: filter.companyId })
    };
    const orderBy = sortBy
        ? { [sortBy.split(':')[0]]: sortBy.split(':')[1] }
        : { id: 'desc' };
    const [promotions, total] = await Promise.all([
        prisma.promotion.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                company: true
            }
        }),
        prisma.promotion.count({ where })
    ]);
    return {
        results: promotions,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
    };
};
const getPromotionById = async (id) => {
    return prisma.promotion.findUnique({
        where: { id },
        include: {
            company: true
        }
    });
};
const updatePromotionById = async (promotionId, updateBody) => {
    const promotion = await getPromotionById(promotionId);
    if (!promotion) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Promotion not found');
    }
    let imageUrl = updateBody.image;
    if (updateBody.image && updateBody.image.startsWith('data:image')) {
        if (promotion.image) {
            (0, fileUpload_1.deleteImage)(promotion.image);
        }
        imageUrl = (0, fileUpload_1.savePromotionImage)(updateBody.image);
    }
    const updateData = {
        ...updateBody,
        image: imageUrl
    };
    const currentType = promotion.promotionType;
    if (currentType !== 'GIFT_CARD')
        delete updateData.giftCardDeliveryMethod;
    if (currentType !== 'DISCOUNT_CODE') {
        delete updateData.approvalMethod;
        delete updateData.codeType;
        delete updateData.couponCodes;
    }
    if (currentType !== 'FREE_PRODUCT') {
        delete updateData.freeProductDeliveryMethod;
        delete updateData.freeProductApprovalMethod;
    }
    if (currentType !== 'DIGITAL_DOWNLOAD') {
        delete updateData.downloadableFileUrl;
        delete updateData.digitalApprovalMethod;
    }
    return prisma.promotion.update({
        where: { id: promotionId },
        data: updateData,
        include: {
            company: true
        }
    });
};
const deletePromotionById = async (promotionId) => {
    const promotion = await getPromotionById(promotionId);
    if (!promotion) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Promotion not found');
    }
    if (promotion.image) {
        (0, fileUpload_1.deleteImage)(promotion.image);
    }
    await prisma.promotion.delete({
        where: { id: promotionId }
    });
};
exports.default = {
    createPromotion,
    queryPromotions,
    getPromotionById,
    updatePromotionById,
    deletePromotionById
};
//# sourceMappingURL=promotion.service.js.map