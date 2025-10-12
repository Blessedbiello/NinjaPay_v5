# NinjaPay 18-Day Sprint Plan
**Execution Blueprint - Day-by-Day Tasks**

*Version: 1.0 | Start Date: [Your Start Date]*
*Team Size: [1-3 people]*

---

## Sprint Overview

**Total Duration**: 18 days (432 hours for 3-person team, 144 hours per person)

**Critical Path**:
```
Days 1-2: Foundation → Days 3-6: Arcium → Days 7-12: Core Modules → Days 13-16: AI Agents → Days 17-18: Integration
```

**Daily Commitment**: 8 hours/person (flexible, but consistent)

**Success Metric**: Working production demo by Day 18, 11:59 PM

---

## Team Roles (If 3 People)

**Person A - "Backend Lead"**:
- Primary: Arcium integration, Payment Service, smart contracts
- Days 1-12 (critical path)

**Person B - "Frontend Lead"**:
- Primary: Mobile app, merchant dashboard, payroll console
- Days 7-14 (parallel to backend)

**Person C - "AI/DevOps Lead"**:
- Primary: AI agents, deployment, infrastructure
- Days 1-6 (infra setup), Days 13-18 (AI agents + integration)

**If Solo or Duo**: Combine roles, focus on core path first (Arcium → Mobile → 1 AI agent)

---

## **Days 1-2: Foundation** 🏗️

### Day 1 - Saturday (Monorepo Setup)

**Person A Tasks** (8 hours):

**Hour 1-2**: Environment Setup
```bash
# Install tooling
curl -fsSL https://get.pnpm.io/install.sh | sh
npm install -g turbo
brew install solana  # or curl for Linux
cargo install --git https://github.com/coral-xyz/anchor avm
avm install latest

# Create monorepo
mkdir ninjapay && cd ninjapay
pnpm init
pnpm add -D turbo typescript @types/node
```

**Hour 3-4**: Monorepo Structure
```bash
# Create folder structure
mkdir -p apps/{mobile,merchant-dashboard,payroll-console,landing}
mkdir -p services/{api-gateway,payment-service,arcium-service,merchant-service,payroll-service}
mkdir -p packages/{arcium-sdk,database,types,config,logger}
mkdir -p agents/{compliance-agent,analytics-agent,investigator-agent}
mkdir -p programs/ninjapay-vault
mkdir -p docs scripts infrastructure tests

# Initialize package.json files
for dir in apps/* services/* packages/*; do
  cd $dir && pnpm init && cd ../..
done
```

**Hour 5-6**: Configure Turborepo
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
  - 'agents/*'
```

**Hour 7-8**: Shared Packages Setup
```bash
# packages/types
cd packages/types
pnpm add -D typescript
npx tsc --init

# packages/config (ESLint, Prettier)
cd packages/config
pnpm add -D eslint prettier @typescript-eslint/parser

# packages/logger
cd packages/logger
pnpm add winston
```

**Deliverable**: Monorepo initialized, `pnpm build` runs successfully

---

**Person B Tasks** (8 hours):

**Hour 1-3**: Database Setup
```bash
# Sign up for services
# - Supabase (PostgreSQL)
# - MongoDB Atlas
# - Upstash (Redis)

# Create .env file
cat > .env <<EOF
DATABASE_URL="postgresql://..."
MONGODB_URI="mongodb+srv://..."
REDIS_URL="redis://..."
SOLANA_RPC_URL="https://api.devnet.solana.com"
EOF

# Initialize Prisma
cd packages/database
pnpm add prisma @prisma/client
npx prisma init
```

**Hour 4-6**: Prisma Schema (Initial)
```prisma
// packages/database/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  email         String?  @unique
  arciumKeyId   String?  // Reference to Arcium MPC key
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  transactions  Transaction[]
  rewardAccount RewardAccount?
}

model Transaction {
  id                String   @id @default(cuid())
  userId            String
  sender            String
  recipient         String
  encryptedAmount   Bytes    // ElGamal ciphertext
  amountCommitment  String   // Pedersen commitment
  proofs            Json
  signature         String?
  status            TxStatus
  createdAt         DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id])
}

enum TxStatus {
  PENDING
  PROCESSING
  CONFIRMED
  FAILED
}

model Merchant {
  id            String   @id @default(cuid())
  userId        String   @unique
  businessName  String
  apiKey        String   @unique
  webhookUrl    String?
  webhookSecret String?
  createdAt     DateTime @default(now())

  paymentLinks  PaymentLink[]
}

model PaymentLink {
  id          String   @id @default(cuid())
  merchantId  String
  url         String   @unique
  productName String
  amount      Decimal?
  active      Boolean  @default(true)

  merchant    Merchant @relation(fields: [merchantId], references: [id])
}

model RewardAccount {
  id             String @id @default(cuid())
  userId         String @unique
  pointsBalance  Int    @default(0)
  referralCode   String @unique

  user           User   @relation(fields: [userId], references: [id])
}
```

**Hour 7-8**: Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Deliverable**: Database schemas deployed, Prisma Client generated

---

**Person C Tasks** (8 hours):

**Hour 1-3**: CI/CD Setup
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
```

**Hour 4-6**: Deployment Setup
```bash
# Sign up for services
# - Vercel (frontend)
# - Railway (backend)
# - Fly.io (Rust services)

# Install CLIs
npm i -g vercel railway
```

