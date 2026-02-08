# Fix Email Reset Password URL

## Vấn đề

Email reset password hiển thị link `localhost:3000` thay vì domain thật.

## Nguyên nhân

- Biến `NEXT_PUBLIC_APP_URL` được baked vào build lúc compile
- Server chưa có biến `APP_URL` trong .env
- Code đã được fix để ưu tiên `APP_URL` (server-side) trước

## Giải pháp - Cách 1: Thêm APP_URL (Khuyến nghị)

### Bước 1: Thêm biến APP_URL vào .env trên server

```bash
cd /root/digital-shop

# Edit .env file
nano .env

# Thêm dòng này (thay your-domain.com bằng domain thật):
APP_URL="https://webmmo.net"

# Save: Ctrl+X, Y, Enter
```

### Bước 2: Restart PM2

```bash
pm2 restart digital-shop
```

### Bước 3: Test

```bash
# Test thử reset password
# Email giờ sẽ có link: https://webmmo.net/auth/reset-password/...
```

**Ưu điểm**: Không cần rebuild, thay đổi ngay lập tức

---

## Giải pháp - Cách 2: Rebuild với NEXT_PUBLIC_APP_URL

Nếu muốn dùng `NEXT_PUBLIC_APP_URL`:

### Bước 1: Set env variable

```bash
cd /root/digital-shop

# Edit .env
nano .env

# Sửa/thêm dòng:
NEXT_PUBLIC_APP_URL="https://webmmo.net"
```

### Bước 2: Rebuild

```bash
npm run build
pm2 restart digital-shop
```

**Nhược điểm**: Phải rebuild mỗi khi đổi domain

---

## Verify

Sau khi fix, check xem email có link đúng không:

```bash
# Xem PM2 logs
pm2 logs digital-shop --lines 50

# Tìm dòng "📧 [Email]" và check link trong email
```

Hoặc test trực tiếp:
1. Vào trang reset password
2. Nhập email
3. Check email nhận được
4. Link phải là: `https://webmmo.net/auth/reset-password/...`

---

## Tổng kết

**Khuyến nghị**: Dùng **Cách 1** (APP_URL) vì:
- Không cần rebuild
- Thay đổi runtime
- Linh hoạt hơn

File `.env` trên server nên có:
```env
APP_URL="https://webmmo.net"
NEXT_PUBLIC_APP_URL="https://webmmo.net"
```
