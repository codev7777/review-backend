export const getUploadDir = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? '/var/www/uploads' : 'uploads';
};
