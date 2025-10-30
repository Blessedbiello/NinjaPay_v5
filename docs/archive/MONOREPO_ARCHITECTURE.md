# NinjaPay Monorepo Architecture
**18-Day Production MVP - Privacy-First Modular System**

*Version: 2.0 | Execution Timeline: 18 Days*
*Target: Production-Ready MVP with AI Agents*

---

## Executive Summary

**Challenge**: Build production-ready NinjaPay in 18 days with AI agents + privacy + 3 products

**Strategy**: Modular monorepo with parallel workstreams, AI agents as async workers, Arcium privacy layer

**Critical Path**: Arcium integration (Days 1-6) → Core modules (Days 7-12) → AI agents (Days 13-16) → Integration (Days 17-18)

**Risk Mitigation**: Each module can ship independently, AI agents are additive (not blocking)

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Tech Stack](#2-tech-stack)
3. [Module Architecture](#3-module-architecture)
4. [AI Agent System](#4-ai-agent-system)
5. [Data Flow & Dependencies](#5-data-flow--dependencies)
6. [Privacy-by-Design](#6-privacy-by-design)
7. [18-Day Implementation Plan](#7-18-day-implementation-plan)
8. [Deployment Strategy](#8-deployment-strategy)

---

## 1. Monorepo Structure

### 1.1 High-Level Organization

```
ninjapay/
├── apps/                           # Frontend applications
│   ├── mobile/                     # React Native (Venmo-like)
│   ├── merchant-dashboard/         # Next.js (Stripe-like)
│   ├── payroll-console/            # Next.js (Payroll management)
│   ├── admin-portal/               # Next.js (Internal ops/AI agent monitoring)
│   └── landing/                    # Next.js (Marketing site)
│
├── services/                       # Backend microservices
│   ├── api-gateway/                # Express.js (Main API entry)
│   ├── payment-service/            # Rust (Payment processing)
│   ├── arcium-service/             # Rust (Arcium MPC integration)
│   ├── merchant-service/           # Node.js (Merchant operations)
│   ├── payroll-service/            # Node.js (Payroll processing)
│   ├── reward-service/             # Node.js (Loyalty/gamification)
│   ├── webhook-service/            # Node.js (Event delivery)
│   └── ai-orchestrator/            # Python (AI agent coordinator)
│
├── agents/                         # AI Agent modules
│   ├── compliance-agent/           # Python (KYC/AML/fraud)
│   ├── analytics-agent/            # Python (Insights/predictions)
│   ├── investigator-agent/         # Python (Suspicious activity)
│   ├── support-agent/              # Python (Customer service)
│   ├── reporting-agent/            # Python (Financial reports)
│   ├── recurring-agent/            # Python (Automated payroll/subs)
│   ├── risk-agent/                 # Python (Risk scoring)
│   └── liquidity-agent/            # Python (Treasury management)
│
├── packages/                       # Shared libraries
│   ├── arcium-sdk/                 # TypeScript + Rust bindings
│   ├── solana-utils/               # Solana helpers
│   ├── magicblock-sdk/             # MagicBlock integration
│   ├── database/                   # Prisma schema + client
│   ├── ui/                         # Shared React components
│   ├── config/                     # Shared configs (ESLint, TS)
│   ├── logger/                     # Structured logging
│   ├── queue/                      # Bull job queue
│   ├── cache/                      # Redis client
│   └── types/                      # Shared TypeScript types
│
├── programs/                       # Solana smart contracts
│   ├── ninjapay-vault/             # Anchor (Escrow + batch payments)
│   ├── reward-pool/                # Anchor (Loyalty token staking)
│   └── compliance-oracle/          # Anchor (On-chain compliance checks)
│
├── sdks/                           # Public SDKs for developers
│   ├── typescript-sdk/             # npm package
│   ├── python-sdk/                 # pip package
│   └── rust-sdk/                   # crates.io
│
├── scripts/                        # Automation scripts
│   ├── setup.sh                    # Dev environment setup
│   ├── deploy-programs.sh          # Deploy Solana programs
│   ├── seed-db.ts                  # Database seeding
│   └── generate-keys.ts            # API key generation
│
├── docs/                           # Documentation
│   ├── api/                        # API documentation (Mintlify)
│   ├── architecture/               # System design docs
│   └── guides/                     # Integration guides
│
├── infrastructure/                 # IaC and DevOps
│   ├── docker/                     # Dockerfiles
│   ├── kubernetes/                 # K8s manifests (if needed)
│   └── terraform/                  # Cloud infrastructure
│
├── tests/                          # End-to-end tests
│   ├── e2e/                        # Playwright tests
│   ├── integration/                # Service integration tests
│   └── load/                       # k6 load tests
│
├── .github/                        # GitHub Actions CI/CD
├── turbo.json                      # Turborepo config
├── package.json                    # Root package.json
├── pnpm-workspace.yaml             # PNPM workspaces
└── README.md                       # Project overview
```

### 1.2 Monorepo Tool Choice

**Decision: Turborepo + PNPM**

**Why Turborepo**:
- Fast builds (caching)
- Parallel task execution (critical for 18 days)
- Simple setup (vs Nx/Lerna)

**Why PNPM**:
- Efficient disk usage (shared node_modules)
- Fast installs (vs npm/yarn)
- Workspace support

**Config**:
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "deploy": {
      "dependsOn": ["build", "test"],
      "outputs": []
    }
  }
}
```

---

## 2. Tech Stack

### 2.1 Frontend Stack

**Mobile App** (`apps/mobile`):
- **Framework**: React Native 0.73 + Expo
- **State**: React Query + Zustand
- **Navigation**: React Navigation 6
- **UI**: NativeWind (Tailwind for RN)
- **Solana**: @solana-mobile/mobile-wallet-adapter-protocol

**Web Apps** (`merchant-dashboard`, `payroll-console`, `admin-portal`):
- **Framework**: Next.js 14 (App Router)
- **State**: React Query + Zustand
- **UI**: Shadcn UI + Tailwind
- **Auth**: NextAuth.js
- **Charts**: Recharts

**Landing Page** (`apps/landing`):
- **Framework**: Next.js 14 (Static)
- **UI**: Tailwind + Framer Motion
- **SEO**: next-seo

### 2.2 Backend Stack

**API Gateway** (`services/api-gateway`):
- **Framework**: Express.js (TypeScript)
- **Validation**: Zod
- **Auth**: JWT + API keys
- **Rate Limiting**: Redis

**Payment Service** (`services/payment-service`):
- **Language**: Rust
- **Framework**: Actix-web
- **Why Rust**: Performance-critical ZK proof generation

**Arcium Service** (`services/arcium-service`):
- **Language**: Rust
- **Why**: Direct Arcium SDK integration (likely Rust)

**Node.js Services** (`merchant`, `payroll`, `reward`, `webhook`):
- **Framework**: Express.js (TypeScript)
- **ORM**: Prisma
- **Queue**: Bull + Redis
- **Validation**: Zod

**AI Orchestrator** (`services/ai-orchestrator`):
- **Language**: Python 3.11
- **Framework**: FastAPI
- **LLM**: You'll provide details
- **Queue**: Celery + Redis

### 2.3 AI Agent Stack

**Language**: Python 3.11 (all agents)

**Base Framework**:
- **LangChain** (agent orchestration) OR **AutoGPT** (autonomous agents)
- **LLM Provider**: [You'll provide - OpenAI, Anthropic, local model?]
- **Vector DB**: Pinecone or Qdrant (for context/memory)
- **Observability**: LangSmith or Helicone

**Shared Libraries**:
- `pydantic` (data validation)
- `sqlalchemy` (database ORM)
- `httpx` (async HTTP)
- `redis-py` (caching)

### 2.4 Database Stack

**Primary Database**: PostgreSQL 15
- **ORM**: Prisma (Node.js), SQLAlchemy (Python)
- **Use**: User data, merchants, payments metadata

**Document Store**: MongoDB
- **Use**: Transaction logs, events, AI agent context

**Cache**: Redis 7
- **Use**: Session cache, rate limiting, job queues, proof cache

**Vector Database**: Qdrant (self-hosted) or Pinecone (managed)
- **Use**: AI agent memory, semantic search

### 2.5 Blockchain Stack

**Solana**:
- **Framework**: Anchor 0.29
- **RPC**: Helius (primary), QuickNode (backup)
- **SDK**: @solana/web3.js 1.87

**Arcium**:
- **SDK**: @arcium/sdk (or Rust crate)
- **Network**: Devnet (testing), Mainnet-alpha (production)

**MagicBlock**:
- **SDK**: @magicblock/sdk
- **Use**: Fast transactions (<50ms)

### 2.6 DevOps Stack

**Version Control**: GitHub

**CI/CD**: GitHub Actions
- Build on push
- Test on PR
- Deploy on merge to main

**Deployment**:
- **Frontend**: Vercel (Next.js apps)
- **Backend**: Railway (Node.js services)
- **Rust Services**: Fly.io or Railway
- **Python AI**: Modal or Replicate
- **Database**: Supabase (PostgreSQL) + MongoDB Atlas

**Monitoring**:
- **Errors**: Sentry
- **Logs**: Axiom or Betterstack
- **Metrics**: Prometheus + Grafana (if self-hosted)
- **APM**: Datadog (if budget) or OpenTelemetry

**Secrets**: Doppler or GitHub Secrets

---

## 3. Module Architecture

### 3.1 Merchant Module (Stripe-like)

**Purpose**: Enable merchants to accept confidential payments

**Components**:
```
merchant-service/
├── src/
│   ├── routes/
│   │   ├── onboarding.ts           # Merchant signup
│   │   ├── payment-links.ts        # Create/manage links
│   │   ├── checkout.ts             # Hosted checkout page
│   │   ├── invoices.ts             # Invoice generation
│   │   ├── settlements.ts          # Batch settlements
│   │   └── analytics.ts            # Revenue analytics
│   ├── services/
│   │   ├── kyc.service.ts          # Business verification
│   │   ├── payment.service.ts      # Payment processing
│   │   ├── aggregation.service.ts  # Privacy-preserving analytics
│   │   └── webhook.service.ts      # Event notifications
│   ├── models/
│   │   ├── merchant.model.ts
│   │   ├── payment-link.model.ts
│   │   └── transaction.model.ts
│   └── utils/
│       ├── encryption.ts           # End-to-end encryption
│       └── compliance.ts           # Regulatory checks
```

**Key Features**:
- **No-code payment links** (primary MVP feature)
- **Hosted checkout pages** (like Stripe Checkout)
- **API for developers** (secondary)
- **Privacy-preserving analytics** (aggregated only)
- **Webhook system** (event notifications)

**Database Schema**:
```prisma
model Merchant {
  id              String   @id @default(cuid())
  walletAddress   String   @unique
  businessName    String
  email           String   @unique
  kycStatus       KYCStatus
  apiKey          String   @unique
  webhookUrl      String?
  webhookSecret   String?
  createdAt       DateTime @default(now())

  paymentLinks    PaymentLink[]
  transactions    Transaction[]
}

model PaymentLink {
  id              String   @id @default(cuid())
  merchantId      String
  productName     String
  description     String?
  amount          Decimal?  // null = customer chooses
  currency        String
  url             String   @unique
  active          Boolean  @default(true)

  merchant        Merchant @relation(fields: [merchantId], references: [id])
  payments        Transaction[]
}
```

**API Endpoints**:
```
POST   /v1/merchants/onboard          # Create merchant account
GET    /v1/merchants/me               # Get merchant details
POST   /v1/merchants/payment-links    # Create payment link
GET    /v1/merchants/payment-links    # List payment links
GET    /v1/merchants/transactions     # List transactions
GET    /v1/merchants/analytics        # Aggregated revenue
POST   /v1/merchants/webhooks         # Register webhook
```

---

### 3.2 Reward System Module

**Purpose**: Loyalty points, cashback, gamification

**Components**:
```
reward-service/
├── src/
│   ├── routes/
│   │   ├── points.ts               # Earn/spend points
│   │   ├── campaigns.ts            # Reward campaigns
│   │   ├── leaderboard.ts          # Gamification
│   │   └── redemption.ts           # Redeem rewards
│   ├── services/
│   │   ├── points.service.ts       # Point calculation
│   │   ├── campaign.service.ts     # Campaign management
│   │   ├── referral.service.ts     # Referral tracking
│   │   └── nft-reward.service.ts   # NFT badges (Solana)
│   └── models/
│       ├── reward-account.model.ts
│       ├── campaign.model.ts
│       └── redemption.model.ts
```

**Reward Mechanisms**:
1. **Transaction Rewards**: 0.1% back in NinjaPay points
2. **Referral Bonus**: 100 points for inviter + invitee
3. **Streak Rewards**: Daily usage streak (gamification)
4. **Milestone NFTs**: "Sent 100 payments" badge (Solana NFT)
5. **Merchant Campaigns**: Merchants can offer bonus points

**On-Chain Component** (`programs/reward-pool`):
```rust
// Anchor program for reward token staking
pub mod reward_pool {
    pub fn stake_for_boost(ctx: Context<Stake>, amount: u64) -> Result<()> {
        // Stake NinjaPay tokens for higher cashback
        // e.g., stake 1000 tokens → 2x rewards
    }

    pub fn claim_rewards(ctx: Context<Claim>) -> Result<()> {
        // Claim accumulated rewards as SPL tokens
    }
}
```

**Database Schema**:
```prisma
model RewardAccount {
  id              String   @id @default(cuid())
  userId          String   @unique
  pointsBalance   Int      @default(0)
  lifetimePoints  Int      @default(0)
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  referralCode    String   @unique

  transactions    RewardTransaction[]
}

model Campaign {
  id              String   @id
  name            String
  description     String
  multiplier      Float    // e.g., 2.0 = 2x points
  startDate       DateTime
  endDate         DateTime
  active          Boolean

  conditions      Json     // Flexible conditions
}
```

---

### 3.3 Payroll System Module

**Purpose**: Recurring salary/contractor payments with privacy

**Components**:
```
payroll-service/
├── src/
│   ├── routes/
│   │   ├── employees.ts            # Employee management
│   │   ├── payroll.ts              # Run payroll
│   │   ├── schedules.ts            # Recurring schedules
│   │   └── reports.ts              # Compliance reports
│   ├── services/
│   │   ├── batch-payment.service.ts # Bulk confidential transfers
│   │   ├── schedule.service.ts      # Cron-based execution
│   │   ├── compliance.service.ts    # Tax reporting
│   │   └── auditor.service.ts       # Auditor key management
│   └── models/
│       ├── employee.model.ts
│       ├── payroll-run.model.ts
│       └── payment-schedule.model.ts
```

**Key Features**:
- **CSV Upload**: Bulk import employees
- **Recurring Schedules**: Auto-run monthly payroll
- **Confidential Batch**: All salaries encrypted
- **Auditor Keys**: Accountant can decrypt for taxes
- **Compliance Reports**: 1099 generation (future)

**Batch Payment Flow**:
```
1. Upload CSV (employee_wallet, amount)
2. Preview total (decrypted for admin)
3. Generate batch confidential transfers (Arcium)
4. Submit to Solana (single transaction or batched)
5. Notify employees (email + push notification)
6. Record in database (encrypted amounts)
```

**Database Schema**:
```prisma
model Employee {
  id              String   @id @default(cuid())
  companyId       String
  walletAddress   String
  name            String
  email           String
  salary          Decimal  @encrypted  // Encrypted at rest
  paymentSchedule PaymentSchedule
  active          Boolean  @default(true)

  payments        PayrollPayment[]
}

model PayrollRun {
  id              String   @id @default(cuid())
  companyId       String
  status          PayrollStatus
  totalAmount     Decimal  @encrypted
  employeeCount   Int
  scheduledDate   DateTime
  executedDate    DateTime?
  batchSignature  String?

  payments        PayrollPayment[]
}

enum PaymentSchedule {
  WEEKLY
  BIWEEKLY
  MONTHLY
  CUSTOM
}
```

---

### 3.4 Mobile Module (Venmo-like)

**Purpose**: Consumer P2P confidential payments

**Components**:
```
mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Balance + recent txs
│   │   ├── SendScreen.tsx          # Send payment flow
│   │   ├── ReceiveScreen.tsx       # QR code + address
│   │   ├── ContactsScreen.tsx      # Saved recipients
│   │   ├── TransactionHistory.tsx  # Tx list with decryption
│   │   ├── RewardsScreen.tsx       # Points + leaderboard
│   │   └── SettingsScreen.tsx      # Account settings
│   ├── components/
│   │   ├── BalanceCard.tsx         # Confidential balance display
│   │   ├── PaymentConfirmation.tsx # Confirmation modal
│   │   ├── QRScanner.tsx           # Camera QR scanner
│   │   └── TransactionRow.tsx      # Tx list item
│   ├── hooks/
│   │   ├── useWallet.ts            # Wallet connection
│   │   ├── useConfidentialTransfer.ts
│   │   ├── useBalance.ts
│   │   └── useRewards.ts
│   ├── services/
│   │   ├── api.service.ts          # Backend API client
│   │   ├── arcium.service.ts       # Arcium SDK wrapper
│   │   └── push-notifications.ts   # Firebase/OneSignal
│   └── utils/
│       ├── encryption.ts
│       └── formatting.ts
```

**Key Flows**:

**1. Send Payment**:
```
1. Enter recipient (scan QR, paste address, or pick contact)
2. Enter amount
3. Optional: Add note (encrypted)
4. Review (show fee, speed estimate)
5. Sign with wallet (Mobile Wallet Adapter)
6. Submit confidential transfer (Arcium)
7. Show success (instant UI, finalize in background)
```

**2. Receive Payment**:
```
1. Display QR code (wallet address encoded)
2. Or share payment link (ninjapay.me/@username)
3. Push notification when payment received
4. Decrypt and display amount
```

**3. View History**:
```
1. Fetch encrypted transactions from backend
2. Decrypt amounts using Arcium (batch decryption)
3. Display list with filters (sent/received, date)
4. Tap transaction → details (Solscan link, note, etc.)
```

---

## 4. AI Agent System

### 4.1 Agent Architecture

**Orchestrator Pattern**:
```
User/System Event
    ↓
API Gateway
    ↓
AI Orchestrator (FastAPI)
    ↓
Agent Task Queue (Celery)
    ↓
[Compliance Agent] [Analytics Agent] [Investigator Agent] ...
    ↓
Results stored in DB
    ↓
Webhook notification (if needed)
```

**Shared Agent Base Class**:
```python
# agents/base/agent.py

from abc import ABC, abstractmethod
from typing import Any, Dict
import logging

class BaseAgent(ABC):
    def __init__(self, agent_id: str, llm_provider: str):
        self.agent_id = agent_id
        self.llm = self._init_llm(llm_provider)
        self.memory = self._init_memory()
        self.logger = logging.getLogger(agent_id)

    @abstractmethod
    async def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a task and return results"""
        pass

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return agent-specific system prompt"""
        pass

    async def _init_llm(self, provider: str):
        # Initialize LLM (you'll provide details)
        pass

    def _init_memory(self):
        # Initialize vector DB for agent memory
        pass
```

### 4.2 Priority 1 Agents (MVP - Days 13-16)

#### **Compliance Agent** 🚨
**Purpose**: KYC/AML/fraud detection

**Capabilities**:
- **KYC Verification**: Check identity docs, verify business
- **AML Screening**: Cross-reference against OFAC/sanctions lists
- **Fraud Detection**: Flag suspicious transaction patterns
- **Risk Scoring**: Assign risk score to users/merchants

**Implementation**:
```python
# agents/compliance-agent/agent.py

class ComplianceAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a compliance officer for a financial services platform.
        Your role is to:
        1. Verify user identities (KYC)
        2. Screen transactions for money laundering (AML)
        3. Detect fraud patterns
        4. Assign risk scores

        Use the following data sources:
        - User KYC documents
        - Transaction history
        - Wallet on-chain activity
        - OFAC sanctions list

        Respond with: {"risk_level": "low|medium|high", "reason": "...", "action": "approve|review|reject"}
        """

    async def process(self, task: Dict) -> Dict:
        task_type = task['type']

        if task_type == 'kyc_check':
            return await self._kyc_verification(task['user_id'])
        elif task_type == 'transaction_screen':
            return await self._aml_screening(task['transaction_id'])
        elif task_type == 'fraud_check':
            return await self._fraud_detection(task['user_id'])

    async def _kyc_verification(self, user_id: str):
        # Fetch user data
        user = await db.get_user(user_id)

        # Use LLM to analyze KYC docs
        analysis = await self.llm.analyze(
            prompt=f"Verify this user's identity: {user.kyc_documents}",
            system_prompt=self.get_system_prompt()
        )

        # Store result
        await db.update_user_kyc_status(user_id, analysis['risk_level'])

        return analysis

    async def _aml_screening(self, transaction_id: str):
        # Fetch transaction
        tx = await db.get_transaction(transaction_id)

        # Check patterns
        patterns = await self._analyze_patterns(tx)

        # Check sanctions
        sanctions_hit = await self._check_sanctions(tx.recipient_wallet)

        if sanctions_hit:
            return {"risk_level": "high", "reason": "Sanctioned entity", "action": "reject"}

        return patterns
```

**Integration Points**:
- Triggered on: New user signup, large transaction (>$10k), merchant onboarding
- Outputs: Risk score, approval/rejection, flagged for manual review
- Webhook: Notify admin if high risk

---

#### **Analytics Agent** 📊
**Purpose**: User insights, retention predictions, growth metrics

**Capabilities**:
- **Churn Prediction**: Identify users likely to churn
- **Cohort Analysis**: Segment users by behavior
- **Anomaly Detection**: Unusual activity patterns
- **Personalized Insights**: User-specific recommendations

**Implementation**:
```python
# agents/analytics-agent/agent.py

class AnalyticsAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a data analyst specializing in fintech user behavior.
        Analyze user data to provide insights:
        1. Churn risk (likelihood user stops using app)
        2. Engagement patterns (frequency, volume)
        3. Growth opportunities (upsell, referrals)
        4. Anomalies (unusual behavior)

        Output actionable recommendations.
        """

    async def process(self, task: Dict) -> Dict:
        task_type = task['type']

        if task_type == 'churn_prediction':
            return await self._predict_churn(task['user_id'])
        elif task_type == 'cohort_analysis':
            return await self._cohort_analysis(task['cohort_id'])
        elif task_type == 'personalized_insights':
            return await self._generate_insights(task['user_id'])

    async def _predict_churn(self, user_id: str):
        # Fetch user activity
        activity = await db.get_user_activity(user_id, days=30)

        # Features: last_transaction_days_ago, transaction_count, avg_amount
        features = self._extract_features(activity)

        # Use LLM or ML model to predict churn
        prediction = await self.llm.predict_churn(features)

        if prediction['churn_risk'] > 0.7:
            # Trigger retention campaign
            await self._trigger_retention(user_id)

        return prediction
```

---

#### **Investigator Agent** 🕵️
**Purpose**: Detect suspicious transactions, stolen funds recovery

**Capabilities**:
- **Stolen Fund Tracking**: Trace funds through wallets
- **Suspicious Activity**: Flag unusual patterns
- **Chain Analysis**: On-chain forensics
- **Reporting**: Generate investigation reports

**Implementation**:
```python
# agents/investigator-agent/agent.py

class InvestigatorAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a blockchain investigator specializing in financial crimes.
        Your role:
        1. Trace stolen funds through transaction graphs
        2. Identify money laundering patterns (structuring, layering)
        3. Flag high-risk wallets
        4. Generate forensic reports

        Use on-chain data and pattern recognition.
        """

    async def process(self, task: Dict) -> Dict:
        task_type = task['type']

        if task_type == 'trace_funds':
            return await self._trace_stolen_funds(task['wallet_address'])
        elif task_type == 'analyze_wallet':
            return await self._analyze_wallet(task['wallet_address'])
        elif task_type == 'generate_report':
            return await self._generate_report(task['case_id'])

    async def _trace_stolen_funds(self, wallet: str):
        # Fetch on-chain transaction history
        txs = await solana_client.get_transactions(wallet, limit=1000)

        # Build transaction graph
        graph = self._build_tx_graph(txs)

        # Use LLM to analyze patterns
        analysis = await self.llm.analyze_graph(graph)

        # Identify suspicious hops
        suspicious_wallets = analysis['flagged_wallets']

        return {
            "suspect_wallets": suspicious_wallets,
            "confidence": analysis['confidence'],
            "report": analysis['summary']
        }
```

---

### 4.3 Priority 2 Agents (Post-MVP - Days 17-18 or later)

#### **Support Agent** 💬
**Purpose**: Automated customer service

**Capabilities**:
- Answer common questions (FAQs)
- Troubleshoot issues (tx failed, balance not showing)
- Generate personalized responses
- Escalate to human if complex

**Use Cases**:
- "Why is my transaction pending?" → Check status, explain finality
- "How do I withdraw to bank?" → Provide step-by-step guide
- "Is my money safe?" → Explain Arcium security model

**Implementation Sketch**:
```python
async def process_support_ticket(ticket: Dict):
    # Retrieve user context
    user = await db.get_user(ticket['user_id'])
    history = await db.get_support_history(user)

    # Generate response using LLM + RAG
    response = await llm.generate_response(
        query=ticket['message'],
        context=f"User: {user}, History: {history}",
        knowledge_base=support_docs
    )

    # Check if escalation needed
    if response['confidence'] < 0.7:
        await escalate_to_human(ticket)
    else:
        await send_response(ticket['user_id'], response['message'])
```

---

#### **Reporting Agent** 📈
**Purpose**: Generate financial summaries, compliance reports

**Capabilities**:
- Monthly revenue summaries (for merchants)
- Tax documents (1099, annual statements)
- Audit trails (for regulators)
- Custom reports (ad-hoc queries)

**Use Cases**:
- Merchant: "Generate my Q4 2025 revenue report"
- Company: "Prepare payroll summary for accountant"
- Regulator: "Provide transaction history for wallet XYZ"

---

#### **Recurring Payments Agent** 🔄
**Purpose**: Automate subscriptions and payroll

**Capabilities**:
- Execute scheduled payments (cron-like)
- Handle failures (retry logic, notify user)
- Adjust for holidays/weekends
- Smart rescheduling (if balance insufficient)

**Implementation**:
```python
async def process_recurring_payment(schedule: Dict):
    # Check if today is payment day
    if not is_payment_due(schedule):
        return

    # Check balance
    balance = await get_balance(schedule['payer_wallet'])

    if balance < schedule['amount']:
        # Insufficient balance
        await notify_user("Insufficient balance for recurring payment")
        await smart_reschedule(schedule)  # Try again in 3 days
        return

    # Execute payment
    result = await execute_confidential_transfer(
        from=schedule['payer_wallet'],
        to=schedule['recipient_wallet'],
        amount=schedule['amount']
    )

    if result['success']:
        await update_schedule(schedule['id'], last_run=now())
    else:
        await handle_failure(schedule, result['error'])
```

---

#### **Risk Agent** ⚠️
**Purpose**: Real-time risk scoring for transactions

**Capabilities**:
- Assign risk score (0-100) to every transaction
- Block high-risk transactions automatically
- Learn from false positives (feedback loop)
- Adapt to new fraud patterns

**Scoring Factors**:
- Amount (large = higher risk)
- Velocity (many txs in short time)
- New wallet (no history)
- Geographic patterns (VPN, Tor)
- Wallet on-chain reputation

---

#### **Liquidity Agent** 💰
**Purpose**: Treasury management, liquidity optimization

**Capabilities**:
- Monitor vault balances
- Auto-rebalance across tokens (USDC, SOL)
- Yield optimization (stake idle funds)
- Alert if liquidity low

**Use Case**:
- Company has $500k in USDC vault for payroll
- Payroll is $200k/month
- Agent: Stake $250k in Marinade for 5% APY
- Keep $250k liquid for next payroll
- Auto-unstake 7 days before payroll date

---

### 4.4 Additional AI Agent Ideas

#### **Content Moderation Agent** 🛡️
- Scan payment notes for abuse/illegal content
- Flag suspicious messages
- Auto-block if high confidence

#### **Price Oracle Agent** 💱
- Fetch real-time SOL/USDC prices
- Calculate conversion rates
- Predict price movements for treasury management

#### **Growth Agent** 📈
- A/B test recommendations
- Feature prioritization (based on usage data)
- Viral loop optimization

#### **Onboarding Agent** 👋
- Personalized welcome flow
- Detect user intent (consumer vs merchant)
- Adaptive tutorials

#### **Retention Agent** 💌
- Send personalized notifications
- "You haven't used NinjaPay in 7 days - here's 50 bonus points"
- Win-back campaigns

---

## 5. Data Flow & Dependencies

### 5.1 Core Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

USER ACTION (Mobile/Web)
    ↓
API GATEWAY (Express)
    ├─ Auth Middleware (JWT validation)
    ├─ Rate Limiting (Redis)
    └─ Request Routing
    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐       │
│  │ Payment Service│    │ Merchant Svc   │    │ Payroll Svc    │       │
│  │ (Rust)         │    │ (Node.js)      │    │ (Node.js)      │       │
│  └────────┬───────┘    └────────┬───────┘    └────────┬───────┘       │
│           │                     │                      │                │
│           └─────────────────────┴──────────────────────┘                │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌───────────────────────┐                           │
│                    │   Arcium Service      │                           │
│                    │   (Rust)              │                           │
│                    │                       │                           │
│                    │ • Encrypt amounts     │                           │
│                    │ • Generate ZK proofs  │                           │
│                    │ • MPC operations      │                           │
│                    └───────────┬───────────┘                           │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐         ┌──────────────────┐                     │
│  │ MagicBlock L2    │         │ Solana L1        │                     │
│  │ (Fast Path)      │────────▶│ (Final Settlement)                     │
│  │                  │         │                  │                     │
│  │ • <50ms finality │         │ • Arcium SPL     │                     │
│  │ • TEE security   │         │ • Smart contracts│                     │
│  └──────────────────┘         └──────────────────┘                     │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVENT SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Transaction Confirmed                                                   │
│         │                                                                │
│         ├──▶ Webhook Service ──▶ Merchant webhook                       │
│         ├──▶ AI Orchestrator ──▶ [Compliance Agent, Analytics Agent]    │
│         ├──▶ Reward Service ──▶ Award points                            │
│         └──▶ Push Notification ──▶ Mobile app                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA STORES                                    │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│  PostgreSQL      │  MongoDB         │  Redis                           │
│                  │                  │                                  │
│  • Users         │  • Tx logs       │  • Session cache                 │
│  • Merchants     │  • Events        │  • Rate limits                   │
│  • Employees     │  • AI context    │  • Job queues                    │
│  • Metadata      │  • Analytics     │  • Proof cache                   │
└──────────────────┴──────────────────┴──────────────────────────────────┘
```

### 5.2 Module Dependencies

**Dependency Graph**:
```
API Gateway
├─ Payment Service
│  ├─ Arcium Service (required)
│  ├─ MagicBlock SDK (optional)
│  └─ Database (required)
├─ Merchant Service
│  ├─ Payment Service (required)
│  ├─ Webhook Service (required)
│  └─ Database (required)
├─ Payroll Service
│  ├─ Payment Service (required)
│  ├─ Arcium Service (required)
│  └─ Database (required)
├─ Reward Service
│  ├─ Database (required)
│  └─ Solana (reward-pool program)
└─ AI Orchestrator
   ├─ All Agents (modular)
   ├─ Vector DB (required)
   └─ Database (required)
```

**Critical Path** (Blocking Dependencies):
1. **Arcium Service** → Everything depends on this
2. **Database schema** → All services need this
3. **API Gateway** → Frontend depends on this

**Parallel Development** (Non-blocking):
- Mobile app UI (can use mock data)
- Merchant dashboard (can use mock data)
- AI agents (can develop independently)
- Reward system (bonus feature)

---

## 6. Privacy-by-Design

### 6.1 Privacy Principles

**1. Data Minimization**:
- Collect only necessary data
- Don't store plaintext amounts in database
- Use encrypted fields for sensitive data

**2. End-to-End Encryption**:
- Amounts encrypted by Arcium before leaving client
- Backend never sees plaintext amounts
- Only user + auditor can decrypt

**3. Zero-Knowledge Proofs**:
- Prove sufficient balance without revealing balance
- Prove amount in valid range without revealing amount
- Prove signature valid without revealing key

**4. Selective Transparency**:
- Transactions visible (sender, recipient, timestamp)
- Amounts hidden by default
- Auditor keys for compliance (optional)

**5. Client-Side Decryption**:
- Mobile app decrypts amounts locally
- Backend returns ciphertext only
- Decryption keys never leave device

### 6.2 Privacy Implementation

**Database Encryption**:
```prisma
// Prisma schema with encryption

model Transaction {
  id                String   @id @default(cuid())
  sender            String
  recipient         String
  encryptedAmount   Bytes    // ElGamal ciphertext
  amountCommitment  String   // Pedersen commitment (public)
  proofs            Json     // ZK proofs
  signature         String
  status            TxStatus
  createdAt         DateTime @default(now())
}

// Note: No plaintext amount stored!
```

**API Response**:
```json
// GET /v1/transactions/:id
{
  "id": "tx_abc123",
  "sender": "7xJ8...abc",
  "recipient": "9kL2...def",
  "encrypted_amount": "0x4a7b...", // Ciphertext
  "amount_commitment": "0x8c3d...", // Pedersen commitment
  "proofs": {
    "range_proof": "0x...",
    "validity_proof": "0x..."
  },
  "status": "confirmed",
  "signature": "tx_signature_here",
  "created_at": "2025-10-05T12:00:00Z"
}

// Client decrypts locally:
const amount = await arcium.decrypt(tx.encrypted_amount, userKeyId);
// amount = 50.00
```

**Privacy-Preserving Analytics**:
```typescript
// Aggregate without decrypting individual amounts

async function getMerchantRevenue(merchantId: string) {
  // Fetch all transaction commitments
  const commitments = await db.getTransactionCommitments(merchantId);

  // Homomorphic addition (sum commitments without decrypting)
  const totalCommitment = sumCommitments(commitments);

  // Only merchant can decrypt total
  const totalRevenue = await arcium.decrypt(totalCommitment, merchantKeyId);

  return {
    total_revenue: totalRevenue, // Decrypted
    transaction_count: commitments.length, // Public
    individual_transactions: commitments.map(c => ({
      commitment: c, // Public
      amount: null // Hidden
    }))
  };
}
```

---

## 7. 18-Day Implementation Plan

### Overview

**Phase 1** (Days 1-6): Foundation + Arcium
**Phase 2** (Days 7-12): Core Modules
**Phase 3** (Days 13-16): AI Agents
**Phase 4** (Days 17-18): Integration + Polish

---

### **Day 1-2: Foundation** 🏗️

**Goal**: Monorepo setup, tooling, architecture

**Tasks**:
- [ ] Initialize Turborepo + PNPM workspace
- [ ] Set up folder structure (apps, services, packages, agents, programs)
- [ ] Configure shared packages (types, config, logger)
- [ ] Set up PostgreSQL + MongoDB + Redis (Supabase + Atlas + Upstash)
- [ ] Create Prisma schema (initial models)
- [ ] Set up GitHub Actions CI/CD
- [ ] Deploy infrastructure (Vercel, Railway accounts)

**Deliverable**: Empty monorepo with all tooling configured, CI/CD green

---

### **Day 3-6: Arcium Integration** 🔐

**Goal**: Confidential transfers working end-to-end

**Tasks**:
- [ ] **Day 3**: Study Arcium docs, set up SDK
  - Install Arcium SDK (Rust or TypeScript)
  - Create test accounts on Arcium devnet
  - Run example: Create confidential account

- [ ] **Day 4**: Build Arcium Service
  - `services/arcium-service/` (Rust)
  - Functions: `createConfidentialAccount`, `encryptAmount`, `generateProofs`
  - Test: Encrypt/decrypt amount locally

- [ ] **Day 5**: Payment Service integration
  - `services/payment-service/` (Rust)
  - Integrate Arcium Service
  - Function: `createConfidentialTransfer(from, to, amount)`
  - Test: Send confidential transfer on devnet

- [ ] **Day 6**: API Gateway + testing
  - Expose `POST /v1/payments` endpoint
  - E2E test: Mobile → API → Arcium → Solana
  - **Milestone**: First confidential transfer working!

**Deliverable**: API endpoint that creates confidential transfers on Solana devnet

---

### **Day 7-8: Mobile App Core** 📱

**Goal**: Basic mobile app with send/receive

**Tasks**:
- [ ] **Day 7**: App structure + wallet connection
  - Initialize React Native + Expo
  - Implement wallet connection (Mobile Wallet Adapter)
  - Display balance (regular, not confidential yet)
  - UI: Home screen, Send screen, Receive screen

- [ ] **Day 8**: Confidential transfers in mobile
  - Integrate with Payment Service API
  - Send flow: Enter amount → Review → Sign → Confirm
  - Receive flow: Display QR code
  - Test: Send confidential USDC between 2 phones

**Deliverable**: Mobile app can send/receive confidential payments

---

### **Day 9-10: Merchant Module** 💳

**Goal**: Payment links working

**Tasks**:
- [ ] **Day 9**: Merchant Service + database
  - Implement `services/merchant-service/`
  - Database: Merchants, PaymentLinks
  - API: Create merchant, create payment link
  - Test: Create payment link, get unique URL

- [ ] **Day 10**: Merchant Dashboard + Checkout Page
  - `apps/merchant-dashboard/`: Login, create link, view transactions
  - Hosted checkout page: `/pay/:linkId`
  - Customer can pay via wallet
  - Test: End-to-end merchant flow

**Deliverable**: Merchants can create payment links, customers can pay

---

### **Day 11-12: Payroll Module** 💼

**Goal**: Batch confidential payments working

**Tasks**:
- [ ] **Day 11**: Payroll Service
  - Implement `services/payroll-service/`
  - Database: Employees, PayrollRuns
  - API: Upload CSV, preview, execute batch
  - Integrate with Arcium for batch transfers

- [ ] **Day 12**: Payroll Console
  - `apps/payroll-console/`: Upload CSV, view runs
  - Test: Upload 10 employees, execute payroll
  - Verify: All 10 transactions confirmed, amounts encrypted

**Deliverable**: Companies can run confidential payroll via CSV upload

---

### **Day 13-14: AI Agent Infrastructure** 🤖

**Goal**: AI orchestrator + 2 agents working

**Tasks**:
- [ ] **Day 13**: AI Orchestrator
  - Implement `services/ai-orchestrator/` (FastAPI)
  - Set up Celery + Redis for async tasks
  - Create BaseAgent class
  - Test: Orchestrator can route tasks to agents

- [ ] **Day 14**: Compliance Agent
  - Implement `agents/compliance-agent/`
  - Capabilities: KYC check, AML screening, fraud detection
  - Integrate with LLM (you provide details)
  - Test: Run KYC check on test user

**Deliverable**: Compliance agent can analyze user risk

---

### **Day 15-16: More AI Agents** 🧠

**Goal**: 3 more agents operational

**Tasks**:
- [ ] **Day 15**:
  - **Analytics Agent**: Churn prediction, cohort analysis
  - **Investigator Agent**: Trace suspicious transactions
  - Test both agents

- [ ] **Day 16**:
  - **Recurring Payments Agent**: Auto-execute scheduled payments
  - **Support Agent** (if time): Answer FAQs
  - Integrate agents with main system (trigger on events)

**Deliverable**: 5 AI agents running, triggered by system events

---

### **Day 17: Integration & Testing** 🔗

**Goal**: All modules connected, end-to-end flows working

**Tasks**:
- [ ] **Consumer Flow**:
  - Alice sends $50 to Bob (mobile app)
  - Compliance agent checks transaction (auto)
  - Transaction completes
  - Both get push notifications
  - Analytics agent logs activity

- [ ] **Merchant Flow**:
  - Merchant creates payment link
  - Customer pays $99
  - Compliance agent screens transaction
  - Webhook fires to merchant
  - Merchant dashboard updates

- [ ] **Payroll Flow**:
  - Company uploads 10 employees
  - Payroll service executes batch
  - Compliance agent approves (auto)
  - All employees receive payment
  - Reporting agent generates summary

- [ ] **Bug fixes**: Resolve integration issues

**Deliverable**: All 3 products work end-to-end

---

### **Day 18: Polish & Deploy** ✨

**Goal**: Production deployment, demo ready

**Tasks**:
- [ ] **Polish**:
  - UI improvements (loading states, error messages)
  - Add animations (React Native Reanimated)
  - Fix edge cases

- [ ] **Deploy**:
  - Mobile: Build iOS + Android (TestFlight, Play Store)
  - Web: Deploy to Vercel (merchant + payroll + landing)
  - Backend: Deploy to Railway (all services)
  - Database: Supabase + MongoDB Atlas (production)
  - Monitoring: Sentry (error tracking)

- [ ] **Documentation**:
  - Update README.md
  - API documentation (Mintlify)
  - Demo script

- [ ] **Demo Prep**:
  - Record backup video (in case live demo fails)
  - Test demo flow 10x times

**Deliverable**: Production deployment, demo-ready system

---

### Sprint Breakdown (Who Does What)

**If Solo** (1 person, 18 days):
- **Weeks 1-2**: Core system (you)
- **Week 2-3**: AI agents (you, nights/weekends)
- **Risk**: Tight, but doable with focus

**If Team of 2**:
- **Person A**: Backend (Arcium, Payment Service, Merchant, Payroll)
- **Person B**: Frontend (Mobile, Dashboards, UI)
- **Both**: AI agents (split agents between you)

**If Team of 3** (Recommended):
- **Person A**: Backend/Arcium (critical path)
- **Person B**: Frontend (mobile + web)
- **Person C**: AI agents + DevOps

---

## 8. Deployment Strategy

### 8.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION DEPLOYMENT                             │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND APPS (Vercel)
├─ apps/mobile (Expo EAS)
│  ├─ iOS: TestFlight → App Store
│  └─ Android: Internal Testing → Play Store
├─ apps/merchant-dashboard (Vercel)
├─ apps/payroll-console (Vercel)
└─ apps/landing (Vercel)

BACKEND SERVICES (Railway)
├─ api-gateway (Node.js)
├─ payment-service (Rust)
├─ arcium-service (Rust)
├─ merchant-service (Node.js)
├─ payroll-service (Node.js)
├─ reward-service (Node.js)
└─ webhook-service (Node.js)

AI SERVICES (Modal or Replicate)
├─ ai-orchestrator (Python FastAPI)
└─ agents/* (Python Celery workers)

DATABASES
├─ PostgreSQL (Supabase)
├─ MongoDB (MongoDB Atlas)
├─ Redis (Upstash)
└─ Vector DB (Qdrant Cloud)

BLOCKCHAIN
├─ Solana (Helius RPC)
├─ Arcium (Mainnet-alpha)
└─ MagicBlock (if integrated)
```

### 8.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy NinjaPay

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-gateway

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: expo/expo-github-action@v8
      - run: eas build --platform all --profile production
```

---

## Appendix: Critical Decisions

### Decision 1: Arcium vs Token-2022

**If Arcium available**: Use it (better tech, first-mover advantage)
**If Arcium delayed**: Use Token-2022 (production-ready fallback)
**Decision point**: Day 3 (when you start integration)

### Decision 2: MagicBlock Integration

**If time permits** (Day 17-18): Integrate for speed
**If tight on time**: Skip, add post-launch
**Not blocking**: Core product works without it

### Decision 3: AI Agent Scope

**MVP** (Days 13-16): Compliance, Analytics, Investigator (3 agents)
**Post-MVP**: Support, Reporting, Recurring, Risk (4 more agents)
**Reasoning**: 3 agents show capability, more is overkill for demo

### Decision 4: Mobile First or Web First

**Recommendation**: **Parallel development**
- Mobile (Person A): Days 7-8
- Merchant Dashboard (Person B): Days 9-10
- Both ready by Day 10

---

## Summary: Can We Do This in 18 Days?

**Honest Assessment**:

**If team of 3, focused execution**: YES ✅
- Person A: Backend/Arcium (Days 1-12)
- Person B: Frontend (Days 7-12)
- Person C: AI agents (Days 13-16)
- All: Integration (Days 17-18)

**If team of 2**: YES ⚠️ (tight, need to cut scope)
- Must cut: MagicBlock, 2-3 AI agents
- Focus: Core payments + 2 AI agents

**If solo**: MAYBE ⚠️⚠️ (heroic effort required)
- Must cut: Mobile app polish, 4+ AI agents, advanced features
- Focus: Working demo of core concept

**Keys to Success**:
1. **Parallel development** (don't wait for backend to start frontend)
2. **AI agents are additive** (can ship with 0 agents, add them later)
3. **Ruthless prioritization** (cut features daily if behind)
4. **Daily standups** (15 min sync, adjust plan)

**My Recommendation**:
- Days 1-12: **Ship core payments system** (consumer + merchant + payroll)
- Days 13-16: **Add 2-3 AI agents** (compliance + 1-2 more)
- Days 17-18: **Polish + deploy**

This gives you a working product by Day 12 (safety buffer), then AI agents are "bonus features" that make you stand out.

Ready to execute? 🚀
