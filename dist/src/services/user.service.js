"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const client_2 = __importDefault(require("../client"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const encryption_1 = require("../utils/encryption");
const createUser = async (email, password, name, role = client_1.Role.USER) => {
    if (password.length < 8) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Password length must be at least 8 characters long');
    }
    if (await getUserByEmail(email)) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    const company = await client_2.default.company.create({
        data: {
            name: name ? `${name}'s Company` : `New Company`,
            detail: null,
            logo: null,
            websiteUrl: null,
            planId: null,
            ratio: 0,
            reviews: 0
        }
    });
    return client_2.default.user.create({
        data: {
            email,
            name,
            password: await (0, encryption_1.encryptPassword)(password),
            role,
            companyId: company.id
        }
    });
};
const queryUsers = async (filter, options, keys = [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'companyId',
    'createdAt',
    'updatedAt'
]) => {
    var _a, _b, _c;
    const page = (_a = options.page) !== null && _a !== void 0 ? _a : 1;
    const limit = (_b = options.limit) !== null && _b !== void 0 ? _b : 10;
    const sortBy = options.sortBy;
    const sortType = (_c = options.sortType) !== null && _c !== void 0 ? _c : 'desc';
    const uu = await client_2.default.user.findMany();
    const users = await client_2.default.user.findMany({
        where: filter,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortType } : undefined
    });
    return users;
};
const getUserById = async (id, keys = [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'companyId',
    'createdAt',
    'updatedAt'
]) => {
    return client_2.default.user.findUnique({
        where: { id },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
};
const getUserByEmail = async (email, keys = [
    'id',
    'email',
    'name',
    'password',
    'role',
    'isEmailVerified',
    'companyId',
    'createdAt',
    'updatedAt'
]) => {
    return client_2.default.user.findUnique({
        where: { email },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
};
const updateUserById = async (userId, updateBody, keys = ['id', 'email', 'name', 'companyId']) => {
    const user = await getUserById(userId, ['id', 'email', 'name']);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await getUserByEmail(updateBody.email))) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    const updatedUser = await client_2.default.user.update({
        where: { id: user.id },
        data: updateBody,
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return updatedUser;
};
const deleteUserById = async (userId) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    await client_2.default.user.delete({ where: { id: user.id } });
    return user;
};
exports.default = {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById
};
//# sourceMappingURL=user.service.js.map