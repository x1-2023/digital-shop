#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Backup database
echo "🗄️  Backing up database..."
cp prisma/production.db prisma/production.db.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No existing database to backup"

# Sync database schema
echo "🗄️  Syncing database schema..."
npx prisma db push

# Generate Prisma Client
echo "⚙️  Generating Prisma Client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

# Make cron script executable
echo "🔧 Setting permissions..."
chmod +x scripts/auto-topup-cron.js

# Restart PM2 with updated config
echo "🔄 Restarting PM2..."
pm2 restart ecosystem.config.js --update-env

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "📋 View Logs:"
echo "  Main app:  pm2 logs digital-shop"
echo "  Cron job:  pm2 logs auto-topup-cron"
echo "  All logs:  pm2 logs"
