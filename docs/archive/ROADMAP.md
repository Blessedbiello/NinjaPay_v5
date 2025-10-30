# NinjaPay Implementation Roadmap
**6-Week Hackathon Execution Plan**

*Detailed Week-by-Week Implementation Strategy*
*Version: 1.0 | Date: October 2025*

---

## Executive Summary

**Timeline**: 6 weeks (42 days)
**Team Size**: 2-3 developers (recommended)
**Goal**: Ship production-quality hackathon demo + working testnet deployment
**Strategy**: Build iteratively, ship weekly, prioritize ruthlessly

**Week-by-Week Milestones**:
- **Week 1**: Foundation (monorepo, wallets, basic Solana integration)
- **Week 2**: Arcium Integration (confidential transfers working)
- **Week 3**: Consumer Mobile App (Venmo-like UX)
- **Week 4**: Merchant Platform (payment links, dashboard)
- **Week 5**: Payroll + APIs (batch payments, developer tools)
- **Week 6**: Polish + Videos (demo perfection, pitch creation)

---

## Table of Contents

1. [Week 0: Pre-Work & Setup](#week-0-pre-work--setup)
2. [Week 1: Foundation](#week-1-foundation)
3. [Week 2: Arcium Integration](#week-2-arcium-integration)
4. [Week 3: Consumer Mobile App](#week-3-consumer-mobile-app)
5. [Week 4: Merchant Platform](#week-4-merchant-platform)
6. [Week 5: Payroll & APIs](#week-5-payroll--apis)
7. [Week 6: Polish & Submission](#week-6-polish--submission)
8. [Daily Schedule Template](#daily-schedule-template)
9. [Risk Contingencies](#risk-contingencies)

---

## Week 0: Pre-Work & Setup
**Duration**: 3-5 days before official start
**Goal**: Remove blockers, set up tooling, secure partnerships

### Tasks

#### Administrative
- [ ] **Apply for Arcium Early Access**
  - Visit Arcium website, fill out developer application
  - Explain NinjaPay use case in application
  - Request early API access for hackathon
  - Expected wait: 1-2 weeks (do this ASAP!)

- [ ] **Join Community Channels**
  - Arcium Discord/Telegram (get integration support)
  - MagicBlock Discord (ephemeral rollup help)
  - Solana Dev Discord (general Solana questions)
  - Colosseum hackathon Discord (official announcements)

- [ ] **Register Accounts**
  - GitHub organization: `ninjapay-labs`
  - Vercel account (frontend deployment)
  - Railway/Render account (backend deployment)
  - Domain: `ninjapay.xyz` (Namecheap ~$12/year)
  - MongoDB Atlas (free tier)
  - Supabase (PostgreSQL free tier)
  - Upstash (Redis free tier)

#### Development Environment Setup

- [ ] **Install Tooling**
  ```bash
  # Solana CLI
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

  # Anchor (Solana smart contract framework)
  cargo install --git https://github.com/coral-xyz/anchor avm --locked
  avm install latest
  avm use latest

  # Node.js 20+ (via nvm)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 20
  nvm use 20

  # Rust (for proof service)
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  # React Native CLI
  npm install -g react-native-cli

  # Expo CLI (easier for mobile dev)
  npm install -g eas-cli

  # Solana wallet (for testing)
  npm install -g @solana/wallet-adapter-wallets
  ```

- [ ] **Create Solana Wallets**
  ```bash
  # Developer wallet (deployment, funding)
  solana-keygen new --outfile ~/.config/solana/dev-wallet.json

  # Store pubkey
  export DEV_WALLET=$(solana-keygen pubkey ~/.config/solana/dev-wallet.json)

  # Get devnet SOL
  solana airdrop 5 $DEV_WALLET --url devnet
  ```

- [ ] **Setup Project Repository**
  ```bash
  mkdir ninjapay
  cd ninjapay
  git init

  # Create monorepo structure
  mkdir -p apps/{mobile,merchant-dashboard,payroll-console,backend}
  mkdir -p packages/{arcium-sdk,magicblock-sdk,shared}
  mkdir -p programs/{ninjapay-vault}

  # Initialize package.json
  npm init -y

  # Install Turborepo (monorepo management)
  npm install turbo --save-dev

  # Create .gitignore
  cat > .gitignore <<EOF
  node_modules/
  .env
  .env.local
  dist/
  build/
  target/
  *.log
  .DS_Store
  EOF
  ```

#### Research & Planning

- [ ] **Read Documentation**
  - [ ] Arcium Confidential SPL docs
  - [ ] MagicBlock ephemeral rollup docs
  - [ ] Solana Token-2022 confidential transfer guide
  - [ ] React Native Solana Mobile docs

- [ ] **Study Code Examples**
  - [ ] Arcium example projects (if available)
  - [ ] MagicBlock demo apps
  - [ ] Solana Mobile example app
  - [ ] Existing privacy projects (WAYS, Vanish)

- [ ] **Connect with Mentors** (if hackathon provides)
  - Schedule office hours with Arcium team
  - Schedule office hours with MagicBlock team
  - Introduce yourself, explain project

### Deliverables

- ✅ Arcium early access application submitted
- ✅ All accounts registered
- ✅ Development environment ready
- ✅ Monorepo initialized
- ✅ Team has read key documentation

---

## Week 1: Foundation
**Duration**: Days 1-7
**Goal**: Monorepo working, basic Solana integration, wallet connection

**Key Milestone**: By end of week, you can send a regular (non-confidential) USDC transfer from mobile app

### Day 1-2: Monorepo & Infrastructure

#### Tasks

- [ ] **Setup Turborepo Configuration**
  ```json
  // turbo.json
  {
    "pipeline": {
      "build": {
        "dependsOn": ["^build"],
        "outputs": ["dist/**", ".next/**"]
      },
      "dev": {
        "cache": false
      },
      "test": {
        "dependsOn": ["^build"]
      }
    }
  }
  ```

- [ ] **Initialize Packages**
  ```bash
  # Shared utilities
  cd packages/shared
  npm init -y
  npm install @solana/web3.js @solana/spl-token

  # Arcium SDK wrapper (will implement in Week 2)
  cd ../arcium-sdk
  npm init -y
  # (placeholder for now)

  # MagicBlock SDK wrapper
  cd ../magicblock-sdk
  npm init -y
  # (placeholder for now)
  ```

- [ ] **Initialize Backend**
  ```bash
  cd apps/backend
  npm init -y
  npm install express cors dotenv
  npm install -D typescript @types/node @types/express
  npx tsc --init

  # Create basic Express server
  mkdir src
  touch src/index.ts
  ```

- [ ] **Setup Database**
  ```bash
  # PostgreSQL (Supabase)
  # - Create project on Supabase
  # - Note connection string
  # - Create initial schema (users, merchants, payment_intents)

  # MongoDB (Atlas)
  # - Create cluster
  # - Note connection string

  # Redis (Upstash)
  # - Create database
  # - Note connection string

  # Add to .env
  cat > apps/backend/.env <<EOF
  DATABASE_URL=postgresql://...
  MONGODB_URI=mongodb+srv://...
  REDIS_URL=redis://...
  SOLANA_RPC_URL=https://api.devnet.solana.com
  EOF
  ```

### Day 3-4: Mobile App Foundation

- [ ] **Initialize React Native App with Expo**
  ```bash
  cd apps/mobile
  npx create-expo-app@latest . --template blank-typescript

  # Install Solana dependencies
  npm install @solana/web3.js @solana/spl-token
  npm install @solana-mobile/mobile-wallet-adapter-protocol
  npm install react-native-get-random-values @react-native-async-storage/async-storage

  # Install UI libraries
  npm install @react-navigation/native @react-navigation/stack
  npm install react-native-screens react-native-safe-area-context
  ```

- [ ] **Setup Navigation**
  ```typescript
  // App.tsx
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';

  const Stack = createStackNavigator();

  function App() {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  ```

- [ ] **Implement Wallet Connection**
  ```typescript
  // src/hooks/useWalletConnection.ts
  import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';

  export function useWalletConnection() {
    const connect = async () => {
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

      return result;
    };

    return { connect };
  }
  ```

### Day 5-6: Basic Token Transfers

- [ ] **Implement Regular USDC Transfer** (non-confidential, for testing)
  ```typescript
  // packages/shared/src/transfers.ts
  import { Connection, PublicKey, Transaction } from '@solana/web3.js';
  import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

  export async function sendUSDC(
    connection: Connection,
    from: PublicKey,
    to: PublicKey,
    amount: number,
    mint: PublicKey // USDC mint
  ) {
    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(mint, from);
    const toTokenAccount = await getAssociatedTokenAddress(mint, to);

    // Create transfer instruction
    const instruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      from,
      amount * 1e6 // USDC has 6 decimals
    );

    // Build and return transaction
    const transaction = new Transaction().add(instruction);
    return transaction;
  }
  ```

- [ ] **Test Transfer on Devnet**
  - Create test USDC tokens (use Solana Token Program)
  - Send from wallet A to wallet B
  - Verify transaction on Solscan
  - Confirm balance updates

### Day 7: Week 1 Review

- [ ] **End-of-Week Demo**
  - Mobile app connects to Phantom wallet ✓
  - App displays USDC balance ✓
  - App sends regular USDC transfer ✓
  - Transaction visible on Solscan devnet ✓

- [ ] **Code Review**
  - Clean up code
  - Add comments
  - Commit to GitHub

- [ ] **Checkpoint Meeting**
  - Review what's working
  - Identify blockers for Week 2
  - Adjust plan if needed

### Week 1 Deliverables

✅ Monorepo structure in place
✅ Mobile app with wallet connection
✅ Regular USDC transfer working on devnet
✅ Backend API server running (basic)
✅ Databases connected

**Time Budget**: 40 hours
- Monorepo setup: 8h
- Mobile app foundation: 12h
- Wallet connection: 8h
- Token transfers: 10h
- Testing & debugging: 2h

---

## Week 2: Arcium Integration
**Duration**: Days 8-14
**Goal**: Confidential transfers working using Arcium Confidential SPL

**Key Milestone**: Send a confidential USDC transfer where amount is encrypted onchain

### Day 8-9: Arcium SDK Integration

- [ ] **Install Arcium Dependencies**
  ```bash
  cd packages/arcium-sdk
  npm install @arcium/sdk # (if available via npm)
  # OR clone from GitHub if still in early access
  ```

- [ ] **Study Arcium Examples**
  - Read Arcium quickstart guide
  - Run example confidential transfer locally
  - Understand MXE (Multiparty eXecution Environment) lifecycle

- [ ] **Create Arcium Client Wrapper**
  ```typescript
  // packages/arcium-sdk/src/client.ts
  import { ArciumClient } from '@arcium/sdk';

  export class NinjapayArciumClient {
    private client: ArciumClient;

    constructor(config: { network: 'mainnet-alpha' | 'devnet' }) {
      this.client = new ArciumClient({
        network: config.network,
        // ... other config
      });
    }

    async createConfidentialAccount(owner: PublicKey, mint: PublicKey) {
      // 1. Request MPC key generation
      const mxe = await this.client.createMXE({
        type: 'confidential-account-setup',
      });

      // 2. Generate ElGamal keypair using MPC
      const { publicKey, keyId } = await mxe.generateElGamalKey({
        owner: owner.toBase58(),
      });

      // 3. Create on-chain account
      // ... implementation
    }

    async confidentialTransfer(params: {
      from: PublicKey;
      to: PublicKey;
      amount: number;
      senderKeyId: string;
    }) {
      // 1. Encrypt amount using MPC
      // 2. Generate ZK proofs
      // 3. Submit to blockchain
      // ... implementation
    }
  }
  ```

### Day 10-11: Confidential Transfer Implementation

- [ ] **Create Confidential Mint**
  ```typescript
  // scripts/create-confidential-mint.ts

  async function createConfidentialMint() {
    const arcium = new NinjapayArciumClient({ network: 'devnet' });

    // Create mint with confidential transfer extension
    const mint = await arcium.createConfidentialMint({
      decimals: 6,
      authority: devWallet.publicKey,
      // Optional: Add auditor key for compliance
      auditorKey: auditorPublicKey,
    });

    console.log('Confidential mint created:', mint.toBase58());
    return mint;
  }
  ```

- [ ] **Implement Encrypt + Prove Flow**
  ```typescript
  // packages/arcium-sdk/src/confidential-transfer.ts

  export async function createConfidentialTransferTx(
    arcium: NinjapayArciumClient,
    params: {
      from: PublicKey;
      to: PublicKey;
      amount: number;
      senderKeyId: string;
    }
  ) {
    // Step 1: Create MXE for this transfer
    const mxe = await arcium.client.createMXE({
      type: 'confidential-transfer',
    });

    // Step 2: Encrypt amount
    const encryptedAmount = await mxe.encryptAmount({
      amount: params.amount,
      recipientPubkey: await arcium.getElGamalPubkey(params.to),
      senderKeyId: params.senderKeyId,
    });

    // Step 3: Generate ZK proofs
    const proofs = await mxe.generateTransferProofs({
      encryptedAmount,
      senderBalance: await arcium.getEncryptedBalance(params.from),
    });

    // Step 4: Build Solana transaction
    const tx = await buildConfidentialTransferTransaction({
      from: params.from,
      to: params.to,
      encryptedAmount,
      proofs,
    });

    return tx;
  }
  ```

### Day 12-13: Mobile App Integration

- [ ] **Update Mobile App to Use Arcium**
  ```typescript
  // apps/mobile/src/hooks/useConfidentialTransfer.ts

  export function useConfidentialTransfer() {
    const arcium = useArciumClient();
    const wallet = useWallet();

    const sendConfidential = async (to: string, amount: number) => {
      try {
        // 1. Create confidential transfer transaction
        const tx = await arcium.createConfidentialTransferTx({
          from: wallet.publicKey,
          to: new PublicKey(to),
          amount,
          senderKeyId: wallet.arciumKeyId,
        });

        // 2. Sign with wallet
        const signedTx = await wallet.signTransaction(tx);

        // 3. Submit to Solana
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        // 4. Wait for confirmation
        await connection.confirmTransaction(signature);

        return signature;
      } catch (error) {
        console.error('Confidential transfer failed:', error);
        throw error;
      }
    };

    return { sendConfidential };
  }
  ```

- [ ] **Update UI to Show Encrypted Amounts**
  ```typescript
  // apps/mobile/src/screens/TransactionHistory.tsx

  function TransactionRow({ tx }) {
    const [decrypted, setDecrypted] = useState<number | null>(null);
    const arcium = useArciumClient();

    const handleDecrypt = async () => {
      // Decrypt amount using Arcium MPC
      const amount = await arcium.decryptAmount({
        ciphertext: tx.encryptedAmount,
        keyId: wallet.arciumKeyId,
      });
      setDecrypted(amount);
    };

    return (
      <View>
        <Text>To: {tx.recipient}</Text>
        <Text>
          Amount: {decrypted ? `$${decrypted}` : '***'}
        </Text>
        {!decrypted && (
          <Button title="Decrypt" onPress={handleDecrypt} />
        )}
      </View>
    );
  }
  ```

### Day 14: Week 2 Testing & Review

- [ ] **End-to-End Test**
  1. Create confidential account for Alice
  2. Create confidential account for Bob
  3. Alice deposits 100 USDC to confidential balance
  4. Alice sends 50 USDC to Bob confidentially
  5. Verify on Solscan: amount shows as "***"
  6. Bob decrypts and sees 50 USDC in his app

- [ ] **Code Review & Documentation**
  - Document Arcium integration
  - Add error handling
  - Commit to GitHub

### Week 2 Deliverables

✅ Arcium SDK integrated
✅ Confidential transfers working on devnet
✅ Mobile app can send/receive confidential payments
✅ Amounts encrypted onchain (verified on Solscan)
✅ Users can decrypt their own balances/transactions

**Time Budget**: 40 hours
- Arcium SDK integration: 10h
- Confidential transfer implementation: 12h
- Mobile app integration: 10h
- Testing & debugging: 6h
- Documentation: 2h

---

## Week 3: Consumer Mobile App
**Duration**: Days 15-21
**Goal**: Polish mobile UX to Venmo-level quality

**Key Milestone**: Beautiful, intuitive mobile app ready for demo

### Day 15-16: Core Features

- [ ] **Balance Display**
  ```typescript
  // apps/mobile/src/components/BalanceCard.tsx

  function BalanceCard() {
    const { balance, isDecrypted } = useBalance();
    const [showAmount, setShowAmount] = useState(false);

    return (
      <View style={styles.card}>
        <Text style={styles.label}>Private Balance</Text>
        <TouchableOpacity onPress={() => setShowAmount(!showAmount)}>
          <Text style={styles.amount}>
            {showAmount ? `${balance} USDC` : '••••••'}
          </Text>
          <Icon name={showAmount ? 'eye-off' : 'eye'} />
        </TouchableOpacity>
        <Text style={styles.subtitle}>≈ ${balance} USD</Text>
      </View>
    );
  }
  ```

- [ ] **Send Flow Polish**
  - Add contact picker
  - Add quick amounts ($10, $20, $50, $100)
  - Add payment notes (optional)
  - Add confirmation screen with review
  - Add success animation

- [ ] **QR Code Scanner**
  ```bash
  npm install react-native-camera react-native-qrcode-svg
  ```

  ```typescript
  // apps/mobile/src/screens/ScanQRScreen.tsx

  function ScanQRScreen() {
    const navigation = useNavigation();

    const onQRScanned = (data: string) => {
      // Parse wallet address or payment request
      const address = parseQRData(data);
      navigation.navigate('Send', { recipient: address });
    };

    return (
      <RNCamera
        onBarCodeRead={({ data }) => onQRScanned(data)}
        style={styles.camera}
      />
    );
  }
  ```

### Day 17-18: Transaction History & Contacts

- [ ] **Transaction History with Decryption**
  ```typescript
  // apps/mobile/src/screens/TransactionHistory.tsx

  function TransactionHistory() {
    const { transactions } = useTransactions();
    const [decryptedAmounts, setDecryptedAmounts] = useState<Map<string, number>>(new Map());

    useEffect(() => {
      // Decrypt all amounts on load (batch)
      decryptAllAmounts(transactions).then(setDecryptedAmounts);
    }, [transactions]);

    return (
      <FlatList
        data={transactions}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            amount={decryptedAmounts.get(item.signature)}
          />
        )}
      />
    );
  }
  ```

- [ ] **Contacts System**
  ```typescript
  // apps/mobile/src/screens/ContactsScreen.tsx

  function ContactsScreen() {
    const { contacts, addContact } = useContacts();

    return (
      <View>
        <FlatList
          data={contacts}
          renderItem={({ item }) => (
            <ContactRow
              name={item.name}
              address={item.address}
              onPress={() => navigateToSend(item.address)}
            />
          )}
        />
        <FAB icon="plus" onPress={showAddContactDialog} />
      </View>
    );
  }
  ```

### Day 19-20: UI Polish & Animations

- [ ] **Add Loading States**
  - Skeleton loaders
  - Progress indicators
  - Pull-to-refresh

- [ ] **Add Animations**
  ```bash
  npm install react-native-reanimated
  ```

  ```typescript
  // Smooth balance update animation
  import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

  function BalanceCard() {
    const balance = useSharedValue(0);

    useEffect(() => {
      balance.value = withSpring(newBalance);
    }, [newBalance]);

    return (
      <Animated.View>
        {/* ... */}
      </Animated.View>
    );
  }
  ```

- [ ] **Add Haptics**
  ```bash
  npm install expo-haptics
  ```

  ```typescript
  import * as Haptics from 'expo-haptics';

  const handleSendSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  ```

### Day 21: Week 3 Testing

- [ ] **User Testing**
  - Test with 3-5 non-technical users
  - Observe where they get confused
  - Iterate on UX

- [ ] **Performance Optimization**
  - Profile app performance
  - Optimize heavy components
  - Reduce bundle size

### Week 3 Deliverables

✅ Venmo-quality mobile UX
✅ Send/receive confidential payments
✅ Transaction history with decryption
✅ QR code scanner
✅ Contacts system
✅ Smooth animations and haptics

**Time Budget**: 40 hours
- Core features: 12h
- Transaction history: 6h
- Contacts: 4h
- UI polish: 10h
- Testing & iteration: 8h

---

## Week 4: Merchant Platform
**Duration**: Days 22-28
**Goal**: Merchant dashboard for payment links and analytics

**Key Milestone**: Merchants can create payment links and receive confidential payments

### Day 22-23: Merchant Dashboard Setup

- [ ] **Initialize Next.js Dashboard**
  ```bash
  cd apps/merchant-dashboard
  npx create-next-app@latest . --typescript --tailwind --app

  npm install @solana/web3.js wagmi viem
  npm install @tanstack/react-query
  npm install recharts # for charts
  ```

- [ ] **Setup Authentication**
  ```typescript
  // app/api/auth/login/route.ts

  export async function POST(request: Request) {
    const { email, signature } = await request.json();

    // Verify wallet signature
    const message = `Sign in to NinjaPay Merchant Dashboard\nEmail: ${email}`;
    const isValid = await verifySignature(message, signature);

    if (isValid) {
      // Create JWT
      const token = jwt.sign({ email }, process.env.JWT_SECRET!);
      return Response.json({ token });
    }

    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  ```

- [ ] **Create Dashboard Layout**
  ```typescript
  // app/(dashboard)/layout.tsx

  export default function DashboardLayout({ children }) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    );
  }
  ```

### Day 24-25: Payment Link Creation

- [ ] **Payment Link Form**
  ```typescript
  // app/(dashboard)/payment-links/new/page.tsx

  function NewPaymentLinkPage() {
    const [form, setForm] = useState({
      productName: '',
      description: '',
      amount: '',
      currency: 'USDC',
      redirectUrl: '',
    });

    const handleCreate = async () => {
      const response = await fetch('/api/payment-links', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      const { linkId, url } = await response.json();
      router.push(`/payment-links/${linkId}`);
    };

    return (
      <form onSubmit={handleCreate}>
        {/* Form fields */}
      </form>
    );
  }
  ```

- [ ] **Payment Link Page (Customer-Facing)**
  ```typescript
  // app/pay/[linkId]/page.tsx

  export default async function PaymentPage({ params }) {
    const link = await getPaymentLink(params.linkId);

    return (
      <div className="max-w-md mx-auto p-8">
        <Image src={link.image} alt={link.productName} />
        <h1>{link.productName}</h1>
        <p>{link.description}</p>
        <p className="text-3xl">{link.amount} {link.currency}</p>

        <PaymentButton
          amount={link.amount}
          currency={link.currency}
          merchant={link.merchantWallet}
          onSuccess={() => router.push(link.redirectUrl)}
        />

        <p className="text-sm text-gray-500">
          ✓ Amount encrypted onchain for privacy
        </p>
      </div>
    );
  }
  ```

### Day 26-27: Merchant Analytics

- [ ] **Transactions List**
  ```typescript
  // app/(dashboard)/transactions/page.tsx

  function TransactionsPage() {
    const { data: transactions } = useQuery({
      queryKey: ['transactions'],
      queryFn: () => fetch('/api/transactions').then(r => r.json()),
    });

    return (
      <div>
        <h1>Transactions</h1>
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{formatDate(tx.createdAt)}</td>
                <td>{tx.customerWallet.slice(0, 4)}...{tx.customerWallet.slice(-4)}</td>
                <td>*** USDC</td> {/* Encrypted */}
                <td>{tx.status}</td>
                <td>
                  <a href={`https://solscan.io/tx/${tx.signature}`}>View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  }
  ```

- [ ] **Analytics Dashboard**
  ```typescript
  // app/(dashboard)/page.tsx

  function DashboardOverview() {
    const { data: stats } = useQuery({
      queryKey: ['stats'],
      queryFn: () => fetch('/api/analytics/overview').then(r => r.json()),
    });

    return (
      <div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Total Volume"
            value={stats.totalVolume}
            trend="+12%"
          />
          <StatCard
            title="Transactions"
            value={stats.transactionCount}
            trend="+8%"
          />
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
          />
        </div>

        <RevenueChart data={stats.dailyRevenue} />
      </div>
    );
  }
  ```

### Day 28: Week 4 Testing

- [ ] **End-to-End Flow**
  1. Merchant creates payment link
  2. Customer visits link
  3. Customer pays with confidential transfer
  4. Merchant sees transaction in dashboard (amount encrypted)
  5. Merchant can decrypt aggregate total

### Week 4 Deliverables

✅ Merchant dashboard (Next.js)
✅ Payment link creation
✅ Customer payment page
✅ Transaction list (encrypted amounts)
✅ Analytics overview (aggregated)

**Time Budget**: 40 hours
- Dashboard setup: 8h
- Payment links: 12h
- Analytics: 10h
- UI polish: 6h
- Testing: 4h

---

## Week 5: Payroll & APIs
**Duration**: Days 29-35
**Goal**: Payroll system + developer API

**Key Milestone**: Companies can batch confidential payments via CSV or API

### Day 29-30: Payroll Console

- [ ] **CSV Upload**
  ```typescript
  // app/(payroll)/new/page.tsx

  function NewPayrollPage() {
    const [csv, setCsv] = useState<File | null>(null);
    const [parsed, setParsed] = useState<PayrollEntry[]>([]);

    const handleUpload = async (file: File) => {
      const text = await file.text();
      const entries = parsePayrollCSV(text);
      setParsed(entries);
    };

    return (
      <div>
        <FileUpload onUpload={handleUpload} />

        {parsed.length > 0 && (
          <PayrollPreview
            entries={parsed}
            onConfirm={executePayroll}
          />
        )}
      </div>
    );
  }
  ```

- [ ] **Batch Payment Execution**
  ```typescript
  // packages/arcium-sdk/src/batch-transfer.ts

  export async function executeBatchPayroll(
    arcium: NinjapayArciumClient,
    payments: Array<{ to: PublicKey; amount: number }>
  ) {
    // Create single MXE for batch (more efficient)
    const mxe = await arcium.client.createMXE({
      type: 'batch-transfer',
      optimizeBatch: true,
    });

    // Encrypt all amounts in parallel
    const encrypted = await Promise.all(
      payments.map(p => mxe.encryptAmount({
        amount: p.amount,
        recipientPubkey: await arcium.getElGamalPubkey(p.to),
      }))
    );

    // Generate batched proof (cheaper than individual)
    const proof = await mxe.generateBatchProof({ encrypted });

    // Submit to blockchain
    const signatures = await submitBatchTransaction({ encrypted, proof });

    return signatures;
  }
  ```

### Day 31-32: Backend API

- [ ] **Payment API Endpoints**
  ```typescript
  // apps/backend/src/routes/payments.ts

  router.post('/v1/payments', authenticateAPIKey, async (req, res) => {
    const { amount, currency, recipient, metadata } = req.body;

    // Validate
    if (!amount || !recipient) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create payment intent
    const paymentIntent = await db.paymentIntents.create({
      merchantId: req.merchant.id,
      recipientWallet: recipient,
      amount,
      currency,
      status: 'pending',
      metadata,
    });

    // Initiate confidential transfer
    const result = await arcium.createConfidentialTransferTx({
      from: req.merchant.wallet,
      to: new PublicKey(recipient),
      amount,
    });

    // Submit to blockchain
    const signature = await connection.sendRawTransaction(result.transaction);

    // Update payment intent
    await db.paymentIntents.update(paymentIntent.id, {
      txSignature: signature,
      status: 'processing',
    });

    res.json({
      id: paymentIntent.id,
      status: 'processing',
      signature,
    });
  });

  router.get('/v1/payments/:id', authenticateAPIKey, async (req, res) => {
    const payment = await db.paymentIntents.findById(req.params.id);

    if (!payment || payment.merchantId !== req.merchant.id) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(payment);
  });
  ```

- [ ] **Webhook System**
  ```typescript
  // apps/backend/src/services/webhook.service.ts

  export async function triggerWebhook(
    webhook: Webhook,
    event: string,
    data: any
  ) {
    const payload = {
      event,
      data,
      timestamp: Date.now(),
    };

    // Sign payload
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Send HTTP request
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ninjapay-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Retry logic
        await queueWebhookRetry(webhook, payload);
      }
    } catch (error) {
      await queueWebhookRetry(webhook, payload);
    }
  }
  ```

### Day 33-34: API Documentation

- [ ] **OpenAPI Specification**
  ```yaml
  # docs/openapi.yaml

  openapi: 3.0.0
  info:
    title: NinjaPay API
    version: 1.0.0

  paths:
    /v1/payments:
      post:
        summary: Create payment
        security:
          - ApiKeyAuth: []
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  amount:
                    type: number
                  currency:
                    type: string
                  recipient:
                    type: string
        responses:
          '200':
            description: Payment created
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Payment'

  components:
    securitySchemes:
      ApiKeyAuth:
        type: apiKey
        in: header
        name: X-API-Key
  ```

- [ ] **Create Docs Site** (Mintlify or Docusaurus)
  ```bash
  npx create-docusaurus@latest docs classic
  # Add API reference, guides, examples
  ```

### Day 35: Week 5 Testing

- [ ] **API Testing**
  - Test all endpoints with Postman
  - Test webhook delivery
  - Test error handling
  - Load test (can handle 100 req/min?)

- [ ] **Payroll E2E Test**
  - Upload CSV with 10 employees
  - Execute batch payment
  - Verify all transactions confirmed
  - Check amounts encrypted onchain

### Week 5 Deliverables

✅ Payroll console with CSV upload
✅ Batch confidential payments working
✅ REST API for developers
✅ Webhook system
✅ API documentation

**Time Budget**: 40 hours
- Payroll console: 10h
- Backend API: 12h
- Webhook system: 6h
- Documentation: 8h
- Testing: 4h

---

## Week 6: Polish & Submission
**Duration**: Days 36-42
**Goal**: Perfect demo, create videos, submit hackathon

**Key Milestone**: Hackathon submission complete

### Day 36: MagicBlock Integration (If Time)

- [ ] **MagicBlock Ephemeral Rollups**
  ```typescript
  // packages/magicblock-sdk/src/session.ts

  export async function createFastPaymentSession(
    accounts: PublicKey[]
  ): Promise<string> {
    const session = await magicblock.createEphemeralSession({
      accounts,
      duration: 300, // 5 min
      teeSecured: true,
      targetLatency: 20,
    });

    return session.id;
  }

  export async function executeFastTransfer(
    sessionId: string,
    tx: Transaction
  ): Promise<string> {
    const signature = await magicblock.submitToSession(sessionId, tx);
    return signature;
  }
  ```

- [ ] **Update Mobile App to Use MagicBlock for <$1k Payments**
  ```typescript
  async function routePayment(amount: number, tx: Transaction) {
    if (amount < 1000) {
      // Fast path: MagicBlock ephemeral rollup
      const sessionId = await createFastPaymentSession([sender, recipient]);
      return await executeFastTransfer(sessionId, tx);
    } else {
      // Slow path: Direct to Solana L1 for finality
      return await connection.sendRawTransaction(tx.serialize());
    }
  }
  ```

### Day 37-38: Demo Preparation

- [ ] **Create Demo Script**
  ```markdown
  # NinjaPay Demo Script

  ## Setup (before demo)
  - [ ] 2 phones with app installed (Alice, Bob)
  - [ ] Alice has 1000 USDC in confidential balance
  - [ ] Merchant account set up with payment link
  - [ ] Payroll CSV prepared (10 employees)
  - [ ] All services running on testnet
  - [ ] Solscan open in browser (to show encrypted amounts)

  ## Demo Flow (6 minutes total)

  ### 1. Consumer P2P Payment (2 min)
  - Alice opens NinjaPay app
  - Shows confidential balance: 1000 USDC
  - Taps "Send"
  - Scans Bob's QR code
  - Enters 50 USDC
  - Confirms payment
  - Success screen shows ~20ms latency
  - Switch to Bob's phone: received 50 USDC
  - Open Solscan: amount shows "***" (encrypted)

  ### 2. Merchant Payment Link (2 min)
  - Open merchant dashboard
  - Create payment link for "Online Course - $99"
  - Copy link, open in customer browser
  - Customer pays with Phantom wallet
  - Confidential transfer executes
  - Merchant dashboard shows new transaction (encrypted amount)
  - Merchant decrypts aggregate total for accounting

  ### 3. Payroll Batch Payment (2 min)
  - Open payroll console
  - Upload CSV (10 employees, various amounts)
  - Review preview: total $50,000
  - Execute batch payment
  - Progress bar: 0% → 100% in ~15 seconds
  - All 10 transactions confirmed
  - Show Solscan: all amounts "***" (encrypted)
  - Each employee can decrypt only their own amount
  ```

- [ ] **Practice Demo**
  - Run through script 5+ times
  - Fix any bugs that come up
  - Optimize for smoothness
  - Time it (should be <6 min)

### Day 39: Create Pitch Video

- [ ] **Script 3-Minute Pitch**
  ```
  [0:00-0:30] HOOK + PROBLEM
  - Show Solscan transaction: "$487,239" salary payment (public!)
  - "This is the problem with blockchain transparency."
  - "Privacy is blocking crypto adoption."

  [0:30-1:30] SOLUTION
  - Introduce NinjaPay: confidential payments on Solana
  - Show mobile app: Venmo-like UX
  - Show merchant dashboard: Stripe-like tools
  - Show payroll: institutional features
  - Explain tech: Arcium MPC + MagicBlock + ZK proofs

  [1:30-2:30] DEMO
  - Quick cuts of demo highlights
  - Show encrypted transactions on Solscan
  - Show speed (20ms latency)
  - Show decryption (user-controlled)

  [2:30-3:00] IMPACT
  - Market size: $87B payment gateways
  - Ecosystem impact: privacy layer for Solana
  - Call to action: "Try NinjaPay at ninjapay.xyz"
  - End card: GitHub, demo link
  ```

- [ ] **Record & Edit**
  - Use screen recording software (OBS, Loom)
  - Record in 4K if possible
  - Add captions for accessibility
  - Add background music (royalty-free)
  - Keep under 3 minutes (strict requirement!)

### Day 40: Create Technical Demo Video

- [ ] **Script 5-Minute Technical Deep-Dive**
  ```
  [0:00-1:00] ARCHITECTURE
  - Show architecture diagram
  - Explain 4 layers: Frontend, API, MagicBlock L2, Solana L1
  - Highlight Arcium MPC as core privacy primitive

  [1:00-2:30] CODE WALKTHROUGH
  - Open IDE
  - Show Arcium integration code
  - Show MPC encryption function
  - Show ZK proof generation
  - Show MagicBlock session creation
  - Explain how no single entity can decrypt

  [2:30-4:00] INNOVATION
  - Why is combining these primitives novel?
  - Arcium: MPC-powered privacy (no single key)
  - MagicBlock: Speed without sacrificing privacy
  - Compliance: Auditor keys for regulation
  - Show proof of work: GitHub commits, complex implementation

  [4:00-5:00] ECOSYSTEM IMPACT
  - How other devs can use our APIs
  - Show API docs
  - Example integrations (DEX, NFT marketplace)
  - Open-source components
  ```

- [ ] **Record & Edit**
  - Screen recording + talking head
  - Show code clearly (zoom in)
  - Highlight key sections
  - Add diagrams/animations if time permits

### Day 41: Final Polish

- [ ] **Code Cleanup**
  - Remove console.logs
  - Remove commented code
  - Format all files (Prettier)
  - Add JSDoc comments
  - Update README.md

- [ ] **README.md**
  ```markdown
  # NinjaPay - Confidential Payments on Solana

  > Privacy-first payment platform combining Venmo-level UX with institutional-grade confidentiality

  ## 🎯 Hackathon Submission

  - **Pitch Video**: [YouTube link]
  - **Technical Demo**: [YouTube link]
  - **Live Demo**: https://ninjapay.xyz
  - **API Docs**: https://docs.ninjapay.xyz

  ## 🚀 Quick Start

  ### Mobile App
  ```bash
  cd apps/mobile
  npm install
  npm run dev
  ```

  ### Merchant Dashboard
  ```bash
  cd apps/merchant-dashboard
  npm install
  npm run dev
  ```

  ### Backend API
  ```bash
  cd apps/backend
  npm install
  npm run dev
  ```

  ## 🏗️ Architecture

  [Include architecture diagram]

  ## 🔐 Privacy Tech

  - **Arcium MPC**: Distributed key management
  - **Zero-Knowledge Proofs**: Amount confidentiality
  - **MagicBlock**: Sub-50ms transactions
  - **Token-2022**: Solana-native privacy

  ## 📊 Demo Credentials

  - Merchant Dashboard: demo@ninjapay.xyz / [testnet wallet]
  - Mobile App: Use any Solana wallet (Phantom/Backpack)

  ## 🎥 Videos

  - [3-min Pitch Video]
  - [5-min Technical Demo]

  ## 🤝 Team

  - [Your Name] - Full-stack + Solana
  - [Co-founder if applicable]

  ## 📄 License

  MIT
  ```

- [ ] **Deploy to Production**
  - Mobile: TestFlight (iOS), Google Play Internal Testing (Android)
  - Dashboard: Vercel
  - Backend: Railway/Render
  - Ensure all on Solana devnet (or mainnet-beta if Arcium ready)

- [ ] **Test Everything One More Time**
  - Mobile app works on real devices
  - Merchant dashboard accessible at ninjapay.xyz
  - API endpoints respond
  - Webhooks deliver
  - All flows in demo script work

### Day 42: Submit Hackathon

- [ ] **Submission Checklist**
  - [ ] 3-minute pitch video uploaded to YouTube
  - [ ] 5-minute technical demo uploaded to YouTube
  - [ ] GitHub repo public and clean
  - [ ] README.md complete
  - [ ] Live demo accessible
  - [ ] All links working
  - [ ] Submitted to hackathon platform before deadline

- [ ] **Share on Social Media**
  - Tweet launch announcement
  - Post in Solana Discord
  - Share in Arcium/MagicBlock communities
  - Tag Colosseum, Solana Foundation

- [ ] **Celebrate** 🎉
  - You shipped a complex crypto project in 6 weeks!
  - Take a break
  - Wait for judging results

### Week 6 Deliverables

✅ MagicBlock integration (if time)
✅ Polished demo (all 3 products working)
✅ 3-minute pitch video
✅ 5-minute technical demo video
✅ Clean GitHub repo
✅ Hackathon submission complete

**Time Budget**: 40 hours
- MagicBlock integration: 6h
- Demo preparation: 8h
- Pitch video: 6h
- Technical video: 6h
- Polish & cleanup: 8h
- Submission: 4h
- Buffer: 2h

---

## Daily Schedule Template

### Recommended Daily Routine (8 hours/day)

**9:00 AM - 9:30 AM**: Planning
- Review yesterday's progress
- Identify blockers
- Plan today's tasks (specific & measurable)
- Update todo list

**9:30 AM - 12:30 PM**: Deep Work Session 1
- Most complex tasks (e.g., Arcium integration, ZK proofs)
- No interruptions, focus time
- 25-min work / 5-min break (Pomodoro)

**12:30 PM - 1:30 PM**: Lunch Break

**1:30 PM - 4:30 PM**: Deep Work Session 2
- Continue complex tasks or start new ones
- Pair programming if team (great for debugging)

**4:30 PM - 5:30 PM**: Testing & Review
- Test what you built today
- Write tests (unit/integration)
- Code review if team
- Fix obvious bugs

**5:30 PM - 6:00 PM**: Documentation & Commit
- Document what you built
- Update README if needed
- Git commit with clear messages
- Push to GitHub

**6:00 PM - End**: Async Communication
- Respond to Discord messages
- Check Arcium/MagicBlock support channels
- Plan tomorrow

---

## Risk Contingencies

### Scenario 1: Arcium Early Access Not Granted

**If**: Arcium team doesn't grant early access in time

**Fallback**: Use Token-2022 Confidential Transfer extension directly
- Still provides encrypted amounts
- Missing: PDA support, sender-created accounts, MPC security
- Enough to demo the concept
- Can migrate to Arcium post-hackathon

**Time Impact**: Saves ~8 hours (simpler integration)

---

### Scenario 2: MagicBlock Integration Too Complex

**If**: Can't get MagicBlock working by Week 6 Day 1

**Decision**: Skip it, focus on polish

**Reasoning**:
- Arcium privacy is core differentiator
- MagicBlock is "nice to have" for speed
- Can demo on Solana L1 (still ~400ms, acceptable)
- Mention MagicBlock in roadmap instead

**Time Saved**: 6 hours → use for extra polish

---

### Scenario 3: Mobile App Performance Issues

**If**: React Native app is laggy/crashes on devices

**Fallback**: Build web app instead (Progressive Web App)
- Faster development (no native issues)
- Works on mobile browsers
- Loses: Push notifications, deep wallet integration
- Gains: Faster iteration, no app store approval

**Time Impact**: Neutral (web is faster to build)

---

### Scenario 4: Running Out of Time

**If**: Week 5 ends and major features incomplete

**Triage Decision Tree**:

**Priority 1 (Must Have)**:
- ✅ Consumer mobile app (send/receive confidential)
- ✅ Basic merchant dashboard (create link, view transactions)
- ✅ Arcium confidential transfers working

**Priority 2 (Should Have)**:
- ⚠️ Payroll (can be super basic - manual entry, not CSV)
- ⚠️ API (can skip webhooks, just core endpoints)
- ⚠️ Analytics (can show fake data if needed)

**Priority 3 (Nice to Have)**:
- ❌ MagicBlock (cut if needed)
- ❌ Advanced features (contacts, recurring payments)
- ❌ Perfect UI polish

**Minimum Viable Demo**:
If down to last 24 hours, focus on:
1. One smooth demo flow (consumer send)
2. Proof Arcium confidential transfers work
3. Killer pitch video (can make up for incomplete features)

---

### Scenario 5: Critical Bug in Production

**If**: Major bug discovered during Day 41 testing

**Process**:
1. **Assess Severity**
   - Blocker (prevents demo): Drop everything, fix immediately
   - Major (noticeable but demo works): Fix if <2 hours
   - Minor (cosmetic): Document, fix post-hackathon

2. **Debug Strategy**
   - Reproduce consistently
   - Check logs (Sentry, console)
   - Binary search (disable features until works)
   - Ask for help (Discord, team)

3. **Time Box**
   - Set 2-hour limit
   - If not fixed, find workaround
   - Worst case: Cut feature from demo

---

## Final Tips

### Time Management

- **Work in sprints**: 2-hour focused blocks
- **Ship daily**: Have something working at end of each day
- **Don't gold-plate**: "Done is better than perfect"
- **Cut scope aggressively**: 3 working features > 10 half-done features

### Technical

- **Use TypeScript strictly**: Catch bugs early
- **Write tests for critical paths**: Confidential transfer logic
- **Log everything**: Use Sentry for error tracking
- **Cache aggressively**: Redis for performance

### Team Coordination (If Applicable)

- **Daily standups**: 15 minutes, sync on progress
- **Clear ownership**: Person A owns mobile, Person B owns backend
- **Shared Figma**: Design before coding
- **GitHub PRs**: Review each other's code

### Communication

- **Document as you go**: README, inline comments
- **Screenshot progress**: For pitch video
- **Engage communities**: Arcium, MagicBlock, Solana devs are helpful
- **Build in public**: Tweet progress, builds excitement

---

## Success Criteria

### Minimum (Top 10 Finish)

- ✅ All 3 products functional (even if basic)
- ✅ Confidential transfers working on testnet
- ✅ Good pitch video (clear problem/solution/demo)
- ✅ Technical demo shows code and architecture
- ✅ GitHub repo clean and documented

### Target (Top 3 Finish)

- ✅ All above PLUS
- ✅ Exceptional UX (Venmo-quality mobile app)
- ✅ MagicBlock integration (speed differentiation)
- ✅ 10+ developers tested API
- ✅ Partnership/endorsement from Arcium or MagicBlock
- ✅ Real merchant pilot

### Stretch (Grand Prize)

- ✅ All above PLUS
- ✅ Live mainnet deployment (if Arcium ready)
- ✅ Viral pitch video (clever, entertaining)
- ✅ Media coverage (crypto Twitter, news sites)
- ✅ Perfect execution (zero bugs in demo)
- ✅ Novel technical innovation (new use of MPC/ZK)

---

**Document Version**: 1.0
**Last Updated**: October 5, 2025
**Status**: Ready to Execute
**Good luck building! 🚀**
