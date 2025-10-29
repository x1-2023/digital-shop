#!/bin/bash

##############################################################################
# Database Restore Script for Digital Shop
#
# Usage:
#   ./scripts/restore.sh <backup_name>
#
# Example:
#   ./scripts/restore.sh 20250126_143000
#   ./scripts/restore.sh before_migration
##############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.production.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backup name provided
if [ -z "$1" ]; then
    log_error "Please provide backup name"
    echo "Usage: ./scripts/restore.sh <backup_name>"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR" | grep -E "(db_|app_data_)" | sed 's/\(db_\|app_data_\)//' | sed 's/\..*//' | sort -u
    exit 1
fi

BACKUP_NAME="$1"

# Check if backup exists
DB_BACKUP="$BACKUP_DIR/db_${BACKUP_NAME}.sql.gz"
if [ ! -f "$DB_BACKUP" ]; then
    log_error "Database backup not found: $DB_BACKUP"
    exit 1
fi

# Warning
echo ""
echo "========================================"
log_warn "WARNING: This will overwrite current data!"
echo "========================================"
echo "Backup to restore: $BACKUP_NAME"
echo "Database file: $DB_BACKUP"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

# Stop application to prevent data corruption
log_info "Stopping application..."
docker compose -f "$COMPOSE_FILE" stop app

# Restore PostgreSQL database
log_info "Restoring PostgreSQL database..."
gunzip -c "$DB_BACKUP" | \
docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U postgres -d digital_shop

log_info "Database restored successfully"

# Restore application data
APP_DATA_BACKUP="$BACKUP_DIR/app_data_${BACKUP_NAME}.tar.gz"
if [ -f "$APP_DATA_BACKUP" ]; then
    log_info "Restoring application data..."
    docker run --rm \
        -v shop_app_data:/data \
        -v "$(pwd)/$BACKUP_DIR:/backup:ro" \
        alpine sh -c "cd /data && tar xzf /backup/app_data_${BACKUP_NAME}.tar.gz"
    log_info "Application data restored"
fi

# Restore product files
PRODUCTS_BACKUP="$BACKUP_DIR/products_${BACKUP_NAME}.tar.gz"
if [ -f "$PRODUCTS_BACKUP" ]; then
    log_info "Restoring product files..."
    tar xzf "$PRODUCTS_BACKUP" -C ./public
    log_info "Product files restored"
fi

# Start application
log_info "Starting application..."
docker compose -f "$COMPOSE_FILE" start app

# Wait for application to be ready
log_info "Waiting for application to be ready..."
sleep 5

# Verify health
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log_info "Application is healthy"
else
    log_warn "Application health check failed. Please check logs."
fi

echo ""
echo "========================================"
log_info "Restore completed!"
echo "========================================"
echo "Backup restored: $BACKUP_NAME"
echo ""
log_info "Please verify application functionality"
