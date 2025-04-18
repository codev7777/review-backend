import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';
import { getFrontendPath } from '../utils/url';

const transport = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = 'Reset password';
  const resetPasswordUrl = getFrontendPath(`/auth/reset-password?token=${token}`);
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = getFrontendPath(`/auth/verify-email?token=${token}`);
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
  await sendEmail(to, subject, text);
};

/**
 * Send welcome email
 * @param {string} email
 * @param {string} name
 * @returns {Promise}
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  const dashboardUrl = getFrontendPath('/vendor-dashboard');

  const mailOptions = {
    from: `"ReviewBrothers" <${config.email.from}>`,
    to: email,
    subject: 'Welcome to ReviewBrothers!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ReviewBrothers, ${name}!</h2>
        <p>Thank you for joining our platform. We're excited to help you manage your product reviews and grow your business.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated message, please do not reply directly to this email.
        </p>
      </div>
    `
  };

  await transport.sendMail(mailOptions);
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail
};
