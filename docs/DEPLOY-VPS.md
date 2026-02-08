# 🚀 Hướng Dẫn Deploy VPS (Ubuntu/Debian)

Hướng dẫn này dành cho việc deploy lên VPS sử dụng **PM2** và **Nginx**.

---

## 🛠️ Yêu Cầu Server

- **OS**: Ubuntu 20.04/22.04 hoặc Debian 11/12.
- **Node.js**: v20.x (LTS).
- **Database**: MySQL 8.0 hoặc MariaDB.
- **Reverse Proxy**: Nginx.
- **Process Manager**: PM2.

---

## Bước 1: Chuẩn Bị Môi Trường (Trên VPS)

SSH vào VPS và chạy các lệnh sau:

### 1.1 Cài Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.2 Cài PM2 và Yarn
```bash
sudo npm install -g pm2 yarn
```

### 1.3 Cài MySQL (Nếu chưa có)
```bash
sudo apt-get install -y mysql-server
sudo mysql_secure_installation
```

---

## Bước 2: Setup Database

Đăng nhập MySQL và tạo database:
```sql
CREATE DATABASE digital_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shop_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON digital_shop.* TO 'shop_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Bước 3: Deploy Code

Có 2 cách:
1. **Git Clone** (Khuyên dùng): Pull code từ Git về.
2. **Upload**: Upload file zip lên.

Giả sử dùng Git:
```bash
mkdir -p /var/www/digital-shop
cd /var/www/digital-shop
git clone <your-repo-url> .
```

### 3.1 Cài đặt dependencies
```bash
npm install
```

### 3.2 Cấu hình .env
Tạo file `.env`:
```bash
cp .env.example .env
nano .env
```
Điền thông tin DB:
```env
DATABASE_URL="mysql://shop_user:YourStrongPassword123!@localhost:3306/digital_shop"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<random-string>"
```

### 3.3 Build App
```bash
npx prisma generate
npx prisma db push  # Hoặc prisma migrate deploy
npm run build
```

---

## Bước 4: Chạy App với PM2

```bash
pm2 start npm --name "digital-shop" -- start
pm2 save
pm2 startup
```

*(Nếu dùng standalone mode, có thể chạy `pm2 start server.js` trong `.next/standalone`)*.

---

## Bước 5: Cấu Hình Nginx (Reverse Proxy)

Cài Nginx:
```bash
sudo apt install nginx
```

Tạo config:
```bash
sudo nano /etc/nginx/sites-available/digital-shop
```

Nội dung:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt:
```bash
sudo ln -s /etc/nginx/sites-available/digital-shop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Bước 6: SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

✅ **Hoàn tất!**
