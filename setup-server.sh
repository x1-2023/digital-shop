#!/bin/bash

# ==============================================================================
# Setup script cho Digital Shop trên Ubuntu server mới
# ==============================================================================

set -e  # Exit on error

echo "=========================================="
echo "Digital Shop - Server Setup Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Determine user
if [ "$EUID" -eq 0 ]; then
    # Running as root
    TARGET_USER="root"
    TARGET_HOME="/root"
    print_info "Script đang chạy với root"
else
    # Running as normal user
    TARGET_USER=$USER
    TARGET_HOME=$HOME
    print_info "Script đang chạy với user: $TARGET_USER"
fi

# ==============================================================================
# 1. Cài đặt Nginx
# ==============================================================================
echo ""
print_info "Bước 1: Cài đặt Nginx..."

if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
    print_success "Nginx đã được cài đặt"
else
    print_success "Nginx đã có sẵn"
fi

# Start và enable nginx
systemctl start nginx
systemctl enable nginx
print_success "Nginx đã được khởi động và enable auto-start"

# ==============================================================================
# 2. Cài đặt Node.js 20.x với NVM
# ==============================================================================
echo ""
print_info "Bước 2: Cài đặt Node.js 20.x với NVM..."

# Check if nvm exists
NVM_DIR="$TARGET_HOME/.nvm"
if [ -d "$NVM_DIR" ]; then
    print_success "NVM đã có sẵn"
    # Load nvm
    export NVM_DIR="$NVM_DIR"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    print_info "Đang cài NVM cho $TARGET_USER..."

    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

    # Load nvm
    export NVM_DIR="$TARGET_HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    # Add to shell profile if not exists
    BASHRC="$TARGET_HOME/.bashrc"
    if ! grep -q 'NVM_DIR' "$BASHRC" 2>/dev/null; then
        echo '' >> "$BASHRC"
        echo '# NVM' >> "$BASHRC"
        echo 'export NVM_DIR="$HOME/.nvm"' >> "$BASHRC"
        echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> "$BASHRC"
        echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> "$BASHRC"
        print_success "Đã thêm NVM vào $BASHRC"
    fi

    print_success "NVM đã được cài đặt"
fi

# Reload bashrc to apply NVM
if [ -f "$TARGET_HOME/.bashrc" ]; then
    source "$TARGET_HOME/.bashrc" 2>/dev/null || true
fi

