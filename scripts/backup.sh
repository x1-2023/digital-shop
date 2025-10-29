#!/bin/bash

##############################################################################
# Database Backup Script for Digital Shop
#
# Usage:
#   ./scripts/backup.sh [backup_name]
#
# Example:
#   ./scripts/backup.sh before_migration
#   ./scripts/backup.sh daily
##############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-$DATE}"
COMPOSE_FILE="docker-compose.production.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Starting backup: $BACKUP_NAME"

# Check if Docker Compose is running
if ! docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log_warn "Some containers are not running. Backup may be incomplete."
fi

# Backup PostgreSQL database
log_info "Backing up PostgreSQL database..."
if docker compose -f "$COMPOSE_FILE" ps | grep -q "postgres.*Up"; then
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U postgres digital_shop > "$BACKUP_DIR/db_${BACKUP_NAME}.sql"

    # Compress the SQL dump
    gzip "$BACKUP_DIR/db_${BACKUP_NAME}.sql"
    log_info "Database backup saved: db_${BACKUP_NAME}.sql.gz"
else
    log_error "PostgreSQL container is not running!"
fi

# Backup SQLite database (if exists)
if [ -f "./prisma/dev.db" ]; then
    log_info "Backing up SQLite database..."
    cp "./prisma/dev.db" "$BACKUP_DIR/sqlite_${BACKUP_NAME}.db"
    gzip "$BACKUP_DIR/sqlite_${BACKUP_NAME}.db"
    log_info "SQLite backup saved: sqlite_${BACKUP_NAME}.db.gz"
fi

# Backup Docker volumes
log_info "Backing up application data..."
docker run --rm \
    -v shop_app_data:/data:ro \
    -v "$(pwd)/$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/app_data_${BACKUP_NAME}.tar.gz" -C /data .

log_info "Application data backup saved: app_data_${BACKUP_NAME}.tar.gz"

# Backup product files
if [ -d "./public/products" ]; then
    log_info "Backing up product files..."
    tar czf "$BACKUP_DIR/products_${BACKUP_NAME}.tar.gz" -C ./public products
    log_info "Product files backup saved: products_${BACKUP_NAME}.tar.gz"
fi

# Calculate backup sizes
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# Summary
echo ""
echo "========================================"
log_info "Backup completed successfully!"
echo "========================================"
echo "Backup location: $BACKUP_DIR"
echo "Backup name: $BACKUP_NAME"
echo "Total backup size: $TOTAL_SIZE"
echo ""

# List backup files
log_info "Backup files:"
ls -lh "$BACKUP_DIR" | grep "$BACKUP_NAME"

# Cleanup old backups (keep last 30 days)
log_info "Cleaning up old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete

log_info "Cleanup completed"

echo ""
log_info "To restore from this backup, use:"
echo "  ./scripts/restore.sh $BACKUP_NAME"
