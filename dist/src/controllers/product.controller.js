"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const product_service_1 = require("../services/product.service");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
const createProduct = (0, catchAsync_1.default)(async (req, res) => {
    const productData = { ...req.body };
    if (productData.companyId) {
        productData.companyId = Number(productData.companyId);
    }
    if (productData.categoryId) {
        productData.categoryId = Number(productData.categoryId);
    }
    if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        productData.image = base64Image;
    }
    const product = await (0, product_service_1.createProduct0)(productData);
    res.status(http_status_1.default.CREATED).send(product);
});
const getProducts = async (req, res) => {
    try {
        const { title, companyId, categoryId, asin, ids } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy;
        const filter = {
            ...(title && { title: title }),
            ...(companyId && { companyId: parseInt(companyId) }),
            ...(categoryId && { categoryId: parseInt(categoryId) }),
            ...(asin && { asin: asin }),
            ...(ids && { ids: ids })
        };
        const options = {
            page,
            limit,
            ...(sortBy && { sortBy })
        };
        const result = await (0, product_service_1.queryProducts)(filter, options);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
const getProduct = (0, catchAsync_1.default)(async (req, res) => {
    const product = await (0, product_service_1.getProductById)(Number(req.params.productId));
    res.send(product);
});
const updateProduct = (0, catchAsync_1.default)(async (req, res) => {
    const productData = { ...req.body };
    if (productData.companyId) {
        productData.companyId = Number(productData.companyId);
    }
    if (productData.categoryId) {
        productData.categoryId = Number(productData.categoryId);
    }
    if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        productData.image = base64Image;
    }
    const product = await (0, product_service_1.updateProductById)(Number(req.params.productId), productData);
    res.send(product);
});
const deleteProduct = (0, catchAsync_1.default)(async (req, res) => {
    await (0, product_service_1.deleteProductById)(Number(req.params.productId));
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    createProduct,
    getProducts: exports.getProducts,
    getProduct,
    updateProduct,
    deleteProduct
};
//# sourceMappingURL=product.controller.js.map