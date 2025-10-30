const ADMIN_API_URL =
  process.env.ADMIN_API_URL ||
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  'http://localhost:8001/v1/admin';

export const getAdminUrl = () => ADMIN_API_URL;

export const getAdminSecret = () => {
  const secret = process.env.ADMIN_API_KEY;

  if (!secret) {
    throw new Error('ADMIN_API_KEY environment variable must be set');
  }

  return secret;
};
