# Hướng Dẫn Chạy Production với Docker

Hướng dẫn chi tiết từ A-Z để deploy Digital Shop lên production với Docker.

---

## Yêu Cầu

- Docker & Docker Compose đã cài đặt
- Port 3000 available
- Tối thiểu 512MB RAM

---

## Bước 1: Chuẩn Bị Environment Variables

### 1.1. Chỉnh sửa file `.env.production`

```bash
# Mở file .env.production
nano .env.production
```

### 1.2. Cập nhật các giá trị sau:

```env
# Database (SQLite - không cần thay đổi)
DATABASE_URL="file:./production.db"

# JWT Session Secret - ĐỔI THÀNH SECRET MỚI!
# Tạo secret mới: openssl rand -hex 32
SESSION_SECRET="YOUR_NEW_SECRET_HERE_CHANGE_THIS"

# Email (Optional - chỉ cần nếu dùng forgot password)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Contact - ĐỔI THÀNH TELEGRAM CỦA BẠN
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/yourusername"

NODE_ENV="production"
```

**Lưu ý:**
- `SESSION_SECRET` phải là chuỗi random 64 ký tự
- Có thể tạo bằng: `openssl rand -hex 32`

---

## Bước 2: Build và Chạy Docker

### 2.1. Build và start container

```bash
docker-compose up -d --build
```

**Quá trình này sẽ:**
1. Build Next.js app (~2-3 phút)
2. Tạo production image (~150-200MB)
3. Khởi động container
4. Tự động chạy Prisma migrations

### 2.2. Xem logs để theo dõi

```bash
docker-compose logs -f app
```

**Chờ đến khi thấy:**
```
✓ Starting...
✓ Ready in 2.3s
- Local:        http://localhost:3000
```

**Nhấn Ctrl+C để thoát logs** (container vẫn chạy)

---

## Bước 3: Setup Admin - Wizard Tự Động! 🧙‍♂️

### 3.1. Truy cập Setup Wizard

Mở trình duyệt và truy cập:
```
http://localhost:3000/setup
```

hoặc nếu đã có domain:
```
https://yourdomain.com/setup
```

### 3.2. Làm theo các bước trên màn hình:

**Bước 1: Database Check**
- Wizard sẽ tự động kiểm tra database
- Nếu OK, click "Tiếp theo"

**Bước 2: Tạo Admin**
- Nhập **Email Admin**: `admin@example.com`
- Nhập **Mật khẩu**: Tối thiểu 8 ký tự
- Nhập **Xác nhận mật khẩu**
- Tên website (optional): `Digital Shop`
- Click **"Hoàn tất setup"**

**Bước 3: Thành công!**
- Wizard sẽ tự động tạo:
  - ✅ Admin user
  - ✅ Default settings
  - ✅ 3 categories mặc định
- Tự động redirect về trang đăng nhập

---

## Bước 4: Đăng Nhập Admin

### 4.1. Truy cập trang login

```
http://localhost:3000/auth/signin
```

### 4.2. Đăng nhập với admin vừa tạo

- Email: Email bạn nhập ở bước 3
- Password: Password bạn nhập ở bước 3

### 4.3. Truy cập Admin Panel

Sau khi login thành công, truy cập:
```
http://localhost:3000/admin
```

---

## Bước 5: Cấu Hình Website (Optional)

### 5.1. Website Settings

Vào **Admin Panel > Website Settings** để cấu hình:
- Tên website
- Logo, Favicon
- SEO metadata
- Social links

### 5.2. Payment Settings

Vào **Admin Panel > Settings** để cấu hình:
- Thông tin ngân hàng
- Phương thức thanh toán
- Quy tắc nạp tiền (min/max)

---

## Các Lệnh Docker Hữu Ích

### Xem logs realtime
```bash
docker-compose logs -f app
```

### Xem trạng thái container
```bash
docker-compose ps
```

### Restart container
```bash
docker-compose restart app
```

### Stop container
```bash
docker-compose down
```

### Stop và xóa database (CẢNH BÁO: Mất hết data!)
```bash
docker-compose down -v
```

### Rebuild from scratch
```bash
docker-compose down
docker-compose up -d --build
```