**Hour 7-8**: Monitoring Setup
```bash
# Sentry
pnpm add @sentry/nextjs @sentry/node

# Create sentry.config.js
```

**Deliverable**: CI/CD running, deployment accounts ready

---

### Day 2 - Sunday (API Gateway + Solana)

**Person A Tasks** (8 hours):

**Hour 1-3**: API Gateway Scaffold
```typescript
// services/api-gateway/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});
app.use('/api/', limiter);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import route modules (will create)
import paymentRoutes from './routes/payments';
import merchantRoutes from './routes/merchants';

app.use('/v1/payments', paymentRoutes);
app.use('/v1/merchants', merchantRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
```

**Hour 4-6**: Authentication Middleware
```typescript
// services/api-gateway/src/middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'No API key provided' });
  }

  // Check API key in database
  const merchant = await prisma.merchant.findUnique({
    where: { apiKey: apiKey as string }
  });

  if (!merchant) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.merchant = merchant;
  next();
};
```

**Hour 7-8**: Basic Solana Integration
```typescript
// packages/solana-utils/src/client.ts

import { Connection, PublicKey, Keypair } from '@solana/web3.js';

export class SolanaClient {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getBalance(address: string): Promise<number> {
    const pubkey = new PublicKey(address);
    const balance = await this.connection.getBalance(pubkey);
    return balance / 1e9; // Convert lamports to SOL
  }

  async getTransaction(signature: string) {
    return await this.connection.getTransaction(signature);
  }
}
```

**Deliverable**: API Gateway running, can handle requests

---

**Person B Tasks** (8 hours):

**Hour 1-4**: Mobile App Scaffold
```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript

# Install dependencies
pnpm add @solana/web3.js @solana/spl-token
pnpm add @solana-mobile/mobile-wallet-adapter-protocol
pnpm add @react-navigation/native @react-navigation/stack
pnpm add zustand react-query

# Install UI
pnpm add nativewind
pnpm add --save-dev tailwindcss
```

**Hour 5-8**: Navigation Setup
```typescript
// apps/mobile/App.tsx

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from 'react-query';

import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
```

**Deliverable**: Mobile app runs, navigation works

---

**Person C Tasks** (8 hours):

**Hour 1-4**: Solana Program Setup
```bash
cd programs/ninjapay-vault
anchor init

# Install dependencies
cargo add anchor-lang anchor-spl
```

**Hour 5-8**: Basic Vault Program
```rust
// programs/ninjapay-vault/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Ninja1111111111111111111111111111111111111111");

#[program]
pub mod ninjapay_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.bump = *ctx.bumps.get("vault").unwrap();
        Ok(())
    }

    // More functions to come
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Vault {
    pub authority: Pubkey,
    pub bump: u8,
}
```

**Deliverable**: Anchor program compiles

---

**End of Day 2 Checkpoint**:
- ✅ Monorepo structure complete
- ✅ Database schemas deployed
- ✅ API Gateway running
- ✅ Mobile app scaffold ready
- ✅ Solana program initialized
- ✅ CI/CD configured

**Risk Check**: Are we on track? If behind, cut scope (remove reward system from MVP)

---

## **Days 3-6: Arcium Integration** 🔐

### Day 3 - Monday (Arcium Study & Setup)

**ALL HANDS** (Critical path - everyone learns Arcium)

**Hour 1-2**: Arcium Documentation Study
- Read: https://www.arcium.com/articles/confidential-spl-token
- Read: Official SDK docs (when available)
- Understand: MPC workflow, MXE creation, proof generation

**Hour 3-4**: Arcium SDK Setup
```bash
# Check if Arcium SDK is available
# If Rust:
cd services/arcium-service
cargo new .
cargo add arcium-sdk  # (if published)

# If TypeScript:
cd packages/arcium-sdk
pnpm add @arcium/sdk  # (if published)

# If neither, clone from GitHub
git clone https://github.com/Arcium-Network/sdk
```

**Hour 5-6**: Create Test Accounts
```bash
# Create Solana test wallets
solana-keygen new --outfile ~/.config/solana/test-user-1.json
solana-keygen new --outfile ~/.config/solana/test-user-2.json

# Get devnet SOL
solana airdrop 5 <pubkey-1> --url devnet
solana airdrop 5 <pubkey-2> --url devnet

# If Arcium has CLI, create confidential accounts
arcium create-account --wallet test-user-1.json
```

**Hour 7-8**: Run Arcium Example
```typescript
// Test script to verify Arcium works

import { ArciumClient } from '@arcium/sdk';

async function testArcium() {
  const client = new ArciumClient({
    network: 'devnet',
  });

  // Create MXE
  const mxe = await client.createMXE({
    type: 'confidential-transfer',
  });

  // Generate ElGamal keypair
  const { publicKey, keyId } = await mxe.generateElGamalKey({
    owner: 'test-user-1-pubkey',
  });

  console.log('ElGamal public key:', publicKey);
  console.log('Key ID:', keyId);

  // Encrypt amount
  const encryptedAmount = await mxe.encryptAmount({
    amount: 100,
    recipientPubkey: publicKey,
  });

  console.log('Encrypted amount:', encryptedAmount);

  // SUCCESS!
}

testArcium();
```

