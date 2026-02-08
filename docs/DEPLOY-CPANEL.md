# 🚀 Hướng Dẫn Deploy Lên cPanel (MySQL + Node.js)

> **Cập nhật**: 08/02/2026 — Đã chuyển sang MySQL, build sẵn trên Windows.

---

## 📋 Tổng Quan

| Hạng mục | Giá trị |
|----------|---------|
| Database | MySQL (`twebmmonet_digital`) |
| Node.js | 18+ (khuyên 20 LTS) |
| Build output | `.next/standalone` (~412 MB) |
| Dung lượng cần | Tối thiểu 1 GB disk |

---

## Bước 1: Build Trên Máy Tính (Windows)

Mở terminal trong thư mục dự án:

```powershell
npm run build
```

Chờ đến khi thấy `✓ Generating static pages (xx/xx)` — build xong.

---

## Bước 2: Chuẩn Bị File Upload

Sau khi build xong, làm theo **đúng thứ tự** sau:

### 2.1 Copy thêm 2 folder vào standalone

```powershell
# Copy folder public vào standalone
Copy-Item -Recurse -Force "public" ".next\standalone\public"

# Copy folder .next/static vào standalone/.next/static
Copy-Item -Recurse -Force ".next\static" ".next\standalone\.next\static"
```

### 2.2 Copy thêm Prisma schema

```powershell
# Prisma cần schema file để chạy trên server
New-Item -ItemType Directory -Force -Path ".next\standalone\prisma"
Copy-Item "prisma\schema.prisma" ".next\standalone\prisma\schema.prisma"
```

### 2.3 Kiểm tra cấu trúc

Sau khi copy xong, folder `.next/standalone` phải có cấu trúc:

```
standalone/
├── .next/
│   ├── static/          ← Vừa copy vào
│   └── server/
├── prisma/
│   └── schema.prisma    ← Vừa copy vào
├── public/              ← Vừa copy vào
├── node_modules/
├── server.js            ← File khởi động (QUAN TRỌNG)
├── package.json
└── ...
```

### 2.4 Nén thành ZIP

Vào bên trong folder `.next/standalone`, chọn **tất cả file**, nén thành `deploy.zip`.

> ⚠️ **Lưu ý**: Nén **nội dung bên trong** folder standalone, KHÔNG nén chính folder standalone. Khi giải nén ra phải thấy ngay `server.js`, không phải thấy folder `standalone/` bọc bên ngoài.

---

## Bước 3: Tạo MySQL Database Trên cPanel

1. Đăng nhập **cPanel** → **MySQL® Databases**
2. **Tạo Database**: `twebmmonet_digital` (cPanel sẽ tự thêm prefix, VD: `twebmmonet_digital`)
3. **Tạo User**: `twebmmonet_shop` với password `Quang##2022`
4. **Add User to Database**: Chọn user vừa tạo → chọn database → tick **ALL PRIVILEGES** → Add
5. Xong bước này bạn sẽ có:
   - Database: `twebmmonet_digital`
   - User: `twebmmonet_shop`
   - Host: `localhost`

---

## Bước 4: Upload Code Lên cPanel

1. Đăng nhập **cPanel** → **File Manager**
2. Tạo folder mới tên `digital-shop` **ngang hàng** với `public_html`

   ```
   /home/twebmmonet/
   ├── digital-shop/     ← TẠO FOLDER NÀY
   ├── public_html/
   └── ...
   ```

3. Mở folder `digital-shop` → bấm **Upload** → chọn file `deploy.zip`
4. Chờ upload xong → click chuột phải vào `deploy.zip` → **Extract**
5. Sau khi giải nén, kiểm tra bên trong `digital-shop/` phải thấy ngay `server.js`
6. **Xóa file `deploy.zip`** để tiết kiệm dung lượng

---

## Bước 5: Tạo Node.js App Trên cPanel

1. Quay lại trang chủ **cPanel** → **Setup Node.js App**
2. Bấm **CREATE APPLICATION**
3. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Node.js version** | `20` (hoặc phiên bản mới nhất có sẵn) |
| **Application mode** | `Production` |
| **Application root** | `digital-shop` |
| **Application URL** | Chọn domain của bạn (VD: `webmmo.net`) |
| **Application startup file** | `server.js` |

4. Bấm **CREATE** — Chưa bấm Start, làm tiếp bước 6.

---

## Bước 6: Cấu Hình Biến Môi Trường

