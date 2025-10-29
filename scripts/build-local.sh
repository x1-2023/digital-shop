#!/bin/bash
# ==============================================================================
# Build Docker image locally and export for server deployment
# ==============================================================================

set -e  # Exit on error

PROJECT_NAME="shop-app"
VERSION=$(date +%Y%m%d-%H%M%S)
IMAGE_NAME="${PROJECT_NAME}:${VERSION}"
EXPORT_FILE="${PROJECT_NAME}-${VERSION}.tar.gz"

echo "======================================================================"
echo "🔨 Building Docker Image: ${IMAGE_NAME}"
echo "======================================================================"

# Build image
docker build -t ${IMAGE_NAME} -f Dockerfile.production .

# Also tag as latest
docker tag ${IMAGE_NAME} ${PROJECT_NAME}:latest

echo ""
echo "======================================================================"
echo "💾 Exporting image to: ${EXPORT_FILE}"
echo "======================================================================"

# Save and compress
docker save ${IMAGE_NAME} | gzip > ${EXPORT_FILE}

# Get file size
SIZE=$(du -h ${EXPORT_FILE} | cut -f1)

echo ""
echo "======================================================================"
echo "✅ Build Complete!"
echo "======================================================================"
echo "Image: ${IMAGE_NAME}"
echo "File: ${EXPORT_FILE}"
echo "Size: ${SIZE}"
echo ""
echo "Next steps:"
echo "1. Upload to server:"
echo "   scp ${EXPORT_FILE} root@YOUR-SERVER-IP:~/"
echo ""
echo "2. On server, load image:"
echo "   docker load < ~/${EXPORT_FILE}"
echo ""
echo "3. Deploy:"
echo "   cd ~/apps/shop"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo "======================================================================"
