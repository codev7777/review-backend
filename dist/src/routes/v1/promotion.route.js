"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promotion_controller_1 = __importDefault(require("../../controllers/promotion.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const promotion_validation_1 = __importDefault(require("../../validations/promotion.validation"));
const router = express_1.default.Router();
router
    .route('/')
    .post((0, auth_1.default)(), (0, validate_1.default)(promotion_validation_1.default.createPromotion), promotion_controller_1.default.createPromotion)
    .get((0, auth_1.default)(), (0, validate_1.default)(promotion_validation_1.default.getPromotions), promotion_controller_1.default.getPromotions);
router
    .route('/:promotionId')
    .get((0, auth_1.default)(), (0, validate_1.default)(promotion_validation_1.default.getPromotion), promotion_controller_1.default.getPromotion)
    .patch((0, auth_1.default)(), (0, validate_1.default)(promotion_validation_1.default.updatePromotion), promotion_controller_1.default.updatePromotion)
    .delete((0, auth_1.default)(), (0, validate_1.default)(promotion_validation_1.default.deletePromotion), promotion_controller_1.default.deletePromotion);
exports.default = router;
//# sourceMappingURL=promotion.route.js.map