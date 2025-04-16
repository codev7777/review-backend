"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../../src/client"));
const globals_1 = require("@jest/globals");
const setupTestDB = () => {
    (0, globals_1.beforeAll)(async () => {
        await client_1.default.$connect();
    });
    (0, globals_1.beforeEach)(async () => {
        await client_1.default.token.deleteMany();
        await client_1.default.user.deleteMany();
    });
    (0, globals_1.afterAll)(async () => {
        await client_1.default.token.deleteMany();
        await client_1.default.user.deleteMany();
        await client_1.default.$disconnect();
    });
};
exports.default = setupTestDB;
//# sourceMappingURL=setupTestDb.js.map