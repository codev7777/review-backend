"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const auth_validation_1 = __importDefault(require("../../validations/auth.validation"));
const controllers_1 = require("../../controllers");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.post('/register', (0, validate_1.default)(auth_validation_1.default.register), controllers_1.authController.register);
router.post('/login', (0, validate_1.default)(auth_validation_1.default.login), controllers_1.authController.login);
router.post('/logout', (0, validate_1.default)(auth_validation_1.default.logout), controllers_1.authController.logout);
router.post('/refresh-tokens', (0, validate_1.default)(auth_validation_1.default.refreshTokens), controllers_1.authController.refreshTokens);
router.post('/forgot-password', (0, validate_1.default)(auth_validation_1.default.forgotPassword), controllers_1.authController.forgotPassword);
router.post('/reset-password', (0, validate_1.default)(auth_validation_1.default.resetPassword), controllers_1.authController.resetPassword);
router.post('/send-verification-email', (0, auth_1.default)(), controllers_1.authController.sendVerificationEmail);
router.post('/verify-email', (0, validate_1.default)(auth_validation_1.default.verifyEmail), controllers_1.authController.verifyEmail);
exports.default = router;
//# sourceMappingURL=auth.route.js.map