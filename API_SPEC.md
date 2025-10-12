# NinjaPay API Specification
**RESTful API for Confidential Payments**

*Complete Developer Documentation*
*Version: 1.0 | Date: October 2025*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Authentication](#2-authentication)
3. [Core Concepts](#3-core-concepts)
4. [API Endpoints](#4-api-endpoints)
5. [Webhooks](#5-webhooks)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting](#7-rate-limiting)
8. [SDKs & Libraries](#8-sdks--libraries)
9. [Examples](#9-examples)
10. [Best Practices](#10-best-practices)

---

## 1. Introduction

### Overview

The NinjaPay API allows developers to integrate confidential payments into their applications. Built on Solana using Arcium's Confidential SPL Token standard, the API provides:

- **Privacy-First**: All payment amounts are encrypted onchain
- **Fast**: Sub-second transaction finality via MagicBlock
- **Developer-Friendly**: REST API with comprehensive SDKs
- **Compliance-Ready**: Optional auditor keys for institutional use

### Base URL

```
Production:  https://api.ninjapay.xyz/v1
Testnet:     https://api.testnet.ninjapay.xyz/v1
```

### API Versions

| Version | Status | Notes |
|---------|--------|-------|
| v1 | Current | Stable, recommended |

### Quick Start

```bash
# Get your API key from dashboard.ninjapay.xyz
export NINJAPAY_API_KEY="nj_live_abc123..."

# Make your first API call
curl https://api.ninjapay.xyz/v1/payments \
  -H "Authorization: Bearer $NINJAPAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USDC",
    "recipient": "7xJ8...abc"
  }'
```

---

## 2. Authentication

### API Keys

All API requests must include an API key in the `Authorization` header.

**Format**:
```
Authorization: Bearer nj_live_abc123...
```

**Key Types**:
- `nj_test_...`: Testnet keys (for development)
- `nj_live_...`: Production keys (for live transactions)

### Getting API Keys

1. Sign up at [dashboard.ninjapay.xyz](https://dashboard.ninjapay.xyz)
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Copy and securely store your key (shown only once)

**Security**:
- Never commit API keys to version control
- Store keys in environment variables
- Rotate keys every 90 days
- Use different keys for dev/staging/prod

### Example

```typescript
// ✅ Good: Environment variable
const apiKey = process.env.NINJAPAY_API_KEY;

// ❌ Bad: Hardcoded
const apiKey = "nj_live_abc123...";
```

---

## 3. Core Concepts

### Payment Lifecycle

```
pending → processing → confirmed → finalized
   ↓
cancelled / failed
```

**States**:
- `pending`: Payment created, not yet submitted to blockchain
- `processing`: Transaction submitted, waiting for confirmation
- `confirmed`: Transaction confirmed (1 confirmation)
- `finalized`: Transaction finalized (32 confirmations on Solana)
- `failed`: Transaction failed (insufficient balance, invalid recipient, etc.)
- `cancelled`: Payment cancelled before processing

### Amount Commitment

Instead of plaintext amounts, NinjaPay uses **Pedersen commitments**:

```
commitment = g^amount * h^randomness
```

**Properties**:
- Hides the amount
- Allows verification (ZK proofs)
- Additive homomorphic (can sum without decrypting)

**In API Responses**:
```json
{
  "amount_commitment": "0x4a7b2c8d...",  // Public commitment
  "amount": null  // Encrypted, not returned
}
```

### Idempotency

All `POST` requests support idempotency via `Idempotency-Key` header:

```bash
curl https://api.ninjapay.xyz/v1/payments \
  -H "Authorization: Bearer $NINJAPAY_API_KEY" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{"amount": 100, "currency": "USDC", "recipient": "..."}'
```

If you retry with the same idempotency key, you'll receive the same response (no duplicate payment).

---

## 4. API Endpoints

### Payments

#### Create Payment

Create a confidential payment.

**Endpoint**: `POST /v1/payments`

**Request Body**:
```json
{
  "amount": 100.50,
  "currency": "USDC",
  "recipient": "7xJ8...abc",
  "metadata": {
    "invoice_id": "INV-001",
    "customer_email": "alice@example.com"
  },
  "priority": "standard"  // "standard" | "fast"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount to send (decimals allowed) |
| `currency` | string | Yes | Currency code (currently only "USDC") |
| `recipient` | string | Yes | Recipient Solana wallet address |
| `metadata` | object | No | Custom key-value pairs (max 20 keys, 500 chars each) |
| `priority` | string | No | "standard" (Solana L1) or "fast" (MagicBlock L2) |

**Response**:
```json
{
  "id": "pay_abc123",
  "status": "pending",
  "amount_commitment": "0x4a7b2c8d...",
  "currency": "USDC",
  "recipient": "7xJ8...abc",
  "metadata": {
    "invoice_id": "INV-001",
    "customer_email": "alice@example.com"
  },
  "created_at": "2025-10-05T12:00:00Z",
  "signature": null  // Will be set when confirmed
}
```

**Status Codes**:
- `201 Created`: Payment created successfully
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: Rate limit exceeded

**Example**:
```typescript
const response = await fetch('https://api.ninjapay.xyz/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 100.50,
    currency: 'USDC',
    recipient: '7xJ8...abc',
  }),
});

const payment = await response.json();
console.log('Payment ID:', payment.id);
```

---

#### Get Payment

Retrieve payment details by ID.

**Endpoint**: `GET /v1/payments/:id`

**Response**:
```json
{
  "id": "pay_abc123",
  "status": "confirmed",
  "amount_commitment": "0x4a7b2c8d...",
  "currency": "USDC",
  "recipient": "7xJ8...abc",
  "metadata": { /* ... */ },
  "created_at": "2025-10-05T12:00:00Z",
  "confirmed_at": "2025-10-05T12:00:02Z",
  "signature": "tx_signature_here",
  "explorer_url": "https://solscan.io/tx/tx_signature_here"
}
```

**Status Codes**:
- `200 OK`: Payment found
- `404 Not Found`: Payment not found
- `401 Unauthorized`: Invalid API key

---

#### List Payments

List all payments for your account.

**Endpoint**: `GET /v1/payments`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of results (max 100, default 10) |
| `starting_after` | string | Pagination cursor (payment ID) |
| `status` | string | Filter by status: "pending", "confirmed", etc. |
| `created_after` | string | ISO 8601 timestamp |
| `created_before` | string | ISO 8601 timestamp |

**Response**:
```json
{
  "data": [
    {
      "id": "pay_abc123",
      "status": "confirmed",
      /* ... */
    },
    {
      "id": "pay_def456",
      "status": "pending",
      /* ... */
    }
  ],
  "has_more": true,
  "next_cursor": "pay_def456"
}
```

**Example**:
```typescript
const response = await fetch(
  'https://api.ninjapay.xyz/v1/payments?limit=10&status=confirmed',
  {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  }
);

const { data, has_more, next_cursor } = await response.json();
```

---

#### Cancel Payment

Cancel a pending payment.

**Endpoint**: `POST /v1/payments/:id/cancel`

**Response**:
```json
{
  "id": "pay_abc123",
  "status": "cancelled",
  "cancelled_at": "2025-10-05T12:01:00Z"
}
```

**Status Codes**:
- `200 OK`: Payment cancelled
- `400 Bad Request`: Cannot cancel (already confirmed)
- `404 Not Found`: Payment not found

---

### Batch Payments (Payroll)

#### Create Batch Payment

Send payments to multiple recipients in one transaction (ideal for payroll).

**Endpoint**: `POST /v1/payments/batch`

**Request Body**:
```json
{
  "payments": [
    {
      "recipient": "7xJ8...abc",
      "amount": 5000,
      "metadata": { "employee_id": "EMP-001", "name": "Alice" }
    },
    {
      "recipient": "9kL2...def",
      "amount": 3000,
      "metadata": { "employee_id": "EMP-002", "name": "Bob" }
    }
  ],
  "currency": "USDC"
}
```

**Response**:
```json
{
  "batch_id": "batch_xyz789",
  "status": "processing",
  "total_amount": 8000,
  "payment_count": 2,
  "payments": [
    { "id": "pay_abc123", "status": "pending", /* ... */ },
    { "id": "pay_def456", "status": "pending", /* ... */ }
  ],
  "created_at": "2025-10-05T12:00:00Z"
}
```

**Limits**:
- Max 1000 payments per batch
- All payments must use same currency

---

#### Get Batch Status

Check the status of a batch payment.

**Endpoint**: `GET /v1/payments/batch/:batch_id`

**Response**:
```json
{
  "batch_id": "batch_xyz789",
  "status": "completed",
  "total_amount": 8000,
  "payment_count": 2,
  "succeeded": 2,
  "failed": 0,
  "payments": [
    { "id": "pay_abc123", "status": "confirmed", /* ... */ },
    { "id": "pay_def456", "status": "confirmed", /* ... */ }
  ],
  "completed_at": "2025-10-05T12:00:15Z"
}
```

---

### Balance

#### Get Decrypted Balance

Get your decrypted confidential USDC balance.

**Endpoint**: `GET /v1/balance`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | string | Wallet address (optional, defaults to your account wallet) |

**Response**:
```json
{
  "balance": 1234.56,
  "currency": "USDC",
  "wallet": "7xJ8...abc",
  "last_updated": "2025-10-05T12:00:00Z"
}
```

**Note**: This endpoint uses Arcium MPC to decrypt your balance. The decryption happens server-side and is not logged.

---

### Transactions

#### List Transactions

List all your transactions (sent and received).

**Endpoint**: `GET /v1/transactions`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of results (max 100, default 10) |
| `starting_after` | string | Pagination cursor |
| `direction` | string | "sent" or "received" |
| `status` | string | Filter by status |

**Response**:
```json
{
  "data": [
    {
      "id": "tx_abc123",
      "type": "sent",
      "amount_commitment": "0x4a7b2c8d...",
      "recipient": "9kL2...def",
      "status": "confirmed",
      "signature": "tx_signature_here",
      "created_at": "2025-10-05T12:00:00Z"
    }
  ],
  "has_more": false
}
```

---

### Webhooks

#### Create Webhook

Register a webhook URL to receive real-time events.

**Endpoint**: `POST /v1/webhooks`

**Request Body**:
```json
{
  "url": "https://myapp.com/webhooks/ninjapay",
  "events": [
    "payment.succeeded",
    "payment.failed",
    "payment.cancelled"
  ],
  "description": "Production webhook"
}
```

**Response**:
```json
{
  "id": "wh_abc123",
  "url": "https://myapp.com/webhooks/ninjapay",
  "events": ["payment.succeeded", "payment.failed", "payment.cancelled"],
  "secret": "whsec_xyz789...",  // Use this to verify webhook signatures
  "enabled": true,
  "created_at": "2025-10-05T12:00:00Z"
}
```

**Available Events**:
- `payment.created`
- `payment.succeeded`
- `payment.failed`
- `payment.cancelled`
- `batch.completed`
- `batch.failed`

---

#### List Webhooks

**Endpoint**: `GET /v1/webhooks`

**Response**:
```json
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://myapp.com/webhooks/ninjapay",
      "events": ["payment.succeeded"],
      "enabled": true,
      "created_at": "2025-10-05T12:00:00Z"
    }
  ]
}
```

---

#### Delete Webhook

**Endpoint**: `DELETE /v1/webhooks/:id`

**Response**:
```json
{
  "id": "wh_abc123",
  "deleted": true
}
```

---

## 5. Webhooks

### Receiving Webhooks

When an event occurs, NinjaPay sends a POST request to your webhook URL.

**Webhook Payload**:
```json
{
  "id": "evt_abc123",
  "type": "payment.succeeded",
  "data": {
    "id": "pay_abc123",
    "status": "confirmed",
    "amount_commitment": "0x4a7b2c8d...",
    "recipient": "7xJ8...abc",
    "signature": "tx_signature_here",
    "confirmed_at": "2025-10-05T12:00:02Z"
  },
  "created_at": "2025-10-05T12:00:02Z"
}
```

**Headers**:
```
Content-Type: application/json
X-Ninjapay-Signature: sha256=abc123...
X-Ninjapay-Event-Id: evt_abc123
```

### Verifying Webhook Signatures

Always verify webhook signatures to ensure the request came from NinjaPay.

**Algorithm**: HMAC-SHA256

```typescript
import crypto from 'crypto';

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// Express.js example
app.post('/webhooks/ninjapay', (req, res) => {
  const signature = req.headers['x-ninjapay-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhook(payload, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const event = req.body;
  console.log('Event:', event.type, event.data);

  res.status(200).send('OK');
});
```

### Webhook Retry Logic

If your webhook endpoint returns a non-2xx status code, NinjaPay will retry:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 10 minutes |
| 4 | 1 hour |
| 5 | 12 hours |

After 5 failed attempts, the webhook is marked as failed and will not be retried.

**Best Practices**:
- Return `200 OK` immediately (within 5 seconds)
- Process webhook asynchronously (queue for background job)
- Use idempotency (check `event.id` to avoid duplicate processing)

---

## 6. Error Handling

### Error Response Format

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_recipient",
    "message": "The recipient address is not a valid Solana wallet",
    "param": "recipient"
  }
}
```

### Error Types

| Type | HTTP Code | Description |
|------|-----------|-------------|
| `invalid_request_error` | 400 | Invalid parameters |
| `authentication_error` | 401 | Invalid API key |
| `permission_error` | 403 | Forbidden |
| `not_found_error` | 404 | Resource not found |
| `rate_limit_error` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `invalid_api_key` | API key is invalid or revoked | Check your API key |
| `invalid_recipient` | Recipient address is malformed | Use valid Solana address (base58) |
| `insufficient_balance` | Not enough funds | Deposit more USDC to your vault |
| `amount_too_small` | Amount below minimum (0.01 USDC) | Increase amount |
| `amount_too_large` | Amount above maximum | Split into multiple payments |
| `duplicate_idempotency_key` | Idempotency key already used | Use a new key or retrieve existing payment |

---

## 7. Rate Limiting

### Limits

| Tier | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 600 | 100,000 |
| Enterprise | Custom | Custom |

### Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1633024800
```

### Handling Rate Limits

**Status Code**: `429 Too Many Requests`

**Response**:
```json
{
  "error": {
    "type": "rate_limit_error",
    "message": "You have exceeded the rate limit. Try again in 30 seconds."
  }
}
```

**Best Practices**:
- Implement exponential backoff
- Cache API responses when possible
- Use batch endpoints (reduce number of requests)
- Upgrade to higher tier if needed

**Example (Exponential Backoff)**:
```typescript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Max retries exceeded');
}
```

---

## 8. SDKs & Libraries

### Official SDKs

#### TypeScript/JavaScript

```bash
npm install @ninjapay/sdk
```

```typescript
import { NinjaPay } from '@ninjapay/sdk';

const ninjapay = new NinjaPay({
  apiKey: process.env.NINJAPAY_API_KEY,
  network: 'mainnet',  // or 'testnet'
});

// Create payment
const payment = await ninjapay.payments.create({
  amount: 100,
  currency: 'USDC',
  recipient: '7xJ8...abc',
});

console.log('Payment ID:', payment.id);

// List payments
const payments = await ninjapay.payments.list({ limit: 10 });

// Get payment
const retrieved = await ninjapay.payments.retrieve('pay_abc123');
```

#### Python

```bash
pip install ninjapay
```

```python
import ninjapay

ninjapay.api_key = os.environ['NINJAPAY_API_KEY']

# Create payment
payment = ninjapay.Payment.create(
    amount=100,
    currency='USDC',
    recipient='7xJ8...abc'
)

print(f'Payment ID: {payment.id}')
```

#### Rust

```bash
cargo add ninjapay
```

```rust
use ninjapay::{Client, PaymentCreateParams};

#[tokio::main]
async fn main() {
    let client = Client::new(env::var("NINJAPAY_API_KEY").unwrap());

    let payment = client.payments().create(PaymentCreateParams {
        amount: 100.0,
        currency: "USDC".to_string(),
        recipient: "7xJ8...abc".to_string(),
        ..Default::default()
    }).await.unwrap();

    println!("Payment ID: {}", payment.id);
}
```

### Community SDKs

- **Go**: `github.com/ninjapay/go-ninjapay`
- **Ruby**: `gem install ninjapay`
- **PHP**: `composer require ninjapay/ninjapay-php`

---

## 9. Examples

### Example 1: E-Commerce Checkout

Accept confidential payments on your website.

```typescript
// Backend (Node.js/Express)
app.post('/api/checkout', async (req, res) => {
  const { cart, customerWallet } = req.body;

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  // Create confidential payment
  const payment = await ninjapay.payments.create({
    amount: total,
    currency: 'USDC',
    recipient: process.env.MERCHANT_WALLET,
    metadata: {
      customer_wallet: customerWallet,
      order_id: generateOrderId(),
      items: JSON.stringify(cart),
    },
  });

  // Return payment ID to frontend
  res.json({ paymentId: payment.id });
});

// Frontend (React)
async function handleCheckout() {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ cart, customerWallet }),
  });

  const { paymentId } = await response.json();

  // Show payment modal
  showPaymentModal(paymentId);
}
```

---

### Example 2: Automated Payroll

Send monthly salaries to employees.

```typescript
import { NinjaPay } from '@ninjapay/sdk';
import csv from 'csv-parser';
import fs from 'fs';

