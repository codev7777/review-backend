"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = __importDefault(require("../../controllers/product.controller"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const product_validation_1 = __importDefault(require("../../validations/product.validation"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
router
    .route('/')
    .post((0, auth_1.default)(), upload.single('image'), (0, validate_1.default)(product_validation_1.default.createProduct), product_controller_1.default.createProduct)
    .get((0, auth_1.default)(), product_controller_1.default.getProducts);
router
    .route('/:productId')
    .get((0, auth_1.default)(), (0, validate_1.default)(product_validation_1.default.getProduct), product_controller_1.default.getProduct)
    .patch((0, auth_1.default)(), upload.single('image'), (0, validate_1.default)(product_validation_1.default.updateProduct), product_controller_1.default.updateProduct)
    .delete((0, auth_1.default)(), (0, validate_1.default)(product_validation_1.default.deleteProduct), product_controller_1.default.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.route.js.map