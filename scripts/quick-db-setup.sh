#!/bin/bash
# Quick Database Setup - Run this script

echo "🗄️  Setting up NinjaPay database..."

# Create database and user
sudo -u postgres psql << 'EOSQL'
-- Ignore if already exists
CREATE DATABASE ninjapay;
CREATE USER ninjapay WITH PASSWORD 'ninjapay123';
GRANT ALL PRIVILEGES ON DATABASE ninjapay TO ninjapay;
\c ninjapay
GRANT ALL ON SCHEMA public TO ninjapay;
EOSQL

echo "✅ Database and user created"

# Update .env
echo "📝 Updating .env file..."
sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"|' .env

# Run migrations
echo "📦 Running Prisma migrations..."
cd packages/database
export DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"
pnpm prisma generate
pnpm prisma db push --accept-data-loss
cd ../..

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Connection: postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay"
echo ""
echo "Next: Restart API Gateway with:"
echo "  cd services/api-gateway"
echo "  export DATABASE_URL='postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public'"
echo "  pnpm dev"
