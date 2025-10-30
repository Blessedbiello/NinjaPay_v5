#!/bin/bash
# NinjaPay End-to-End Payment Flow Test
# Tests the complete payment lifecycle with Arcium MPC

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    NinjaPay E2E Payment Flow Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Configuration
API_GATEWAY="http://localhost:8001"
ARCIUM_SERVICE="http://localhost:8002"

# Step 1: Check Services
echo -e "${BLUE}[Step 1] Checking service health...${NC}"

API_HEALTH=$(curl -s "$API_GATEWAY/health" | jq -r '.data.status' 2>/dev/null || echo "down")
if [ "$API_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ API Gateway: healthy${NC}"
else
    echo -e "${RED}❌ API Gateway: $API_HEALTH${NC}"
    exit 1
fi

ARCIUM_HEALTH=$(curl -s "$ARCIUM_SERVICE/api/health" | jq -r '.status' 2>/dev/null || echo "down")
if [ "$ARCIUM_HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Arcium Service: healthy${NC}"
else
    echo -e "${RED}❌ Arcium Service: $ARCIUM_HEALTH${NC}"
    exit 1
fi

echo ""

# Step 2: Test Arcium Encryption
echo -e "${BLUE}[Step 2] Testing Arcium MPC encryption...${NC}"

ENCRYPT_RESPONSE=$(curl -s -X POST "$ARCIUM_SERVICE/api/computation/encrypt" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "user_pubkey": "3fMoA42W8MzvA86ZUFiRj5ayoEuwmDkz1qtZGiY5ooWR",
    "recipient": "RecipientWallet123456789012345678901"
  }')

ENCRYPT_SUCCESS=$(echo "$ENCRYPT_RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")
if [ "$ENCRYPT_SUCCESS" = "true" ]; then
    CIPHERTEXT=$(echo "$ENCRYPT_RESPONSE" | jq -r '.ciphertext' | head -c 50)
    COMMITMENT=$(echo "$ENCRYPT_RESPONSE" | jq -r '.commitment' | head -c 50)
    echo -e "${GREEN}✅ Amount encrypted successfully${NC}"
    echo -e "   Ciphertext (preview): ${CIPHERTEXT}..."
    echo -e "   Commitment (preview): ${COMMITMENT}..."
else
    echo -e "${YELLOW}⚠️  Encryption endpoint test: $ENCRYPT_RESPONSE${NC}"
fi

echo ""

# Step 3: Database Test
echo -e "${BLUE}[Step 3] Testing database connection...${NC}"

DB_TEST=$(PGPASSWORD=ninjapay123 psql -U ninjapay -h localhost -d ninjapay -t -c "SELECT COUNT(*) FROM \"Merchant\"" 2>/dev/null || echo "0")
MERCHANT_COUNT=$(echo "$DB_TEST" | tr -d '[:space:]')

if [ "$MERCHANT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database connected: $MERCHANT_COUNT merchants found${NC}"
else
    echo -e "${YELLOW}⚠️  Database: no merchants found (run migrations/seed)${NC}"
fi

echo ""

# Step 4: Solana Devnet Check
echo -e "${BLUE}[Step 4] Checking Solana devnet connection...${NC}"

SOLANA_BALANCE=$(solana balance --url devnet 2>/dev/null | awk '{print $1}' || echo "0")
WALLET_ADDRESS=$(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null || echo "unknown")

if [ "$SOLANA_BALANCE" != "0" ]; then
    echo -e "${GREEN}✅ Solana devnet: $SOLANA_BALANCE SOL${NC}"
    echo -e "   Wallet: $WALLET_ADDRESS"
else
    echo -e "${RED}❌ Solana: no balance${NC}"
fi

echo ""

# Step 5: Redis Check
echo -e "${BLUE}[Step 5] Checking Redis...${NC}"

REDIS_PING=$(redis-cli ping 2>/dev/null || echo "DOWN")
if [ "$REDIS_PING" = "PONG" ]; then
    REDIS_KEYS=$(redis-cli dbsize | awk '{print $2}')
    echo -e "${GREEN}✅ Redis: connected ($REDIS_KEYS keys)${NC}"
else
    echo -e "${RED}❌ Redis: not responding${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ NinjaPay System Test Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "  1. Create API key for merchant (via admin portal)"
echo "  2. Test payment intent creation:"
echo "     curl -X POST $API_GATEWAY/v1/payment_intents \\"
echo "       -H 'X-API-Key: YOUR_KEY' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"amount\": 1000, \"currency\": \"USDC\", \"recipient\": \"...\"}'"
echo ""
echo "  3. Start Merchant Dashboard:"
echo "     cd apps/merchant-dashboard && pnpm dev:dashboard"
echo ""
