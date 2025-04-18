export const getFrontendUrl = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? 'https://reviewbrothers.com' : 'http://localhost:8080';
};

export const getFrontendPath = (path: string): string => {
  return `${getFrontendUrl()}${path}`;
};
