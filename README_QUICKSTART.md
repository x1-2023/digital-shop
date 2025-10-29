# Quick Start Guide

## 🚀 Khởi Động Development

```bash
npm run dev
```

Một lệnh đơn giản sẽ:
- ✅ Start Next.js dev server
- ✅ Auto-initialize cron jobs
- ✅ Auto-topup chạy mỗi 30 giây

## 📚 Chi Tiết

- **Auto-Topup Setup:** Xem [CRON_SETUP.md](CRON_SETUP.md)
- **Debug Auto-Topup:** Xem [DEBUG_AUTO_TOPUP.md](DEBUG_AUTO_TOPUP.md)
- **Settings Check:** Chạy `node check-settings.js`

## 🔧 Scripts Hữu Ích

```bash
npm run dev          # Start dev server + auto-cron
npm run dev:only     # Start dev server only (không có cron)
npm run cron:start   # Initialize cron jobs (manual)
npm run db:studio    # Open Prisma Studio
npm run build        # Build for production
```

## ⚡ Auto-Topup

Hệ thống tự động cộng tiền vào ví user khi phát hiện giao dịch ngân hàng:

1. User tạo deposit request → Nhận mã nạp (ví dụ: `NAP98flsu2p`)
2. User chuyển khoản với nội dung chứa mã nạp
3. Cron job (chạy mỗi 30s) tự động:
   - Kiểm tra giao dịch ngân hàng mới
   - Khớp mã nạp với deposit request
   - Cộng tiền vào ví
   - Cập nhật status → `APPROVED`

**Thời gian xử lý:** Tối đa 30 giây sau khi chuyển khoản!

## 🧪 Test

1. Tạo user account (không phải admin)
2. Vào `/wallet` → Nhấn "Nạp tiền"
3. Nhập số tiền → Nhận mã nạp
4. Chuyển khoản với mã đó
5. Đợi tối đa 30s → Tiền tự động vào ví

## 🔍 Troubleshooting

**Cron không chạy?**
```bash
curl http://localhost:3000/api/cron-init
```

**Test auto-topup thủ công:**
```bash
curl http://localhost:3000/api/cron/auto-topup
```

**Kiểm tra settings:**
```bash
node check-settings.js
```

---

Xem thêm documentation chi tiết trong thư mục gốc.
