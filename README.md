# NinjaPay

**Confidential Payments Platform for Solana**

> Privacy-first payment infrastructure powered by Arcium MPC and MagicBlock ephemeral rollups

## 🚀 What is NinjaPay?

NinjaPay is the privacy layer for Solana commerce, enabling individuals, merchants, and institutions to transact with Venmo-level convenience while keeping amounts confidential through cutting-edge cryptography.

### Three Integrated Products

1. **Consumer Mobile App** - Venmo-like P2P payments with confidential amounts
2. **Merchant Platform** - Stripe-like payment tools with encrypted transactions
3. **Payroll System** - Institutional-grade batch payments with compliance features

## 🏗️ Tech Stack

- **Privacy**: Arcium Confidential SPL (MPC-powered encryption)
- **Speed**: MagicBlock Ephemeral Rollups (sub-50ms transactions)
- **Blockchain**: Solana + Token-2022 + Anchor
- **Frontend**: React Native (mobile), Next.js 14 (dashboards)
- **Backend**: Express.js, Rust (payment services)
- **AI Agents**: Python + FastAPI + Celery
- **Database**: PostgreSQL, MongoDB, Redis
- **Monorepo**: Turborepo + PNPM

## 📦 Monorepo Structure

```
ninjapay/
├── apps/                      # Frontend applications
│   ├── mobile/               # React Native consumer app
│   ├── merchant-dashboard/   # Next.js merchant portal
│   ├── payroll-console/      # Next.js payroll management
│   ├── admin-portal/         # Next.js admin/monitoring
│   └── landing/              # Next.js marketing site
│
├── services/                  # Backend microservices
│   ├── api-gateway/          # ✅ Express.js API gateway
│   ├── payment-service/      # Rust payment processing
│   ├── arcium-service/       # Rust Arcium MPC integration
│   ├── merchant-service/     # Node.js merchant ops
│   ├── payroll-service/      # Node.js payroll processing
│   ├── reward-service/       # Node.js loyalty/rewards
│   ├── webhook-service/      # Node.js event delivery
│   └── ai-orchestrator/      # Python AI coordinator
│
├── agents/                    # AI agent modules
│   ├── compliance-agent/     # Python (KYC/AML/fraud)
│   ├── analytics-agent/      # Python (Insights/predictions)
│   ├── investigator-agent/   # Python (Suspicious activity)
│   ├── support-agent/        # Python (Customer service)
│   ├── reporting-agent/      # Python (Financial reports)
│   ├── recurring-agent/      # Python (Automated payments)
│   ├── risk-agent/           # Python (Risk scoring)
│   └── liquidity-agent/      # Python (Treasury management)
│
├── packages/                  # Shared libraries
│   ├── types/                # ✅ Shared TypeScript types
│   ├── logger/               # ✅ Winston structured logging
│   ├── database/             # ✅ Prisma schema (15 models)
│   ├── config/               # ✅ Shared configs
│   ├── arcium-sdk/           # Arcium integration
│   ├── solana-utils/         # Solana helpers
│   ├── ui/                   # Shared React components
│   ├── queue/                # Bull job queue
│   └── cache/                # Redis client
│
└── programs/                  # Solana smart contracts
    ├── ninjapay-vault/       # Anchor escrow program
    ├── reward-pool/          # Anchor loyalty staking
    └── compliance-oracle/    # Anchor compliance checks
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- PNPM 8+
- Rust 1.70+
- Solana CLI 1.17+
- Anchor 0.29+

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development servers
pnpm dev
```

### Environment Setup

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://..."
MONGODB_URI="mongodb+srv://..."
REDIS_URL="redis://..."

# Solana
SOLANA_RPC_URL="https://api.devnet.solana.com"

# Arcium (requires early access)
ARCIUM_API_KEY="..."
ARCIUM_NETWORK="devnet"

