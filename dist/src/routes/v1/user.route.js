"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const validations_1 = require("../../validations");
const controllers_1 = require("../../controllers");
const router = express_1.default.Router();
router
    .route('/')
    .post((0, auth_1.default)('manageUsers'), (0, validate_1.default)(validations_1.userValidation.createUser), controllers_1.userController.createUser)
    .get((0, auth_1.default)('getUsers'), (0, validate_1.default)(validations_1.userValidation.getUsers), controllers_1.userController.getUsers);
router
    .route('/:userId')
    .get((0, auth_1.default)('getUsers'), (0, validate_1.default)(validations_1.userValidation.getUser), controllers_1.userController.getUser)
    .patch((0, auth_1.default)('manageUsers'), (0, validate_1.default)(validations_1.userValidation.updateUser), controllers_1.userController.updateUser)
    .delete((0, auth_1.default)('manageUsers'), (0, validate_1.default)(validations_1.userValidation.deleteUser), controllers_1.userController.deleteUser);
exports.default = router;
//# sourceMappingURL=user.route.js.map