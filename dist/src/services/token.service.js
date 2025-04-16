"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const moment_1 = __importDefault(require("moment"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config/config"));
const user_service_1 = __importDefault(require("./user.service"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../client"));
const generateToken = (userId, expires, type, secret = config_1.default.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: (0, moment_1.default)().unix(),
        exp: expires.unix(),
        type
    };
    return jsonwebtoken_1.default.sign(payload, secret);
};
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    const createdToken = client_2.default.token.create({
        data: {
            token,
            userId: userId,
            expires: expires.toDate(),
            type,
            blacklisted
        }
    });
    return createdToken;
};
const verifyToken = async (token, type) => {
    const payload = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
    const userId = Number(payload.sub);
    const tokenData = await client_2.default.token.findFirst({
        where: { token, type, userId, blacklisted: false }
    });
    if (!tokenData) {
        throw new Error('Token not found');
    }
    return tokenData;
};
const generateAuthTokens = async (user) => {
    const accessTokenExpires = (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires, client_1.TokenType.ACCESS);
    const refreshTokenExpires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires, client_1.TokenType.REFRESH);
    await saveToken(refreshToken, user.id, refreshTokenExpires, client_1.TokenType.REFRESH);
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate()
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate()
        }
    };
};
const generateResetPasswordToken = async (email) => {
    const user = await user_service_1.default.getUserByEmail(email);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'No users found with this email');
    }
    const expires = (0, moment_1.default)().add(config_1.default.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id, expires, client_1.TokenType.RESET_PASSWORD);
    await saveToken(resetPasswordToken, user.id, expires, client_1.TokenType.RESET_PASSWORD);
    return resetPasswordToken;
};
const generateVerifyEmailToken = async (user) => {
    const expires = (0, moment_1.default)().add(config_1.default.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = generateToken(user.id, expires, client_1.TokenType.VERIFY_EMAIL);
    await saveToken(verifyEmailToken, user.id, expires, client_1.TokenType.VERIFY_EMAIL);
    return verifyEmailToken;
};
exports.default = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken
};
//# sourceMappingURL=token.service.js.map