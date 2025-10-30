# Setup Guide - Digital Shop

## 1. Environment Configuration

### Development Environment
Create `.env` file in root directory:

```bash
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-min-32-chars"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@yourdomain.com"
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/your_channel"
NODE_ENV="development"
```

### Production Environment (Docker)
Create `.env` file (Docker Compose reads `.env` by default, NOT `.env.production`):

```bash
DATABASE_URL="file:/app/data/production.db"
SESSION_SECRET="your-secret-key-min-32-chars"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="no-reply@yourdomain.com"
NEXT_PUBLIC_TELEGRAM_URL="https://t.me/your_channel"
NODE_ENV="production"
```

**Important Notes:**
- `SESSION_SECRET` must be at least 32 characters long
- Generate secure secret: `openssl rand -hex 32`
- Docker Compose automatically reads `.env` file from root directory
- To use a different env file: `docker compose --env-file .env.production up -d --build`

### Using Different Environment Files

If you have `.env.production` file instead of `.env`:

```bash
# Option 1: Rename file (recommended)
mv .env.production .env
docker compose up -d --build

# Option 2: Use --env-file flag
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production down
docker compose --env-file .env.production logs -f app

# Option 3: Specify in command
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production up -d
```

**Note:** If using `--env-file`, you must specify it for EVERY docker compose command.

---

## 2. Docker Commands

### Build & Run

```bash
# Build and start containers in background
docker compose up -d --build

# Build without cache (recommended after code changes)
docker compose build --no-cache
docker compose up -d

# View logs
docker compose logs -f app

# View last 100 lines
docker compose logs --tail=100 app
```

### Container Management

```bash
# Stop containers
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart containers
docker compose restart

# Check container status
docker compose ps
```

### Clean Up Docker Resources

```bash
# Remove all stopped containers, unused networks, dangling images
docker system prune -af

# Remove build cache
docker builder prune -af

# Remove everything including volumes (WARNING: deletes data)
docker system prune -af --volumes

# Check disk usage
docker system df
```

### Troubleshooting - Space Issues

```bash
# If you get "no space left on device" error:

# 1. Clean Docker cache
docker system prune -af
docker builder prune -af

# 2. Check Docker storage
docker system df

# 3. Remove old images manually
docker image ls
docker image rm <image-id>

# 4. Clean overlay2 (if needed, requires Docker stop)
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/overlay2/*
sudo systemctl start docker
```

---

## 3. Database Management

### Automatic Database Setup
The Docker container automatically handles database setup:
- First run: Creates database and runs migrations
- Subsequent runs: Syncs schema if needed
- The entrypoint script (`docker-entrypoint.sh`) handles this automatically

### Manual Database Operations

```bash
# Access container shell
docker compose exec app sh

# Inside container - view database
cd /app/data
ls -la

# Run Prisma commands manually
npx prisma db push
npx prisma studio

# Exit container
exit
```

### Database Backup

```bash
# Backup production database
docker compose exec app cp /app/data/production.db /app/data/backup.db

# Copy backup to host
docker compose cp app:/app/data/backup.db ./backup.db
```

---

## 4. Deployment Workflow

### First Time Deployment

```bash
# 1. Clone repository
git clone <your-repo-url>
cd digital-shop

# 2. Create .env file
nano .env
# Add your environment variables

# 3. Build and start
docker compose up -d --build

# 4. Check logs
docker compose logs -f app

# 5. Access setup wizard
# Visit: http://your-domain.com/setup
```

### Update Deployment (After Code Changes)

```bash
# 1. Pull latest code
cd ~/digital-shop
git pull

# 2. Rebuild without cache
docker compose down
docker compose build --no-cache

# 3. Start containers
docker compose up -d

# 4. Verify deployment
docker compose logs -f app
```

### Quick Update (Minor Changes)

```bash
cd ~/digital-shop
git pull
docker compose up -d --build
docker compose logs -f app
```

---

## 5. Common Issues & Solutions

### Issue: "SESSION_SECRET must be set"
**Solution:** Check `.env` file exists and `SESSION_SECRET` is at least 32 characters

```bash
# Verify .env file
cat .env | grep SESSION_SECRET

# Generate new secret if needed
echo "SESSION_SECRET=\"$(openssl rand -hex 32)\"" >> .env
```

### Issue: "The edge runtime does not support Node.js 'crypto' module"
**Solution:** This is fixed in latest code. Pull latest changes:

```bash
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Issue: "Unable to open database file"
**Solution:** Database directory permissions issue

```bash
# Check if data directory exists
docker compose exec app ls -la /app/data

# If not, recreate container
docker compose down -v
docker compose up -d
```

### Issue: "Event handlers cannot be passed to Client Component props"
**Solution:** Fixed in latest code. Update and rebuild:

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

### Issue: Admin redirect loop (can't access /admin)
**Solution:** Clear browser cookies and try again, or check session in logs:

```bash
docker compose logs -f app | grep -i session
```

---

## 6. Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Database file path | `file:/app/data/production.db` |
| `SESSION_SECRET` | Yes | JWT secret (min 32 chars) | Generate with `openssl rand -hex 32` |
| `RESEND_API_KEY` | Yes | Resend API key for emails | `re_xxxxx` |
| `RESEND_FROM_EMAIL` | Yes | Email sender address | `no-reply@yourdomain.com` |
| `NEXT_PUBLIC_TELEGRAM_URL` | Yes | Telegram support link | `https://t.me/your_channel` |
| `NODE_ENV` | Yes | Environment mode | `production` |

---

## 7. Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run type checking
npx tsc --noEmit

# Format code
npx prettier --write .

# Prisma commands
npx prisma generate
npx prisma db push
npx prisma studio
```

---

## 8. Docker Compose File Reference

The `docker-compose.yml` passes environment variables to build stage:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
      args:
        - SESSION_SECRET=${SESSION_SECRET}
        - DATABASE_URL=${DATABASE_URL}
        - RESEND_API_KEY=${RESEND_API_KEY}
        - RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL}
        - NEXT_PUBLIC_TELEGRAM_URL=${NEXT_PUBLIC_TELEGRAM_URL}
```

**Key Points:**
- Build args are passed from `.env` file
- Variables are used during `npm run build`
- Runtime variables are also set in container

---

## 9. Health Check & Monitoring

```bash
# Check if app is running
curl http://localhost:3000

# Check Docker health status
docker compose ps

# Monitor logs in real-time
docker compose logs -f app

# Check container resource usage
docker stats

# Check app process inside container
docker compose exec app ps aux
```

---

## 10. Production Checklist

Before deploying to production:

- [ ] Set strong `SESSION_SECRET` (min 32 chars)
- [ ] Configure valid `RESEND_API_KEY`
- [ ] Set correct `RESEND_FROM_EMAIL` domain
- [ ] Update `NEXT_PUBLIC_TELEGRAM_URL`
- [ ] Verify `.env` file exists in root directory
- [ ] Test build locally: `docker compose build`
- [ ] Backup existing database if updating
- [ ] Run with `--no-cache` for clean build
- [ ] Monitor logs after deployment
- [ ] Test admin login and functionality
- [ ] Verify email sending works
- [ ] Check all pages load correctly

---

## Support

For issues or questions:
- Check logs: `docker compose logs -f app`
- Review this guide for common issues
- Contact via Telegram: Check `NEXT_PUBLIC_TELEGRAM_URL` in your `.env`
