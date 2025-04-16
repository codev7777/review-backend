"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const healthCheck = async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(http_status_1.default.OK).json({
            status: 'ok',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    }
    catch (error) {
        res.status(http_status_1.default.SERVICE_UNAVAILABLE).json({
            status: 'error',
            message: 'Server is running but database connection failed',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.default = {
    healthCheck
};
//# sourceMappingURL=health.controller.js.map