**Deliverable**: Arcium SDK working, can encrypt/decrypt amounts

---

### Day 4 - Tuesday (Arcium Service)

**Person A Tasks** (8 hours):

**Hour 1-4**: Build Arcium Service (Rust)
```rust
// services/arcium-service/src/lib.rs

use arcium_sdk::{ArciumClient, MXE};
use solana_sdk::pubkey::Pubkey;

pub struct ArciumService {
    client: ArciumClient,
}

impl ArciumService {
    pub fn new(network: &str) -> Self {
        let client = ArciumClient::new(network);
        Self { client }
    }

    pub async fn create_confidential_account(
        &self,
        owner: Pubkey,
        mint: Pubkey,
    ) -> Result<(Pubkey, String), Error> {
        // Create MXE
        let mxe = self.client.create_mxe("confidential-account-setup").await?;

        // Generate ElGamal keypair via MPC
        let (elgamal_pubkey, key_id) = mxe.generate_elgamal_key(owner).await?;

        // Create on-chain confidential token account
        let token_account = self.create_token_account_with_extension(
            mint,
            owner,
            elgamal_pubkey,
        ).await?;

        Ok((token_account, key_id))
    }

    pub async fn encrypt_amount(
        &self,
        amount: u64,
        recipient_pubkey: &str,
        sender_key_id: &str,
    ) -> Result<Vec<u8>, Error> {
        let mxe = self.client.create_mxe("confidential-transfer").await?;

        let ciphertext = mxe.encrypt_amount(
            amount,
            recipient_pubkey,
            sender_key_id,
        ).await?;

        Ok(ciphertext)
    }

    pub async fn generate_transfer_proofs(
        &self,
        encrypted_amount: &[u8],
        sender_balance: &[u8],
    ) -> Result<TransferProofs, Error> {
        let mxe = self.client.create_mxe("proof-generation").await?;

        let proofs = mxe.generate_transfer_proofs(
            encrypted_amount,
            sender_balance,
        ).await?;

        Ok(proofs)
    }

    pub async fn decrypt_amount(
        &self,
        ciphertext: &[u8],
        key_id: &str,
    ) -> Result<u64, Error> {
        let mxe = self.client.create_mxe("decryption").await?;

        let amount = mxe.decrypt(ciphertext, key_id).await?;

        Ok(amount)
    }
}

pub struct TransferProofs {
    pub range_proof: Vec<u8>,
    pub validity_proof: Vec<u8>,
    pub equality_proof: Vec<u8>,
}
```

**Hour 5-8**: Test Arcium Service
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_encrypt_decrypt() {
        let service = ArciumService::new("devnet");

        // Create account
        let (account, key_id) = service
            .create_confidential_account(user_pubkey, mint_pubkey)
            .await
            .unwrap();

        // Encrypt
        let ciphertext = service
            .encrypt_amount(100, &recipient_pubkey, &key_id)
            .await
            .unwrap();

        // Decrypt
        let amount = service
            .decrypt_amount(&ciphertext, &key_id)
            .await
            .unwrap();

        assert_eq!(amount, 100);
    }
}
```

**Deliverable**: Arcium Service can encrypt/decrypt amounts

---

**Person B & C**: Continue mobile app UI (Day 7-8 tasks start early)

---

### Day 5 - Wednesday (Payment Service)

**Person A Tasks** (8 hours):

**Hour 1-4**: Payment Service Core
```rust
// services/payment-service/src/lib.rs

use arcium_service::ArciumService;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    transaction::Transaction,
    pubkey::Pubkey,
    signature::Signer,
};

pub struct PaymentService {
    arcium: ArciumService,
    solana: RpcClient,
}

impl PaymentService {
    pub async fn create_confidential_transfer(
        &self,
        from: Pubkey,
        to: Pubkey,
        amount: u64,
        sender_key_id: String,
    ) -> Result<String, Error> {
        // 1. Get recipient's ElGamal pubkey
        let recipient_elgamal = self.get_elgamal_pubkey(to).await?;

        // 2. Encrypt amount using Arcium
        let encrypted_amount = self.arcium.encrypt_amount(
            amount,
            &recipient_elgamal,
            &sender_key_id,
        ).await?;

        // 3. Get sender's encrypted balance
        let sender_balance = self.get_encrypted_balance(from).await?;

        // 4. Generate ZK proofs
        let proofs = self.arcium.generate_transfer_proofs(
            &encrypted_amount,
            &sender_balance,
        ).await?;

        // 5. Build Solana transaction
        let tx = self.build_confidential_transfer_tx(
            from,
            to,
            encrypted_amount,
            proofs,
        ).await?;

        // 6. Submit to Solana
        let signature = self.solana.send_and_confirm_transaction(&tx)?;

        Ok(signature.to_string())
    }

    async fn build_confidential_transfer_tx(
        &self,
        from: Pubkey,
        to: Pubkey,
        encrypted_amount: Vec<u8>,
        proofs: TransferProofs,
    ) -> Result<Transaction, Error> {
        // Build transaction with confidential transfer instruction
        // (Arcium SDK should provide this)
        todo!("Implement transaction building")
    }
}
```

**Hour 5-8**: Integration Testing
```bash
# Test end-to-end confidential transfer on devnet