const ninjapay = new NinjaPay({ apiKey: process.env.NINJAPAY_API_KEY });

async function runPayroll(csvFilePath: string) {
  const payments = [];

  // Read employee data from CSV
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      payments.push({
        recipient: row.wallet_address,
        amount: parseFloat(row.salary),
        metadata: {
          employee_id: row.employee_id,
          name: row.name,
          month: new Date().toISOString().slice(0, 7),  // "2025-10"
        },
      });
    })
    .on('end', async () => {
      console.log(`Preparing to pay ${payments.length} employees...`);

      // Create batch payment
      const batch = await ninjapay.payments.createBatch({
        payments,
        currency: 'USDC',
      });

      console.log(`Batch created: ${batch.batch_id}`);

      // Poll for completion
      let status = 'processing';
      while (status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

        const updated = await ninjapay.payments.getBatch(batch.batch_id);
        status = updated.status;

        console.log(`Status: ${status} (${updated.succeeded}/${updated.payment_count} succeeded)`);
      }

      if (status === 'completed') {
        console.log('✓ Payroll completed successfully!');
      } else {
        console.error('✗ Payroll failed:', status);
      }
    });
}

runPayroll('./employees.csv');
```

---

### Example 3: Webhook Integration

Process payment events in real-time.

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.NINJAPAY_WEBHOOK_SECRET;

// Verify webhook signature
function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${expectedSignature}` === signature;
}

