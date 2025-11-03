#!/bin/bash

# Deploy script for production server

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart the application (adjust based on your setup)
echo "🔄 Restarting application..."
# If using PM2:
# pm2 restart digital-shop
# If using Docker:
# docker-compose down && docker-compose up -d
# If using systemd:
# sudo systemctl restart digital-shop

echo "✅ Deployment complete!"
