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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Không chạy script này với root! Chạy với user thường có sudo."
    exit 1
fi

# ==============================================================================
# 1. Cài đặt Nginx
# ==============================================================================
echo ""
print_info "Bước 1: Cài đặt Nginx..."

if ! command -v nginx &> /dev/null; then
    sudo apt update
    sudo apt install -y nginx
    print_success "Nginx đã được cài đặt"
else
    print_success "Nginx đã có sẵn"
fi

# Start và enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx đã được khởi động và enable auto-start"

# ==============================================================================
# 2. Cài đặt Node.js 20.x
# ==============================================================================
echo ""
print_info "Bước 2: Cài đặt Node.js 20.x..."

if ! command -v node &> /dev/null; then
    print_info "Đang cài Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js đã được cài đặt"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js đã có sẵn: $NODE_VERSION"
fi

# ==============================================================================
# 3. Cài đặt PM2
# ==============================================================================
echo ""
print_info "Bước 3: Cài đặt PM2..."

if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
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
sudo mkdir -p /var/www
print_success "Thư mục /var/www đã được tạo"

# Tạo thư mục cho Let's Encrypt
sudo mkdir -p /var/www/html/.well-known/acme-challenge
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
    sudo cp /etc/nginx/sites-available/webmmo.net /etc/nginx/sites-available/webmmo.net.backup-$(date +%Y%m%d-%H%M%S)
    print_success "Đã backup config cũ"
fi

# Copy new config
sudo cp webmmo.net /etc/nginx/sites-available/webmmo.net
print_success "Đã copy nginx config"

# Create symlink
if [ ! -L "/etc/nginx/sites-enabled/webmmo.net" ]; then
    sudo ln -s /etc/nginx/sites-available/webmmo.net /etc/nginx/sites-enabled/webmmo.net
    print_success "Đã tạo symlink"
else
    print_success "Symlink đã tồn tại"
fi

# Remove default site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    print_success "Đã xóa default site"
fi

# Test nginx config
if sudo nginx -t; then
    print_success "Nginx config hợp lệ"
    sudo systemctl reload nginx
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
sudo cp public/maintenance.html /var/www/maintenance.html
print_success "Đã copy trang bảo trì"

# Make maintenance.sh executable
if [ -f "maintenance.sh" ]; then
    chmod +x maintenance.sh
    print_success "Đã cấp quyền thực thi cho maintenance.sh"
else
    print_error "Không tìm thấy file maintenance.sh!"
fi

# ==============================================================================
# 7. Setup UFW Firewall
# ==============================================================================
echo ""
print_info "Bước 7: Cấu hình Firewall..."

if command -v ufw &> /dev/null; then
    # Allow SSH
    sudo ufw allow OpenSSH
    print_success "Đã cho phép SSH"

    # Allow HTTP/HTTPS
    sudo ufw allow 'Nginx Full'
    print_success "Đã cho phép HTTP/HTTPS"

    # Enable UFW (nếu chưa enable)
    if ! sudo ufw status | grep -q "Status: active"; then
        print_info "Bật UFW firewall..."
        echo "y" | sudo ufw enable
        print_success "UFW đã được bật"
    else
        print_success "UFW đã active"
    fi
else
    print_info "UFW chưa được cài đặt, bỏ qua bước này"
fi

# ==============================================================================
# 8. Tạo .env file template
# ==============================================================================
echo ""
print_info "Bước 8: Kiểm tra .env file..."

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
# 9. Install dependencies và build
# ==============================================================================
echo ""
print_info "Bước 9: Install dependencies và build..."

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
# 10. Setup PM2
# ==============================================================================
echo ""
print_info "Bước 10: Setup PM2..."

read -p "Bạn có muốn start PM2 ngay bây giờ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Đang start PM2..."
    pm2 start ecosystem.config.js
    print_success "PM2 đã được start"

    print_info "Đang setup PM2 startup..."
    pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
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