# API
JWT_SECRET="your-secret-key"
```

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) - System design deep-dive
- [Sprint Plan](./SPRINT_PLAN.md) - 18-day implementation roadmap
- [API Spec](./API_SPEC.md) - Developer API documentation
- [PRD](./PRD.md) - Product requirements

## 🚧 Development Status

**Current Phase**: Arcium MPC Integration Complete ✅

- [x] Monorepo structure (Turborepo + PNPM)
- [x] Shared packages (types, config, logger, database)
- [x] Database schema (Prisma - 15 models)
- [x] API Gateway (Express.js with auth, rate limiting, health checks)
- [x] Solana Web3.js integration (connection, wallet, token, transaction utils)
- [x] Arcium MPC integration
  - [x] Encrypted instructions (transfer, batch payroll, balance query)
  - [x] Rust microservice for MPC computations
  - [x] TypeScript SDK for client-side encryption
  - [x] Confidential payment flow APIs
- [x] MagicBlock ephemeral rollup integration
  - [x] Anchor program for batch payroll with #[ephemeral]
  - [x] Delegation/settlement lifecycle implementation
  - [x] TypeScript SDK for ephemeral rollup management
  - [x] Payroll service with cost optimization
- [ ] Frontend applications

### Arcium Integration Highlights

**Encrypted Instructions** (`services/arcium-service/build/`):
- `encrypted_transfer.arcis` - Confidential P2P transfers
- `batch_payroll.arcis` - Bulk payments (up to 3 recipients)
- `query_balance.arcis` - Encrypted balance queries
- `validate_amount.arcis` - Amount validation in MPC
- `add_values.arcis` - Test MPC computation

**Arcium Service APIs** (`services/arcium-service/src/api/`):
- `POST /api/computation/invoke` - Queue MPC computation
- `GET /api/computation/status` - Poll computation status
- `POST /api/computation/callback` - Receive MPC results
- `GET /api/computation/instructions` - List available instructions
- `POST /api/account/setup` - Initialize confidential vault

**Client SDK** (`packages/solana-utils/src/`):
- `ArciumClient` - MPC network client
- `EncryptionUtils` - Client-side encryption/decryption
- `ConfidentialPaymentService` - High-level payment API
- `VaultManager` - Confidential account management

### MagicBlock Integration Highlights

**Batch Payroll Program** (`programs/ninja-payroll/`):
- Anchor program with `#[ephemeral]` attribute for ephemeral rollup support
- Delegation/undelegation lifecycle management
- SPL Token transfers at 10-50ms latency
- Batch processing for 100+ recipients
- Cost: ~$0.02 vs ~$1.00 traditional (95%+ savings)

**Payroll Service APIs** (`services/payroll-service/`):
- `POST /v1/payroll/process` - Execute batch payroll
- `POST /v1/payroll/estimate` - Estimate costs
- `GET /v1/batch/:id` - Get batch status
- `GET /v1/batch/:id/status` - Poll processing progress

**MagicBlock Client SDK** (`packages/solana-utils/src/magicblock.ts`):
- `MagicBlockPayrollClient` - Ephemeral rollup client
- `executePayroll()` - End-to-end batch processing
- Automatic routing via Magic Router
- Support for all 3 regions (Asia/EU/US validators)

**Performance Metrics**:
- **Latency**: 10-50ms per payment in ephemeral rollup
- **Cost**: ~$0.02 for 100+ payments (vs ~$1.00 traditional)
- **Throughput**: Process hundreds of payments in seconds
- **Privacy**: Optional TEE execution for confidential payroll

See [SPRINT_PLAN.md](./SPRINT_PLAN.md) for detailed timeline.

## 🔐 Security

NinjaPay implements defense-in-depth security:

- **Layer 1**: MPC (Arcium) - Distributed key management
- **Layer 2**: TEE (MagicBlock) - Hardware-secured computation
- **Layer 3**: ZK Proofs - Cryptographic privacy guarantees
- **Layer 4**: TLS 1.3 - Encrypted communications

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🤝 Contributing

This is a hackathon project. Contributions welcome after initial launch.

## 🔗 Links

- Website: https://ninjapay.xyz (coming soon)
- Docs: https://docs.ninjapay.xyz (coming soon)
- Twitter: @ninjapay (coming soon)

---

Built with ❤️ for the Solana ecosystem
