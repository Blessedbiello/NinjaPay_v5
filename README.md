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
├── apps/                  # Frontend applications
│   ├── mobile/           # React Native consumer app
│   ├── merchant-dashboard/  # Next.js merchant portal
│   └── payroll-console/  # Next.js payroll management
├── services/             # Backend microservices
│   ├── api-gateway/      # Express.js API gateway
│   ├── payment-service/  # Rust payment processing
│   └── arcium-service/   # Rust Arcium MPC integration
├── agents/               # AI agent modules
│   ├── compliance-agent/ # KYC/AML/fraud detection
│   ├── analytics-agent/  # Insights & predictions
│   └── investigator-agent/ # Suspicious activity detection
├── packages/             # Shared libraries
│   ├── arcium-sdk/       # Arcium integration
│   ├── database/         # Prisma schema
│   └── types/            # Shared TypeScript types
└── programs/             # Solana smart contracts
    └── ninjapay-vault/   # Anchor escrow program
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

**Current Phase**: Day 1 - Foundation Setup ✅

- [x] Monorepo structure
- [x] Shared packages (types, config, logger)
- [ ] Database schema
- [ ] API Gateway scaffold
- [ ] Arcium integration (Days 3-6)

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
