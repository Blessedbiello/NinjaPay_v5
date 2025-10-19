#!/bin/bash

echo "🔧 Setting up NinjaPay PostgreSQL Database..."

# Create database and user (suppress collation warnings)
echo "📦 Creating database..."
sudo -u postgres psql -c "CREATE DATABASE ninjapay;" 2>&1 | grep -v "WARNING.*collation" || true

echo "👤 Creating user..."
sudo -u postgres psql -c "CREATE USER ninjapay WITH PASSWORD 'ninjapay123';" 2>&1 | grep -v "WARNING.*collation" || true

echo "🔐 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ninjapay TO ninjapay;"

echo "📋 Granting schema permissions..."
sudo -u postgres psql -d ninjapay -c "GRANT ALL ON SCHEMA public TO ninjapay;"

echo ""
echo "✅ Database created successfully!"
echo ""
echo "🔄 Running Prisma migrations..."

# Set DATABASE_URL and run Prisma migrations
cd packages/database
export DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"
pnpm prisma db push --accept-data-loss

echo ""
echo "✅ Database setup complete!"
echo ""
echo "🧪 Testing connection..."
cd ../..

# Test the registration endpoint
curl -X POST http://localhost:3000/v1/auth/merchant/register \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Corp","email":"test@ninjapay.io","walletAddress":"7xJ8kL9pMnQ2rStU3vWxYz5aBcDeFgHiJkLmNoPqRsTu"}' \
  2>/dev/null | jq '.'

echo ""
echo "✅ Database setup complete! You can now use NinjaPay."
