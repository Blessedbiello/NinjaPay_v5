// API Request/Response types

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Payment API
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  recipient: string;
  metadata?: Record<string, any>;
  priority?: 'speed' | 'finality';
}

export interface CreatePaymentResponse {
  id: string;
  status: string;
  signature?: string;
  amountCommitment: string;
  recipient: string;
  createdAt: string;
}

export interface GetBalanceRequest {
  walletAddress: string;
  decrypt?: boolean;
}

export interface GetBalanceResponse {
  walletAddress: string;
  encryptedBalance: string;
  decryptedBalance?: number;
  lastUpdated: string;
}

// Merchant API
export interface CreatePaymentLinkRequest {
  productName: string;
  description?: string;
  amount?: number;
  currency?: string;
  redirectUrl?: string;
  imageUrl?: string;
}

export interface CreatePaymentLinkResponse {
  id: string;
  url: string;
  productName: string;
  amount?: number;
  active: boolean;
  createdAt: string;
}

// Payroll API
export interface BatchPaymentRequest {
  payments: Array<{
    walletAddress: string;
    amount: number;
    employeeName?: string;
    note?: string;
  }>;
  scheduledDate?: string;
}

export interface BatchPaymentResponse {
  runId: string;
  status: string;
  totalAmount: number;
  employeeCount: number;
  signatures?: string[];
  createdAt: string;
}

// Webhook API
export interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
}

export interface CreateWebhookResponse {
  id: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  createdAt: string;
}