Trong giao diện Node.js App vừa tạo, tìm mục **Environment variables**, bấm **Add Variable** để thêm:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `mysql://twebmmonet_shop:Quang%23%232022@localhost:3306/twebmmonet_digital` |
| `NEXTAUTH_SECRET` | *(Tạo chuỗi ngẫu nhiên: `openssl rand -hex 32`)* |
| `NEXTAUTH_URL` | `https://your-domain.com` *(thay bằng domain thật)* |
| `CRON_SECRET` | *(Chuỗi bảo mật bất kỳ, VD: `my-secret-cron-key-2024`)* |
| `NODE_ENV` | `production` |
| `PORT` | *(Để trống hoặc không cần thêm — cPanel tự quản lý)* |

> ⚠️ **Quan trọng**: Password `Quang##2022` phải encode ký tự `#` thành `%23`, nên trong URL là `Quang%23%232022`.

Bấm **Save**.

---

## Bước 7: Chạy Prisma + Khởi Động App

### 7.1 Mở Terminal trên cPanel

Trong giao diện **Setup Node.js App**, bạn sẽ thấy **dòng lệnh kích hoạt môi trường** (Enter to virtual environment). Copy dòng đó rồi:

1. Vào **cPanel** → **Terminal** (hoặc SSH vào server)
2. **Paste dòng lệnh kích hoạt** đó vào terminal, ví dụ:
   ```bash
   source /home/twebmmonet/nodevenv/digital-shop/20/bin/activate && cd /home/twebmmonet/digital-shop
   ```

### 7.2 Cài Prisma CLI và tạo bảng

```bash
# Cài prisma CLI (nếu chưa có)
npm install prisma --save-dev

# Tạo Prisma Client
npx prisma generate

# Tạo tất cả bảng trong MySQL (QUAN TRỌNG - chạy 1 lần đầu)
npx prisma db push
```

> Lệnh `prisma db push` sẽ đọc file `prisma/schema.prisma` và tạo toàn bộ tables trong MySQL. Bạn sẽ thấy output như:
> ```
> Your database is now in sync with your Prisma schema.
> ```

### 7.3 Khởi động App

Quay lại giao diện **Setup Node.js App** trên cPanel → bấm **Restart**.

Hoặc chạy trên terminal:
```bash
node server.js
```

### 7.4 Kiểm tra

Truy cập domain của bạn — nếu thấy trang web thì đã deploy thành công! 🎉

---

## Bước 8: Cài Đặt Cron Job

Vào **cPanel** → **Cron Jobs** → Thêm các lệnh sau:

### Keep-alive + Auto Topup (Mỗi 1 phút)

Cài đặt: `* * * * *`
```bash
/usr/bin/curl -s "https://your-domain.com/api/cron/auto-topup" >/dev/null 2>&1
```

### Auto Review (Mỗi 5 phút — tùy chọn)

Cài đặt: `*/5 * * * *`
```bash
/usr/bin/curl -s "https://your-domain.com/api/cron/auto-review?key=YOUR_CRON_SECRET" >/dev/null 2>&1
```

> Thay `your-domain.com` bằng domain thật và `YOUR_CRON_SECRET` bằng giá trị bạn đã set ở bước 6.

---

## 🔄 Cập Nhật Code (Lần Deploy Sau)

Khi có code mới, lặp lại:

1. Build trên máy tính: `npm run build`
2. Copy `public` + `.next/static` + `prisma/schema.prisma` vào `.next/standalone`
3. Nén và upload `deploy.zip` lên `digital-shop/`
4. Giải nén (ghi đè file cũ)
5. SSH vào → active virtual env → chạy:
   ```bash
   npx prisma generate
   npx prisma db push    # Chỉ cần nếu schema thay đổi
   ```
6. Restart Node.js App trên cPanel

> ✅ Dữ liệu MySQL **KHÔNG BỊ MẤT** khi deploy lại (khác với SQLite phải tránh ghi đè file .db).

---

## ❓ Xử Lý Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `502 Bad Gateway` | App chưa khởi động xong | Chờ 30s rồi refresh, hoặc Restart App |
| `Cannot find module` | Thiếu node_modules | SSH vào chạy `npm install` |
| `PrismaClientInitializationError` | Chưa chạy `prisma generate` hoặc sai `DATABASE_URL` | SSH vào chạy `npx prisma generate` |
| `Access denied for user` | Sai user/pass MySQL hoặc chưa add user vào database | Kiểm tra lại bước 3 |
| Trang trắng, không có CSS | Chưa copy `.next/static` vào standalone | Làm lại bước 2.1 |
