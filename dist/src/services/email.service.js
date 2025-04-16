"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../config/logger"));
const transport = nodemailer_1.default.createTransport(config_1.default.email.smtp);
if (config_1.default.env !== 'test') {
    transport
        .verify()
        .then(() => logger_1.default.info('Connected to email server'))
        .catch(() => logger_1.default.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}
const sendEmail = async (to, subject, text) => {
    const msg = { from: config_1.default.email.from, to, subject, text };
    await transport.sendMail(msg);
};
const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Reset password';
    const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
    const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
    await sendEmail(to, subject, text);
};
const sendVerificationEmail = async (to, token) => {
    const subject = 'Email Verification';
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
    await sendEmail(to, subject, text);
};
exports.default = {
    transport,
    sendEmail,
    sendResetPasswordEmail,
    sendVerificationEmail
};
//# sourceMappingURL=email.service.js.map