app.post('/webhooks/ninjapay', async (req, res) => {
  const signature = req.headers['x-ninjapay-signature'];
  const payload = JSON.stringify(req.body);

  // Verify signature
  if (!verifyWebhook(payload, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  // Process event
  switch (event.type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(event.data);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;

    case 'batch.completed':
      await handleBatchCompleted(event.data);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  // Respond immediately
  res.status(200).send('OK');
});

async function handlePaymentSucceeded(payment) {
  console.log('Payment succeeded:', payment.id);

  // Grant access to digital product
  await db.orders.update({
    payment_id: payment.id,
    status: 'completed',
    completed_at: new Date(),
  });

  // Send confirmation email
  await sendEmail(payment.metadata.customer_email, {
    subject: 'Payment Received',
    body: `Your payment of ${payment.metadata.amount} USDC was received successfully.`,
  });
}

async function handlePaymentFailed(payment) {
  console.error('Payment failed:', payment.id);

  // Notify customer
  await sendEmail(payment.metadata.customer_email, {
    subject: 'Payment Failed',
    body: 'Your payment could not be processed. Please try again.',
  });
}

async function handleBatchCompleted(batch) {
  console.log('Batch completed:', batch.batch_id);

  // Send payroll summary email to finance team
  await sendEmail('finance@company.com', {
    subject: `Payroll Completed - ${batch.payment_count} employees paid`,
    body: `Total: ${batch.total_amount} USDC`,
  });
}

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

---

## 10. Best Practices

### Security

1. **Never expose API keys**
   - Store in environment variables
   - Use different keys for dev/prod
   - Rotate keys regularly

2. **Verify webhook signatures**
   - Always validate HMAC signatures
   - Prevent webhook replay attacks

3. **Use HTTPS**
   - All webhook URLs must use HTTPS
   - Reject unencrypted connections

### Performance

1. **Use batch endpoints**
   - Send 100 payments in one request instead of 100 requests
   - Reduces API calls and latency

2. **Implement caching**
   - Cache balance for 5 minutes
   - Cache payment status for 30 seconds
   - Use ETags for conditional requests

3. **Handle rate limits gracefully**
   - Implement exponential backoff
   - Queue requests during rate limit

### Reliability

1. **Implement retries**
   - Retry failed requests (with idempotency keys)
   - Use exponential backoff (1s, 2s, 4s, 8s)

2. **Monitor webhook delivery**
   - Log all webhook events
   - Alert on failed deliveries
   - Implement manual retry mechanism

3. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log errors for debugging
   - Provide fallback UX

### Testing

1. **Use testnet for development**
   - All testing on devnet/testnet
   - Only move to mainnet when ready

2. **Test error scenarios**
   - Insufficient balance
   - Invalid recipient
   - Rate limits

3. **Load test before launch**
   - Simulate 100+ concurrent requests
   - Ensure your webhook endpoint can handle load

---

## Appendix

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Oct 2025 | Initial release |

### Support

- **Email**: support@ninjapay.xyz
- **Discord**: [discord.gg/ninjapay](https://discord.gg/ninjapay)
- **Twitter**: [@ninjapay](https://twitter.com/ninjapay)

### Legal

- [Terms of Service](https://ninjapay.xyz/terms)
- [Privacy Policy](https://ninjapay.xyz/privacy)
- [API Terms](https://ninjapay.xyz/api-terms)

---

**Document Version**: 1.0
**Last Updated**: October 5, 2025
**API Version**: v1
