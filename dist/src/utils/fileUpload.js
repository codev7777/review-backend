"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.savePromotionImage = exports.saveCampaignImage = exports.saveProductImage = exports.saveCompanyLogo = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const saveCompanyLogo = (base64Data) => {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image data');
    }
    const [, imageType, base64String] = matches;
    const buffer = Buffer.from(base64String, 'base64');
    const fileName = `company-logo-${(0, uuid_1.v4)()}.${imageType}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    fs_1.default.writeFileSync(filePath, buffer);
    return fileName;
};
exports.saveCompanyLogo = saveCompanyLogo;
const saveProductImage = (base64Data) => {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image data');
    }
    const [, imageType, base64String] = matches;
    const buffer = Buffer.from(base64String, 'base64');
    const fileName = `product-image-${(0, uuid_1.v4)()}.${imageType}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    fs_1.default.writeFileSync(filePath, buffer);
    return fileName;
};
exports.saveProductImage = saveProductImage;
const saveCampaignImage = (base64Data) => {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image data');
    }
    const [, imageType, base64String] = matches;
    const buffer = Buffer.from(base64String, 'base64');
    const fileName = `campaign-image-${(0, uuid_1.v4)()}.${imageType}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    fs_1.default.writeFileSync(filePath, buffer);
    return fileName;
};
exports.saveCampaignImage = saveCampaignImage;
const savePromotionImage = (base64Data) => {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image data');
    }
    const [, imageType, base64String] = matches;
    const buffer = Buffer.from(base64String, 'base64');
    const fileName = `promotion-image-${(0, uuid_1.v4)()}.${imageType}`;
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    fs_1.default.writeFileSync(filePath, buffer);
    return fileName;
};
exports.savePromotionImage = savePromotionImage;
const deleteImage = (fileName) => {
    const filePath = path_1.default.join(UPLOAD_DIR, fileName);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
};
exports.deleteImage = deleteImage;
//# sourceMappingURL=fileUpload.js.map