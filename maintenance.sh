#!/bin/bash

# Script để bật/tắt maintenance mode

NGINX_CONF="/etc/nginx/sites-available/digital-shop"
MAINTENANCE_FILE="/var/www/maintenance.html"

case "$1" in
    on)
        echo "🔧 Bật maintenance mode..."

        # Copy file maintenance
        sudo cp public/maintenance.html "$MAINTENANCE_FILE"

        # Tạo nginx config cho maintenance
        sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name webmmo.net www.webmmo.net;

    root /var/www;

    location / {
        return 503;
    }

    error_page 503 @maintenance;
    location @maintenance {
        rewrite ^(.*)$ /maintenance.html break;
    }
}
EOF

        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx

        echo "✅ Maintenance mode đã BẬT"
        echo "📝 Trang bảo trì: http://your-domain.com"
        ;;

    off)
        echo "🚀 Tắt maintenance mode..."

        # Khôi phục nginx config bình thường
        sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name webmmo.net www.webmmo.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx

        echo "✅ Maintenance mode đã TẮT"
        echo "🌐 Website đang chạy bình thường"
        ;;

    *)
        echo "Usage: $0 {on|off}"
        echo "  on  - Bật maintenance mode"
        echo "  off - Tắt maintenance mode và khôi phục website"
        exit 1
        ;;
esac
