"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../utils/pick"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
const createCategory = (0, catchAsync_1.default)(async (req, res) => {
    const category = await services_1.categoryService.createCategory(req.body);
    res.status(http_status_1.default.CREATED).send(category);
});
const getCategories = (0, catchAsync_1.default)(async (req, res) => {
    const filter = (0, pick_1.default)(req.query, ['name']);
    const options = (0, pick_1.default)(req.query, ['sortBy', 'limit', 'page']);
    const result = await services_1.categoryService.queryCategories(filter, options);
    res.send(result);
});
const getCategory = (0, catchAsync_1.default)(async (req, res) => {
    const category = await services_1.categoryService.getCategoryById(Number(req.params.categoryId));
    if (!category) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Category not found');
    }
    res.send(category);
});
const updateCategory = (0, catchAsync_1.default)(async (req, res) => {
    const category = await services_1.categoryService.updateCategoryById(Number(req.params.categoryId), req.body);
    res.send(category);
});
const deleteCategory = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.categoryService.deleteCategoryById(Number(req.params.categoryId));
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
};
//# sourceMappingURL=category.controller.js.map