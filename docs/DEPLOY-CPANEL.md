# 🚀 Hướng Dẫn Cài Đặt Mới (Fresh Install) - cPanel Hosting

> **Tình huống**: Bạn mua một host mới tinh (hoặc reset host cũ), và muốn deploy website lên từ đầu.
> **Dữ liệu**: Web sẽ trắng trơn, chưa có dữ liệu cũ.

---

## �️ Chuẩn Bị (File Cần Thiết)
Bạn cần có **2 file** này trên máy tính (đã được tạo sẵn ở bước trước):

1. **`full-deploy.zip`** (~200MB): Chứa Code + Thư viện Node.js + Prisma Linux.
2. **`db_init.sql`**: Chứa cấu trúc Database MySQL.

---

## Bước 1: Tạo Database MySQL

1. Đăng nhập **cPanel**.
2. Tìm & chọn **MySQL® Databases**.
3. **Tạo Database Mới**:
   - Tên: `digital` (Full tên sẽ là: `twebmmonet_digital`).
   - Bấm **Create Database**.
4. **Tạo User Mới**:
   - Username: `shop` (Full tên sẽ là: `twebmmonet_shop`).
   - Password: `Quang##2022`
   - Bấm **Create User**.
5. **Thêm User vào Database**:
   - Kéo xuống mục **Add User To Database**.
   - User: `twebmmonet_shop`.
   - Database: `twebmmonet_digital`.
   - Bấm **Add**.
   - Tick chọn **ALL PRIVILEGES** (Quyền cao nhất).
   - Bấm **Make Changes**.

---

## Bước 2: Upload Code (Không cần npm install)

1. Quay lại trang chủ cPanel -> **File Manager**.
2. Tạo folder mới tên `digital-shop` (ngang hàng `public_html`).
3. Vào trong `digital-shop/` -> Bấm **Upload**.
4. Chọn file **`full-deploy.zip`**.
5. Sau khi upload xong (100%), bấm chuột phải vào file zip -> **Extract**.
6. **Kiểm tra**: Sau khi giải nén, bạn phải thấy folder `node_modules`, file `server.js`, `package.json` ngay trong thư mục này.
7. Xóa file `full-deploy.zip` cho nhẹ host.

---

## Bước 3: Nhập Cấu Trúc Database

1. Trang chủ cPanel -> **phpMyAdmin**.
2. Cột bên trái, chọn database **`twebmmonet_digital`** vừa tạo.
3. Nhìn thanh menu trên cùng, chọn tab **Import** (Nhập).
4. Bấm **Choose File** -> Chọn file **`db_init.sql`**.
5. Kéo xuống dưới cùng -> Bấm **Go** (Thực hiện).
   *(Màn hình báo thành công màu xanh là OK).*

---

## Bước 4: Cài Đặt Node.js App

1. Trang chủ cPanel -> **Setup Node.js App**.
2. Bấm **CREATE APPLICATION**.
3. Điền thông tin y hệt như sau:

| Trường | Điền Giá Trị |
|---|---|
| **Node.js version** | `20` (Chọn bản cao nhất có thể) |
| **Application mode** | `Production` |
| **Application root** | `digital-shop` |
| **Application URL** | Chọn domain chính (VD: `webmmo.net`) |
| **Application startup file** | `server.js` |

4. Bấm nút **CREATE**.

---

## Bước 5: Cấu Hình Biến Môi Trường (.env)

Trong giao diện Node.js App vừa tạo, tìm mục **Environment variables** (hoặc nút Settings). Bấm **Add Variable** để thêm từng dòng:

| Tên (Name) | Giá trị (Value) | Lưu ý |
|---|---|---|
| `DATABASE_URL` | `mysql://twebmmonet_shop:Quang%23%232022@localhost:3306/twebmmonet_digital` | Pass `#` đổi thành `%23` |
| `NEXTAUTH_SECRET` | `bc3448523126652fa2adb9fa684a8049c849d58438ea8cc314ed18ac356d9d6c` | Hoặc chuỗi bất kỳ dài loằng ngoằng |
| `NEXTAUTH_URL` | `https://webmmo.net` | Đổi thành domain thật |
| `CRON_SECRET` | `e70a98b6-90b7-4c3e-af2a-19ab84dfea31` | Key bảo mật cho Cron Job |
| `NODE_ENV` | `production` | Bắt buộc |

Sau khi điền đủ, bấm **Save**.

---

## Bước 6: Khởi Động Web

1. Trong giao diện Node.js App, bấm **STOP APP** (nếu đang chạy).
2. Chờ 5 giây.
3. Bấm **START APP**.
4. Truy cập website để kiểm tra.

> 💡 **Vì sao không cần chạy lệnh?**
> File `full-deploy.zip` mình tạo đã chứa sẵn mọi thư viện cần thiết (bao gồm cả Prisma cho Linux), nên bạn **KHÔNG CẦN** vào Terminal chạy `npm install` hay `prisma generate` nữa. Server yếu vẫn chạy ngon lành!

---

## Bước 7: Cài Đặt Cron Job (Tự động)

Để web không bị "ngủ đông" và tự động check nạp tiền:

1. Trang chủ cPanel -> **Cron Jobs**.
2. Phần **Common Settings**, chọn `Once Per Minute` (* * * * *).
3. Ô **Command**, dán lệnh sau:
   ```bash
   /usr/bin/curl -s "https://webmmo.net/api/cron/auto-topup" >/dev/null 2>&1
   ```
   *(Nhớ thay `webmmo.net` bằng domain của bạn)*.
4. Bấm **Add New Cron Job**.

---

## ❓ Xử Lý Lỗi (Troubleshoot)

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| **Lỗi 503 Service Unavailable** | App đang khởi động hoặc crash | Vào Node.js App -> Restart. Chờ 1 phút rồi F5. |
| **Lỗi Database Connection** | Sai pass hoặc chưa import SQL | Kiểm tra lại Bước 1 (User/Pass) và Bước 3 (Import). |
| **Lỗi Permission (Ảnh/Upload)** | Chỉ đọc (Read-only) | Vào Terminal, gõ `cd digital-shop` rồi chạy: `chmod -R 755 public` |
| **Web trắng trơn** | Thiếu file tĩnh | Kiểm tra xem folder `.next/static` có trong `digital-shop/.next/static` không. |