cargo test --package payment-service -- --nocapture
```

**Deliverable**: Can send confidential transfer on Solana devnet

---

### Day 6 - Thursday (API Integration)

**Person A Tasks** (8 hours):

**Hour 1-4**: Expose Payment API
```typescript
// services/api-gateway/src/routes/payments.ts

import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { PaymentService } from '@ninjapay/payment-service'; // Rust binding

const router = express.Router();
const paymentService = new PaymentService();

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { amount, recipient } = req.body;
    const senderKeyId = req.user.arciumKeyId;

    const signature = await paymentService.createConfidentialTransfer(
      req.user.walletAddress,
      recipient,
      amount,
      senderKeyId
    );

    res.json({
      id: generatePaymentId(),
      status: 'processing',
      signature,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateJWT, async (req, res) => {
  // Get payment status
});

export default router;
```

**Hour 5-8**: E2E Test
```bash
# Start API gateway
cd services/api-gateway
pnpm dev

# Test with curl
curl -X POST http://localhost:3001/v1/payments \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "recipient": "7xJ8...abc"}'

# Should return signature
```

**Deliverable**: API endpoint `/v1/payments` working, creates confidential transfers

---

**🎉 MILESTONE: Arcium Integration Complete!**
- ✅ Confidential transfers working on devnet
- ✅ API can create confidential payments
- ✅ Ready to build frontend

---

## **Days 7-8: Mobile App Core** 📱

### Day 7 - Friday (Wallet Connection + UI)

**Person B Tasks** (8 hours):

**Hour 1-3**: Wallet Connection
```typescript
// apps/mobile/src/hooks/useWallet.ts

import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { useState } from 'react';

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = async () => {
    try {
      const result = await transact(async (wallet) => {
        const authorization = await wallet.authorize({
          cluster: 'devnet',
          identity: { name: 'NinjaPay' },
        });

        return {
          publicKey: authorization.accounts[0].address,
          authToken: authorization.auth_token,
        };
      });

      setPublicKey(result.publicKey);
      setConnected(true);

      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setConnected(false);
  };

  return { connected, publicKey, connect, disconnect };
}
```

**Hour 4-6**: Home Screen UI
```typescript
// apps/mobile/src/screens/HomeScreen.tsx

import { View, Text, TouchableOpacity } from 'react-native';
import { useWallet } from '../hooks/useWallet';
import { useBalance } from '../hooks/useBalance';

export default function HomeScreen({ navigation }) {
  const { connected, publicKey, connect } = useWallet();
  const { balance, isLoading } = useBalance(publicKey);

  if (!connected) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold mb-4">Welcome to NinjaPay</Text>
        <TouchableOpacity
          onPress={connect}
          className="bg-purple-600 px-8 py-4 rounded-lg"
        >
          <Text className="text-white font-bold">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      {/* Balance Card */}
      <View className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl mb-6">
        <Text className="text-white text-sm">Private Balance</Text>
        <Text className="text-white text-4xl font-bold mt-2">
          {isLoading ? '•••••' : `$${balance} USDC`}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-around mb-6">
        <TouchableOpacity
          onPress={() => navigation.navigate('Send')}
          className="bg-white p-4 rounded-lg shadow items-center flex-1 mr-2"
        >
          <Text className="text-2xl mb-2">📤</Text>
          <Text className="font-semibold">Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Receive')}
          className="bg-white p-4 rounded-lg shadow items-center flex-1 ml-2"
        >
          <Text className="text-2xl mb-2">📥</Text>
          <Text className="font-semibold">Receive</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text className="text-lg font-bold mb-4">Recent Transactions</Text>
      {/* Transaction list component */}
    </View>
  );
}
```

**Hour 7-8**: Send Screen Scaffold
```typescript
// apps/mobile/src/screens/SendScreen.tsx

export default function SendScreen() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <View className="flex-1 p-6">
      <Text className="text-xl font-bold mb-4">Send Payment</Text>

      <Text className="mb-2">To</Text>
      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        placeholder="Wallet address or scan QR"
        className="border p-4 rounded-lg mb-4"
      />

      <Text className="mb-2">Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="numeric"
        className="border p-4 rounded-lg mb-6"
      />

      <TouchableOpacity className="bg-purple-600 p-4 rounded-lg">
        <Text className="text-white text-center font-bold">
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Deliverable**: Mobile app with wallet connection and UI

---

### Day 8 - Saturday (Confidential Transfers in Mobile)

**Person B Tasks** (8 hours):

**Hour 1-4**: Integrate Payment API
```typescript
// apps/mobile/src/hooks/useConfidentialTransfer.ts

import { useMutation } from 'react-query';
import { useWallet } from './useWallet';
import api from '../services/api';

export function useConfidentialTransfer() {
  const { publicKey } = useWallet();

  const mutation = useMutation(async ({ to, amount }: { to: string, amount: number }) => {
    const response = await api.post('/v1/payments', {
      recipient: to,
      amount,
    });

    return response.data;
  });

  return {
    sendConfidential: mutation.mutate,
    isLoading: mutation.isLoading,
    error: mutation.error,
    data: mutation.data,
  };
}
```

