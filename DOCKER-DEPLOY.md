# Docker Deployment Guide - Digital Shop

## ✅ TẤT CẢ TRƯỜNG HỢP ĐÃ ĐƯỢC XỬ LÝ TỰ ĐỘNG

### 🎯 Đặc điểm của giải pháp này:

#### ✅ **Lần chạy đầu tiên** (Fresh deployment)
- Script tự động tạo database mới từ schema
- Tạo tất cả các bảng cần thiết
- Không cần chạy lệnh migration thủ công

#### ✅ **Các lần chạy tiếp theo** (Normal operation)
- Database được lưu trong Docker Volume (persistent)
- Script chỉ sync schema nếu có thay đổi
- Không bị mất dữ liệu khi restart

#### ✅ **Server Reboot** (Automatic restart)
- Docker có setting `restart: unless-stopped`
- Container tự động khởi động khi server boot
- Không cần can thiệp thủ công

#### ✅ **Update Code/Schema** (Deployment update)
- Pull code mới → rebuild container
- Script tự động sync schema changes
- Zero-downtime với blue-green deployment (nếu cần)

---

## 📋 DEPLOYMENT STEPS

### Bước 1: Chuẩn bị Server

```bash
# Cài Docker & Docker Compose (nếu chưa có)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Kiểm tra
docker --version
docker compose version
```

### Bước 2: Upload Code

**Cách 1: Git (Khuyên dùng)**
```bash
cd ~
git clone <your-repo-url> digital-shop
cd digital-shop
```

**Cách 2: SCP**
```bash
# Từ Windows
scp -r E:\Agent-Code\Shop root@your-server:/root/digital-shop
```

### Bước 3: Tạo .env.production

```bash
cd ~/digital-shop

cat > .env.production << 'EOF'
# Database (MUST point to /app/data for volume persistence)
DATABASE_URL="file:/app/data/production.db"

# JWT Session Secret (Generate: openssl rand -hex 32)
SESSION_SECRET="your-secret-key-min-32-chars-here"

# Email (Optional)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Contact
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/yourgroup"

# Environment
NODE_ENV="production"
EOF

# Generate new SESSION_SECRET
openssl rand -hex 32
# Copy output và paste vào SESSION_SECRET trong .env.production
```

### Bước 4: Deploy

```bash
# First time deployment
docker compose up -d --build

# Xem logs
docker compose logs -f app
```

**Kết quả mong đợi:**
```
===================================
Digital Shop - Container Starting
===================================
[1/4] Checking database directory...
      ✓ Database directory OK
[2/4] Setting up database...
      → Database not found, creating...
      ✓ Database created
[3/4] Verifying database connection...
      ✓ Connection OK

[4/4] Starting Next.js server...
===================================

▲ Next.js 15.5.6
- Local:        http://localhost:3000
✓ Ready in 349ms
```

---

## 🔄 CÁC LỆNH THƯỜNG DÙNG

### Xem logs
```bash
docker compose logs -f app           # Realtime
docker compose logs --tail=100 app   # 100 dòng cuối
```

### Restart
```bash
docker compose restart app
```

### Stop
```bash
docker compose stop
docker compose down  # Stop và xóa container
```

### Update code và redeploy
```bash
git pull                              # Pull code mới
docker compose down                   # Stop container cũ
docker compose up -d --build          # Build và chạy mới
docker compose logs -f app            # Xem logs
```

### Vào container để debug
```bash
docker exec -it digital-shop-app sh

# Trong container:
ls -la /app/data                      # Kiểm tra database
npx prisma studio                     # Mở Prisma Studio
exit
```

### Backup database
```bash
# Backup
docker cp digital-shop-app:/app/data/production.db ./backup-$(date +%Y%m%d-%H%M%S).db

# Restore
docker cp ./backup-20241030.db digital-shop-app:/app/data/production.db
docker compose restart app
```

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Unable to open the database file"
**Nguyên nhân:** Volume permission hoặc DATABASE_URL sai

**Giải pháp:**
```bash
# 1. Kiểm tra DATABASE_URL
cat .env.production | grep DATABASE_URL
# Phải là: DATABASE_URL="file:/app/data/production.db"

# 2. Xóa volume và tạo lại
docker compose down
docker volume rm digital-shop_app_data
docker compose up -d --build
```

### Container không tự khởi động sau khi reboot
**Nguyên nhân:** Docker service chưa enable

**Giải pháp:**
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### Port 5000 đã được sử dụng
**Giải pháp:**
```bash
# Cách 1: Kill process đang dùng port
sudo lsof -i :5000
sudo kill -9 <PID>

# Cách 2: Đổi port trong docker-compose.yml
# Sửa dòng: "5000:3000" thành "8080:3000"
```

### Database bị corrupt
**Giải pháp:**
```bash
# 1. Backup database hiện tại (nếu có thể)
docker cp digital-shop-app:/app/data/production.db ./corrupt-backup.db

# 2. Xóa database và tạo mới
docker compose down
docker volume rm digital-shop_app_data
docker compose up -d --build

# 3. Restore từ backup cũ (nếu có)
docker cp ./backup-old.db digital-shop-app:/app/data/production.db
docker compose restart app
```

---

## 🚀 PRODUCTION CHECKLIST

- [ ] Đã generate SESSION_SECRET mới (không dùng mặc định)
- [ ] Đã cấu hình RESEND_API_KEY cho email
- [ ] Đã setup Nginx reverse proxy (khuyên dùng)
- [ ] Đã setup SSL certificate (Let's Encrypt)
- [ ] Đã cấu hình firewall (UFW)
- [ ] Đã setup backup tự động cho database
- [ ] Đã test restart server (reboot)
- [ ] Đã setup monitoring (optional: Uptime Kuma, Grafana)

---

## 📊 MONITORING

### Xem resource usage
```bash
docker stats digital-shop-app
```

### Setup backup tự động (crontab)
```bash
# Tạo script backup
cat > /root/backup-digital-shop.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/digital-shop"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d-%H%M%S)
docker cp digital-shop-app:/app/data/production.db $BACKUP_DIR/db-$DATE.db
# Giữ lại 7 ngày backup
find $BACKUP_DIR -name "db-*.db" -mtime +7 -delete
EOF

chmod +x /root/backup-digital-shop.sh

# Thêm vào crontab (backup mỗi ngày 3AM)
crontab -e
# Thêm dòng:
# 0 3 * * * /root/backup-digital-shop.sh
```

---

## 🔐 SECURITY

### Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📝 NOTES

1. **Database Location:** `/app/data/production.db` (inside container)
2. **Volume Name:** `digital-shop_app_data`
3. **Port Mapping:** `5000:3000` (host:container)
4. **Auto-restart:** Enabled (`restart: unless-stopped`)
5. **Health Check:** Tự động kiểm tra mỗi 30s

---

**Bạn đã có một hệ thống production-ready với:**
- ✅ Auto database migration
- ✅ Auto restart on server reboot
- ✅ Persistent data với Docker volumes
- ✅ Health checks
- ✅ Easy backup & restore

**Enjoy! 🎉**
