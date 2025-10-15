# NinjaPay Development Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Rust 1.70+ (for Solana programs)
- Solana CLI
- Phantom Wallet

### Installation

```bash
git clone https://github.com/Blessedbiello/NinjaPay_v5.git
cd NinjaPay_v5
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
```

Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ninjapay"
SOLANA_RPC_URL="https://api.devnet.solana.com"
JWT_SECRET="your-secure-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Database Setup

```bash
cd packages/database
pnpm prisma generate
pnpm prisma db push  # Requires PostgreSQL running
```

### Start Development

```bash
# Terminal 1: API Gateway (port 3000)
cd services/api-gateway
pnpm dev

# Terminal 2: Merchant Dashboard (port 3001) 
cd apps/merchant-dashboard
pnpm dev
```

Access:
- **API**: http://localhost:3000
- **Dashboard**: http://localhost:3001

## 📡 API Testing

### 1. Register Merchant

```bash
curl -X POST http://localhost:3000/v1/auth/merchant/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Corp",
    "email": "test@example.com",
    "walletAddress": "7xJ8kL9pMnQ2rStU3vWxYz5aBcDeFgHiJkLmNoPqRsTu"
  }'
```

Save the `token` from response.

### 2. Create Payment Intent

```bash
curl -X POST http://localhost:3000/v1/payment_intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "USDC",
    "recipient": "7xJ8kL9pMnQ2rStU3vWxYz5aBcDeFgHiJkLmNoPqRsTu"
  }'
```

### 3. List Payments

```bash
curl http://localhost:3000/v1/payment_intents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎨 Dashboard Usage

1. Go to http://localhost:3001/login
2. Click "Register" tab
3. Fill in:
   - Business Name: "Test Corp"
   - Email: "test@example.com"
   - Wallet: Click "Connect" (requires Phantom wallet)
4. Click "Create Account"
5. You'll be redirected to dashboard

## 🏗️ Architecture

```
├── API Gateway (port 3000)
│   ├── POST /v1/auth/merchant/register
│   ├── POST /v1/auth/merchant/login
│   ├── POST /v1/payment_intents
│   ├── GET /v1/payment_intents/:id
│   ├── POST /v1/payments
│   └── GET /v1/products
│
├── Dashboard (port 3001)
│   ├── /login - Authentication
│   ├── /dashboard - Overview
│   ├── /dashboard/payments - Payment history
│   ├── /dashboard/products - Product catalog
│   └── /dashboard/settings - Business settings
│
└── Database (PostgreSQL)
    └── 15 models (User, Merchant, PaymentIntent, etc.)
```

## 🔧 Build Commands

```bash
# Build all
pnpm build

# Build specific service
cd services/api-gateway && pnpm build
cd apps/merchant-dashboard && pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## 🧪 Current Status

### ✅ Implemented
- JWT authentication with merchant support
- Payment intents API (create, retrieve, list, confirm, cancel)
- P2P payments API  
- Products API (CRUD)
- Customers API (CRUD)
- Dashboard UI (7 pages)
- Wallet connection (Phantom)
- Protected routes

### ⚠️ Partial
- Arcium MPC (stubbed, not real encryption)
- Solana transactions (not submitted to blockchain)
- MagicBlock payroll (SDK ready, needs deployment)

### ❌ Not Started
- Webhook delivery
- Mobile app
- AI agents
- Real blockchain integration

## 🚀 Next Steps

1. **Start PostgreSQL**
2. **Run migrations**: `cd packages/database && pnpm prisma db push`
3. **Start API Gateway**: `cd services/api-gateway && pnpm dev`
4. **Start Dashboard**: `cd apps/merchant-dashboard && pnpm dev`
5. **Test registration** at http://localhost:3001/login
6. **Create payments** via dashboard or API

## 🐛 Troubleshooting

### Database connection failed
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `pnpm prisma generate`

### Port already in use
- API Gateway: Change `API_PORT` in `.env`
- Dashboard: Change port in `package.json` dev script

### Prisma client not found
```bash
cd packages/database
pnpm prisma generate
```

### Build errors
```bash
pnpm install
pnpm build
```

## 📦 Project Structure

```
services/
  api-gateway/           # Express REST API
    src/
      routes/           # API endpoints
      services/         # Business logic
      middleware/       # Auth, error handling
      
apps/
  merchant-dashboard/    # Next.js frontend
    src/
      app/              # Pages
      components/       # React components  
      contexts/         # Auth context
      lib/              # API client
      
packages/
  database/             # Prisma schema
  solana-utils/         # Blockchain SDKs
  types/                # Shared types
  
programs/
  ninja-payroll/        # Solana Anchor program
```

## 🔐 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Optional
SOLANA_RPC_URL="https://api.devnet.solana.com"
ARCIUM_API_URL="http://localhost:8001"
MAGICBLOCK_RPC_URL="https://devnet.magicblock.app"
```

## 📚 API Documentation

Full API docs coming soon. For now, see route files:
- `services/api-gateway/src/routes/*.ts`

Endpoints use Stripe-like snake_case for consistency.

---

**Happy coding! 🥷💰**