**Hour 5-8**: Complete Send Flow
```typescript
// Updated SendScreen with actual transfer

export default function SendScreen({ navigation }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const { sendConfidential, isLoading } = useConfidentialTransfer();

  const handleSend = async () => {
    try {
      const result = await sendConfidential({
        to: recipient,
        amount: parseFloat(amount),
      });

      navigation.navigate('Success', {
        signature: result.signature,
        amount: amount,
        recipient: recipient,
      });
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    }
  };

  return (
    // ... UI with handleSend on button press
  );
}
```

**Deliverable**: Mobile app can send confidential payments!

---

**🎉 MILESTONE: Mobile App Working!**
- ✅ Wallet connection
- ✅ Send confidential USDC
- ✅ Receive (QR code display)

---

## **Days 9-10: Merchant Module** 💳

### Day 9 - Sunday (Merchant Service)

**Person A Tasks** (8 hours):

**Hour 1-4**: Merchant Service
```typescript
// services/merchant-service/src/index.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const app = express();
const prisma = new PrismaClient();

// Create merchant
app.post('/merchants', async (req, res) => {
  const { walletAddress, businessName, email } = req.body;

  const apiKey = `nj_live_${crypto.randomBytes(32).toString('hex')}`;
  const webhookSecret = crypto.randomBytes(32).toString('hex');

  const merchant = await prisma.merchant.create({
    data: {
      userId: req.user.id,
      businessName,
      apiKey,
      webhookSecret,
    },
  });

  res.json({ merchant, apiKey }); // Return API key once
});

// Create payment link
app.post('/merchants/payment-links', async (req, res) => {
  const { productName, amount, description } = req.body;

  const linkId = crypto.randomBytes(16).toString('hex');
  const url = `https://ninjapay.xyz/pay/${linkId}`;

  const paymentLink = await prisma.paymentLink.create({
    data: {
      merchantId: req.merchant.id,
      url,
      productName,
      amount,
      description,
    },
  });

  res.json({ paymentLink });
});

// List transactions (encrypted amounts)
app.get('/merchants/transactions', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { /* merchant's transactions */ },
    select: {
      id: true,
      recipient: true,
      amountCommitment: true, // Public commitment
      // encryptedAmount: NOT returned
      status: true,
      createdAt: true,
    },
  });

  res.json({ transactions });
});
```

**Hour 5-8**: Database Schema Updates
```prisma
// Add to schema.prisma

model PaymentLink {
  id          String   @id @default(cuid())
  merchantId  String
  url         String   @unique
  productName String
  description String?
  amount      Decimal?
  currency    String   @default("USDC")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  merchant    Merchant     @relation(fields: [merchantId], references: [id])
  payments    Transaction[]

  @@index([merchantId])
}
```

**Deliverable**: Merchant can create payment links via API

---

### Day 10 - Monday (Merchant Dashboard)

**Person B Tasks** (8 hours):

**Hour 1-4**: Merchant Dashboard App
```bash
cd apps/merchant-dashboard
npx create-next-app@latest . --typescript --tailwind --app

pnpm add @tanstack/react-query recharts
```

**Hour 5-8**: Dashboard UI
```typescript
// apps/merchant-dashboard/app/dashboard/page.tsx

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/merchants/stats').then(r => r.json()),
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue || 0}`}
          trend="+12%"
        />
        <StatsCard
          title="Transactions"
          value={stats?.transactionCount || 0}
          trend="+8%"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
        />
      </div>

      {/* Payment Links */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Payment Links</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded">
          Create New Link
        </button>
      </div>
    </div>
  );
}
```

**Deliverable**: Merchant dashboard live on Vercel

---

**Person C Tasks** (Days 9-10): Start AI Orchestrator setup

---

**🎉 MILESTONE: Merchant Platform Working!**
- ✅ Merchants can sign up
- ✅ Create payment links
- ✅ View transactions (encrypted)

---

## **Days 11-12: Payroll Module** 💼

### Day 11 - Tuesday (Payroll Service)

**Person A Tasks** (8 hours):

**Hour 1-4**: Payroll Service
```typescript
// services/payroll-service/src/index.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const app = express();
const prisma = new PrismaClient();

// Upload CSV
app.post('/payroll/upload', async (req, res) => {
  const csvContent = req.body.csv;

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Validate
  const employees = records.map((row: any) => ({
    walletAddress: row.wallet_address,
    amount: parseFloat(row.amount),
    name: row.name || null,
  }));

  const totalAmount = employees.reduce((sum, emp) => sum + emp.amount, 0);

  res.json({
    employees,
    totalAmount,
    count: employees.length,
  });
});

// Execute payroll
app.post('/payroll/execute', async (req, res) => {
  const { employees } = req.body;

  // Create PayrollRun
  const run = await prisma.payrollRun.create({
    data: {
      companyId: req.user.companyId,
      status: 'PROCESSING',
      totalAmount: calculateTotal(employees),
      employeeCount: employees.length,
    },
  });

  // Execute batch confidential transfers
  const signatures = await executeBatchPayments(employees);

  // Update run
  await prisma.payrollRun.update({
    where: { id: run.id },
    data: {
      status: 'COMPLETED',
      batchSignature: signatures[0], // or all signatures
    },
  });

  res.json({ run, signatures });
});
```

