import { Client } from 'node-mailjet';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import config from '../config/config';
import { getFrontendUrl } from '../utils/url';
import userService from './user.service';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIR } from '../config/constants';

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
            <h2 style="text-align: left; color: black;">Reset your password!</h2>
            <p style="color: black;">
              Hi ${name}!
              <br />  <br /> <br />
              We received a request to reset the password for your <strong>ReviewBrothers</strong> account.
              <br /><br />
              To proceed, simply click the button below and follow the instructions to set a new password: 
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetPasswordUrl}" 
                style="display: inline-block; padding: 16px 36px; background-color: #232f3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s ease;"
                onmouseover="this.style.backgroundColor='#f97316'"
                onmouseout="this.style.backgroundColor='#232f3e'">
                Reset My Password
              </a>
            </div>
            <p style="color: black;">
              If you didn't make this request, you can safely ignore this email. Your current password will remain unchanged. 
              <br /><br />  
              Need help or have questions? Contact us at <a href="mailto:info@reviewbrothers.com">info@reviewbrothers.com</a> - 
              we're happy to assist.
              <br />
            </p>
            <p style="margin-top: 40px;">
              Best Regards,<br /><br />
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

const sendInvitationEmail = async (
  to: string,
  tempPassword: string,
  companyName: string
): Promise<void> => {
  const loginUrl = `${getFrontendUrl()}/auth/login`;

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
          Subject: `You've been invited to join ${companyName} on Review Brothers`,
          HTMLPart: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.ibb.co/zhx5Wy7K/11.png" alt="Review Brothers" style="max-width: 100%; height: auto; border-radius: 8px;" />
            </div>
            <h2 style="text-align: left; color: black;">Welcome to Review Brothers!</h2>
            <p style="color: black;">
              You've been invited to join ${companyName} on Review Brothers.
              <br /><br />
              Your temporary password is: <strong>${tempPassword}</strong>
              <br /><br />
              To get started:
            </p>
            <ol style="color: black;">
              <li>Go to the login page: <a href="${loginUrl}">${loginUrl}</a></li>
              <li>Log in with your email and the temporary password above</li>
              <li>Set a new password when prompted</li>
              <li>Complete your profile</li>
            </ol>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                style="display: inline-block; padding: 16px 36px; background-color: #232f3e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.3s ease;"
                onmouseover="this.style.backgroundColor='#f97316'"
                onmouseout="this.style.backgroundColor='#232f3e'">
                Log In Now
              </a>
            </div>
            <p style="color: black;">
              If you didn't expect this invitation, you can safely ignore this email.
              <br /><br />
              Need help? Contact us at <a href="mailto:info@reviewbrothers.com">info@reviewbrothers.com</a>
            </p>
            <p style="margin-top: 40px;">
              Best Regards,<br />
              <strong>Review Brothers Team</strong>
            </p>
          </div>
          `
        }
      ]
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send invitation email');
  }
};

/**
 * Send digital download PDF via email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} promotionTitle - Title of the promotion
 * @param {string} pdfFileName - Name of the PDF file
 * @returns {Promise<void>}
 */
export const sendDigitalDownloadEmail = async (
  to: string,
  name: string,
  promotionTitle: string,
  pdfFileName: string
): Promise<void> => {
  const pdfPath = path.join(UPLOAD_DIR, pdfFileName);
  console.log('Attempting to send digital download email:', {
    to,
    name,
    promotionTitle,
    pdfFileName,
    pdfPath
  });

  try {
    // Check if PDF file exists
    if (!fs.existsSync(pdfPath)) {
      console.error('PDF file not found:', pdfPath);
      throw new Error('PDF file not found');
    }

    const pdfContent = fs.readFileSync(pdfPath);
    console.log('PDF file read successfully, size:', pdfContent.length);

    const result = await mailjet.post('send', { version: 'v3.1' }).request({
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
          Subject: `Your Digital Download: ${promotionTitle}`,
          HTMLPart: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://i.ibb.co/zhx5Wy7K/11.png" alt="Review Brothers" style="max-width: 200px; height: auto; border-radius: 8px;" />
            </div>
            <h2 style="text-align: left; color: #232f3e; margin-bottom: 20px;">Thank you for your valuable review! 🎉</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              We're thrilled to have your feedback and are excited to share your digital download with you. Your opinion helps us and other customers make better decisions!
            </p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #232f3e; margin-top: 0;">Your Digital Download</h3>
              <p style="color: #333; margin-bottom: 10px;">
                <strong>${promotionTitle}</strong>
              </p>
              <p style="color: #666; font-size: 14px;">
                The PDF file is attached to this email. Simply click to download and enjoy your content!
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #333; font-size: 14px;">
                If you have any questions or need assistance, our support team is here to help!<br />
                Contact us at <a href="mailto:info@reviewbrothers.com" style="color: #232f3e; text-decoration: none;">info@reviewbrothers.com</a>
              </p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 0;">
                We appreciate your trust in Review Brothers. Your satisfaction is our top priority!
              </p>
            </div>
            <p style="margin-top: 40px; color: #232f3e; font-weight: bold;">
              Best Regards,<br />
              <span style="color: #f97316;">The Review Brothers Team</span>
            </p>
          </div>
          `,
          Attachments: [
            {
              ContentType: 'application/pdf',
              Filename: pdfFileName,
              Base64Content: pdfContent.toString('base64')
            }
          ]
        }
      ]
    });

    console.log('Email sent successfully:', result.body);
  } catch (error: any) {
    console.error('Error sending digital download email:', error);
    if (error.response?.body) {
      console.error('Mailjet API response:', error.response.body);
    }
    throw error;
  }
};

