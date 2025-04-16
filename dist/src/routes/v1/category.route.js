"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../../controllers");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const validations_1 = require("../../validations");
const router = express_1.default.Router();
router
    .route('/')
    .post((0, auth_1.default)('manageCategories'), (0, validate_1.default)(validations_1.categoryValidation.createCategory), controllers_1.categoryController.createCategory)
    .get((0, validate_1.default)(validations_1.categoryValidation.getCategories), controllers_1.categoryController.getCategories);
router
    .route('/:categoryId')
    .get((0, validate_1.default)(validations_1.categoryValidation.getCategory), controllers_1.categoryController.getCategory)
    .patch((0, auth_1.default)('manageCategories'), (0, validate_1.default)(validations_1.categoryValidation.updateCategory), controllers_1.categoryController.updateCategory)
    .delete((0, auth_1.default)('manageCategories'), (0, validate_1.default)(validations_1.categoryValidation.deleteCategory), controllers_1.categoryController.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.route.js.map