**Hour 5-8**: Batch Payment Implementation
```rust
// In payment-service, add batch function

impl PaymentService {
    pub async fn execute_batch_confidential_transfers(
        &self,
        transfers: Vec<Transfer>,
        sender_key_id: String,
    ) -> Result<Vec<String>, Error> {
        // Create single MXE for batch (more efficient)
        let mxe = self.arcium.create_mxe("batch-transfer").await?;

        // Encrypt all amounts in parallel
        let mut encrypted_transfers = vec![];
        for transfer in transfers {
            let encrypted = self.arcium.encrypt_amount(
                transfer.amount,
                &transfer.recipient_elgamal,
                &sender_key_id,
            ).await?;

            encrypted_transfers.push((transfer.recipient, encrypted));
        }

        // Generate batched proof (cheaper than individual)
        let batch_proof = mxe.generate_batch_proof(&encrypted_transfers).await?;

        // Submit all transactions
        let signatures = self.submit_batch_transactions(
            encrypted_transfers,
            batch_proof,
        ).await?;

        Ok(signatures)
    }
}
```

**Deliverable**: Payroll service can execute batch payments

---

### Day 12 - Wednesday (Payroll Console)

**Person B Tasks** (8 hours):

**Hour 1-8**: Payroll Console UI
```typescript
// apps/payroll-console/app/payroll/new/page.tsx

export default function NewPayrollPage() {
  const [csv, setCsv] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const { mutate: executePayroll, isLoading } = useMutation(/* ... */);

  const handleUpload = async (file: File) => {
    const text = await file.text();

    const response = await fetch('/api/payroll/upload', {
      method: 'POST',
      body: JSON.stringify({ csv: text }),
    });

    const data = await response.json();
    setPreview(data);
  };

  const handleExecute = () => {
    executePayroll(preview.employees);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">New Payroll Run</h1>

      {!preview ? (
        <FileUpload onUpload={handleUpload} />
      ) : (
        <>
          <PayrollPreview
            employees={preview.employees}
            totalAmount={preview.totalAmount}
          />

          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="bg-purple-600 text-white px-8 py-4 rounded-lg"
          >
            {isLoading ? 'Executing...' : `Execute Payroll ($${preview.totalAmount})`}
          </button>
        </>
      )}
    </div>
  );
}
```

**Deliverable**: Payroll console deployed, can run payroll

---

**🎉 MILESTONE: All 3 Core Products Working!**
- ✅ Consumer mobile app
- ✅ Merchant platform
- ✅ Payroll system

**DAY 12 CHECKPOINT**: This is your SAFETY BUFFER. If you reach here with all 3 products working, you're on track. AI agents are BONUS.

---

## **Days 13-16: AI Agents** 🤖

### Day 13 - Thursday (AI Infrastructure)

**Person C Tasks** (8 hours):

**Hour 1-4**: AI Orchestrator (FastAPI)
```python
# services/ai-orchestrator/main.py

from fastapi import FastAPI
from celery import Celery

app = FastAPI()
celery_app = Celery('ninjapay', broker='redis://localhost:6379')

@app.post("/agents/compliance/kyc")
async def run_kyc_check(user_id: str):
    # Queue task for Compliance Agent
    task = celery_app.send_task('agents.compliance.kyc_check', args=[user_id])
    return {"task_id": task.id}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    return {
        "status": result.status,
        "result": result.result if result.ready() else None
    }
```

**Hour 5-8**: Base Agent Class
```python
# agents/base/agent.py

from abc import ABC, abstractmethod
from langchain import OpenAI  # or your LLM
from typing import Dict, Any

class BaseAgent(ABC):
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    @abstractmethod
    async def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass
```

**Deliverable**: AI orchestrator running, can queue tasks

---

### Day 14 - Friday (Compliance Agent)

**Person C Tasks** (8 hours):

**Hour 1-8**: Compliance Agent Implementation
```python
# agents/compliance-agent/agent.py

from agents.base.agent import BaseAgent
from celery import Celery

celery_app = Celery('compliance', broker='redis://localhost:6379')

class ComplianceAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a compliance officer for NinjaPay.
        Analyze user data and transactions for:
        1. KYC verification
        2. AML screening
        3. Fraud detection

        Output: {"risk_level": "low|medium|high", "reason": "...", "action": "approve|review|reject"}
        """

    async def process(self, task: Dict) -> Dict:
        task_type = task['type']

        if task_type == 'kyc_check':
            return await self._kyc_verification(task['user_id'])
        elif task_type == 'transaction_screen':
            return await self._aml_screening(task['transaction_id'])

    async def _kyc_verification(self, user_id: str):
        # Fetch user data
        user = await db.get_user(user_id)

        # Analyze with LLM
        prompt = f"""
        User Data:
        - Wallet: {user.wallet_address}
        - Email: {user.email}
        - Registration Date: {user.created_at}
        - Transaction Count: {user.transaction_count}
        - Total Volume: {user.total_volume}

        Assess KYC risk level.
        """

        response = self.llm.predict(prompt, system=self.get_system_prompt())
        analysis = json.loads(response)

        # Store result
        await db.update_user_kyc(user_id, analysis['risk_level'])

        return analysis

@celery_app.task(name='agents.compliance.kyc_check')
def kyc_check(user_id: str):
    agent = ComplianceAgent('compliance-1')
    return asyncio.run(agent.process({
        'type': 'kyc_check',
        'user_id': user_id
    }))
```

