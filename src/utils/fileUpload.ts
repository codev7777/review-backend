import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const isProduction = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = isProduction ? '/var/www/uploads' : path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save a company logo from base64 data
 * @param {string} base64Data - Base64 encoded image data
 * @returns {string} - Path to the saved image
 */
export const saveCompanyLogo = (base64Data: string): string => {
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const [, imageType, base64String] = matches;
  const buffer = Buffer.from(base64String, 'base64');
  const fileName = `company-logo-${uuidv4()}.${imageType}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return fileName;
};

/**
 * Save a product image from base64 data
 * @param {string} base64Data - Base64 encoded image data
 * @returns {string} - Path to the saved image
 */
export const saveProductImage = (base64Data: string): string => {
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const [, imageType, base64String] = matches;
  const buffer = Buffer.from(base64String, 'base64');
  const fileName = `product-image-${uuidv4()}.${imageType}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return fileName;
};

/**
 * Save a campaign image from base64 data
 * @param {string} base64Data - Base64 encoded image data
 * @returns {string} - Path to the saved image
 */
export const saveCampaignImage = (base64Data: string): string => {
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const [, imageType, base64String] = matches;
  const buffer = Buffer.from(base64String, 'base64');
  const fileName = `campaign-image-${uuidv4()}.${imageType}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return fileName;
};

/**
 * Save a promotion image from base64 data
 * @param {string} base64Data - Base64 encoded image data
 * @returns {string} - Path to the saved image
 */
export const savePromotionImage = (base64Data: string): string => {
  const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const [, imageType, base64String] = matches;
  const buffer = Buffer.from(base64String, 'base64');
  const fileName = `promotion-image-${uuidv4()}.${imageType}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return fileName;
};

/**
 * Save a PDF file from base64 data
 * @param {string} base64Data - Base64 encoded PDF data
 * @returns {string} - Path to the saved PDF
 */
export const savePdfFile = (base64Data: string): string => {
  const matches = base64Data.match(/^data:application\/pdf;base64,(.+)$/);
  if (!matches || matches.length !== 2) {
    throw new Error('Invalid base64 PDF data');
  }

  const [, base64String] = matches;
  const buffer = Buffer.from(base64String, 'base64');
  const fileName = `promotion-pdf-${uuidv4()}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  return fileName;
};

/**
 * Delete an image file
 * @param {string} fileName - Name of the file to delete
 */
export const deleteImage = (fileName: string): void => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
