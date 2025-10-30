/**
 * React hooks for NinjaPay API integration
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  PaymentIntent,
  Product,
  Customer,
  PaymentLink,
  CheckoutSession,
} from '@/lib/api-client';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseApiListState<T> {
  items: T[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic hook for fetching single resource
export function useApiResource<T>(
  fetcher: () => Promise<any>,
  deps: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Generic hook for fetching list of resources
export function useApiList<T>(
  fetcher: () => Promise<any>,
  deps: any[] = []
): UseApiListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (response.success) {
        setItems(response.data.items || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, total, loading, error, refetch: fetchData };
}

// Payment Intents hooks
export function usePaymentIntent(id: string) {
  return useApiResource<PaymentIntent>(
    () => apiClient.getPaymentIntent(id),
    [id]
  );
}

export function usePaymentIntents(params?: {
  limit?: number;
  offset?: number;
  customerId?: string;
  status?: string;
  decrypt?: boolean;
}) {
  return useApiList<PaymentIntent>(
    () => apiClient.listPaymentIntents(params),
    [JSON.stringify(params)]
  );
}

// Products hooks
export function useProduct(id: string) {
  return useApiResource<Product>(() => apiClient.getProduct(id), [id]);
}

export function useProducts(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
}) {
  return useApiList<Product>(
    () => apiClient.listProducts(params),
    [JSON.stringify(params)]
  );
}

// Customers hooks
export function useCustomer(id: string) {
  return useApiResource<Customer>(() => apiClient.getCustomer(id), [id]);
}

export function useCustomers(params?: { limit?: number; offset?: number }) {
  return useApiList<Customer>(
    () => apiClient.listCustomers(params),
    [JSON.stringify(params)]
  );
}

// Payment Links hooks
export function usePaymentLinks(params?: { limit?: number; offset?: number }) {
  return useApiList<PaymentLink>(
    () => apiClient.listPaymentLinks(params),
    [JSON.stringify(params)]
  );
}

// Checkout Session hook
export function useCheckoutSession(id: string) {
  return useApiResource<CheckoutSession>(
    () => apiClient.getCheckoutSession(id),
    [id]
  );
}

// Balance hook
export function useBalance() {
  return useApiResource<{
    available: number;
    pending: number;
    encryptedBalance?: string;
    commitment?: string;
  }>(() => apiClient.getBalance(), []);
}

// Health check hook
export function useHealthCheck() {
  return useApiResource<{ status: string; timestamp: string }>(
    () => apiClient.health(),
    []
  );
}

// Mutation hooks
export function useCreatePaymentIntent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();

  const create = async (params: {
    amount: number;
    currency?: string;
    customerId?: string;
    productId?: string;
    description?: string;
    metadata?: Record<string, any>;
    recipient?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      if (!publicKey || !signMessage) {
        throw new Error('Connect a wallet that supports message signing to authorize this payment intent.');
      }

      const recipient = params.recipient ?? publicKey.toBase58();
      const payloadDescriptor = {
        amount: params.amount,
        currency: params.currency ?? 'USDC',
        recipient,
        signer: publicKey.toBase58(),
        timestamp: Date.now(),
      };

      const message = `NINJAPAY::PAYMENT_INTENT::${JSON.stringify(payloadDescriptor)}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const userSignature = bs58.encode(signatureBytes);

      const response = await apiClient.createPaymentIntent({
        ...params,
        recipient,
        userSignature,
        metadata: {
          ...(params.metadata ?? {}),
          signaturePayload: payloadDescriptor,
        },
      });

      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create payment intent');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useCreateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (params: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    images?: string[];
    active?: boolean;
    metadata?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.createProduct(params);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create product');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (params: {
    email: string;
    name?: string;
    walletAddress?: string;
    metadata?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.createCustomer(params);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to create customer');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, params: Partial<Product>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.updateProduct(id, params);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update product');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.deleteProduct(id);
      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || 'Failed to delete product');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProduct, loading, error };
}

export function useConfirmPaymentIntent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.confirmPaymentIntent(id);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to confirm payment');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { confirm, loading, error };
}

export function useCancelPaymentIntent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.cancelPaymentIntent(id);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to cancel payment');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, loading, error };
}

// ============================================
// DEVELOPER HOOKS
// ============================================

interface DeveloperMetrics {
  apiCalls: {
    total: number;
    growth: string;
  };
  successRate: number;
  avgResponseTime: number;
  activeApiKeys: number;
  totalApiKeys: number;
  webhookDeliveries: {
    total: number;
    successRate: number;
  };
  integrationStatus: {
    hasApiKey: boolean;
    hasFirstCall: boolean;
    hasWebhook: boolean;
    hasWebhookDelivery: boolean;
    hasTestPayment: boolean;
    completionPercentage: number;
  };
}

interface ApiActivity {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  apiKeyName: string;
  apiKeyLastChars: string;
  errorMessage?: string;
}

interface ApiError {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  errorMessage: string;
}

export function useDeveloperMetrics() {
  return useApiResource<DeveloperMetrics>(
    async () => {
      const response = await fetch('/api/v1/developers/metrics');
      return response.json();
    },
    []
  );
}

export function useApiActivity(params?: { limit?: number }) {
  return useApiList<ApiActivity>(
    async () => {
      const query = params ? `?limit=${params.limit}` : '';
      const response = await fetch(`/api/v1/developers/activity${query}`);
      return response.json();
    },
    [JSON.stringify(params)]
  );
}

export function useApiErrors(params?: { limit?: number }) {
  return useApiList<ApiError>(
    async () => {
      const query = params ? `?limit=${params.limit}` : '';
      const response = await fetch(`/api/v1/developers/errors${query}`);
      return response.json();
    },
    [JSON.stringify(params)]
  );
}
