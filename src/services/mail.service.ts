import { Client } from 'node-mailjet';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import config from '../config/config';

const mailjet = new Client({
  apiKey: 'ef8405722e49209064a09000f1986414',
  apiSecret: 'e240eebd311af32c6bc1a241ba43de3c'
});

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;

  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'noreply@reviewbrothers.com',
            Name: 'Review Brothers'
          },
          To: [
            {
              Email: to,
              Name: to.split('@')[0]
            }
          ],
          TemplateID: 6909627,
          TemplateLanguage: true,
          Subject: 'Verify your email address',
          Variables: {
            verification_url: verificationUrl
          }
        }
      ]
    });
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
const sendResetPasswordEmail = async (to: string, token: string): Promise<void> => {
  const resetPasswordUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;

  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'noreply@reviewbrothers.com',
            Name: 'Review Brothers'
          },
          To: [
            {
              Email: to,
              Name: to.split('@')[0]
            }
          ],
          TemplateID: 6909627, // You should create a new template for password reset
          TemplateLanguage: true,
          Subject: 'Reset your password',
          Variables: {
            verification_url: resetPasswordUrl
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send reset password email');
  }
};

export default {
  sendVerificationEmail,
  sendResetPasswordEmail
};
