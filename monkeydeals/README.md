# 🍌 MonkeyDeals

**The next evolution of Groupon - user-owned, borderless, and Web3-powered**

MonkeyDeals is a decentralized discount marketplace where every promotion is a collectible, tradable NFT that grants real-world savings. Built for the MonkeDAO Cypherpunk Hackathon.

---

## 🎯 Vision

Transform traditional discounts into liquid digital assets. Every deal—from flights to shopping—becomes an NFT you can own, trade, or gift.

## ✨ Core Features

### 🎫 NFT Promotions
- Each deal minted as a transferable NFT
- Rich metadata: discount %, expiry, merchant ID, redemption rules
- Verifiable ownership on Solana blockchain

### 🏪 Merchant Dashboard
- Easy deal creation interface
- Automatic NFT minting for promotions
- Control over issuance limits and expiration
- Real-time redemption tracking

### 🛍️ User Marketplace
- Browse and discover deals
- Purchase or claim discount NFTs
- Resell unused coupons
- Trade with other users

### 🔍 Deal Aggregator
- Integration with external APIs (Skyscanner, Booking.com, Shopify)
- Live deals from multiple sources
- Curated deal feed

### 👥 Social Discovery
- Share deals with community
- Rate and review promotions
- Comment and discuss offers
- Viral discovery like RedFlagDeals

### ✅ Redemption Verification
- QR code-based verification
- On-chain attestation
- Single-use enforcement
- Merchant validation flow

### 🎁 Rewards & Staking
- Stake NFTs for rewards
- Merchant loyalty tokens
- Cashback programs
- NFT badges for active users

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                 MonkeyDeals                      │
├─────────────────────────────────────────────────┤
│  Frontend (Next.js)                              │
│  ├─ Merchant Dashboard                           │
│  ├─ User Marketplace                             │
│  ├─ Deal Discovery Feed                          │
│  └─ Redemption Portal                            │
├─────────────────────────────────────────────────┤
│  Smart Contracts (Solana/Anchor)                │
│  ├─ Coupon NFT Program                           │
│  ├─ Redemption Program                           │
│  ├─ Marketplace Program                          │
│  └─ Rewards Program                              │
├─────────────────────────────────────────────────┤
│  Backend Services                                │
│  ├─ Deal Aggregator API                          │
│  ├─ Metadata Service                             │
│  ├─ Notification Service                         │
│  └─ Analytics Service                            │
├─────────────────────────────────────────────────┤
│  Infrastructure                                  │
│  ├─ Solana Devnet/Mainnet                        │
│  ├─ IPFS (NFT Metadata)                          │
│  ├─ PostgreSQL (Off-chain data)                  │
│  └─ Redis (Caching)                              │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

**Blockchain:**
- Solana (Layer 1)
- Anchor Framework (Smart contracts)
- Metaplex (NFT standard)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter

**Backend:**
- Node.js / Express
- PostgreSQL
- Redis
- IPFS (Pinata/NFT.Storage)

**APIs:**
- Skyscanner Flight Search API
- Booking.com Affiliate API
- Shopify Partner API
- OpenWeather (location-based deals)

---

## 📦 Project Structure

```
monkeydeals/
├── programs/                 # Solana smart contracts
│   └── monkeydeals-nft/     # Anchor program
│       ├── src/
│       │   ├── lib.rs       # Program entry
│       │   ├── state.rs     # Account structures
│       │   └── instructions.rs
│       └── Cargo.toml
├── app/                      # Next.js frontend
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities
│   │   └── hooks/           # Custom hooks
│   ├── public/
│   └── package.json
├── scripts/                  # Deployment scripts
├── tests/                    # Integration tests
└── docs/                     # Documentation
```

---

## 🎯 MonkeDAO Track Requirements

### ✅ Core Features
- [x] NFT Promotions with metadata
- [x] Merchant Dashboard for deal creation
- [x] User Wallet & Marketplace
- [x] Deal Aggregator Feed
- [x] Social Discovery Layer
- [x] Redemption Verification Flow
- [x] Reward Staking / Cashback

### ✅ Web3 Integration Challenges Addressed
1. **NFT Representation**: Metaplex Token Metadata Standard
2. **Redemption Flow**: QR code + on-chain attestation
3. **UX Abstraction**: Wallet login with social auth, fiat on-ramp
4. **Merchant Onboarding**: No-code dashboard, existing catalog import
5. **Marketplace Liquidity**: Integrated secondary market, price discovery

### 🎁 Bonus Features
- On-chain reputation with NFT badges
- Travel-specific subset for crypto events
- Geo-based discovery ("Deals near me")
- Integration with Magic Eden marketplace
- Group deals with pooled resources

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.30+
- pnpm

### Install Dependencies
```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Install pnpm
npm install -g pnpm

# Install project dependencies
cd monkeydeals
pnpm install
```

### Build Smart Contracts
```bash
cd programs/monkeydeals-nft
anchor build
anchor test
```

### Run Frontend
```bash
cd app
pnpm dev
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run smart contract tests
anchor test

# Run integration tests
pnpm test:integration
```

---

## 🚢 Deployment

### Deploy to Solana Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Deploy Frontend
```bash
cd app
pnpm build
vercel deploy
```

---

## 📖 Use Cases

### 1. **Travel Deals**
- Flight discount NFTs from Skyscanner
- Hotel coupon NFTs from Booking.com
- Transferable to friends/family

### 2. **Restaurant Coupons**
- Local restaurant promotions
- Group dining deals
- Social sharing for virality

### 3. **E-commerce Discounts**
- Shopify merchant integrations
- Limited edition sale NFTs
- Collectible seasonal deals

### 4. **Event Tickets**
- Crypto conference discounts
- NFT meetup deals
- Community-exclusive offers

---

## 🎨 Design Principles

1. **User-First**: Abstract Web3 complexity
2. **Merchant-Friendly**: Easy onboarding, no crypto knowledge required
3. **Community-Driven**: Social features, viral sharing
4. **Trustless**: On-chain verification, transparent redemption
5. **Liquid**: Free market for unused coupons

---

## 🤝 MonkeDAO Track Alignment

**Mission**: Build the next evolution of Groupon - user-owned, borderless, Web3-powered ✅

**Core Problem**: Traditional discount platforms trap users with non-transferable coupons ✅

**Solution**: Trustless, transparent, liquid deal economy with NFT promotions ✅

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Demo**: Coming Soon
- **Docs**: [docs/](./docs)
- **GitHub**: This Repository
- **Video Demo**: Coming Soon

---

## 👥 Team

Built with 🍌 for MonkeDAO Cypherpunk Hackathon

---

## 🙏 Acknowledgments

- MonkeDAO for sponsoring this track
- Solana Foundation
- Metaplex Foundation
- The Cypherpunk community

---

**Go bananas for savings! ��**
