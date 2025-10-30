# NinjaPay Product Requirements Document (PRD)
**Confidential Payments Platform for Solana**

*Product Vision, Features, User Stories, and Success Metrics*
*Version: 1.0 | Date: October 2025*

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [Product Features](#3-product-features)
4. [User Stories & Acceptance Criteria](#4-user-stories--acceptance-criteria)
5. [User Flows](#5-user-flows)
6. [UI/UX Requirements](#6-uiux-requirements)
7. [Technical Requirements](#7-technical-requirements)
8. [Success Metrics](#8-success-metrics)
9. [Release Plan](#9-release-plan)

---

## 1. Product Overview

### 1.1 Vision Statement

> **NinjaPay is the privacy layer for Solana commerce** — enabling individuals, merchants, and institutions to transact with Venmo-level convenience while keeping amounts confidential through cutting-edge cryptography.

### 1.2 Problem Statement

**Consumer Problem**:
"I want to use crypto for everyday payments, but I don't want my friends, family, or the world seeing my salary, spending patterns, or financial activity."

**Merchant Problem**:
"I want to accept crypto payments with lower fees than Stripe (2.9%), but I can't reveal my revenue to competitors or expose customer purchase amounts."

**Institution Problem**:
"We want to pay employees in stablecoins for instant global payroll, but we can't broadcast every employee's salary on a public blockchain."

### 1.3 Solution

NinjaPay provides **three integrated products**:

1. **Consumer Mobile App**: Venmo-like P2P payments with confidential amounts
2. **Merchant Platform**: Stripe-like payment tools with encrypted transactions
3. **Payroll System**: Institutional-grade batch payments with compliance features

**Core Technology**:
- **Arcium Confidential SPL**: MPC-powered encrypted token standard
- **MagicBlock Ephemeral Rollups**: Sub-50ms transaction speed
- **Zero-Knowledge Proofs**: Cryptographic privacy guarantees

### 1.4 Target Market

**Primary Markets**:
1. **Crypto-native consumers** (100k-500k users)
   - Early adopters concerned about privacy
   - DeFi users, NFT traders, DAO contributors

2. **Online merchants** (5k-25k merchants)
   - E-commerce stores on Shopify
   - Digital goods sellers (courses, software)
   - Crypto-friendly SaaS companies

3. **Remote-first companies** (500-2k companies)
   - Web3 projects with global teams
   - DAOs with contributor payments
   - Crypto startups doing payroll in stablecoins

**Market Size**:
- TAM: $87B (global payment gateways)
- SAM: $4.3B (crypto payment market)
- SOM: $215M (Solana ecosystem payments, Year 1)

---

## 2. User Personas

### Persona 1: Alex (Privacy-Conscious Consumer)

**Demographics**:
- Age: 28
- Occupation: Software Engineer at Web3 startup
- Location: Remote (US/Europe)
- Tech Savvy: High
- Crypto Experience: 2 years, active DeFi user

**Goals**:
- Split bills with roommates without revealing salary
- Pay friends back for dinner without public amounts
- Receive DAO contributor payments privately
- Keep financial activity confidential

**Pain Points**:
- Venmo is great UX but centralized
- Current Solana wallets show all amounts publicly
- Doesn't want to use "sketchy" privacy coins
- Needs compliance for tax purposes

**Quote**:
> "I love Solana's speed, but I don't want everyone on Solscan seeing that I just paid my landlord $2,400."

**Key Features for Alex**:
- Mobile app with Venmo-like UX
- Instant payments (<100ms feel)
- Contact list integration
- Transaction history (only I can see amounts)
- Export for taxes (decrypted records)

---

### Persona 2: Maya (Crypto Merchant)

**Demographics**:
- Age: 34
- Occupation: Founder, online education platform
- Location: Remote (Asia)
- Tech Savvy: Medium-High
- Crypto Experience: 3 years, accepts BTC/ETH/SOL

**Goals**:
- Accept crypto payments with lower fees than Stripe
- Hide revenue from competitors
- Provide customers privacy (don't leak purchase amounts)
- Easy integration (like Stripe)

**Pain Points**:
- Stripe takes 2.9% + $0.30 per transaction
- Existing crypto gateways reveal all payment amounts
- Customers hesitate because purchases are public
- Complex integration (not developer-friendly)

**Quote**:
> "I switched to Solana Pay for 0.1% fees, but now my competitors can see my exact monthly revenue. Not ideal."

**Key Features for Maya**:
- Payment link generation (no code needed)
- Developer API (if she hires a dev)
- Analytics dashboard (aggregated only)
- Webhooks for automation
- Shopify plugin (future)

---

### Persona 3: BuilderDAO (DeFi Protocol)

**Demographics**:
- Organization: DAO treasury manager
- Team Size: 45 contributors (15 core, 30 part-time)
- Monthly Payroll: $180k in USDC
- Crypto Native: 100%

**Goals**:
- Pay contributors globally, instantly
- Keep individual salaries confidential
- Maintain compliance for tax reporting
- Automate monthly payroll

**Pain Points**:
- Manual Gnosis Safe multisig takes hours
- All salaries visible onchain (embarrassing for team)
- Traditional payroll providers don't support crypto
- Need audit trail for accountants

**Quote**:
> "We're paying our senior dev $15k/month and junior dev $3k/month. Both amounts are public on Solscan. It's awkward."

**Key Features for BuilderDAO**:
- Batch payment CSV upload
- Encrypted individual amounts
- Auditor key for accountant
- API for automation (integrate with treasury management)
- Compliance reporting

---

### Persona 4: FinTech Corp (Traditional Company)

**Demographics**:
- Company: Regulated financial services company
- Size: 250 employees
- Exploring: Crypto payroll pilot
- Compliance: Critical (SEC, FinCEN)

**Goals**:
- Test crypto payroll for international employees
- Maintain regulatory compliance
- Provide privacy for employees
- Reduce cross-border payment fees (vs SWIFT)

**Pain Points**:
- Public blockchain transparency violates privacy policies
- Pure anonymity (Monero) creates regulatory risk
- Need audit trail for compliance
- Require KYC/AML integration

**Quote**:
> "We'd love to pay our Singapore team in USDC, but our legal team says we can't put salaries on a public ledger."

**Key Features for FinTech Corp**:
- Auditor keys (selective transparency)
- Compliance dashboard
- Transaction limits (per employee/month)
- KYC/AML integration (future)
- SLA guarantees
- Dedicated support

---

## 3. Product Features

### 3.1 Consumer Mobile App

#### MVP Features (Hackathon)

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **Wallet Connection** | P0 | Connect Phantom/Backpack wallet via Mobile Wallet Adapter | Small |
| **Balance Display** | P0 | Show decrypted confidential USDC balance | Small |
| **Send Payment** | P0 | Send confidential amount to wallet address | Large |
| **Receive Payment** | P0 | Display QR code / payment link to receive | Small |
| **Transaction History** | P0 | List of sent/received (decrypted amounts for user) | Medium |
| **Contacts** | P1 | Save frequent recipients with nicknames | Small |
| **Request Payment** | P1 | Generate payment request with QR code | Medium |
| **Payment Status** | P1 | Track pending/confirmed/finalized status | Small |

#### Post-MVP Features

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **Recurring Payments** | P2 | Set up automatic monthly payments | Large |
| **Split Bill** | P2 | Divide payment among multiple people | Medium |
| **Chat Integration** | P2 | Integrate with Dialect for chat-based payments | Medium |
| **Multi-Token Support** | P2 | Support more than USDC (SOL, BONK, etc.) | Medium |
| **Payment Requests** | P2 | Request specific amount from someone | Small |
| **Payment Notes** | P3 | Add memo (encrypted) to payments | Small |
| **Touch ID / Face ID** | P3 | Biometric auth for payments over $100 | Medium |
| **Price Alerts** | P3 | Notify when SOL/USDC price changes | Small |

#### User Stories

**US-001: Send Confidential Payment**
```
AS a user
I WANT to send USDC to a friend with the amount hidden
SO THAT my financial activity remains private

GIVEN I have 100 USDC in my confidential balance
WHEN I enter recipient address and amount 50 USDC
AND I confirm the payment
THEN the transaction is submitted with encrypted amount
AND the recipient receives 50 USDC confidentially
AND only the recipient and I can see the amount
AND the transaction appears on Solscan with "***" amount
AND I see confirmation within 2 seconds
```

**US-002: View Transaction History**
```
AS a user
I WANT to see my past transactions with decrypted amounts
SO THAT I can track my spending

GIVEN I have sent and received several payments
WHEN I open the transaction history screen
THEN I see a list of all my transactions
AND each shows: date, recipient/sender, decrypted amount (only I can see), status
AND I can filter by sent/received
AND I can search by recipient
```

**US-003: Receive Payment via QR Code**
```
AS a user
I WANT to receive payment by showing a QR code
SO THAT I don't have to share my wallet address manually

GIVEN I want to receive a payment
WHEN I tap "Receive"
THEN the app displays a QR code containing my wallet address
AND the sender can scan it to auto-fill my address
AND I receive a notification when payment is received
```

---

### 3.2 Merchant Platform

#### MVP Features (Hackathon)

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **Merchant Signup** | P0 | Create merchant account with email + wallet | Small |
| **Payment Link Generation** | P0 | Create one-time payment link (amount optional) | Medium |
| **Payment Link Page** | P0 | Hosted page where customers pay | Medium |
| **Transaction List** | P0 | View all payments (encrypted amounts, aggregate total) | Medium |
| **API Key Management** | P0 | Generate/revoke API keys | Small |
| **Webhook Setup** | P1 | Register webhook URL for events | Medium |
| **Basic Analytics** | P1 | Daily/weekly/monthly transaction count & volume | Medium |

#### Post-MVP Features

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **Shopify Plugin** | P1 | Direct integration with Shopify stores | Large |
| **Subscription Payments** | P2 | Recurring billing (monthly SaaS) | Large |
| **Invoicing** | P2 | Generate invoices with payment links | Medium |
| **Multi-Currency** | P2 | Accept SOL, BONK, etc. (auto-convert to USDC) | Large |
| **Refunds** | P2 | Issue confidential refunds | Medium |
| **Customer Portal** | P3 | Let customers view their purchase history | Medium |
| **Tax Reporting** | P3 | Generate 1099/tax docs (decrypted for merchant) | Medium |
| **Team Access** | P3 | Multi-user access with permissions | Medium |

#### User Stories

**US-101: Create Payment Link**
```
AS a merchant
I WANT to create a payment link for a product
SO THAT customers can pay me without me building a website

GIVEN I am logged into merchant dashboard
WHEN I click "Create Payment Link"
AND I enter product name "Online Course" and amount 99 USDC
AND I click "Generate Link"
THEN I receive a unique URL like ninjapay.xyz/pay/abc123
AND I can share this link with customers
AND customers who visit the link see a payment page
AND when they pay, the amount is encrypted onchain
```

**US-102: View Transaction List**
```
AS a merchant
I WANT to see all my payments
SO THAT I can track revenue without revealing it publicly

GIVEN I have received 50 payments this month
WHEN I open the "Transactions" page
THEN I see a table with: date, customer wallet (last 4 digits), encrypted amount (***), status
AND at the top, I see aggregated total: "50 transactions, $4,950 total" (decrypted for me only)
AND I can export to CSV (decrypted) for accounting
AND on Solscan, amounts still show as "***" (encrypted)
```

**US-103: Set Up Webhook**
```
AS a merchant
I WANT to receive real-time notifications when payments succeed
SO THAT I can automatically deliver digital products

GIVEN I have an API endpoint https://mystore.com/webhooks/ninjapay
WHEN I register this URL in NinjaPay dashboard
AND I select events ["payment.succeeded", "payment.failed"]
AND I save the webhook
THEN NinjaPay generates a webhook secret for me
AND whenever a payment succeeds, NinjaPay sends POST to my endpoint
AND the payload includes payment ID, status, encrypted amount commitment
AND I can verify the signature using the webhook secret
```

---

### 3.3 Payroll System

#### MVP Features (Hackathon)

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **CSV Upload** | P0 | Upload CSV with recipient addresses + amounts | Medium |
| **Batch Payment** | P0 | Send confidential payments to all recipients | Large |
| **Payment Status** | P0 | Track batch progress (pending/completed/failed) | Medium |
| **Auditor Key Setup** | P1 | Add auditor (e.g., accountant) who can decrypt amounts | Medium |
| **Payment Schedule** | P1 | Schedule recurring payroll (e.g., 1st of every month) | Large |
| **Compliance Dashboard** | P1 | View all payroll payments for compliance/taxes | Medium |

#### Post-MVP Features

| Feature | Priority | Description | Effort |
|---------|----------|-------------|---------|
| **Employee Portal** | P2 | Employees view their payment history | Medium |
| **Multi-Currency Payroll** | P2 | Pay different employees in different tokens | Medium |
| **Tax Withholding** | P2 | Automatically deduct taxes (US/EU) | Large |
| **KYC Integration** | P2 | Verify employee identity for compliance | Large |
| **Bank Transfer Integration** | P3 | Let employees off-ramp to bank account | Large |
| **Payment Approvals** | P3 | Multi-sig approval for large batches | Medium |

#### User Stories

**US-201: Upload Payroll CSV**
```
AS a company admin
I WANT to upload a CSV with employee addresses and salaries
SO THAT I can pay everyone at once

GIVEN I have prepared payroll CSV:
  address,amount,note
  7xJ8...abc,5000,Senior Dev
  9kL2...def,3000,Junior Dev
  4mN5...ghi,4000,Designer
WHEN I upload the CSV to NinjaPay payroll dashboard
THEN the system validates all addresses
AND shows me a preview: "3 payments, total 12,000 USDC"
AND I can review before submitting
```

**US-202: Execute Confidential Batch Payment**
```
AS a company admin
I WANT to send payroll to all employees with amounts encrypted
SO THAT salaries remain private

GIVEN I have uploaded and reviewed payroll CSV (3 employees, 12,000 USDC)
WHEN I click "Execute Payroll"
AND I confirm the transaction
THEN NinjaPay creates confidential transfers for each employee
AND all amounts are encrypted using Arcium MPC
AND each employee receives their salary
AND onchain, all amounts show as "***" (encrypted)
AND only each employee can decrypt their own amount
AND my auditor (if configured) can decrypt all amounts for compliance
```

**US-203: Set Up Auditor Key**
```
AS a company admin
I WANT to add my accountant as an auditor
SO THAT they can verify payroll for taxes without amounts being public

GIVEN I have confidential payroll payments
WHEN I go to "Compliance Settings"
AND I click "Add Auditor"
AND I enter my accountant's wallet address
THEN the accountant's ElGamal public key is added to the mint
AND the accountant can decrypt all payroll amounts (but not transfer)
AND amounts remain encrypted to everyone else
AND I can remove the auditor anytime
```

---

### 3.4 Developer API

#### MVP Endpoints (Hackathon)

| Endpoint | Method | Description | Priority |
|----------|--------|-------------|----------|
| `/v1/payments` | POST | Create payment | P0 |
| `/v1/payments/:id` | GET | Get payment status | P0 |
| `/v1/payments/batch` | POST | Batch payments (payroll) | P0 |
| `/v1/balance` | GET | Get decrypted balance | P0 |
| `/v1/transactions` | GET | List transactions | P1 |
| `/v1/webhooks` | POST | Create webhook | P1 |
| `/v1/webhooks` | GET | List webhooks | P1 |
| `/v1/webhooks/:id` | DELETE | Delete webhook | P1 |

#### Example API Usage

```javascript
// Example: Create confidential payment

const payment = await ninjapay.payments.create({
  amount: 100.50, // Will be encrypted
  currency: 'USDC',
  recipient: '7xJ8...abc',
  metadata: {
    invoice_id: 'INV-001',
    customer_email: 'alice@example.com'
  }
});

// Response:
{
  id: 'pay_abc123',
  status: 'pending',
  amount_commitment: '0x4a7b2...', // Pedersen commitment (public)
  recipient: '7xJ8...abc',
  created_at: '2025-10-05T12:00:00Z',
  signature: null // Will be set when confirmed
}

// Webhook payload when payment succeeds:
{
  event: 'payment.succeeded',
  data: {
    id: 'pay_abc123',
    status: 'completed',
    signature: 'tx_signature_here',
    amount_commitment: '0x4a7b2...',
    recipient: '7xJ8...abc',
    confirmed_at: '2025-10-05T12:00:02Z'
  },
  timestamp: 1728134402
}
```

#### User Stories

**US-301: Integrate Payment API**
```
AS a developer
I WANT to integrate NinjaPay API into my app
SO THAT I can accept confidential payments

GIVEN I have registered for a NinjaPay API key
WHEN I make a POST request to /v1/payments with my API key
AND I include amount, currency, and recipient
THEN NinjaPay creates a confidential payment
AND returns a payment ID
AND I can poll /v1/payments/:id to check status
AND when payment succeeds, I receive a webhook
```

---

## 4. User Stories & Acceptance Criteria

### Consumer App User Stories

#### US-004: Connect Wallet
```
AS a new user
I WANT to connect my Solana wallet to NinjaPay
SO THAT I can start making confidential payments

ACCEPTANCE CRITERIA:
✓ User can tap "Connect Wallet" button
✓ Mobile Wallet Adapter opens (Phantom/Backpack/Solflare)
✓ User approves connection in wallet app
✓ NinjaPay receives wallet public key
✓ NinjaPay creates Arcium MPC key for user's confidential account
✓ User sees their wallet address displayed
✓ User sees their confidential balance (initially 0)
```

#### US-005: Deposit to Confidential Balance
```
AS a user
I WANT to deposit USDC from my regular balance to confidential balance
SO THAT I can make private payments

ACCEPTANCE CRITERIA:
✓ User has 100 USDC in regular Token-2022 account
✓ User taps "Deposit to Private Balance"
✓ User enters amount (e.g., 50 USDC)
✓ User confirms transaction
✓ Transaction moves 50 USDC from public to confidential account
✓ Balance shown as encrypted onchain
✓ User's app displays decrypted balance: 50 USDC
✓ Public Solscan shows "***" for balance
```

### Merchant Platform User Stories

#### US-104: Merchant Signup
```
AS a new merchant
I WANT to create a NinjaPay merchant account
SO THAT I can start accepting confidential payments

ACCEPTANCE CRITERIA:
✓ Merchant visits ninjapay.xyz/signup
✓ Merchant enters email, business name, wallet address
✓ Merchant verifies email
✓ Merchant connects wallet (sign message for verification)
✓ NinjaPay generates API key and webhook secret
✓ Merchant sees dashboard with API credentials
```

#### US-105: Generate Payment Link
```
AS a merchant
I WANT to create a payment link for my product
SO THAT customers can pay without me writing code

ACCEPTANCE CRITERIA:
✓ Merchant clicks "Create Payment Link"
✓ Merchant enters: product name, amount (optional), description
✓ Merchant clicks "Generate"
✓ NinjaPay creates unique URL (e.g., ninjapay.xyz/pay/abc123)
✓ Merchant can copy URL and share it
✓ When customer visits URL, they see payment page
✓ Customer can pay with any Solana wallet
✓ Payment amount is encrypted onchain
✓ Merchant receives webhook notification
```

### Payroll System User Stories

#### US-204: Schedule Recurring Payroll
```
AS a company admin
I WANT to set up recurring monthly payroll
SO THAT employees are paid automatically

ACCEPTANCE CRITERIA:
✓ Admin uploads payroll CSV
✓ Admin clicks "Schedule Recurring"
✓ Admin selects frequency (monthly) and start date (1st of month)
✓ Admin confirms
✓ NinjaPay saves schedule
✓ On 1st of each month, NinjaPay automatically:
  - Executes batch confidential payments
  - Sends notification email to admin
  - Triggers webhooks for each payment
✓ Admin can view/edit/cancel schedule anytime
```

---

## 5. User Flows

### 5.1 Consumer: Send Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER SEND PAYMENT FLOW                    │
└─────────────────────────────────────────────────────────────────┘

START: User wants to send $50 USDC to friend

1. Open NinjaPay App
   ↓
2. Tap "Send" button
   ↓
3. Enter recipient
   ├─ Scan QR code
   ├─ Paste wallet address
   ├─ Select from contacts
   └─ Search by username (future)
   ↓
4. Enter amount: 50 USDC
   ├─ Keyboard input
   ├─ Suggested amounts ($10, $20, $50, $100)
   └─ Max button (send all)
   ↓
5. Review payment
   ├─ Recipient: John (7xJ8...abc)
   ├─ Amount: 50 USDC
   ├─ Fee: ~$0.00025
   ├─ Speed: Instant (~20ms via MagicBlock)
   └─ Privacy: Amount encrypted ✓
   ↓
6. Tap "Send Payment"
   ↓
7. App creates MagicBlock session (if using fast path)
   ↓
8. App uses Arcium to:
   ├─ Encrypt amount (50 USDC)
   ├─ Generate ZK proofs
   └─ Create confidential transfer transaction
   ↓
9. App prompts wallet signature
   ↓
10. User approves in Phantom/Backpack
   ↓
11. Transaction submitted to MagicBlock ephemeral rollup
   ↓
12. Confirmation screen (within 2 seconds!)
    ├─ "Payment sent! ✓"
    ├─ Recipient: John
    ├─ Amount: 50 USDC (only user sees)
    ├─ Transaction signature: tx_abc...
    ├─ View on Solscan (shows "***" for amount)
    └─ Share receipt button
   ↓
13. (Background) MagicBlock commits to L1 within 5 seconds
   ↓
14. User receives push notification: "Payment finalized on Solana"

END: Friend receives 50 USDC confidentially
```

### 5.2 Merchant: Create Payment Link Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                MERCHANT CREATE PAYMENT LINK FLOW                 │
└─────────────────────────────────────────────────────────────────┘

START: Merchant wants to sell online course for $99

1. Login to NinjaPay merchant dashboard
   ↓
2. Navigate to "Payment Links" page
   ↓
3. Click "Create New Payment Link" button
   ↓
4. Fill out form:
   ├─ Product name: "Web3 Development Course"
   ├─ Description: "Learn Solana development from scratch"
   ├─ Amount: 99 USDC (or leave blank for customer to enter)
   ├─ Redirect URL: https://course.example.com/thank-you
   └─ Image: Upload course thumbnail
   ↓
5. Click "Generate Link"
   ↓
6. NinjaPay creates:
   ├─ Unique payment ID: pay_link_xyz789
   ├─ Payment URL: ninjapay.xyz/pay/xyz789
   └─ QR code (for offline payments)
   ↓
7. Merchant sees success screen:
   ├─ Copy Link button
   ├─ Copy QR code
   ├─ Share on Twitter/Email buttons
   └─ Embed code snippet (for website)
   ↓
8. Merchant copies link and shares with customers

-- CUSTOMER PERSPECTIVE --

9. Customer clicks ninjapay.xyz/pay/xyz789
   ↓
10. Customer sees payment page:
    ├─ Product: "Web3 Development Course"
    ├─ Description: "Learn Solana development..."
    ├─ Price: 99 USDC
    ├─ Merchant: Maya's Crypto Academy
    ├─ Privacy notice: "Amount encrypted onchain ✓"
    └─ "Pay with Solana" button
   ↓
11. Customer clicks "Pay with Solana"
    ↓
12. Customer connects wallet (Phantom/Backpack)
    ↓
13. Customer approves confidential transfer (99 USDC)
    ↓
14. Payment processed (encrypted onchain)
    ↓
15. Customer redirected to https://course.example.com/thank-you
    ↓
16. Merchant receives webhook notification
    ↓
17. Merchant's backend automatically grants course access

END: Merchant earned $99, customer got course, amount is private
```

### 5.3 Company: Payroll Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPANY PAYROLL FLOW                        │
└─────────────────────────────────────────────────────────────────┘

START: Company wants to pay 50 employees

1. Login to NinjaPay payroll console
   ↓
2. Navigate to "Payroll" tab
   ↓
3. Click "New Payroll Run"
   ↓
4. Choose input method:
   ├─ Upload CSV
   ├─ Manual entry
   └─ API integration (future)
   ↓
5. Upload CSV:
   wallet_address,amount,employee_name,employee_id
   7xJ8...abc,5000,Alice,EMP-001
   9kL2...def,3000,Bob,EMP-002
   ...
   (50 rows)
   ↓
6. NinjaPay validates CSV:
   ├─ All addresses are valid Solana wallets? ✓
   ├─ All amounts are positive numbers? ✓
   ├─ Total: 50 employees, $180,000 USDC
   └─ Sufficient balance in company vault? ✓
   ↓
7. Preview screen:
   ├─ 50 payments
   ├─ Total: $180,000 USDC
   ├─ Estimated fees: $0.0125 (50 txs × $0.00025)
   ├─ Estimated time: ~15 seconds
   ├─ Privacy: All amounts encrypted ✓
   └─ List of employees (names censored for privacy)
   ↓
8. Admin reviews and clicks "Execute Payroll"
   ↓
9. Admin signs transaction with company wallet
   ↓
10. NinjaPay processes batch payment:
    ├─ Creates MagicBlock session for speed
    ├─ Uses Arcium to encrypt all 50 amounts in parallel
    ├─ Generates batched ZK proofs (more efficient than 50 individual proofs)
    ├─ Submits confidential transfers to blockchain
    └─ Progress bar: 0% → 100% (takes ~15 seconds)
   ↓
11. Success screen:
    ├─ "Payroll executed successfully! ✓"
    ├─ 50/50 payments confirmed
    ├─ Total: $180,000 USDC
    ├─ All amounts encrypted onchain
    ├─ Transaction signatures: [view list]
    └─ Download receipt (for accounting)
   ↓
12. (Background) NinjaPay sends email to each employee:
    "You've received your salary! Check your NinjaPay wallet."
   ↓
13. (Background) NinjaPay triggers webhooks to company's accounting system
   ↓
14. Company's auditor can decrypt amounts (if auditor key configured)

END: All employees paid, salaries private, company has audit trail
```

---

## 6. UI/UX Requirements

### 6.1 Design Principles

1. **Privacy by Default, Transparency on Demand**
   - All amounts encrypted by default
   - User can easily decrypt their own transactions
   - Clear indicators when something is private vs public

2. **Familiar Patterns**
   - Mobile app: Inspired by Venmo/Cash App (proven UX)
   - Merchant dashboard: Inspired by Stripe (developer-friendly)
   - Minimize learning curve

3. **Progressive Disclosure**
   - Hide crypto complexity initially
   - Advanced features available for power users
   - Explain privacy tech when relevant (not upfront)

4. **Speed & Responsiveness**
   - Instant feedback on all actions
   - Optimistic UI updates (show success immediately, finalize in background)
   - Skeleton loaders, not spinners

5. **Trust & Security**
   - Clear security indicators (lock icons, encryption badges)
   - Explain privacy guarantees simply
   - Show transaction on Solscan (builds trust)

### 6.2 Mobile App UI Specifications

#### Home Screen

```
┌────────────────────────────────────────────────┐
│  NinjaPay                                  ⚙️  │
├────────────────────────────────────────────────┤
│                                                │
│  Private Balance                               │
│  1,234.56 USDC           👁️ (toggle decrypt)  │
│  ≈ $1,234.56 USD                               │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  📤 Send │ │ 📥 Request│ │ 🔄 Swap  │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                │
├────────────────────────────────────────────────┤
│  Recent Transactions                           │
│                                                │
│  📤 Sent to Alice           Today, 2:30 PM     │
│     $50.00                           Confirmed │
│                                                │
│  📥 Received from Bob       Yesterday          │
│     $25.00                           Confirmed │
│                                                │
│  📤 Sent to Charlie         Oct 3              │
│     $100.00                          Confirmed │
│                                                │
│  [View All →]                                  │
└────────────────────────────────────────────────┘
```

#### Send Payment Screen

```
┌────────────────────────────────────────────────┐
│  ← Send Payment                                │
├────────────────────────────────────────────────┤
│                                                │
│  To                                            │
│  ┌──────────────────────────────────────────┐ │
│  │ Alice (7xJ8...abc)                    ▼ │ │
│  └──────────────────────────────────────────┘ │
│  📷 Scan QR   📇 Contacts                      │
│                                                │
│  Amount                                        │
│  ┌──────────────────────────────────────────┐ │
│  │ $ 50.00                              USDC│ │
│  └──────────────────────────────────────────┘ │
│  💰 Balance: 1,234.56 USDC                    │
│                                                │
│  Quick Amounts:                                │
│  [ $10 ] [ $20 ] [ $50 ] [ $100 ] [ Max ]     │
│                                                │
│  Note (optional)                               │
│  ┌──────────────────────────────────────────┐ │
│  │ Lunch money 🍔                           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ✓ Amount encrypted                            │
│  ⚡ Instant payment (~20ms)                   │
│  💵 Fee: ~$0.00025                            │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │          Send $50.00                     │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 6.3 Merchant Dashboard UI Specifications

#### Dashboard Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  NinjaPay Merchant Dashboard                    Maya's Crypto    │
│  [Transactions] [Payment Links] [API] [Webhooks] [Settings]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Overview                                 Last 30 days           │
│                                                                   │
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────┐ │
│  │ Total Volume   │ │ Transactions   │ │ Success Rate         │ │
│  │ $24,950 📈+12% │ │ 187 📈+8%      │ │ 98.4% ✓              │ │
│  └────────────────┘ └────────────────┘ └──────────────────────┘ │
│                                                                   │
│  Revenue Chart (Aggregated)                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     █                                                       │ │
│  │   █ █     █                                                 │ │
│  │ █ █ █ █ █ █   █                                             │ │
│  │ Week 1  Week 2  Week 3  Week 4                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Recent Transactions                          [View All →]       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Date       Customer      Amount       Status       Tx       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Oct 5, 2PM  7xJ8...abc    ***        ✓ Confirmed   View    │ │
│  │ Oct 5, 1PM  9kL2...def    ***        ✓ Confirmed   View    │ │
│  │ Oct 5, 12PM 4mN5...ghi    ***        ⏳ Pending     View    │ │
│  │ Oct 4, 5PM  2pQ8...jkl    ***        ✓ Confirmed   View    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  💡 Note: Individual amounts are encrypted. You can decrypt      │
│  the aggregate total for accounting purposes.                    │
│                                                                   │
│  [Decrypt Total for Accounting] ← Requires wallet signature      │
└──────────────────────────────────────────────────────────────────┘
```

#### Payment Link Creation

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Create Payment Link                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Product Details                                                  │
│                                                                   │
│  Name *                                                           │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Web3 Development Course                                       ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Description                                                      │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Learn Solana development from scratch                         ││
│  │                                                                ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Amount                                                           │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │ 99                      │  │ USDC                      ▼  │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│  ☐ Let customer choose amount                                    │
│                                                                   │
│  Image (optional)                                                 │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  [ Upload Image ]  or drag & drop                             ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Success Redirect URL (optional)                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ https://course.example.com/thank-you                          ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Privacy Settings                                                 │
│  ☑ Encrypt payment amount (recommended)                          │
│  ☐ Show customer's wallet address to me                          │
│                                                                   │
│  ┌────────────────────┐  ┌───────────────────┐                  │
│  │ Preview            │  │ Generate Link  →  │                  │
│  └────────────────────┘  └───────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Accessibility Requirements

- **WCAG 2.1 AA compliance**
- Keyboard navigation support
- Screen reader friendly (proper ARIA labels)
- Minimum contrast ratio 4.5:1
- Text resizable up to 200%
- Touch targets minimum 44×44px
- Supports dark mode

---

## 7. Technical Requirements

### 7.1 Functional Requirements

**FR-001: Confidential Transfers**
- System MUST encrypt transfer amounts using Arcium MPC
- System MUST generate zero-knowledge proofs for all confidential transfers
- System MUST verify ZK proofs before submitting to blockchain
- Encrypted amounts MUST be indecipherable to observers (except recipient and sender)

**FR-002: Fast Execution**
- System SHOULD use MagicBlock ephemeral rollups for transactions <$1000
- System MUST achieve <100ms user-perceived latency for P2P payments
- System MUST fallback to Solana L1 if MagicBlock unavailable

**FR-003: Balance Management**
- System MUST allow users to deposit public USDC to confidential balance
- System MUST allow users to withdraw confidential USDC to public balance
- System MUST decrypt balance on user request (with authentication)
- System MUST cache decrypted balance for 5 minutes

**FR-004: Payment Status Tracking**
- System MUST track payment status: pending → processing → confirmed → finalized
- System MUST emit webhook events on status changes
- System MUST provide transaction signature for verification

**FR-005: Merchant Payment Links**
- System MUST generate unique payment URLs
- System MUST host payment page with merchant branding
- System MUST support both fixed and customer-specified amounts
- System MUST redirect to merchant URL after successful payment

**FR-006: Batch Payments**
- System MUST support batch confidential transfers (up to 1000 recipients)
- System MUST generate batched ZK proofs (more efficient than individual)
- System MUST provide progress tracking for batch operations
- System MUST handle partial failures gracefully (retry failed transfers)

**FR-007: Webhook System**
- System MUST deliver webhooks for registered events
- System MUST sign webhook payloads with HMAC-SHA256
- System MUST retry failed webhooks with exponential backoff (max 5 attempts)
- System MUST provide webhook delivery logs

**FR-008: API Authentication**
- System MUST support API key authentication (HMAC)
- System MUST support JWT authentication for user sessions
- System MUST implement rate limiting (100 req/min for free tier)
- System MUST rotate API keys on user request

### 7.2 Non-Functional Requirements

**NFR-001: Performance**
- API response time: <200ms (p95)
- Payment latency (L2): <100ms (p95)
- Payment latency (L1): <2s (p95)
- System uptime: 99.9% (SLA for enterprise)

**NFR-002: Scalability**
- Support 10,000 concurrent users (MVP)
- Support 100,000 transactions/day (MVP)
- Horizontal scaling via MagicBlock sessions
- Database read replicas for scaling

**NFR-003: Security**
- TLS 1.3 for all communications
- AES-256 encryption at rest
- MPC threshold: 67% nodes required
- Regular security audits (quarterly)
- Bug bounty program post-launch

**NFR-004: Privacy**
- Zero-knowledge proofs for all confidential operations
- No amount leakage in logs or analytics
- Minimal metadata collection
- GDPR/CCPA compliance

**NFR-005: Reliability**
- Automatic failover for critical services
- Database backups (daily, retained 30 days)
- Disaster recovery plan (RPO: 1 hour, RTO: 4 hours)
- Monitoring and alerting (Sentry, Prometheus)

**NFR-006: Compatibility**
- iOS 14+
- Android 10+
- Desktop browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Solana wallets: Phantom, Backpack, Solflare, Glow

---

## 8. Success Metrics

### 8.1 North Star Metric

**Primary**: Monthly Confidential Payment Volume (CPV)
- Target Month 1: $100k
- Target Month 3: $1M
- Target Month 6: $10M

### 8.2 Key Performance Indicators (KPIs)

#### Consumer App

| Metric | Target (Week 1) | Target (Month 1) | Target (Month 3) |
|--------|-----------------|------------------|------------------|
| Daily Active Users (DAU) | 100 | 500 | 2,000 |
| Payments per User per Week | 1 | 2 | 3 |
| Average Payment Amount | $20 | $50 | $75 |
| User Retention (Day 7) | 40% | 50% | 60% |
| App Crashes per Session | <0.1% | <0.01% | <0.01% |

#### Merchant Platform

| Metric | Target (Week 1) | Target (Month 1) | Target (Month 3) |
|--------|-----------------|------------------|------------------|
| Registered Merchants | 50 | 200 | 1,000 |
| Active Merchants (≥1 payment/month) | 20 | 100 | 500 |
| Average Revenue per Merchant | $100 | $500 | $2,000 |
| Payment Link Conversion Rate | 10% | 15% | 20% |
| Merchant Churn Rate (monthly) | - | <5% | <3% |

#### Payroll System

| Metric | Target (Week 1) | Target (Month 1) | Target (Month 3) |
|--------|-----------------|------------------|------------------|
| Companies Using Payroll | 5 | 20 | 50 |
| Employees Paid | 50 | 500 | 2,000 |
| Total Payroll Volume | $50k | $500k | $2M |
| Payroll Success Rate | 99% | 99.5% | 99.9% |
| Average Batch Size | 10 | 25 | 40 |

#### Developer API

| Metric | Target (Week 1) | Target (Month 1) | Target (Month 3) |
|--------|-----------------|------------------|------------------|
| API Keys Generated | 20 | 100 | 500 |
| API Requests per Day | 1k | 10k | 100k |
| API Uptime | 99% | 99.5% | 99.9% |
| Average API Latency | <300ms | <200ms | <150ms |
| Webhook Delivery Success | 95% | 98% | 99% |

### 8.3 Hackathon-Specific Success Criteria

**Must-Have (to win Top 10)**:
- ✅ Working demo on Solana testnet/devnet
- ✅ 3 products functional (consumer + merchant + payroll, even if basic)
- ✅ Arcium confidential transfers working
- ✅ MagicBlock integration (or clear roadmap if blocked)
- ✅ Clean, documented GitHub repo
- ✅ Compelling 3-min pitch video
- ✅ Technical deep-dive video (5 min)

**Nice-to-Have (to win Top 3)**:
- 🎯 10+ developers tested the API before submission
- 🎯 Partnership/endorsement from Arcium or MagicBlock
- 🎯 Real merchant pilot (even 1-2 merchants)
- 🎯 Live transaction on mainnet-beta (if Arcium available)
- 🎯 Media coverage or ecosystem buzz
- 🎯 Testimonials from beta users

---

## 9. Release Plan

### 9.1 Hackathon MVP (Week 6)

**Scope**: Minimum viable demo to win hackathon

**Features**:
- Consumer mobile app (React Native)
  - Connect wallet
  - Send confidential payment
  - View transaction history
  - Receive payment (QR code)
- Merchant dashboard (Next.js)
  - Create payment link
  - View transactions (encrypted)
  - Basic analytics (aggregated)
- Payroll console
  - CSV upload
  - Batch confidential payment
- Developer API
  - `/v1/payments` (create, get status)
  - `/v1/balance` (decrypt)
  - `/v1/webhooks` (basic)

**Tech Stack**:
- Arcium Confidential SPL (if early access granted, else Token-2022)
- MagicBlock Ephemeral Rollups (if integration ready)
- Solana Token-2022 (fallback)
- React Native + Solana Mobile Stack
- Next.js + Vercel
- Node.js + Railway
- PostgreSQL + MongoDB + Redis

**Success Criteria**:
- Demo runs smoothly during pitch
- All 3 use cases demonstrated
- GitHub repo clean and documented
- Videos submitted on time

---

### 9.2 Post-Hackathon v1.0 (Month 1-2)

**Scope**: Production-ready for early adopters

**New Features**:
- Improved mobile UI/UX
- Contacts system
- Payment requests
- Merchant API documentation
- Webhook retry logic
- Basic analytics dashboard
- Bug fixes from hackathon feedback

**Deployment**:
- Solana mainnet-beta (if Arcium ready)
- App Store submission (iOS)
- Google Play submission (Android)
- Production infrastructure (Railway → AWS/GCP)

**Success Metrics**:
- 500 DAU
- 100 merchants
- $1M monthly payment volume

---

### 9.3 v1.1 - Enhanced Features (Month 3-4)

**Scope**: Improve retention and add requested features

**New Features**:
- Recurring payments (consumer)
- Split bill (consumer)
- Shopify plugin (merchant)
- Subscription payments (merchant)
- Scheduled payroll (payroll)
- Multi-sig approvals (payroll)
- SDK for TypeScript/Python
- Improved documentation

**Success Metrics**:
- 2,000 DAU
- 500 active merchants
- $10M monthly payment volume

---

### 9.4 v2.0 - Enterprise & Compliance (Month 6+)

**Scope**: Target institutional customers

**New Features**:
- KYC/AML integration
- Advanced compliance dashboard
- Multi-currency support
- Bank transfer integration (off-ramp)
- Team access controls
- Custom contracts for enterprise
- SLA guarantees
- Dedicated support

**Success Metrics**:
- 10,000 DAU
- 2,000 active merchants
- 100 companies using payroll
- $50M monthly payment volume

---

## 10. Appendix

### 10.1 Glossary

**Confidential Transfer**: Blockchain transaction where the amount is encrypted but verifiable

**Arcium MPC**: Multi-party computation network for distributed key management and encrypted operations

**MagicBlock**: Ephemeral rollup infrastructure providing sub-50ms transaction finality with TEE security

**Auditor Key**: ElGamal public key that can decrypt all transactions on a mint (for compliance)

**Pedersen Commitment**: Cryptographic commitment scheme used to hide amounts while allowing verification

**Zero-Knowledge Proof**: Cryptographic proof that reveals no information except the truth of the statement

**Ephemeral Rollup**: Temporary high-speed execution environment that commits state back to L1

**TEE (Trusted Execution Environment)**: Hardware-secured enclave (Intel TDX) that protects computation

---

**Document Version**: 1.0
**Last Updated**: October 5, 2025
**Owner**: Product Team
**Next Review**: Weekly during hackathon, then monthly
