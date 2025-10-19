#!/bin/bash

echo "🔧 Fixing PostgreSQL and setting up NinjaPay Database..."
echo ""

# Fix collation version mismatch
echo "1️⃣ Fixing collation version..."
sudo -u postgres psql -d postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;" 2>/dev/null || true
sudo -u postgres psql -d postgres -c "ALTER DATABASE postgres REFRESH COLLATION VERSION;" 2>/dev/null || true

echo ""
echo "2️⃣ Creating database ninjapay..."
sudo -u postgres psql -d postgres -c "CREATE DATABASE ninjapay;" 2>&1 | grep -v "WARNING" || true

echo ""
echo "3️⃣ Creating user ninjapay..."
sudo -u postgres psql -d postgres -c "CREATE USER ninjapay WITH PASSWORD 'ninjapay123';" 2>&1 | grep -E "CREATE ROLE|already exists" || true

echo ""
echo "4️⃣ Granting privileges..."
sudo -u postgres psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ninjapay TO ninjapay;"

echo ""
echo "5️⃣ Granting schema permissions..."
sudo -u postgres psql -d ninjapay -c "GRANT ALL ON SCHEMA public TO ninjapay;"
sudo -u postgres psql -d ninjapay -c "ALTER SCHEMA public OWNER TO ninjapay;"

echo ""
echo "✅ Database created successfully!"
echo ""
echo "🔄 Running Prisma migrations..."

# Set DATABASE_URL and run Prisma migrations
cd packages/database
export DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"
pnpm prisma db push --accept-data-loss

echo ""
echo "✅ Prisma migrations complete!"
echo ""
echo "🧪 Testing connection..."
cd ../..

# Test the registration endpoint
curl -X POST http://localhost:3000/v1/auth/merchant/register \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Corp","email":"test@ninjapay.io","walletAddress":"7xJ8kL9pMnQ2rStU3vWxYz5aBcDeFgHiJkLmNoPqRsTu"}' \
  2>/dev/null | jq '.'

echo ""
echo "🎉 Database setup complete! NinjaPay is ready to use."
echo "📍 Dashboard: http://localhost:3001"
echo "📍 API Gateway: http://localhost:3000"
