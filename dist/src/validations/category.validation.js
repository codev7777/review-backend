"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const createCategory = {
    body: joi_1.default.object().keys({
        name: joi_1.default.string().required(),
        description: joi_1.default.string()
    })
};
const getCategories = {
    query: joi_1.default.object().keys({
        name: joi_1.default.string(),
        sortBy: joi_1.default.string(),
        limit: joi_1.default.number().integer(),
        page: joi_1.default.number().integer()
    })
};
const getCategory = {
    params: joi_1.default.object().keys({
        categoryId: joi_1.default.number().integer().required()
    })
};
const updateCategory = {
    params: joi_1.default.object().keys({
        categoryId: joi_1.default.number().integer().required()
    }),
    body: joi_1.default.object()
        .keys({
        name: joi_1.default.string(),
        description: joi_1.default.string()
    })
        .min(1)
};
const deleteCategory = {
    params: joi_1.default.object().keys({
        categoryId: joi_1.default.number().integer().required()
    })
};
exports.default = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
};
//# sourceMappingURL=category.validation.js.map