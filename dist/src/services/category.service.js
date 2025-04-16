"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const prisma = new client_1.PrismaClient();
const createCategory = async (categoryBody) => {
    return prisma.category.create({
        data: categoryBody
    });
};
const queryCategories = async (filter, options) => {
    const { sortBy, limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;
    const where = filter.name
        ? { name: { contains: filter.name, mode: client_1.Prisma.QueryMode.insensitive } }
        : {};
    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            where,
            skip,
            take: limit,
            orderBy: sortBy ? { [sortBy]: 'asc' } : { createdAt: 'desc' }
        }),
        prisma.category.count({ where })
    ]);
    return {
        results: categories,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
    };
};
const getCategoryById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id }
    });
    if (!category) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Category not found');
    }
    return category;
};
const updateCategoryById = async (categoryId, updateBody) => {
    const category = await getCategoryById(categoryId);
    return prisma.category.update({
        where: { id: category.id },
        data: updateBody
    });
};
const deleteCategoryById = async (categoryId) => {
    const category = await getCategoryById(categoryId);
    return prisma.category.delete({
        where: { id: category.id }
    });
};
exports.default = {
    createCategory,
    queryCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById
};
//# sourceMappingURL=category.service.js.map