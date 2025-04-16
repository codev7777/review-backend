"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRecaptcha = void 0;
const axios_1 = __importDefault(require("axios"));
const verifyRecaptcha = async (req, res, next) => {
    const token = req.body.recaptchaToken;
    if (!token) {
        res.status(400).json({ error: 'reCAPTCHA token missing' });
        return;
    }
    try {
        const response = await axios_1.default.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: token
            }
        });
        const { success, score, action } = response.data;
        if (!success) {
            res.status(403).json({ error: 'reCAPTCHA verification failed' });
            return;
        }
        next();
        return;
    }
    catch (err) {
        console.error('reCAPTCHA error:', err);
        res.status(500).json({ error: 'reCAPTCHA verification error' });
        return;
    }
};
exports.verifyRecaptcha = verifyRecaptcha;
//# sourceMappingURL=verifyRecaptcha.js.map