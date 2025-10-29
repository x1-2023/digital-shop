#!/bin/bash
# ==============================================================================
# Deploy to remote server (LXC/VPS)
# ==============================================================================

# Configuration
SERVER_IP="YOUR_LXC_IP"  # Thay đổi IP của bạn
SERVER_USER="root"
SERVER_PATH="~/apps/shop"

# Get latest image file
IMAGE_FILE=$(ls -t shop-app-*.tar.gz 2>/dev/null | head -1)

if [ -z "$IMAGE_FILE" ]; then
    echo "❌ No image file found! Run ./build-local.sh first"
    exit 1
fi

echo "======================================================================"
echo "🚀 Deploying to server: ${SERVER_USER}@${SERVER_IP}"
echo "======================================================================"
echo "Image: ${IMAGE_FILE}"
echo ""

# 1. Upload image
echo "📤 [1/4] Uploading Docker image..."
scp ${IMAGE_FILE} ${SERVER_USER}@${SERVER_IP}:~/

# 2. Upload configs
echo "📤 [2/4] Uploading configs..."
scp .env.production ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env.production
scp docker-compose.prod.yml ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
scp -r nginx/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

# 3. Load image on server
echo "🐳 [3/4] Loading image on server..."
ssh ${SERVER_USER}@${SERVER_IP} "docker load < ~/${IMAGE_FILE}"

# 4. Deploy
echo "🚀 [4/4] Starting services..."
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && docker compose -f docker-compose.prod.yml up -d"

echo ""
echo "======================================================================"
echo "✅ Deploy Complete!"
echo "======================================================================"
echo "Check status:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'docker compose -f ${SERVER_PATH}/docker-compose.prod.yml ps'"
echo ""
echo "View logs:"
echo "  ssh ${SERVER_USER}@${SERVER_IP} 'docker compose -f ${SERVER_PATH}/docker-compose.prod.yml logs -f app'"
echo "======================================================================"
