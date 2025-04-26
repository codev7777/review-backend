import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
export const UPLOAD_DIR: string = isProduction
  ? '/var/www/uploads'
  : path.join(__dirname, '../../uploads');
