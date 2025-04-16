"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAvailablePort = void 0;
const http_1 = require("http");
const logger_1 = __importDefault(require("../config/logger"));
const findAvailablePort = (startPort) => {
    return new Promise((resolve, reject) => {
        const server = new http_1.Server();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger_1.default.info(`Port ${startPort} is in use, trying ${startPort + 1}`);
                server.close();
                (0, exports.findAvailablePort)(startPort + 1)
                    .then(resolve)
                    .catch(reject);
            }
            else {
                reject(err);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(startPort);
        });
        server.listen(startPort);
    });
};
exports.findAvailablePort = findAvailablePort;
//# sourceMappingURL=findAvailablePort.js.map