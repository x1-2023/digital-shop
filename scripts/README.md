# 🛠️ Deployment Scripts

Scripts để build và deploy Docker image.

---

## 📦 Build locally (trên máy Windows/Linux mạnh)

```bash
cd scripts
chmod +x build-local.sh
./build-local.sh
```

**Output:**
- File: `shop-app-YYYYMMDD-HHMMSS.tar.gz` (~300-500MB)
- Docker image: `shop-app:latest`

---

## 🚀 Deploy to server (tự động)

**Bước 1: Config server IP**

```bash
# Edit file deploy-to-server.sh
nano deploy-to-server.sh

# Thay dòng này:
SERVER_IP="YOUR_LXC_IP"  # → IP thật của LXC/VPS
```

**Bước 2: Deploy**

```bash
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

Script sẽ tự động:
1. Upload Docker image
2. Upload configs (.env, docker-compose, nginx)
3. Load image trên server
4. Start containers

---

## 🔄 Deploy thủ công (nếu script không work)

### Trên máy local:

```bash
# 1. Build
./build-local.sh

# 2. Upload
scp shop-app-*.tar.gz root@YOUR_IP:~/
scp .env.production root@YOUR_IP:~/apps/shop/
scp docker-compose.prod.yml root@YOUR_IP:~/apps/shop/
scp -r nginx/ root@YOUR_IP:~/apps/shop/
```

### Trên server:

```bash
# 1. Load image
docker load < ~/shop-app-*.tar.gz

# 2. Deploy
cd ~/apps/shop
docker compose -f docker-compose.prod.yml up -d

# 3. Check
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

---

## ⚡ Quick Deploy (One-liner)

Sau khi đã setup lần đầu:

```bash
# Trên máy local
./build-local.sh && ./deploy-to-server.sh
```

**Done!** 🎉

---

## 🔍 Troubleshooting

### Permission denied

```bash
chmod +x *.sh
```

### SSH key not setup

```bash
# Tạo SSH key
ssh-keygen -t rsa

# Copy sang server
ssh-copy-id root@YOUR_IP
```

### Image file not found

```bash
# Kiểm tra có file .tar.gz không
ls -lh shop-app-*.tar.gz

# Nếu không có, chạy build lại
./build-local.sh
```

---

## 💾 Backup trước khi deploy

```bash
# Trên server
cd ~/apps/shop
docker compose -f docker-compose.prod.yml down
docker exec shop-postgres pg_dump -U postgres digital_shop | gzip > ~/backup-$(date +%Y%m%d).sql.gz
docker compose -f docker-compose.prod.yml up -d
```

---

**Happy Deploying! 🚀**
