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
    .post((0, auth_1.default)('manageCompanies'), (0, validate_1.default)(validations_1.companyValidation.createCompany), controllers_1.companyController.createCompany)
    .get((0, auth_1.default)('getCompanies'), (0, validate_1.default)(validations_1.companyValidation.getCompanies), controllers_1.companyController.getCompanies);
router
    .route('/:companyId')
    .get((0, auth_1.default)('getCompanies'), (0, validate_1.default)(validations_1.companyValidation.getCompany), controllers_1.companyController.getCompany)
    .patch((0, auth_1.default)('manageCompanies'), (0, validate_1.default)(validations_1.companyValidation.updateCompany), controllers_1.companyController.updateCompany)
    .delete((0, auth_1.default)('manageCompanies'), (0, validate_1.default)(validations_1.companyValidation.deleteCompany), controllers_1.companyController.deleteCompany);
exports.default = router;
//# sourceMappingURL=company.route.js.map