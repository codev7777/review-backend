"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const client_1 = __importDefault(require("./client"));
const config_1 = __importDefault(require("./config/config"));
const logger_1 = __importDefault(require("./config/logger"));
const findAvailablePort_1 = require("./utils/findAvailablePort");
let server;
client_1.default.$connect().then(async () => {
    logger_1.default.info('Connected to SQL Database');
    try {
        const availablePort = await (0, findAvailablePort_1.findAvailablePort)(config_1.default.port);
        if (availablePort !== config_1.default.port) {
            logger_1.default.info(`Default port ${config_1.default.port} is in use, using port ${availablePort} instead`);
        }
        server = app_1.default.listen(availablePort, () => {
            logger_1.default.info(`Listening to port ${availablePort}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
});
const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger_1.default.info('Server closed');
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
};
const unexpectedErrorHandler = (error) => {
    logger_1.default.error(error);
    exitHandler();
};
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
//# sourceMappingURL=index.js.map