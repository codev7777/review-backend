"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const roles_1 = require("../config/roles");
const services_1 = require("../services");
const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
    var _a;
    if (err || info || !user) {
        return reject(new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = await services_1.userService.getUserById(user.id);
    if (requiredRights.length) {
        const userRights = (_a = roles_1.roleRights.get(req.user.role)) !== null && _a !== void 0 ? _a : [];
        const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
        console.log(hasRequiredRights, req.params.userId, req.user.id);
        if (!hasRequiredRights && req.params.userId != req.user.id) {
            return reject(new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden'));
        }
    }
    resolve();
};
const auth = (...requiredRights) => async (req, res, next) => {
    return new Promise((resolve, reject) => {
        passport_1.default.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
        .then(() => next())
        .catch((err) => next(err));
};
exports.default = auth;
//# sourceMappingURL=auth.js.map