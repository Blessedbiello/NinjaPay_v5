export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  revalidate?: number;
};

const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000/v1/admin';

export async function adminFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${ADMIN_API_BASE}${path}`;
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dev_admin_key_12345';

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    next: options.revalidate ? { revalidate: options.revalidate } : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin API request failed (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

// API client functions
export const adminApi = {
  async getStats() {
    return adminFetch<{
      merchants: { total: number; active: number; pendingKyc: number };
      payments: { total: number; confirmed: number; lastHour: number };
      timestamp: string;
    }>('/stats');
  },

  async getMerchants(page = 1, limit = 20) {
    return adminFetch<{
      merchants: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/merchants?page=${page}&limit=${limit}`);
  },

  async getMerchant(id: string) {
    return adminFetch<{
      merchant: any;
      paymentStats: any[];
    }>(`/merchants/${id}`);
  },

  async updateMerchant(id: string, data: { kycStatus?: string; settings?: any }) {
    return adminFetch<any>(`/merchants/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  async getPayments(page = 1, limit = 50, status?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) query.append('status', status);
    return adminFetch<{
      payments: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/payments?${query}`);
  },

  async getPayment(id: string) {
    return adminFetch<any>(`/payments/${id}`);
  },

  async getApiLogs(page = 1, limit = 100) {
    return adminFetch<{
      logs: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/api-logs?page=${page}&limit=${limit}`);
  },

  async getWebhookDeliveries(page = 1, limit = 50) {
    return adminFetch<{
      deliveries: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/webhook-deliveries?page=${page}&limit=${limit}`);
  },

  async login(email: string, password: string) {
    return adminFetch<{
      success: boolean;
      session: string;
      user: { email: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
};
