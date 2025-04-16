"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const services_1 = require("../services");
const exclude_1 = __importDefault(require("../utils/exclude"));
const register = (0, catchAsync_1.default)(async (req, res) => {
    const { email, password, name } = req.body;
    const user = await services_1.userService.createUser(email, password, name);
    const userWithoutPassword = (0, exclude_1.default)(user, ['password', 'createdAt', 'updatedAt']);
    const tokens = await services_1.tokenService.generateAuthTokens(user);
    res.status(http_status_1.default.CREATED).send({ user: userWithoutPassword, tokens });
});
const login = (0, catchAsync_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await services_1.authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await services_1.tokenService.generateAuthTokens(user);
    res.send({ user, tokens });
});
const logout = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.logout(req.body.refreshToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
const refreshTokens = (0, catchAsync_1.default)(async (req, res) => {
    const tokens = await services_1.authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
});
const forgotPassword = (0, catchAsync_1.default)(async (req, res) => {
    const resetPasswordToken = await services_1.tokenService.generateResetPasswordToken(req.body.email);
    await services_1.emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.resetPassword(req.query.token, req.body.password);
    res.status(http_status_1.default.NO_CONTENT).send();
});
const sendVerificationEmail = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const verifyEmailToken = await services_1.tokenService.generateVerifyEmailToken(user);
    await services_1.emailService.sendVerificationEmail(user.email, verifyEmailToken);
    res.status(http_status_1.default.NO_CONTENT).send();
});
const verifyEmail = (0, catchAsync_1.default)(async (req, res) => {
    await services_1.authService.verifyEmail(req.query.token);
    res.status(http_status_1.default.NO_CONTENT).send();
});
exports.default = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail
};
//# sourceMappingURL=auth.controller.js.map