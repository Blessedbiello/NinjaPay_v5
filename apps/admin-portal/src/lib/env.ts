
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000/v1/admin';
const ADMIN_API_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_API_KEY || process.env.ADMIN_API_KEY || 'dev_admin_key_12345';

export const getAdminUrl = () => ADMIN_API_URL;
export const getAdminSecret = () => ADMIN_API_SECRET;