# Install Node.js 20 if not exists
if ! command -v node &> /dev/null; then
    print_info "Đang cài Node.js 20..."
    nvm install 20
    nvm use 20
    nvm alias default 20
    print_success "Node.js 20 đã được cài đặt"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js đã có sẵn: $NODE_VERSION"

    # Ensure using Node 20
    if [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
        print_info "Đang chuyển sang Node.js 20..."
        nvm install 20
        nvm use 20
        nvm alias default 20
        print_success "Đã chuyển sang Node.js 20"
    fi
fi

# ==============================================================================
# 3. Cài đặt PM2
# ==============================================================================
echo ""
print_info "Bước 3: Cài đặt PM2..."

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 đã được cài đặt"
else
    print_success "PM2 đã có sẵn"
fi

# ==============================================================================
# 4. Tạo thư mục cần thiết
# ==============================================================================
echo ""
print_info "Bước 4: Tạo thư mục cần thiết..."

# Tạo thư mục cho maintenance page
mkdir -p /var/www
print_success "Thư mục /var/www đã được tạo"

# Tạo thư mục cho Let's Encrypt
mkdir -p /var/www/html/.well-known/acme-challenge
print_success "Thư mục Let's Encrypt đã được tạo"

# ==============================================================================
# 5. Copy nginx config
# ==============================================================================
echo ""
print_info "Bước 5: Copy nginx config..."

# Check if webmmo.net config exists in repo
if [ ! -f "webmmo.net" ]; then
    print_error "Không tìm thấy file webmmo.net trong thư mục hiện tại!"
    print_error "Hãy chạy script này từ thư mục gốc của project (~/digital-shop)"
    exit 1
fi

# Backup old config if exists
if [ -f "/etc/nginx/sites-available/webmmo.net" ]; then
    cp /etc/nginx/sites-available/webmmo.net /etc/nginx/sites-available/webmmo.net.backup-$(date +%Y%m%d-%H%M%S)
    print_success "Đã backup config cũ"
fi

# Copy new config
cp webmmo.net /etc/nginx/sites-available/webmmo.net
print_success "Đã copy nginx config"

# Create symlink
if [ ! -L "/etc/nginx/sites-enabled/webmmo.net" ]; then
    ln -s /etc/nginx/sites-available/webmmo.net /etc/nginx/sites-enabled/webmmo.net
    print_success "Đã tạo symlink"
else
    print_success "Symlink đã tồn tại"
fi

# Remove default site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    print_success "Đã xóa default site"
fi

# Test nginx config
if nginx -t; then
    print_success "Nginx config hợp lệ"
    systemctl reload nginx
    print_success "Đã reload Nginx"
else
    print_error "Nginx config có lỗi! Vui lòng kiểm tra lại."
    exit 1
fi

# ==============================================================================
# 6. Setup maintenance page
# ==============================================================================
echo ""
print_info "Bước 6: Setup maintenance page..."

# Check if maintenance.html exists
if [ ! -f "public/maintenance.html" ]; then
    print_error "Không tìm thấy file public/maintenance.html!"
    exit 1
fi

# Copy maintenance page
cp public/maintenance.html /var/www/maintenance.html
print_success "Đã copy trang bảo trì"

# Make maintenance.sh executable
if [ -f "maintenance.sh" ]; then
    chmod +x maintenance.sh
    print_success "Đã cấp quyền thực thi cho maintenance.sh"
else
    print_error "Không tìm thấy file maintenance.sh!"
fi

# ==============================================================================
# 7. Tạo .env file template
# ==============================================================================
echo ""
print_info "Bước 7: Kiểm tra .env file..."

if [ ! -f ".env" ]; then
    print_info "Tạo file .env template..."
    cat > .env << 'EOF'
DATABASE_URL="file:./data/production.db"
SESSION_SECRET="CHANGE_THIS_TO_RANDOM_32_CHARS_OR_MORE"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@webmmo.net"
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/ADTVC"
NODE_ENV="production"
EOF
    print_success "Đã tạo file .env template"
    print_error "⚠️  Hãy sửa file .env với thông tin thực của bạn!"
else
    print_success ".env file đã tồn tại"
fi

# ==============================================================================
# 8. Install dependencies và build
# ==============================================================================
echo ""
print_info "Bước 8: Install dependencies và build..."

read -p "Bạn có muốn install dependencies và build ngay bây giờ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Đang install dependencies..."
    npm install
    print_success "Dependencies đã được cài đặt"

    print_info "Đang generate Prisma client..."
    npx prisma generate
    print_success "Prisma client đã được generate"

    # Tạo thư mục cần thiết
    mkdir -p data logs public/products/images
    print_success "Đã tạo các thư mục cần thiết"

    print_info "Đang setup database..."
    npx prisma db push
    print_success "Database đã được setup"

    print_info "Đang build production..."
    npm run build
    print_success "Build thành công"
else
    print_info "Bỏ qua install và build. Bạn có thể chạy sau:"
    echo "  npm install"
    echo "  npx prisma generate"
    echo "  mkdir -p data logs public/products/images"
    echo "  npx prisma db push"
    echo "  npm run build"
fi

# ==============================================================================
# 9. Setup PM2
# ==============================================================================
echo ""
print_info "Bước 9: Setup PM2..."

read -p "Bạn có muốn start PM2 ngay bây giờ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Đang start PM2..."
    pm2 start ecosystem.config.js
    print_success "PM2 đã được start"

    print_info "Đang setup PM2 startup..."
    pm2 save
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $TARGET_USER --hp $TARGET_HOME
    print_success "PM2 startup đã được cấu hình"
else
    print_info "Bỏ qua PM2 setup. Bạn có thể chạy sau:"
    echo "  pm2 start ecosystem.config.js"
    echo "  pm2 save"
    echo "  pm2 startup"
fi

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo "=========================================="
echo "✅ Setup hoàn tất!"
echo "=========================================="
echo ""
echo "📋 Các bước tiếp theo:"
echo ""
echo "1. Cấu hình SSL với Let's Encrypt:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d webmmo.net -d www.webmmo.net"
echo ""
echo "2. Kiểm tra .env file và cập nhật thông tin thực:"
echo "   nano .env"
echo ""
echo "3. Nếu chưa build, chạy:"
echo "   npm install && npx prisma generate && npm run build"
echo ""
echo "4. Nếu chưa start PM2, chạy:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Kiểm tra status:"
echo "   pm2 status"
echo "   pm2 logs digital-shop"
echo "   sudo nginx -t"
echo ""
echo "6. Test maintenance mode:"
echo "   ./maintenance.sh on"
echo "   ./maintenance.sh off"
echo ""
echo "=========================================="
echo "📖 Tài liệu: Xem file DEPLOY-PM2.md"
echo "=========================================="
