"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = __importDefault(require("../../controllers/review.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(), review_controller_1.default.createReview);
router.get('/company/:companyId', (0, auth_1.default)(), review_controller_1.default.getCompanyReviews);
router.patch('/:reviewId/status', (0, auth_1.default)(), review_controller_1.default.updateReviewStatus);
exports.default = router;
//# sourceMappingURL=review.route.js.map