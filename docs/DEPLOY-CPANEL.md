# Hướng Dẫn Deploy Lên cPanel (Node.js App)

Tài liệu này hướng dẫn chi tiết cách đưa website lên hosting cPanel có hỗ trợ **Node.js App** (CloudLinux).

## ⚠️ Yêu Cầu Tài Nguyên & Cron Job
1.  **Dung Lượng Ổ Cứng (Disk Space)**:
    *   **Source Code (sau khi build)**: Khoảng **300MB - 500MB**.
    *   **Node Modules (Dependencies)**: Khoảng **300MB**.
    *   **Database (SQLite)**: Nhẹ, chỉ vài MB (nếu dùng MySQL thì tính riêng).
    *   **Uploads (Ảnh sản phẩm)**: Tùy nhu cầu sử dụng thực tế.
    *   👉 **Khuyến nghị**: Hosting nên có **tối thiểu 2GB - 5GB SSD** (để dư cho log và backup).

2.  **RAM & CPU**:
    *   App Next.js khá nhẹ khi chạy chế độ Standalone.
    *   👉 **Khuyến nghị**: Hosting nên có **RAM từ 1GB trở lên** (để lúc khởi động app Node.js không bị crash).

3.  **Cron Job (Tác vụ tự động)**:
    *   **Cơ chế hiện tại**: Project có sẵn `src/lib/cron.ts` chạy ngầm (Auto Topup, Online Tracking) ngay khi app khởi động.
    *   **Tuy nhiên**: Trên cPanel, App có thể bị "ngủ đông" (sleep) nếu không có truy cập.
    *   👉 **Giải pháp**: Cần cài đặt **Cron Jobs** trên cPanel để gọi vào API, vừa kích hoạt tác vụ, vừa giữ cho App luôn chạy (Keep-alive).

---

## Bước 1: Build Tại Máy Tính Của Bạn (Local)
Vì hosting thường yếu hoặc giới hạn RAM, chúng ta sẽ build code tại máy tính cá nhân (hoặc VPS build server) rồi mới upload lên.

1.  Mở terminal tại thư mục dự án trên máy tính.
2.  Chạy lệnh build:
    ```bash
    npm run build
    ```
    *(Lệnh này sẽ tạo ra folder `.next/standalone` nhờ cấu hình `output: 'standalone'` trong `next.config.ts`)*.

---

## Bước 2: Chuẩn Bị File Để Upload
Sau khi build xong, bạn cần gộp các file cần thiết lại để upload.

1.  Truy cập vào folder `.next/standalone` vừa được tạo ra.
2.  **Quan trọng**: Copy folder `public` từ thư mục gốc dự án -> dán vào bên trong `.next/standalone/public`.
3.  **Quan trọng**: Copy folder `.next/static` từ thư mục gốc dự án (`.next/static`) -> dán vào bên trong `.next/standalone/.next/static`.

Lúc này, cấu trúc folder `.next/standalone` sẽ trông như sau:
```text
standalone/
├── .next/
│   ├── static/    <-- (Vừa copy vào)
│   └── server/
├── public/        <-- (Vừa copy vào)
├── node_modules/
├── server.js      <-- (File chạy chính)
└── ...
```

4.  **Nén (Zip)** toàn bộ nội dung bên trong folder `standalone` thành `deploy.zip`.

---

## Bước 3: Upload Lên cPanel

1.  Đăng nhập **cPanel** -> **File Manager**.
2.  Tạo một thư mục mới (ví dụ: `web_source`) ngang hàng với `public_html` (để bảo mật, không nên để code Node.js trực tiếp trong public_html nếu không cần thiết).
3.  Upload file `deploy.zip` vào thư mục `web_source`.
4.  Giải nén (Extract) ra.

---

## Bước 4: Cấu Hình Node.js App

1.  Quay lại trang chủ **cPanel** -> Chọn **Setup Node.js App**.
2.  Bấm **Create Application**.
3.  Điền thông tin:
    *   **Node.js Version**: 18.x hoặc 20.x (khuyến nghị 20).
    *   **Application Mode**: `Production`.
    *   **Application Root**: `web_source` (thư mục bạn vừa giải nén).
    *   **Application URL**: Chọn domain của bạn.
    *   **Application Startup File**: `server.js` (Rất quan trọng).
4.  Bấm **Create**.

---

## Bước 5: Cấu Hình Biến Môi Trường (.env)

Trong giao diện cấu hình Node.js App vừa tạo, tìm mục **Environment Variables** (hoặc nút Settings). Bấm **Add Variable** để thêm các biến từ file `.env` của bạn:

*   `DATABASE_URL`: `file:./dev.db` (Nếu dùng SQLite mặc định) hoặc chuỗi kết nối MySQL nếu dùng MySQL.
*   `NEXTAUTH_SECRET`: (Copy từ file .env cũ hoặc tạo chuỗi ngẫu nhiên mới).
*   `NEXTAUTH_URL`: `https://your-domain.com` (Thay bằng domain thật của bạn).
*   **CRON_SECRET**: (Điền một chuỗi bảo mật bất kỳ để bảo vệ API Cron).

---

## Bước 6: Chạy Ứng Dụng & Cài Đặt Cron Job

### 1. Khởi động Web:
1.  Sau khi điền đủ biến môi trường, bấm **Save**.
2.  Bấm nút **Restart** ứng dụng Node.js.
3.  Truy cập vào domain của bạn để kiểm tra.

### 2. Cài Đặt Cron Job (Tự Động):
Vào **cPanel** -> **Cron Jobs**.
Thêm lệnh `curl` để gọi API định kỳ (Ví dụ chạy mỗi 1 phút `* * * * *`):

**Kiểm tra nạp tiền & Keep-alive (Quan trọng):**
```bash
/usr/bin/curl -s "https://your-domain.com/api/cron/auto-topup" >/dev/null 2>&1
```

*(Lệnh này sẽ kích hoạt quy trình kiểm tra nạp tiền ngân hàng, đồng thời giữ cho web luôn hoạt động, không bị sleep)*.

**Auto Review (Tuỳ chọn - Nếu dùng tính năng tự đánh giá):**
```bash
/usr/bin/curl -s "https://your-domain.com/api/cron/auto-review?key=YOUR_CRON_SECRET" >/dev/null 2>&1
```

---

## 💡 Lưu Ý Quan Trọng Về Database (SQLite vs MySQL)

Hiện tại dự án đang dùng **SQLite** (file `.db`).
*   **Vấn đề**: Mỗi khi bạn deploy lại (upload code mới), nếu bạn ghi đè file `dev.db`, dữ liệu cũ sẽ mất.
*   **Giải pháp với SQLite**: Hãy upload file `dev.db` hiện có lên thư mục `web_source` lần đầu. Các lần sau deploy, **KHÔNG** upload/ghi đè file này.
*   **Giải pháp tốt nhất (Khuyên dùng)**: Chuyển sang dùng **MySQL** trên hosting.
    1.  Tạo Database MySQL trên cPanel.
    2.  Sửa file `.env` dòng `DATABASE_URL` thành dạng mysql.
    3.  Sửa file `prisma/schema.prisma`: đổi `provider = "sqlite"` thành `provider = "mysql"`.
    4.  Chạy `npx prisma db push` trên máy local (sau khi sửa env trỏ về hosting - cần mở remote MySQL) hoặc chạy lệnh migrate trên terminal cPanel.
