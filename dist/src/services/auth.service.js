"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const token_service_1 = __importDefault(require("./token.service"));
const user_service_1 = __importDefault(require("./user.service"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../client"));
const encryption_1 = require("../utils/encryption");
const exclude_1 = __importDefault(require("../utils/exclude"));
const loginUserWithEmailAndPassword = async (email, password) => {
    const user = await user_service_1.default.getUserByEmail(email, [
        'id',
        'email',
        'name',
        'password',
        'role',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
        'companyId'
    ]);
    if (!user || !(await (0, encryption_1.isPasswordMatch)(password, user.password))) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Incorrect email or password');
    }
    return (0, exclude_1.default)(user, ['password']);
};
const logout = async (refreshToken) => {
    const refreshTokenData = await client_2.default.token.findFirst({
        where: {
            token: refreshToken,
            type: client_1.TokenType.REFRESH,
            blacklisted: false
        }
    });
    if (!refreshTokenData) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Not found');
    }
    await client_2.default.token.delete({ where: { id: refreshTokenData.id } });
};
const refreshAuth = async (refreshToken) => {
    try {
        const refreshTokenData = await token_service_1.default.verifyToken(refreshToken, client_1.TokenType.REFRESH);
        const { userId } = refreshTokenData;
        await client_2.default.token.delete({ where: { id: refreshTokenData.id } });
        return token_service_1.default.generateAuthTokens({ id: userId });
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Please authenticate');
    }
};
const resetPassword = async (resetPasswordToken, newPassword) => {
    try {
        const resetPasswordTokenData = await token_service_1.default.verifyToken(resetPasswordToken, client_1.TokenType.RESET_PASSWORD);
        const user = await user_service_1.default.getUserById(resetPasswordTokenData.userId);
        if (!user) {
            throw new Error();
        }
        const encryptedPassword = await (0, encryption_1.encryptPassword)(newPassword);
        await user_service_1.default.updateUserById(user.id, { password: encryptedPassword });
        await client_2.default.token.deleteMany({ where: { userId: user.id, type: client_1.TokenType.RESET_PASSWORD } });
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Password reset failed');
    }
};
const verifyEmail = async (verifyEmailToken) => {
    try {
        const verifyEmailTokenData = await token_service_1.default.verifyToken(verifyEmailToken, client_1.TokenType.VERIFY_EMAIL);
        await client_2.default.token.deleteMany({
            where: { userId: verifyEmailTokenData.userId, type: client_1.TokenType.VERIFY_EMAIL }
        });
        await user_service_1.default.updateUserById(verifyEmailTokenData.userId, { isEmailVerified: true });
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Email verification failed');
    }
};
exports.default = {
    loginUserWithEmailAndPassword,
    isPasswordMatch: encryption_1.isPasswordMatch,
    encryptPassword: encryption_1.encryptPassword,
    logout,
    refreshAuth,
    resetPassword,
    verifyEmail
};
//# sourceMappingURL=auth.service.js.map