/**
 * Send coupon code via email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} promotionTitle - Title of the promotion
 * @param {string} couponCode - The coupon code to send
 * @param {Date} expiryDate - Expiry date of the coupon
 * @returns {Promise<void>}
 */
export const sendCouponCodeEmail = async (
  to: string,
  name: string,
  promotionTitle: string,
  couponCode: string
): Promise<void> => {
  console.log('Starting to send coupon code email:', {
    to,
    name,
    promotionTitle,
    couponCode
  });

  try {
    const result = await mailjet.post('send', { version: 'v3.1' }).request({
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
          Subject: `Your Exclusive Coupon Code: ${promotionTitle}`,
          HTMLPart: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://i.ibb.co/zhx5Wy7K/11.png" alt="Review Brothers" style="max-width: 200px; height: auto; border-radius: 8px;" />
            </div>
            
            <h2 style="text-align: left; color: #232f3e; margin-bottom: 20px;">Thank you for your valuable review! 🎉</h2>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              We're thrilled to have your feedback and are excited to reward you with an exclusive coupon code for your next purchase. Your opinion helps us and other customers make better decisions!
            </p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #232f3e; margin-top: 0;">Your Exclusive Coupon Code</h3>
              <div style="background-color: #ffffff; padding: 15px; border: 2px dashed #232f3e; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 24px; font-weight: bold; color: #f97316; margin: 0;">${couponCode}</p>
              </div>
            </div>

            <div style="background-color: #fff8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #232f3e; margin-top: 0;">How to Use Your Coupon</h3>
              <ol style="color: #333; padding-left: 20px;">
                <li>Add your desired items to your cart</li>
                <li>Proceed to checkout</li>
                <li>Enter the coupon code in the designated field</li>
                <li>Enjoy your discount!</li>
              </ol>
            </div>

            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #232f3e; margin-top: 0;">Need Help?</h3>
              <p style="color: #333; margin-bottom: 10px;">
                If you have any questions about using your coupon or need assistance with your purchase, our support team is here to help!
              </p>
              <p style="color: #666; font-size: 14px;">
                Contact us at <a href="mailto:info@reviewbrothers.com" style="color: #232f3e; text-decoration: none;">info@reviewbrothers.com</a>
              </p>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 0;">
                We appreciate your trust in Review Brothers. Your satisfaction is our top priority!
              </p>
            </div>

            <p style="margin-top: 40px; color: #232f3e; font-weight: bold;">
              Best Regards,<br />
              <span style="color: #f97316;">The Review Brothers Team</span>
            </p>
          </div>
          `
        }
      ]
    });

    console.log('Mailjet API response:', {
      status: result.response.status,
      body: result.body
    });
  } catch (error: any) {
    console.error('Error sending coupon code email:', {
      to,
      name,
      promotionTitle,
      error: error.message,
      response: error.response?.body
    });
    throw error;
  }
};

export default {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendInvitationEmail,
  sendDigitalDownloadEmail,
  sendCouponCodeEmail
};
