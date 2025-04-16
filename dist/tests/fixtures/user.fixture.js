"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUsers = exports.admin = exports.userTwo = exports.userOne = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const faker_1 = require("@faker-js/faker");
const client_1 = __importDefault(require("../../src/client"));
const client_2 = require("@prisma/client");
const password = 'password1';
const salt = bcryptjs_1.default.genSaltSync(8);
exports.userOne = {
    name: faker_1.faker.name.fullName(),
    email: faker_1.faker.internet.email().toLowerCase(),
    password,
    role: client_2.Role.USER,
    isEmailVerified: false
};
exports.userTwo = {
    name: faker_1.faker.name.fullName(),
    email: faker_1.faker.internet.email().toLowerCase(),
    password,
    role: client_2.Role.USER,
    isEmailVerified: false
};
exports.admin = {
    name: faker_1.faker.name.fullName(),
    email: faker_1.faker.internet.email().toLowerCase(),
    password,
    role: client_2.Role.ADMIN,
    isEmailVerified: false
};
const insertUsers = async (users) => {
    await client_1.default.user.createMany({
        data: users.map((user) => ({ ...user, password: bcryptjs_1.default.hashSync(user.password, salt) }))
    });
};
exports.insertUsers = insertUsers;
//# sourceMappingURL=user.fixture.js.map