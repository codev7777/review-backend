import { Client } from 'node-mailjet';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import config from '../config/config';
import { getFrontendUrl } from '../utils/url';
import userService from './user.service';
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
const sendVerificationEmail = async (to: string, token: string, name: string): Promise<void> => {
  const verificationUrl = `${getFrontendUrl()}/verify-email?token=${token}`;

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
            verification_url: verificationUrl,
            name: name
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
// const sendResetPasswordEmail = async (to: string, token: string): Promise<void> => {
//   const resetPasswordUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;

//   try {
//     await mailjet.post('send', { version: 'v3.1' }).request({
//       Messages: [
//         {
//           From: {
//             Email: 'noreply@reviewbrothers.com',
//             Name: 'Review Brothers'
//           },
//           To: [
//             {
//               Email: to,
//               Name: to.split('@')[0]
//             }
//           ],
//           TemplateID: 6914332,
//           TemplateLanguage: true,
//           Subject: 'Reset your password',
//           Variables: {
//             verification_url: resetPasswordUrl
//           }
//         }
//       ]
//     });
//   } catch (error) {
//     console.error('Error sending reset password email:', error);
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send reset password email');
//   }
// };
const sendResetPasswordEmail = async (to: string, token: string): Promise<void> => {
  const user = await userService.getUserByEmail(to);
  let name = user?.name;
  const resetPasswordUrl = `${getFrontendUrl()}/auth/reset-password?token=${token}`;
  console.log(resetPasswordUrl);
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
              Name: name
            }
          ],
          Subject: 'Reset your password',
          TextPart: `
          Dear ${name}!
          
          Thank you for choosing ReviewBrothers! <br /> Please confirm your email address to help us ensure your account is always protected.
          
          Click here to confirm: ${resetPasswordUrl}
          
          For support, email us at info@reviewbrothers.com.
          
          Best Regards,
          ReviewBrothers team
          `,
          HTMLPart: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; text-black">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.ibb.co/zhx5Wy7K/11.png" alt="Review Brothers" style="max-width: 100%; height: auto; border-radius: 8px;" />
            </div>
            <h2 style="text-align: left; color: black;">Dear ${name}!</h2>
            <p style="color: black;">
              Thank you for choosing <strong>ReviewBrothers</strong>! Please confirm your email address to help us ensure your account is always protected.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetPasswordUrl}" 
                style="display: inline-block; padding: 16px 36px; background-color: #232f3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s ease;"
                onmouseover="this.style.backgroundColor='#f97316'"
                onmouseout="this.style.backgroundColor='#232f3e'">
                Confirm Email
              </a>
            </div>
            <p style="color: black;">
              For further technical questions and support, please contact us at 
              <a href="mailto:info@reviewbrothers.com">info@reviewbrothers.com</a>.
              We are looking forward to cooperating with you!
            </p>
            <p style="margin-top: 40px;">
              Best Regards,<br />
              <strong>ReviewBrothers team</strong>
            </p>
          </div>
        `
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
