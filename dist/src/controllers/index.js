"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = exports.categoryController = exports.companyController = exports.userController = exports.authController = void 0;
var auth_controller_1 = require("./auth.controller");
Object.defineProperty(exports, "authController", { enumerable: true, get: function () { return __importDefault(auth_controller_1).default; } });
var user_controller_1 = require("./user.controller");
Object.defineProperty(exports, "userController", { enumerable: true, get: function () { return __importDefault(user_controller_1).default; } });
var company_controller_1 = require("./company.controller");
Object.defineProperty(exports, "companyController", { enumerable: true, get: function () { return __importDefault(company_controller_1).default; } });
var category_controller_1 = require("./category.controller");
Object.defineProperty(exports, "categoryController", { enumerable: true, get: function () { return __importDefault(category_controller_1).default; } });
exports.promotionController = __importStar(require("./promotion.controller"));
//# sourceMappingURL=index.js.map