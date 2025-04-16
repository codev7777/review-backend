"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const http_status_1 = __importDefault(require("http-status"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./config/config"));
const morgan_1 = __importDefault(require("./config/morgan"));
const xss_1 = __importDefault(require("./middlewares/xss"));
const passport_2 = require("./config/passport");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const v1_1 = __importDefault(require("./routes/v1"));
const error_1 = require("./middlewares/error");
const ApiError_1 = __importDefault(require("./utils/ApiError"));
const app = (0, express_1.default)();
if (config_1.default.env !== 'test') {
    app.use(morgan_1.default.successHandler);
    app.use(morgan_1.default.errorHandler);
}
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, xss_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.options('*', (0, cors_1.default)());
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use(passport_1.default.initialize());
passport_1.default.use('jwt', passport_2.jwtStrategy);
if (config_1.default.env === 'production') {
    app.use('/v1/auth', rateLimiter_1.authLimiter);
}
app.use('/v1', v1_1.default);
app.use((req, res, next) => {
    next(new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Not found'));
});
app.use(error_1.errorConverter);
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map