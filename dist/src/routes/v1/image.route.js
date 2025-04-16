"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get('/:filename', (0, auth_1.default)(), async (req, res, next) => {
    try {
        const { filename } = req.params;
        const uploadsDir = path_1.default.join(__dirname, '../../../uploads');
        const filePath = path_1.default.join(uploadsDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Image not found');
        }
        const stats = fs_1.default.statSync(filePath);
        res.setHeader('Content-Type', getContentType(filename));
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        next(error);
    }
});
function getContentType(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return contentTypes[ext] || 'application/octet-stream';
}
exports.default = router;
//# sourceMappingURL=image.route.js.map