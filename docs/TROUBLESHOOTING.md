# Troubleshooting Guide

## 🔄 Cron Job Issues

### Cron vẫn báo lỗi cũ sau khi fix code

**Triệu chứng:**
```
[Cron] Auto-topup error: TypeError: transactions is not iterable
```

**Nguyên nhân:** Code đã update nhưng cron job chưa reload

**Giải pháp:**

**Option 1: Restart cron (nhanh nhất)**
```bash
curl "http://localhost:3000/api/cron-init?action=restart"
```

**Option 2: Restart toàn bộ dev server**
- Tắt terminal (Ctrl+C)
- Chạy lại: `npm run dev`

**Option 3: Tự động (đã cấu hình)**
- Cron giờ dùng dynamic import
- Tự động load code mới nhất mỗi lần chạy
- Không cần restart sau khi fix code!

---

## 💰 Validation Errors

### "Số tiền phải từ 10.000 đến 100.000.000 VND"

**Triệu chứng:** Admin đã set min = 2000 nhưng vẫn báo lỗi 10,000

**Nguyên nhân:** Database bị lỗi hoặc admin chưa save đúng

**Giải pháp:**

1. **Kiểm tra database:**
```bash
node check-settings.js
```

2. **Fix database nếu sai:**
```bash
node fix-settings.js
```

3. **Refresh trang wallet** (Ctrl+F5)

4. **Kiểm tra lại admin settings:**
- Vào `/admin/settings`
- Đảm bảo min/max amount đúng
- Nhấn "Lưu cài đặt"

---

## 🏦 Bank API Errors

### "No bank configs found"

**Triệu chứng:**
```
[AutoTopup] No bank configs found
```

**Nguyên nhân:** Chưa cấu hình bank API trong admin panel

**Giải pháp:**
1. Vào `/admin/settings`
2. Tab "Auto Topup Banks"
3. Thêm bank config:
   - Name: MB Bank
   - API URL: http://192.168.1.1:6868
   - Enabled: ✅
   - Field mappings

4. Save settings

### "HTTP 500" khi fetch transactions

**Nguyên nhân:** Bank API không hoạt động hoặc sai config

**Giải pháp:**
1. **Test API trực tiếp:**
```bash
curl http://192.168.1.1:6868
```

2. **Kiểm tra field mapping:**
- `transactionsPath`: Đúng với response structure
- `fields`: Map đúng tên fields

3. **Kiểm tra filters:**
- `creditIndicator`: Phải match với debit field

---

## 🔍 Auto-Topup Not Matching

### Có giao dịch nhưng không tự động cộng tiền

**Triệu chứng:**
```
[AutoTopup] ❌ No match found for "NAP 98flsu2p"
[AutoTopup] Pending requests: []
```

**Nguyên nhân 1:** Không có deposit request nào với mã đó

**Giải pháp:**
1. Kiểm tra Admin Panel → Deposits
2. Tìm deposit request có `transferContent` = `NAP98flsu2p`
3. Nếu không có → User chưa tạo yêu cầu nạp tiền

**Nguyên nhân 2:** Format mã nạp không khớp

**Giải pháp:**
- Database: `NAP98flsu2p` (không dấu cách)
- Bank transaction: `NAP 98flsu2p` (có dấu cách)
- → Code đã hỗ trợ cả 2 format!

**Nguyên nhân 3:** Deposit request đã APPROVED

**Giải pháp:**
- Chỉ xử lý status = `PENDING`
- Nếu đã APPROVED → Bỏ qua

---

## 🐛 Common Errors

### "Invalid prisma.settings.findUnique()"

**Lỗi đầy đủ:**
```
Unknown field `autoTopupBanks` for select statement on model `Settings`
```

**Nguyên nhân:** Code cũ dùng field không tồn tại

**Giải pháp:** ✅ Đã fix! Code mới dùng `loadBankConfigs()` từ `websiteSettings` table

### "Event handlers cannot be passed to Client Component"

**Nguyên nhân:** Next.js 15 strict mode với Server/Client components

**Giải pháp:** Không ảnh hưởng chức năng, có thể ignore warning này

---

## 📊 Debug Commands

### Kiểm tra settings
```bash
node check-settings.js
```

### Fix settings
```bash
node fix-settings.js
```

### Test auto-topup manual
```bash
curl http://localhost:3000/api/cron/auto-topup
```

### Restart cron jobs
```bash
curl "http://localhost:3000/api/cron-init?action=restart"
```

### View database
```bash
npm run db:studio
```

### Check logs
- Console của terminal đang chạy `npm run dev`
- Tìm `[Cron]`, `[AutoTopup]`, `[API]`

---

## 🔧 Quick Fixes

### Cron không chạy
```bash
curl "http://localhost:3000/api/cron-init?action=restart"
```

### Validation sai
```bash
node fix-settings.js
```

### Test toàn bộ flow
```bash
# 1. Tạo deposit request ở /wallet
# 2. Test auto-topup
curl http://localhost:3000/api/cron/auto-topup
# 3. Kiểm tra /admin/deposits
```

---

## 📞 Support

Nếu vẫn gặp lỗi:

1. Check console logs
2. Run `node check-settings.js`
3. Xem file [DEBUG_AUTO_TOPUP.md](DEBUG_AUTO_TOPUP.md)
4. Xem file [CRON_SETUP.md](CRON_SETUP.md)
