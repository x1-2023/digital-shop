# Hướng dẫn Deploy Auto-topup Cron

## Thay đổi từ PM2 Cron sang Daemon

### Trước đây (PM2 Cron)
- Process chạy mỗi 5 phút rồi tự exit
- Status luôn hiển thị "stopped"
- Khó theo dõi xem có đang chạy không

### Bây giờ (Long-running Daemon)
- Process luôn chạy liên tục
- Status hiển thị "online"
- Sử dụng node-cron bên trong để schedule

## Cách deploy trên server

### 1. Pull code mới về server

```bash
cd /root/digital-shop
git pull origin main
```

### 2. Install dependencies (nếu cần)

```bash
npm install node-cron
```

### 3. Stop process cũ và reload PM2

```bash
# Stop process cũ
pm2 stop auto-topup-cron

# Reload config mới
pm2 reload ecosystem.config.js

# Hoặc delete và start lại
pm2 delete auto-topup-cron
pm2 start ecosystem.config.js --only auto-topup-cron
```

### 4. Kiểm tra status

```bash
pm2 list
```

Bạn sẽ thấy `auto-topup-cron` có status là `online` thay vì `stopped`.

### 5. Xem logs

```bash
# Xem logs real-time
pm2 logs auto-topup-cron

# Xem logs với filter
pm2 logs auto-topup-cron --lines 100
```

## Cấu hình

### Thời gian chạy
Mặc định: mỗi 5 phút

Để thay đổi, sửa trong file `scripts/auto-topup-daemon.js`:

```javascript
// Hiện tại: */5 * * * * (mỗi 5 phút)
const task = cron.schedule('*/5 * * * *', () => {

// Ví dụ thay đổi:
// */1 * * * *  - Mỗi 1 phút
// */10 * * * * - Mỗi 10 phút
// 0 * * * *    - Mỗi giờ
// 0 0 * * *    - Mỗi ngày lúc 0h
```

### Timezone
Mặc định: Asia/Ho_Chi_Minh

Để thay đổi timezone, sửa trong `scripts/auto-topup-daemon.js`:

```javascript
cron.schedule('*/5 * * * *', () => {
  runAutoTopup();
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh" // Đổi timezone ở đây
});
```

## Monitoring

### Kiểm tra process đang chạy

```bash
pm2 show auto-topup-cron
```

### Restart nếu cần

```bash
pm2 restart auto-topup-cron
```

### Xem metrics

```bash
pm2 monit
```

## Troubleshooting

### Process bị stopped
```bash
pm2 restart auto-topup-cron
pm2 logs auto-topup-cron --err
```

### Process restart liên tục
Kiểm tra logs xem có lỗi gì:
```bash
pm2 logs auto-topup-cron --lines 200
```

### Test thủ công
```bash
# Test API endpoint trực tiếp
curl -X POST http://localhost:3000/api/cron/auto-topup
```

## Files quan trọng

- `scripts/auto-topup-daemon.js` - Daemon script chính
- `scripts/auto-topup-cron.js` - Script cũ (có thể xóa sau khi deploy xong)
- `ecosystem.config.js` - PM2 configuration
- `src/app/api/cron/auto-topup/route.ts` - API endpoint
