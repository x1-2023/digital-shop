# Digital Shop - Cửa hàng tài nguyên số

Một trang web bán hàng cá nhân kiểu Sellix với dark theme, ví nội bộ, và hệ thống nạp tiền qua QR code.

## ✨ Tính năng chính

- 🛍️ **Cửa hàng tài nguyên số**: Bán file, license, app với giao diện dark theme đẹp mắt
- 💰 **Ví nội bộ**: Thanh toán nhanh chóng bằng ví nội bộ
- 📱 **Nạp tiền QR code**: Tạo QR code VietQR cho từng yêu cầu nạp tiền
- 👨‍💼 **Admin panel**: Quản lý toàn bộ hệ thống, duyệt nạp tiền, cài đặt
- 🔐 **Bảo mật cao**: RBAC, rate limiting, audit log, idempotency
- 📧 **Email tự động**: Thông báo qua email khi có giao dịch
- 🚀 **Sẵn sàng mở rộng**: Hỗ trợ TPBank, MoMo, Crypto (tùy chọn)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + BullMQ
- **Storage**: S3-compatible (MinIO/R2)
- **Auth**: NextAuth v5 (Email OTP)
- **Email**: Resend
- **UI**: Radix UI + Custom components

## 🚀 Quick Start

### 1. Clone và cài đặt

```bash
git clone <repo-url>
cd digital-shop
npm install
```

### 2. Cấu hình môi trường

```bash
cp env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/digital_shop?schema=public"

# Redis
REDIS_URL="redis://localhost:6379/0"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key-here"
FROM_EMAIL="noreply@yourdomain.com"

# S3 Storage (MinIO for dev)
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="digital-shop"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_REGION="us-east-1"

# License System (JWT RS256)
LICENSE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nYOUR_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----"

# Internal Webhook Secret
INTERNAL_WEBHOOK_SECRET="your-internal-webhook-secret"
```

### 3. Khởi động services

```bash
# Khởi động PostgreSQL, Redis, MinIO
docker compose up -d

# Chờ services khởi động (khoảng 30 giây)
```

### 4. Setup database

```bash
# Chạy migration
npm run db:migrate

# Seed dữ liệu mẫu
npm run db:seed
```

### 5. Khởi động ứng dụng

```bash
# Development
npm run dev

# Worker (terminal khác)
npm run worker
```

Truy cập: http://localhost:3000

## 👥 Tài khoản mặc định

- **Admin**: admin@digitalshop.com
- **Buyer**: buyer@example.com (500k VND)

## 📱 Cách sử dụng

### Cho người dùng

1. **Đăng nhập**: Nhập email để nhận link đăng nhập
2. **Nạp tiền**: 
   - Vào trang "Ví của tôi"
   - Nhập số tiền cần nạp
   - Quét QR code hoặc chuyển khoản theo nội dung
   - Chờ admin duyệt
3. **Mua hàng**:
   - Duyệt sản phẩm trên trang chủ
   - Thêm vào giỏ hàng
   - Thanh toán bằng ví nội bộ

### Cho admin

1. **Đăng nhập**: admin@digitalshop.com
2. **Duyệt nạp tiền**: 
   - Vào Admin Panel > Yêu cầu nạp
   - Xem QR code và nội dung chuyển khoản
   - Duyệt hoặc từ chối
3. **Quản lý sản phẩm**: Admin Panel > Sản phẩm
4. **Cài đặt**: Admin Panel > Cài đặt

## 🔧 Cấu hình nâng cao

### S3 Storage (Production)

Thay MinIO bằng Cloudflare R2:

```env
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_ACCESS_KEY="your-r2-access-key"
S3_SECRET_KEY="your-r2-secret-key"
S3_REGION="auto"
```

### License System

Tạo RSA key pair cho license:

```bash
# Tạo private key
openssl genrsa -out private.pem 2048

# Tạo public key
openssl rsa -in private.pem -pubout -out public.pem

# Copy nội dung vào .env
```

### TPBank Integration (Tùy chọn)

Bật trong Admin Panel > Cài đặt:

```env
TPBANK_ENABLED="true"
TPBANK_API_URL="https://api.tpbank.vn/transactions"
TPBANK_API_TOKEN="your-tpbank-token"
TPBANK_AMOUNT_TOLERANCE="2000"
```

## 📁 Cấu trúc project

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── admin/             # Admin pages
│   └── wallet/            # User pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components
├── lib/                  # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── redis.ts          # Redis client
│   ├── s3.ts             # S3 client
│   ├── license.ts        # License system
│   └── validations.ts    # Zod schemas
└── hooks/                # Custom hooks
```

## 🚀 Deploy

### Docker Compose - Separate Containers (Recommended)

Nginx và Application chạy riêng biệt để dễ quản lý:

**Linux/Mac:**
```bash
# Start all services
./docker-start.sh

# Stop all services
./docker-stop.sh
```

**Windows (PowerShell):**
```powershell
# Start all services
.\docker-start.ps1

# Stop all services
.\docker-stop.ps1
```

**Manual:**
```bash
# Start app first
docker-compose -f docker-compose.app.yml up -d

# Start nginx
docker-compose -f docker-compose.nginx.yml up -d

# Stop (reverse order)
docker-compose -f docker-compose.nginx.yml down
docker-compose -f docker-compose.app.yml down
```

Chi tiết xem [DOCKER_SPLIT_USAGE.md](DOCKER_SPLIT_USAGE.md)

### Docker Compose - All-in-one (Legacy)

```bash
# Production (all in one)
docker compose -f docker-compose.production.yml up -d
```

### Vercel

1. Connect GitHub repo
2. Set environment variables
3. Deploy

## 🔒 Bảo mật

- ✅ RBAC (Role-based access control)
- ✅ Rate limiting (Redis)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention (React)
- ✅ CSRF protection (NextAuth)
- ✅ Audit logging
- ✅ Idempotency keys

## 📊 Monitoring

- **Database**: Prisma Studio (`npm run db:studio`)
- **Redis**: Redis CLI
- **Logs**: Console + Admin Panel > Nhật ký

## 🤝 Contributing

1. Fork repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - xem [LICENSE](LICENSE) file

## 🆘 Support

- 📧 Email: support@digitalshop.com
- 📱 Hotline: 1900-xxxx
- 🕐 Thời gian: 8:00 - 22:00

---

**Made with ❤️ by Digital Shop Team**