### Truy cập vào container (debug)
```bash
docker exec -it digital-shop-app sh
```

---

## Đổi Port (Optional)

Mặc định app chạy trên port **3000**. Để đổi port:

### Cách đổi:

Mở file `docker-compose.yml`, tìm dòng:
```yaml
ports:
  - "3000:3000"
```

Đổi thành (ví dụ port 8080):
```yaml
ports:
  - "8080:3000"
```

**Giải thích:**
- `"PORT_HOST:PORT_CONTAINER"`
- PORT_HOST: Port trên máy bạn (đổi được)
- PORT_CONTAINER: Port trong Docker (GIỮ NGUYÊN 3000)

### Ví dụ:

| Muốn dùng | Sửa thành |
|-----------|-----------|
| Port 8080 | `"8080:3000"` |
| Port 80   | `"80:3000"` |
| Port 5000 | `"5000:3000"` |

Sau khi đổi:
```bash
docker-compose down
docker-compose up -d
```

Truy cập: `http://localhost:8080/setup`

---

## Backup Database

Database SQLite nằm trong Docker volume. Để backup:

### Backup
```bash
docker cp digital-shop-app:/app/data/production.db ./backup-$(date +%Y%m%d).db
```

### Restore
```bash
docker cp ./backup-20250129.db digital-shop-app:/app/data/production.db
docker-compose restart app
```

---

## Troubleshooting

### Container không start được?

1. Check logs:
```bash
docker-compose logs app
```

2. Check port 3000 có bị chiếm không:
```bash
netstat -ano | findstr :3000
```

3. Rebuild:
```bash
docker-compose down
docker-compose up -d --build
```

### Setup wizard báo lỗi database?

1. Check DATABASE_URL trong `.env.production`
2. Đảm bảo `DATABASE_URL="file:./production.db"`
3. Restart container:
```bash
docker-compose restart app
```

### Quên mật khẩu admin?

Tạo admin mới bằng Prisma Studio:
```bash
docker exec -it digital-shop-app npx prisma studio
```

Hoặc reset database (mất hết data):
```bash
docker-compose down -v
docker-compose up -d --build
# Rồi làm lại từ bước 3
```

### Muốn truy cập từ internet?

Cần setup reverse proxy (Nginx/Caddy) với SSL.

Xem file `nginx.conf` trong repo để tham khảo config Nginx.

**Recommend: Dùng Caddy vì tự động SSL:**
```bash
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## Thông Tin Thêm

### File Structure
```
/app/
├── data/              # Database directory
│   └── production.db  # SQLite database
├── public/
│   └── products/      # Product images (mounted from host)
└── ...
```

### Volumes
- `app_data`: SQLite database
- `./public/products`: Product images (shared với host)

### Health Check
Container có built-in health check:
```bash
curl http://localhost:3000/api/health
```

---

## Security Checklist

- [ ] Đổi `SESSION_SECRET` thành random string
- [ ] Đổi admin password thành password mạnh
- [ ] Setup HTTPS với reverse proxy (Nginx/Caddy)
- [ ] Đổi `NEXT_PUBLIC_TELEGRAM_URL` thành link Telegram thật
- [ ] Nếu dùng email: Cấu hình RESEND_API_KEY
- [ ] Backup database định kỳ
- [ ] Giới hạn access vào port 3000 (chỉ reverse proxy)

---

## Khi Nào Cần Restart?

- ✅ Thay đổi `.env.production` → Cần restart
- ✅ Update code → Cần rebuild
- ❌ Thêm product, user → Không cần restart
- ❌ Thay đổi settings qua admin → Không cần restart

---

## Summary Commands

```bash
# 1. Chỉnh sửa .env.production
nano .env.production

# 2. Build và start
docker-compose up -d --build

# 3. Xem logs
docker-compose logs -f app

# 4. Truy cập setup wizard
# http://localhost:3000/setup

# 5. Đăng nhập admin
# http://localhost:3000/auth/signin
```

---

## Support

- Issues: https://github.com/yourusername/digital-shop/issues
- Telegram: [Your Telegram Link]

---

**Chúc bạn deploy thành công! 🚀**
