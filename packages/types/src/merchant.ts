export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'review';

export interface Merchant {
  id: string;
  userId: string;
  walletAddress: string;
  businessName: string;
  email: string;
  kycStatus: KYCStatus;
  apiKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
  settings: MerchantSettings;
  createdAt: Date;
}

export interface MerchantSettings {
  currency: string;
  autoDecrypt: boolean;
  complianceEnabled: boolean;
}

export interface PaymentLink {
  id: string;
  merchantId: string;
  url: string;
  productName: string;
  description?: string;
  amount?: number; // null = customer chooses
  currency: string;
  imageUrl?: string;
  redirectUrl?: string;
  active: boolean;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  enabled: boolean;
  createdAt: Date;
}

export type WebhookEvent =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.pending'
  | 'merchant.kyc.approved'
  | 'merchant.kyc.rejected';

export interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  paymentIntentId?: string;
  eventType: WebhookEvent;
  payload: WebhookPayload;
  responseStatus?: number;
  responseBody?: string;
  attempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}
