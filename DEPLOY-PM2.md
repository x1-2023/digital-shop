# Deploy với PM2 (Không dùng Docker)

## 1. Cài đặt môi trường

### Cài Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # v20.x
npm --version
```

### Cài PM2

```bash
# Cài PM2 global
sudo npm install -g pm2

# Verify
pm2 --version
```

### Cài Nginx (nếu chưa có)

```bash
sudo apt update
sudo apt install -y nginx
```

---

## 2. Clone và Setup Project

```bash
# Clone repository
cd ~
git clone https://github.com/x1-2023/digital-shop.git
cd digital-shop

# Tạo .env file
nano .env
```

Nội dung `.env`:

```env
DATABASE_URL="file:./data/production.db"
SESSION_SECRET="your-secret-key-min-32-chars"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@yourdomain.com"
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/your_channel"
NODE_ENV="production"
```

```bash
# Cài dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Tạo thư mục data và logs
mkdir -p data logs public/products/images

# Setup database
npx prisma db push

# Build production
npm run build
```

---

## 3. Chạy với PM2

```bash
# Start app với PM2
pm2 start ecosystem.config.js

# Xem status
pm2 status

# Xem logs
pm2 logs digital-shop

# Lưu PM2 để auto-start khi reboot
pm2 save
pm2 startup
# Copy và chạy command mà PM2 xuất ra
```

### Các lệnh PM2 cơ bản

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop digital-shop

# Restart
pm2 restart digital-shop

# Reload (zero-downtime)
pm2 reload digital-shop

# Delete
pm2 delete digital-shop

# Xem logs realtime
pm2 logs digital-shop

# Xem logs lỗi
pm2 logs digital-shop --err

# Xem monitoring
pm2 monit

# Xem chi tiết app
pm2 show digital-shop
```

---

## 4. Cấu hình Nginx

```bash
# Tạo config file
sudo nano /etc/nginx/sites-available/digital-shop
```

Nội dung:

```nginx
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

    # Tăng upload size nếu cần
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/digital-shop /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 5. Cài SSL với Let's Encrypt (Optional)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d webmmo.net -d www.webmmo.net

# Auto-renewal đã được setup sẵn
# Test renewal
sudo certbot renew --dry-run
```

---

## 6. Workflow Deploy/Update

### Cập nhật code mới

```bash
cd ~/digital-shop

# Bật maintenance mode (nếu muốn)
chmod +x maintenance.sh
./maintenance.sh on

# Pull code mới
git pull

# Cài dependencies mới (nếu có)
npm install

# Generate Prisma nếu schema thay đổi
npx prisma generate
npx prisma db push

# Build lại
npm run build

# Reload PM2 (zero-downtime)
pm2 reload digital-shop

# Tắt maintenance mode
./maintenance.sh off

# Xem logs để verify
pm2 logs digital-shop --lines 50
```

### Deploy nhanh (không maintenance)

```bash
cd ~/digital-shop
git pull
npm install
npm run build
pm2 reload digital-shop
```

---

## 7. Maintenance Mode

### Bật maintenance mode

```bash
# Cấp quyền thực thi
chmod +x maintenance.sh

# Bật maintenance
./maintenance.sh on
```

Khi bật, website sẽ hiển thị trang bảo trì đẹp với:
- Thông báo đang bảo trì
- Animation loading
- Link liên hệ Telegram

### Tắt maintenance mode

```bash
./maintenance.sh off
```

### Tùy chỉnh trang maintenance

Chỉnh sửa file `public/maintenance.html` để thay đổi:
- Tiêu đề
- Nội dung thông báo
- Link Telegram
- Màu sắc, giao diện

---

## 8. Monitoring và Logs

### Xem logs

```bash
# PM2 logs (realtime)
pm2 logs digital-shop

# PM2 logs (last 100 lines)
pm2 logs digital-shop --lines 100

# File logs
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# Xem CPU/Memory usage
pm2 show digital-shop

# List processes
pm2 list
```

---

## 9. Backup Database

```bash
# Backup database
cp ~/digital-shop/data/production.db ~/backup-$(date +%Y%m%d-%H%M%S).db

# Hoặc tạo script backup tự động
mkdir -p ~/backups

# Thêm vào crontab để backup hàng ngày
crontab -e

# Thêm dòng này (backup lúc 2h sáng mỗi ngày)
0 2 * * * cp ~/digital-shop/data/production.db ~/backups/backup-$(date +\%Y\%m\%d).db
```

---

## 10. Troubleshooting

### App không start

```bash
# Xem lỗi chi tiết
pm2 logs digital-shop --err

# Check port 3000 có bị chiếm không
sudo lsof -i :3000

# Kill process nếu cần
sudo kill -9 <PID>

# Restart PM2
pm2 restart digital-shop
```

### Database lỗi

```bash
cd ~/digital-shop

# Sync schema
npx prisma db push --accept-data-loss

# Hoặc reset database (XÓA DATA!)
# Backup trước!
npx prisma db push --force-reset
```

### Nginx lỗi

```bash
# Test config
sudo nginx -t

# Xem error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### PM2 không auto-start sau reboot

```bash
# Re-setup startup
pm2 unstartup
pm2 startup
# Copy và chạy command được xuất ra

# Save lại
pm2 save
```

---

## 11. Performance Tips

### Tăng số instances (cluster mode)

Chỉnh file `ecosystem.config.js`:

```js
instances: 2, // Hoặc 'max' để dùng hết CPU cores
```

Sau đó:

```bash
pm2 reload digital-shop
```

### Clear logs định kỳ

```bash
# Clear PM2 logs
pm2 flush

# Hoặc setup auto-rotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 12. So sánh Docker vs PM2

| Feature | Docker | PM2 |
|---------|--------|-----|
| **Disk usage** | Cao (images, layers) | Thấp (chỉ code) |
| **Memory** | Cao hơn | Thấp hơn |
| **Build time** | Lâu (1-3 phút) | Nhanh (30s) |
| **Deploy speed** | Chậm (rebuild) | Nhanh (reload) |
| **Zero-downtime** | Cần config thêm | Built-in `pm2 reload` |
| **Auto-restart** | Có | Có |
| **Monitoring** | Cần tools thêm | Built-in |
| **Logs** | `docker logs` | `pm2 logs` |
| **Easy to debug** | Khó hơn | Dễ hơn |

**Kết luận:** PM2 phù hợp hơn cho VPS nhỏ (1-2GB RAM, 20GB disk).

---

## 13. Checklist Production

- [ ] Node.js 20.x installed
- [ ] PM2 installed và configured
- [ ] Nginx installed và configured
- [ ] SSL certificate setup (Let's Encrypt)
- [ ] `.env` file với production values
- [ ] Database được setup và migrate
- [ ] PM2 startup enabled (auto-start on reboot)
- [ ] Backup script được setup
- [ ] Firewall configured (UFW)
- [ ] Domain DNS pointed to server IP
- [ ] Test maintenance mode works
- [ ] Monitor logs for errors

---

## 14. Quick Reference

```bash
# Deploy workflow
cd ~/digital-shop
./maintenance.sh on
git pull
npm install
npm run build
pm2 reload digital-shop
./maintenance.sh off

# Emergency restart
pm2 restart digital-shop

# Check status
pm2 status
pm2 logs digital-shop --lines 50
sudo systemctl status nginx

# Backup
cp data/production.db ~/backup-$(date +%Y%m%d).db
```
