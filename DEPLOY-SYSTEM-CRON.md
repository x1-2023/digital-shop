# Hướng dẫn Setup Auto-topup với System Crontab

## Tại sao dùng System Crontab thay vì PM2?

- ✅ Đơn giản hơn, ổn định hơn
- ✅ Không bị stop bất ngờ
- ✅ Log rõ ràng, dễ debug
- ✅ Tích hợp sẵn với Ubuntu, không cần PM2

## Setup trên Server (Ubuntu)

### Bước 1: Pull code và chuẩn bị

```bash
cd /root/digital-shop
git pull origin main

# Make script executable
chmod +x scripts/auto-topup-simple.sh

# Test thử script
./scripts/auto-topup-simple.sh
```

### Bước 2: Stop PM2 cron (nếu đang chạy)

```bash
# Xem list PM2
pm2 list

# Delete auto-topup-cron nếu có
pm2 delete auto-topup-cron

# Save PM2
pm2 save
```

### Bước 3: Setup system crontab

```bash
# Mở crontab editor
crontab -e

# Thêm dòng này vào cuối file (chạy mỗi 5 phút)
*/5 * * * * /root/digital-shop/scripts/auto-topup-simple.sh

# Save và exit (Ctrl+X, Y, Enter nếu dùng nano)
```

### Bước 4: Verify crontab đã được thêm

```bash
# Xem crontab hiện tại
crontab -l
```

Bạn sẽ thấy:
```
*/5 * * * * /root/digital-shop/scripts/auto-topup-simple.sh
```

### Bước 5: Kiểm tra logs

```bash
# Xem log auto-topup
tail -f /root/digital-shop/logs/auto-topup.log

# Hoặc xem 50 dòng cuối
tail -n 50 /root/digital-shop/logs/auto-topup.log
```

## Các Options Crontab

### Thay đổi tần suất chạy

```bash
# Mỗi 1 phút
*/1 * * * * /root/digital-shop/scripts/auto-topup-simple.sh

# Mỗi 5 phút (mặc định)
*/5 * * * * /root/digital-shop/scripts/auto-topup-simple.sh

# Mỗi 10 phút
*/10 * * * * /root/digital-shop/scripts/auto-topup-simple.sh

# Mỗi giờ (phút 0)
0 * * * * /root/digital-shop/scripts/auto-topup-simple.sh

# Mỗi ngày lúc 2:00 sáng
0 2 * * * /root/digital-shop/scripts/auto-topup-simple.sh
```

### Cú pháp crontab

```
* * * * * command
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 or 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

## Troubleshooting

### Kiểm tra cron service đang chạy

```bash
systemctl status cron
```

Nếu không chạy:
```bash
systemctl start cron
systemctl enable cron
```

### Kiểm tra cron logs của system

```bash
# Ubuntu/Debian
grep CRON /var/log/syslog | tail -20

# Hoặc
journalctl -u cron -n 20
```

### Test script thủ công

```bash
cd /root/digital-shop
./scripts/auto-topup-simple.sh

# Xem log
cat logs/auto-topup.log
```

### Kiểm tra API endpoint

```bash
curl -X POST http://localhost:3000/api/cron/auto-topup
```

### Xem log realtime

```bash
tail -f /root/digital-shop/logs/auto-topup.log
```

### Clear logs cũ (nếu quá lớn)

```bash
# Backup log
cp /root/digital-shop/logs/auto-topup.log /root/digital-shop/logs/auto-topup.log.bak

# Xóa log
> /root/digital-shop/logs/auto-topup.log
```

## Xóa crontab (nếu cần)

```bash
# Mở editor
crontab -e

# Xóa dòng auto-topup, save và exit

# Hoặc xóa toàn bộ crontab
crontab -r
```

## Log Management

Script tự động giữ log ở mức 5000 dòng cuối cùng. Nếu muốn thay đổi:

Edit file `scripts/auto-topup-simple.sh`, dòng cuối:

```bash
# Giữ 10000 dòng thay vì 5000
tail -n 10000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
```

## Monitoring

### Tạo script kiểm tra cron health

```bash
cat > /root/check-autotopup.sh << 'EOF'
#!/bin/bash
echo "=== Last 10 cron executions ==="
tail -n 30 /root/digital-shop/logs/auto-topup.log | grep "Running auto-topup"
echo ""
echo "=== Last errors ==="
tail -n 100 /root/digital-shop/logs/auto-topup.log | grep "ERROR"
EOF

chmod +x /root/check-autotopup.sh
```

Chạy:
```bash
/root/check-autotopup.sh
```

## Kết luận

✅ Auto-topup giờ chạy bằng system cron
✅ Không cần PM2 quản lý
✅ Logs ở: `/root/digital-shop/logs/auto-topup.log`
✅ Ổn định và đơn giản
