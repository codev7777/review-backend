"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductById = exports.updateProductById = exports.getProductById = exports.queryProducts = exports.createProduct0 = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const fileUpload_1 = require("../utils/fileUpload");
const prisma = new client_1.PrismaClient();
const createProduct0 = async (productBody) => {
    if (productBody.asin) {
        const asinRegex = /^[A-Z0-9]{10}$/;
        if (!asinRegex.test(productBody.asin)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid ASIN format');
        }
        const existingProducts = await prisma.$queryRaw `
      SELECT id FROM "Product" WHERE asin = ${productBody.asin}
    `;
        if (existingProducts.length > 0) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Product with this ASIN already exists');
        }
    }
    let imageUrl = productBody.image;
    if (productBody.image && productBody.image.startsWith('data:image')) {
        imageUrl = (0, fileUpload_1.saveProductImage)(productBody.image);
    }
    return prisma.product.create({
        data: {
            ...productBody,
            image: imageUrl,
            ratio: 0
        },
        include: {
            category: true,
            company: true
        }
    });
};
exports.createProduct0 = createProduct0;
const queryProducts = async (filter, options) => {
    const { limit = 10, page = 1, sortBy } = options;
    const skip = (page - 1) * limit;
    if (filter.ids) {
        const productIds = filter.ids.split(',').map((id) => parseInt(id, 10));
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds }
            },
            include: {
                category: true,
                company: true
            }
        });
        return {
            results: products,
            page,
            limit,
            totalPages: 1,
            total: products.length
        };
    }
    if (filter.asin) {
        const asinProducts = await prisma.$queryRaw `
      SELECT id FROM "Product" WHERE asin = ${filter.asin}
    `;
        const productIds = asinProducts.map((p) => p.id);
        if (productIds.length === 0) {
            return {
                results: [],
                page,
                limit,
                totalPages: 0,
                total: 0
            };
        }
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds }
            },
            include: {
                category: true,
                company: true
            }
        });
        return {
            results: products,
            page,
            limit,
            totalPages: 1,
            total: products.length
        };
    }
    const where = {
        ...(filter.title && { title: { contains: filter.title } }),
        ...(filter.companyId && { companyId: filter.companyId }),
        ...(filter.categoryId && { categoryId: filter.categoryId })
    };
    const orderBy = sortBy
        ? { [sortBy.split(':')[0]]: sortBy.split(':')[1] }
        : { id: 'desc' };
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                category: true,
                company: true
            }
        }),
        prisma.product.count({ where })
    ]);
    return {
        results: products,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total
    };
};
exports.queryProducts = queryProducts;
const getProductById = async (id) => {
    return prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            company: true
        }
    });
};
exports.getProductById = getProductById;
const updateProductById = async (productId, updateBody) => {
    const product = await getProductById(productId);
    if (!product) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    let imageUrl = updateBody.image;
    if (updateBody.image && updateBody.image.startsWith('data:image')) {
        if (product.image) {
            (0, fileUpload_1.deleteImage)(product.image);
        }
        imageUrl = (0, fileUpload_1.saveProductImage)(updateBody.image);
    }
    return prisma.product.update({
        where: { id: productId },
        data: {
            ...updateBody,
            image: imageUrl
        },
        include: {
            category: true,
            company: true
        }
    });
};
exports.updateProductById = updateProductById;
const deleteProductById = async (productId) => {
    const product = await getProductById(productId);
    if (!product) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    if (product.image) {
        (0, fileUpload_1.deleteImage)(product.image);
    }
    await prisma.product.delete({
        where: { id: productId }
    });
};
exports.deleteProductById = deleteProductById;
//# sourceMappingURL=product.service.js.map