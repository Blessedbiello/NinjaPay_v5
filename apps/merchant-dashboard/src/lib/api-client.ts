/**
 * NinjaPay API Client
 * Type-safe client for communicating with the API Gateway
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Types
export interface PaymentIntent {
  id: string;
  merchantId: string;
  customerId?: string;
  productId?: string;
  amount: number | null;
  amountCommitment?: string;
  encryptedAmount?: Buffer;
  currency: string;
  description?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  email: string;
  name?: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLink {
  id: string;
  merchantId: string;
  productId?: string;
  amount: number;
  currency: string;
  title: string;
  description?: string;
  active: boolean;
  url: string;
  successUrl?: string;
  cancelUrl?: string;
  allowPromotionCodes?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSession {
  id: string;
  merchantId: string;
  paymentIntentId?: string;
  paymentLinkId?: string;
  status: 'open' | 'complete' | 'expired';
  url: string;
  expiresAt: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  merchantId: string;
  name: string;
  key: string;
  type: 'live' | 'test';
  lastUsed?: string;
  createdAt: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;

    // Try to get API key from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('ninjapay_api_key');
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ninjapay_api_key', apiKey);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || 'UNKNOWN_ERROR',
            message: data.message || 'An error occurred',
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Payment Intents
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId?: string;
    productId?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request<PaymentIntent>('/v1/payment_intents', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPaymentIntent(id: string) {
    return this.request<PaymentIntent>(`/v1/payment_intents/${id}`);
  }

  async listPaymentIntents(params?: {
    limit?: number;
    offset?: number;
    customerId?: string;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ items: PaymentIntent[]; total: number }>(
      `/v1/payment_intents${query ? `?${query}` : ''}`
    );
  }

  async confirmPaymentIntent(id: string) {
    return this.request<PaymentIntent>(`/v1/payment_intents/${id}/confirm`, {
      method: 'POST',
    });
  }

  async cancelPaymentIntent(id: string) {
    return this.request<PaymentIntent>(`/v1/payment_intents/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Products
  async createProduct(params: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    images?: string[];
    active?: boolean;
    metadata?: Record<string, any>;
  }) {
    return this.request<Product>('/v1/products', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getProduct(id: string) {
    return this.request<Product>(`/v1/products/${id}`);
  }

  async listProducts(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ items: Product[]; total: number }>(
      `/v1/products${query ? `?${query}` : ''}`
    );
  }

  async updateProduct(id: string, params: Partial<Product>) {
    return this.request<Product>(`/v1/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteProduct(id: string) {
    return this.request<{ deleted: boolean }>(`/v1/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  async createCustomer(params: {
    email: string;
    name?: string;
    walletAddress?: string;
    metadata?: Record<string, any>;
  }) {
    return this.request<Customer>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCustomer(id: string) {
    return this.request<Customer>(`/v1/customers/${id}`);
  }

  async listCustomers(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ items: Customer[]; total: number }>(
      `/v1/customers${query ? `?${query}` : ''}`
    );
  }

  async updateCustomer(id: string, params: Partial<Customer>) {
    return this.request<Customer>(`/v1/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<{ deleted: boolean }>(`/v1/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Checkout Sessions
  async createCheckoutSession(params: {
    paymentIntentId?: string;
    paymentLinkId?: string;
    successUrl?: string;
    cancelUrl?: string;
    expiresIn?: number;
    metadata?: Record<string, any>;
  }) {
    return this.request<CheckoutSession>('/v1/checkout_sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getCheckoutSession(id: string) {
    return this.request<CheckoutSession>(`/v1/checkout_sessions/${id}`);
  }

  async expireCheckoutSession(id: string) {
    return this.request<CheckoutSession>(`/v1/checkout_sessions/${id}/expire`, {
      method: 'POST',
    });
  }

  // Payment Links (using existing payments endpoint for now)
  async createPaymentLink(params: {
    productId?: string;
    amount: number;
    currency?: string;
    title: string;
    description?: string;
    successUrl?: string;
    cancelUrl?: string;
    allowPromotionCodes?: boolean;
    metadata?: Record<string, any>;
  }) {
    // TODO: Create dedicated payment links endpoint
    return this.request<PaymentLink>('/v1/payments/links', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listPaymentLinks(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ items: PaymentLink[]; total: number }>(
      `/v1/payments/links${query ? `?${query}` : ''}`
    );
  }

  // Webhooks
  async createWebhook(params: {
    url: string;
    events: string[];
    metadata?: Record<string, any>;
  }) {
    return this.request<Webhook>('/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listWebhooks() {
    return this.request<{ items: Webhook[] }>('/v1/webhooks');
  }

  async deleteWebhook(id: string) {
    return this.request<{ deleted: boolean }>(`/v1/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async testWebhook(id: string) {
    return this.request<{ success: boolean }>(`/v1/webhooks/${id}/test`, {
      method: 'POST',
    });
  }

  // Balance
  async getBalance() {
    return this.request<{
      available: number;
      pending: number;
      encryptedBalance?: string;
      commitment?: string;
    }>('/v1/balance');
  }

  // Health
  async health() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for creating custom instances
export default ApiClient;
