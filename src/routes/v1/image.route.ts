import express from 'express';
import path from 'path';
import fs from 'fs';
import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError';
import auth from '../../middlewares/auth';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = isProduction ? '/var/www/uploads' : path.join(__dirname, '../../../uploads');

/**
 * Get image by filename
 * @route GET /v1/images/:filename
 */
router.get('/:filename', auth(), async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Set appropriate headers
    res.setHeader('Content-Type', getContentType(filename));
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper function to determine content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export default router;
