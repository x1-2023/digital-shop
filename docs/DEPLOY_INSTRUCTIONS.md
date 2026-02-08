# 🚀 Deployment Instructions

## Trên Ubuntu Server:

### 1. Pull code mới:
```bash
cd /path/to/your/app
git pull origin main
```

### 2. Chạy script deploy:
```bash
chmod +x deploy.sh
./deploy.sh
```

Script sẽ tự động:
- ✅ Pull code mới
- ✅ Install dependencies
- ✅ Backup database
- ✅ Sync database schema (Prisma)
- ✅ Generate Prisma Client
- ✅ Build Next.js
- ✅ Set permissions cho cron script
- ✅ Restart PM2 với config mới

### 3. Kiểm tra PM2 status:
```bash
pm2 list
```

Bạn sẽ thấy 2 processes:
- `digital-shop` - Main Next.js app
- `auto-topup-cron` - Cron job chạy mỗi 5 phút

### 4. Xem logs:
```bash
# Main app logs
pm2 logs digital-shop

# Cron job logs
pm2 logs auto-topup-cron

# All logs
pm2 logs
```

### 5. Kiểm tra cron job có chạy không:
```bash
# Xem log cron
tail -f logs/cron-out.log
```

## PM2 Commands hữu ích:

```bash
# Restart all
pm2 restart all

# Restart một app
pm2 restart digital-shop

# Stop một app
pm2 stop auto-topup-cron

# Start lại
pm2 start ecosystem.config.js

# Xem thông tin chi tiết
pm2 show digital-shop
pm2 show auto-topup-cron

# Monitor real-time
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 startup (chạy khi server khởi động)
pm2 startup
```

## Cron Job Configuration:

Cron chạy mỗi **5 phút** để check auto-topup.

Muốn thay đổi tần suất? Edit `ecosystem.config.js`:

```javascript
cron_restart: '*/5 * * * *', // Mỗi 5 phút
// hoặc:
cron_restart: '*/10 * * * *', // Mỗi 10 phút
cron_restart: '*/1 * * * *',  // Mỗi 1 phút
cron_restart: '0 * * * *',    // Mỗi giờ
```

Sau khi sửa, restart PM2:
```bash
pm2 restart ecosystem.config.js --update-env
```

## Troubleshooting:

### Cron không chạy?
```bash
# Check logs
pm2 logs auto-topup-cron

# Restart cron
pm2 restart auto-topup-cron

# Delete và start lại
pm2 delete auto-topup-cron
pm2 start ecosystem.config.js
```

### Database migration failed?
```bash
# Restore backup
cp prisma/production.db.backup.YYYYMMDD_HHMMSS prisma/production.db

# Try migration again
npx prisma db push
```

### Port đã được sử dụng?
```bash
# Check port 3000
lsof -i :3000
# hoặc
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>
```

## Tính năng mới trong update này:

### 1. Hệ thống bảo hành 2 chiều
- User có thể tick checkbox để báo lỗi sản phẩm
- Admin nhận được thông báo real-time
- Admin có thể thay thế hoặc từ chối bảo hành
- User thấy ngay sản phẩm được thay thế

### 2. PM2 Cron Job
- Tự động check TPBank mỗi 5 phút
- Auto-topup cho user
- Logs chi tiết trong `logs/cron-out.log`

### 3. Database Schema Changes
- Thêm model `ProductLineItem`
- Enum `ProductLineStatus`
- Enum `ErrorReportStatus`

### 4. 30-day auto-delete warning
- Cảnh báo user đơn hàng sẽ bị xóa sau 30 ngày
- Admin cũng thấy warning

## Quick Start (First Time):

```bash
# Clone repo
git clone <repo-url>
cd digital-shop

# Install PM2 globally
npm install -g pm2

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env với thông tin của bạn

# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Build app
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the command it shows
```

Done! App đang chạy tại `http://localhost:3000`