**Deliverable**: Compliance agent working, can analyze users

---

### Day 15 - Saturday (Analytics + Investigator Agents)

**Person C Tasks** (8 hours):

**Hour 1-4**: Analytics Agent
```python
# agents/analytics-agent/agent.py

class AnalyticsAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a data analyst for NinjaPay.
        Analyze user behavior to:
        1. Predict churn risk
        2. Identify growth opportunities
        3. Detect anomalies

        Output actionable insights.
        """

    async def _predict_churn(self, user_id: str):
        # Fetch user activity
        activity = await db.get_user_activity(user_id, days=30)

        # Extract features
        features = {
            'last_transaction_days_ago': (now() - activity.last_tx).days,
            'transaction_count': activity.tx_count,
            'avg_amount': activity.avg_amount,
        }

        # Predict with LLM
        prompt = f"User features: {features}. Predict churn risk (0-1)."
        response = self.llm.predict(prompt)

        churn_risk = float(response.strip())

        if churn_risk > 0.7:
            # Trigger retention campaign
            await trigger_retention_email(user_id)

        return {"churn_risk": churn_risk}
```

**Hour 5-8**: Investigator Agent
```python
# agents/investigator-agent/agent.py

class InvestigatorAgent(BaseAgent):
    def get_system_prompt(self) -> str:
        return """
        You are a blockchain investigator.
        Trace stolen funds and detect money laundering.
        """

    async def _trace_stolen_funds(self, wallet: str):
        # Fetch on-chain transactions
        txs = await solana_client.get_transactions(wallet, limit=1000)

        # Build graph
        graph = self._build_tx_graph(txs)

        # Analyze with LLM
        prompt = f"Transaction graph: {graph}. Identify suspicious patterns."
        response = self.llm.predict(prompt)

        return json.loads(response)
```

**Deliverable**: 3 AI agents operational

---

### Day 16 - Sunday (Recurring Payments Agent + Integration)

**Person C Tasks** (8 hours):

**Hour 1-4**: Recurring Payments Agent
```python
# agents/recurring-agent/agent.py

class RecurringAgent(BaseAgent):
    async def process_recurring_payment(self, schedule: Dict):
        # Check if payment due
        if not self._is_payment_due(schedule):
            return

        # Check balance
        balance = await get_balance(schedule['payer_wallet'])

        if balance < schedule['amount']:
            await notify_user("Insufficient balance")
            await self._smart_reschedule(schedule)  # Try in 3 days
            return

        # Execute payment
        result = await payment_service.create_confidential_transfer(
            from_wallet=schedule['payer_wallet'],
            to_wallet=schedule['recipient_wallet'],
            amount=schedule['amount'],
            key_id=schedule['key_id']
        )

        if result['success']:
            await update_schedule(schedule['id'], last_run=now())
        else:
            await handle_failure(schedule, result['error'])
```

**Hour 5-8**: Integrate Agents with Main System
```typescript
// In api-gateway, trigger agents on events

// When new user signs up
await fetch('http://ai-orchestrator:8000/agents/compliance/kyc', {
  method: 'POST',
  body: JSON.stringify({ user_id: newUser.id }),
});

// When transaction completes
await fetch('http://ai-orchestrator:8000/agents/analytics/log-activity', {
  method: 'POST',
  body: JSON.stringify({ user_id, transaction_id }),
});
```

**Deliverable**: 4 AI agents running, integrated with system

---

**🎉 MILESTONE: AI Agents Complete!**
- ✅ Compliance agent (KYC/AML)
- ✅ Analytics agent (churn prediction)
- ✅ Investigator agent (fraud detection)
- ✅ Recurring payments agent

---

## **Days 17-18: Integration & Launch** 🚀

### Day 17 - Monday (Integration Testing)

**ALL HANDS** (8 hours):

**Hour 1-2**: End-to-End Flow Testing

**Test 1 - Consumer Flow**:
```
1. Alice downloads mobile app
2. Connects Phantom wallet
3. Deposits 1000 USDC to confidential balance
4. Sends 50 USDC to Bob (confidential)
5. Compliance agent screens transaction (auto-approves)
6. Transaction confirms in ~2 seconds
7. Bob receives push notification
8. Both Alice and Bob see transaction in history
9. Amounts encrypted on Solscan ✓
```

**Test 2 - Merchant Flow**:
```
1. Merchant signs up
2. Creates payment link for "Online Course - $99"
3. Customer visits link
4. Pays with Phantom wallet
5. Confidential transfer executes
6. Webhook fires to merchant backend
7. Merchant dashboard updates
8. Analytics agent logs sale
9. Merchant can decrypt aggregate revenue
```

**Test 3 - Payroll Flow**:
```
1. Company logs into payroll console
2. Uploads CSV with 10 employees
3. Reviews preview (total $50,000)
4. Executes payroll
5. Compliance agent approves batch
6. Recurring agent schedules next month
7. All 10 transactions confirm
8. Employees receive push notifications
9. Reporting agent generates summary email
```

**Hour 3-8**: Bug Fixes
- Fix any issues found in testing
- Edge cases (network failures, insufficient balance, etc.)
- Error messages
- Loading states

**Deliverable**: All 3 products work end-to-end, no critical bugs

