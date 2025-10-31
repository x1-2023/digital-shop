#!/bin/bash

# Script để bật/tắt maintenance mode

NGINX_CONF="/etc/nginx/sites-available/webmmo.net"
NGINX_CONF_BACKUP="/etc/nginx/sites-available/webmmo.net.backup"
MAINTENANCE_FILE="/var/www/maintenance.html"

case "$1" in
    on)
        echo "🔧 Bật maintenance mode..."

        # Backup config hiện tại
        sudo cp "$NGINX_CONF" "$NGINX_CONF_BACKUP"

        # Copy file maintenance
        sudo cp public/maintenance.html "$MAINTENANCE_FILE"

        # Tạo nginx config cho maintenance (giữ SSL)
        sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
# HTTP: Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name webmmo.net www.webmmo.net;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://webmmo.net$request_uri;
    }
}

# HTTPS: Maintenance mode
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webmmo.net www.webmmo.net;

    ssl_certificate     /etc/letsencrypt/live/webmmo.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webmmo.net/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;

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
        echo "📝 Trang bảo trì: https://webmmo.net"
        ;;

    off)
        echo "🚀 Tắt maintenance mode..."

        # Khôi phục từ backup (hoặc dùng config từ repo)
        if [ -f "$NGINX_CONF_BACKUP" ]; then
            sudo cp "$NGINX_CONF_BACKUP" "$NGINX_CONF"
            echo "📋 Khôi phục config từ backup"
        else
            # Fallback: tạo config mới từ file webmmo.net trong repo
            if [ -f "webmmo.net" ]; then
                sudo cp webmmo.net "$NGINX_CONF"
                echo "📋 Khôi phục config từ webmmo.net"
            else
                echo "❌ Không tìm thấy backup! Tạo config mặc định..."
                sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
# HTTP: Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name webmmo.net www.webmmo.net;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://webmmo.net$request_uri;
    }
}

# HTTPS: Proxy to PM2
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webmmo.net www.webmmo.net;

    ssl_certificate     /etc/letsencrypt/live/webmmo.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webmmo.net/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }

    client_max_body_size 25m;
}
EOF
            fi
        fi

        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx

        echo "✅ Maintenance mode đã TẮT"
        echo "🌐 Website đang chạy bình thường: https://webmmo.net"
        ;;

    *)
        echo "Usage: $0 {on|off}"
        echo "  on  - Bật maintenance mode"
        echo "  off - Tắt maintenance mode và khôi phục website"
        exit 1
        ;;
esac
