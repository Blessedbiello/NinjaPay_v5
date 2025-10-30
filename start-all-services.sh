#!/bin/bash

# NinjaPay - Start All Services Script
# This script starts all necessary services for NinjaPay

echo "🚀 Starting NinjaPay Services..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -i:$1 >/dev/null 2>&1
    return $?
}

# 1. Check Redis
echo -e "${BLUE}1. Checking Redis...${NC}"
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running. Starting...${NC}"
    redis-server --daemonize yes
    sleep 2
fi

# 2. Check PostgreSQL
echo -e "${BLUE}2. Checking PostgreSQL...${NC}"
if PGPASSWORD=ninjapay123 psql -U ninjapay -h localhost -d ninjapay -c "SELECT 1" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    exit 1
fi

# 3. Start Arcium Service (Port 8002)
echo -e "${BLUE}3. Starting Arcium Service (Port 8002)...${NC}"
cd /home/bprime/Hackathons/Cypherpunk/Ninjapay_v5/services/arcium-service

if check_port 8002; then
    echo -e "${YELLOW}⚠️  Port 8002 already in use${NC}"
else
    # Check if binary exists
    if [ ! -f "./target/release/arcium-service" ]; then
        echo -e "${YELLOW}⚠️  Binary not found. Building...${NC}"
        cargo build --release
    fi

    # Start service
    RUST_LOG=info,arcium_service=debug ./target/release/arcium-service > logs/arcium.log 2>&1 &
    ARCIUM_PID=$!
    echo -e "${GREEN}✅ Arcium Service started (PID: $ARCIUM_PID)${NC}"
fi

# 4. Start API Gateway (Port 8001)
echo -e "${BLUE}4. Starting API Gateway (Port 8001)...${NC}"
cd /home/bprime/Hackathons/Cypherpunk/Ninjapay_v5/services/api-gateway

if check_port 8001; then
    echo -e "${YELLOW}⚠️  Port 8001 already in use${NC}"
else
    PORT=8001 API_PORT=8001 pnpm dev > logs/api-gateway.log 2>&1 &
    API_PID=$!
    echo -e "${GREEN}✅ API Gateway started (PID: $API_PID)${NC}"
fi

# 5. Start Merchant Dashboard (Port 3001)
echo -e "${BLUE}5. Starting Merchant Dashboard (Port 3001)...${NC}"
cd /home/bprime/Hackathons/Cypherpunk/Ninjapay_v5/apps/merchant-dashboard

if check_port 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 already in use${NC}"
else
    pnpm dev:dashboard > logs/dashboard.log 2>&1 &
    DASH_PID=$!
    echo -e "${GREEN}✅ Merchant Dashboard started (PID: $DASH_PID)${NC}"
fi

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to initialize...${NC}"
sleep 5

# Check services
echo -e "${BLUE}📊 Service Status:${NC}"
echo "-------------------------------------"
check_port 6379 && echo -e "${GREEN}✅ Redis (6379)${NC}" || echo -e "${RED}❌ Redis (6379)${NC}"
check_port 5432 && echo -e "${GREEN}✅ PostgreSQL (5432)${NC}" || echo -e "${RED}❌ PostgreSQL (5432)${NC}"
check_port 8002 && echo -e "${GREEN}✅ Arcium Service (8002)${NC}" || echo -e "${RED}❌ Arcium Service (8002)${NC}"
check_port 8001 && echo -e "${GREEN}✅ API Gateway (8001)${NC}" || echo -e "${RED}❌ API Gateway (8001)${NC}"
check_port 3001 && echo -e "${GREEN}✅ Merchant Dashboard (3001)${NC}" || echo -e "${RED}❌ Merchant Dashboard (3001)${NC}"
echo "-------------------------------------"

echo -e "${GREEN}🎉 NinjaPay Services Started!${NC}"
echo ""
echo -e "${BLUE}📝 Access Points:${NC}"
echo "  • API Gateway: http://localhost:8001"
echo "  • Arcium Service: http://localhost:8002"
echo "  • Merchant Dashboard: http://localhost:3001"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo "  • Arcium: tail -f services/arcium-service/logs/arcium.log"
echo "  • API Gateway: tail -f services/api-gateway/logs/api-gateway.log"
echo "  • Dashboard: tail -f apps/merchant-dashboard/logs/dashboard.log"