---

### Day 18 - Tuesday (Polish & Deploy)

**Person A Tasks** (8 hours):

**Hour 1-4**: Deploy Backend Services
```bash
# Deploy to Railway
railway login
railway up

# Deploy Rust services to Fly.io
fly deploy --config fly.payment-service.toml
fly deploy --config fly.arcium-service.toml

# Deploy AI services to Modal
modal deploy ai-orchestrator
```

**Hour 5-8**: Monitoring Setup
```typescript
// Add Sentry to all services
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
});
```

---

**Person B Tasks** (8 hours):

**Hour 1-4**: Deploy Frontend
```bash
# Mobile app
cd apps/mobile
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android

# Web apps
cd apps/merchant-dashboard
vercel --prod

cd apps/payroll-console
vercel --prod

cd apps/landing
vercel --prod
```

**Hour 5-8**: UI Polish
- Add loading animations (Lottie)
- Add success/error toasts
- Add haptic feedback (mobile)
- Test on real devices

---

**Person C Tasks** (8 hours):

**Hour 1-4**: Documentation
```markdown
# README.md

# NinjaPay - Confidential Payments on Solana

## Demo
- Live site: https://ninjapay.xyz
- Mobile app: [TestFlight link]
- API docs: https://docs.ninjapay.xyz

## Features
1. Consumer P2P payments (Venmo UX)
2. Merchant payment links (Stripe tools)
3. Payroll system (batch payments)
4. AI agents (compliance, analytics, investigator)

## Tech Stack
- Arcium Confidential SPL (privacy)
- Solana (blockchain)
- React Native (mobile)
- Next.js (web)
- FastAPI (AI agents)

## Demo Video
[Link to 3-min pitch video]
```

**Hour 5-8**: Demo Prep
- Record backup demo video (in case live fails)
- Test demo flow 10x times
- Prepare talking points

**Deliverable**: Production deployment complete, demo ready

---

## **LAUNCH DAY** ��

**Final Checklist**:
- [ ] All services deployed and healthy
- [ ] Mobile app on TestFlight/Play Store
- [ ] Web apps accessible at ninjapay.xyz
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Demo video recorded (backup)
- [ ] Live demo tested 10x
- [ ] Documentation complete
- [ ] GitHub repo public and clean
- [ ] Pitch deck finalized
- [ ] Social media posts scheduled

**Demo Script** (6 minutes):
1. **Consumer** (2 min): Alice sends $50 to Bob, show encrypted on Solscan
2. **Merchant** (2 min): Create payment link, customer pays, show dashboard
3. **Payroll** (2 min): Upload CSV, execute, show encrypted salaries

**Backup Plan**: If live demo fails, play pre-recorded video

---

## Contingency Plans

### If Behind Schedule (Day 12 Review)

**Priority 1 (Must Have)**:
- ✅ Mobile app (send/receive)
- ✅ Arcium confidential transfers
- ✅ Basic merchant dashboard

**Priority 2 (Should Have)**:
- ⚠️ Payroll (simplify: manual entry instead of CSV)
- ⚠️ 1-2 AI agents (just compliance agent)

**Priority 3 (Nice to Have)**:
- ❌ MagicBlock (cut)
- ❌ Advanced AI agents (cut)
- ❌ Reward system (cut)

**Minimum Viable Demo**:
- One perfect consumer flow (Alice → Bob)
- One merchant flow (payment link)
- Proof that Arcium works (encrypted on Solscan)

---

### If Major Blocker (Arcium, Technical Issue)

**Day 3**: Arcium not working
→ Pivot to Token-2022 immediately
→ Update pitch: "Building on Token-2022, Arcium-ready architecture"

**Day 10**: Mobile app unstable
→ Build web app instead (faster)
→ Use desktop browser + Phantom extension

**Day 16**: AI agents not working
→ Ship without AI agents
→ Show mock UI: "Compliance Agent: Analyzing..." (fake it)

---

## Daily Standup Template

**Every morning, 15 minutes**:

1. **What did I ship yesterday?**
2. **What will I ship today?**
3. **Am I blocked?**
4. **Are we on track?** (Yes/No/At Risk)

If "At Risk" → Escalate, cut scope immediately

---

## Success Metrics

### Day 6 Checkpoint:
- ✅ Arcium confidential transfer working on devnet

### Day 12 Checkpoint:
- ✅ All 3 products functional (even if rough)
- ✅ Can demo end-to-end flows

### Day 18 Goal:
- ✅ Production deployment live
- ✅ Demo runs perfectly
- ✅ Documentation complete
- ✅ Ready to submit

---

## Final Thoughts

**18 days is aggressive but doable** with:
1. **Focused team** (2-3 people, full-time)
2. **Parallel development** (don't wait for backend to start frontend)
3. **Daily shipping** (something working at end of each day)
4. **Ruthless cutting** (remove features if behind)

**Your biggest advantage**: This sprint plan. Most teams improvise. You have a blueprint.

**My advice**: **Start today**. Don't wait for the perfect moment. Day 1 is monorepo setup—you can do that in 2 hours.

---

**Good luck. Ship it. 🚀**

---

**Document Version**: 1.0
**Last Updated**: October 5, 2025
**Owner**: Founding Team
**Next Review**: Daily standups
