#!/bin/bash

# NinjaPay Database Setup Script
# This script sets up PostgreSQL database for NinjaPay

set -e

echo "🗄️  NinjaPay Database Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Start PostgreSQL if not running
echo -e "${YELLOW}1. Starting PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql
echo -e "${GREEN}✅ PostgreSQL started${NC}"
echo ""

# Check if database already exists
echo -e "${YELLOW}2. Checking if database exists...${NC}"
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='ninjapay'")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  Database 'ninjapay' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        sudo -u postgres psql -c "DROP DATABASE ninjapay;"
        echo -e "${GREEN}✅ Database dropped${NC}"
    else
        echo "Skipping database creation..."
    fi
fi

# Create database if it doesn't exist
if [ "$DB_EXISTS" != "1" ] || [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}3. Creating database 'ninjapay'...${NC}"
    sudo -u postgres psql -c "CREATE DATABASE ninjapay;"
    echo -e "${GREEN}✅ Database created${NC}"
fi
echo ""

# Create user if doesn't exist
echo -e "${YELLOW}4. Setting up database user...${NC}"
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='ninjapay'")

if [ "$USER_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  User 'ninjapay' already exists${NC}"
else
    echo "Creating user 'ninjapay'..."
    sudo -u postgres psql -c "CREATE USER ninjapay WITH PASSWORD 'ninjapay123';"
    echo -e "${GREEN}✅ User created${NC}"
fi
echo ""

# Grant privileges
echo -e "${YELLOW}5. Granting privileges...${NC}"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ninjapay TO ninjapay;"
sudo -u postgres psql -d ninjapay -c "GRANT ALL ON SCHEMA public TO ninjapay;"
echo -e "${GREEN}✅ Privileges granted${NC}"
echo ""

# Update .env file
echo -e "${YELLOW}6. Updating .env file...${NC}"
if [ -f ".env" ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "Backed up .env to .env.backup"

    # Update DATABASE_URL
    if grep -q "DATABASE_URL=" .env; then
        sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"|' .env
    else
        echo 'DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"' >> .env
    fi
    echo -e "${GREEN}✅ .env updated${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"|' .env
fi
echo ""

# Run Prisma migrations
echo -e "${YELLOW}7. Running Prisma migrations...${NC}"
cd packages/database
export DATABASE_URL="postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay?schema=public"

echo "Generating Prisma client..."
pnpm prisma generate

echo "Pushing schema to database..."
pnpm prisma db push --accept-data-loss

echo -e "${GREEN}✅ Database schema created${NC}"
cd ../..
echo ""

# Test connection
echo -e "${YELLOW}8. Testing database connection...${NC}"
if sudo -u postgres psql -d ninjapay -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database credentials:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: ninjapay"
echo "  User: ninjapay"
echo "  Password: ninjapay123"
echo ""
echo "Connection string:"
echo "  postgresql://ninjapay:ninjapay123@localhost:5432/ninjapay"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Restart API Gateway to use the new database"
echo "  2. Go to http://localhost:3001/login"
echo "  3. Register a new merchant account"
echo "  4. Start using NinjaPay!"
echo ""
