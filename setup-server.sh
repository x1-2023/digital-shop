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

# ==============================================================================
# Ask for domain name
# ==============================================================================
echo ""
print_info "Cấu hình domain cho website"
echo ""
read -p "Nhập domain của bạn (ví dụ: webmmo.net): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain không được để trống!"
    exit 1
fi

print_success "Domain: $DOMAIN_NAME"
print_info "Sẽ setup cho cả www.$DOMAIN_NAME và $DOMAIN_NAME"

# Ask for email for SSL
echo ""
read -p "Nhập email cho SSL certificate (ví dụ: admin@$DOMAIN_NAME): " SSL_EMAIL

if [ -z "$SSL_EMAIL" ]; then
    print_error "Email không được để trống!"
    exit 1
fi

print_success "Email: $SSL_EMAIL"

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
# 5. Tạo nginx config với domain động
# ==============================================================================
echo ""
print_info "Bước 5: Tạo nginx config cho $DOMAIN_NAME..."

NGINX_CONF="/etc/nginx/sites-available/$DOMAIN_NAME"

# Backup old config if exists
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "$NGINX_CONF.backup-$(date +%Y%m%d-%H%M%S)"
    print_success "Đã backup config cũ"
fi

# Create WebSocket upgrade map config
print_info "Tạo WebSocket config..."
cat > /etc/nginx/conf.d/websocket.conf <<'EOF'
# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
EOF
print_success "WebSocket config đã được tạo"

# Create initial HTTP-only config for certbot
print_info "Tạo config HTTP tạm thời cho Let's Encrypt..."
cat > "$NGINX_CONF" <<EOF
# HTTP server - For Let's Encrypt and redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Let's Encrypt webroot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Temporary allow all for certbot verification
    location / {
        return 200 'Server is ready for SSL setup';
        add_header Content-Type text/plain;
    }
}
EOF

# Remove default site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    print_success "Đã xóa default site"
fi

# Create symlink
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN_NAME" ]; then
    ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN_NAME"
    print_success "Đã tạo symlink"
fi

# Test and reload nginx
if nginx -t; then
    systemctl reload nginx
    print_success "Nginx config tạm thời đã được tạo"
else
    print_error "Nginx config có lỗi!"
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
# 10. Setup SSL với Let's Encrypt
# ==============================================================================
echo ""
print_info "Bước 10: Setup SSL certificate..."

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_info "Cài đặt Certbot..."
    apt install -y certbot python3-certbot-nginx
    print_success "Certbot đã được cài đặt"
fi

echo ""
print_info "⚠️  Quan trọng: Đảm bảo domain $DOMAIN_NAME và www.$DOMAIN_NAME đã trỏ đúng IP server này!"
echo ""
read -p "Domain đã trỏ đúng IP chưa? Tiếp tục setup SSL? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Đang xin SSL certificate từ Let's Encrypt..."

    # Run certbot
    certbot certonly --webroot -w /var/www/html \
        -d $DOMAIN_NAME -d www.$DOMAIN_NAME \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    if [ $? -eq 0 ]; then
        print_success "SSL certificate đã được cấp thành công!"

        # Create final nginx config with SSL
        print_info "Tạo nginx config với SSL..."
        cat > "$NGINX_CONF" <<EOF
# HTTP: Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$DOMAIN_NAME\$request_uri;
    }
}

# HTTPS: Main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL certificates
    ssl_certificate     /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Strict-Transport-Security "max-age=86400; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml;
    gzip_min_length 1024;

    # Proxy to Next.js PM2
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;

        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Static files cache
    location ~* ^/_next/static/ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    client_max_body_size 25m;

    # Health check
    location = /healthz {
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }
}
EOF

        # Update maintenance.sh with correct domain
        if [ -f "maintenance.sh" ]; then
            sed -i "s/webmmo\.net/$DOMAIN_NAME/g" maintenance.sh
            print_success "Đã cập nhật maintenance.sh với domain mới"
        fi

        # Test and reload nginx
        if nginx -t; then
            systemctl reload nginx
            print_success "Nginx đã được cấu hình với SSL!"
        else
            print_error "Nginx config có lỗi!"
            exit 1
        fi

        # Setup auto-renewal
        print_info "Setup auto-renewal SSL certificate..."
        systemctl enable certbot.timer
        systemctl start certbot.timer
        print_success "SSL auto-renewal đã được setup!"

    else
        print_error "Không thể xin SSL certificate!"
        print_info "Vui lòng kiểm tra:"
        echo "  1. Domain đã trỏ đúng IP server chưa?"
        echo "  2. Port 80 có bị firewall block không?"
        echo "  3. Nginx có đang chạy không?"
        echo ""
        print_info "Bạn có thể chạy lại sau:"
        echo "  certbot certonly --webroot -w /var/www/html -d $DOMAIN_NAME -d www.$DOMAIN_NAME --email $SSL_EMAIL"
    fi
else
    print_info "Bỏ qua SSL setup. Bạn có thể chạy sau:"
    echo "  certbot certonly --webroot -w /var/www/html -d $DOMAIN_NAME -d www.$DOMAIN_NAME --email $SSL_EMAIL"
fi

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo "=========================================="
echo "✅ Setup hoàn tất!"
echo "=========================================="
echo ""
echo "📝 Thông tin hệ thống:"
echo "   Domain: $DOMAIN_NAME"
echo "   SSL Email: $SSL_EMAIL"
echo "   User: $TARGET_USER"
echo "   Home: $TARGET_HOME"
echo ""
echo "🌐 Website của bạn:"
echo "   https://$DOMAIN_NAME"
echo "   https://www.$DOMAIN_NAME"
echo ""
echo "📋 Các lệnh hữu ích:"
echo ""
echo "1. Kiểm tra PM2:"
echo "   pm2 status"
echo "   pm2 logs digital-shop"
echo "   pm2 restart digital-shop"
echo ""
echo "2. Kiểm tra Nginx:"
echo "   nginx -t"
echo "   systemctl status nginx"
echo "   systemctl reload nginx"
echo ""
echo "3. Kiểm tra SSL:"
echo "   certbot certificates"
echo "   certbot renew --dry-run"
echo ""
echo "4. Maintenance mode:"
echo "   ./maintenance.sh on   # Bật"
echo "   ./maintenance.sh off  # Tắt"
echo ""
echo "5. Deploy code mới:"
echo "   git pull"
echo "   npm install"
echo "   npm run build"
echo "   pm2 reload digital-shop"
echo ""
echo "⚠️  Nhớ sửa file .env với thông tin thật của bạn!"
echo ""
echo "=========================================="
echo "📖 Tài liệu: Xem file DEPLOY-PM2.md"
echo "=========================================="
