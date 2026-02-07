# ⚡ QUICK START GUIDE

Get auto-topup running in 5 minutes!

## 🎯 Prerequisites

- ✅ Node.js 18+ installed
- ✅ SQLite database
- ✅ Next.js 14+ project
- ✅ Prisma ORM setup
- ✅ Bank API credentials

## 🚀 Installation (5 Steps)

### Step 1: Install Package (30 seconds)

```bash
# Install Prisma if not already installed
npm install @prisma/client

# Copy all files to your project
cp -r EXPORT_AUTO_TOPUP/* /path/to/your/project/
```

### Step 2: Setup Database (1 minute)

```bash
# Apply database migration
sqlite3 prisma/production.db < database/migrations.sql

# Verify tables created
sqlite3 prisma/production.db ".tables"

# Should see: auto_topup_logs, manual_deposit_requests, etc.
```

### Step 3: Copy Source Files (30 seconds)

```bash
# Copy lib files
cp lib/*.ts src/lib/

# Copy API route
mkdir -p src/app/api/cron/auto-topup
cp api/cron-auto-topup-route.ts src/app/api/cron/auto-topup/route.ts

# Copy scripts
mkdir -p scripts
cp scripts/*.sh scripts/
chmod +x scripts/*.sh
```

### Step 4: Configure Bank API (2 minutes)

```bash
# Edit config file
nano config/tpbank-config.json

# Update these fields:
# - apiUrl: Your bank API endpoint
# - credentials.token: Your API token
# - fieldMapping: Match your API response structure

# Insert into database
sqlite3 prisma/production.db <<EOF
INSERT INTO website_settings (key, value, updatedAt)
VALUES ('bank_api_configs', readfile('config/tpbank-config.json'), datetime('now'));
EOF
```

### Step 5: Setup Cron (1 minute)

```bash
# Auto setup
./scripts/setup-cron.sh

# Or manually
crontab -e
# Add: */2 * * * * /path/to/scripts/auto-topup-simple.sh
```

## ✅ Verification

### Test 1: API Endpoint

```bash
curl -X POST http://localhost:3000/api/cron/auto-topup
```

Expected response:
```json
{
  "success": true,
  "processed": 0,
  "message": "Processed 0 transactions"
}
```

### Test 2: Database

```bash
sqlite3 prisma/production.db "SELECT * FROM website_settings WHERE key='bank_api_configs';"
```

Should show your bank config JSON.

### Test 3: Cron Script

```bash
./scripts/auto-topup-simple.sh

# Check logs
cat logs/auto-topup.log
```

Should see success message.

## 🧪 Test with Sample Data

### Create Test User

```sql
INSERT INTO users (id, email, password, role, createdAt, updatedAt)
VALUES ('testuser1', 'test@example.com', 'hashed_password', 'BUYER', datetime('now'), datetime('now'));
```

### Create Test Deposit Request

```sql
INSERT INTO manual_deposit_requests (
  internalId, userId, amountVnd, transferContent, status, createdAt
) VALUES (
  'TOP123456',
  'testuser1',
  100000,
  'NAP testuser1',
  'PENDING',
  datetime('now')
);
```

### Verify

```sql
SELECT * FROM manual_deposit_requests WHERE status='PENDING';
```

## 📊 Monitor

### Real-time Logs

```bash
tail -f logs/auto-topup.log
```

### Check Processing

```sql
-- Recent auto-topups
SELECT * FROM auto_topup_logs ORDER BY createdAt DESC LIMIT 10;

-- Pending requests
SELECT * FROM manual_deposit_requests WHERE status='PENDING';

-- User balance
SELECT u.email, w.balanceVnd
FROM users u
LEFT JOIN wallets w ON u.id = w.userId;
```

## 🔧 Common Issues

### Issue: No transactions found

**Solution:** Check bank API config
```bash
# Test bank API manually
curl -H "Authorization: Bearer YOUR_TOKEN" YOUR_BANK_API_URL
```

### Issue: Cron not running

**Solution:** Check crontab
```bash
crontab -l
grep CRON /var/log/syslog
```

### Issue: Permission denied

**Solution:** Fix script permissions
```bash
chmod +x scripts/auto-topup-simple.sh
```

## 🎉 Next Steps

Once basic setup works:

1. **Add more banks** - Copy config template and add to array
2. **Configure bonus tiers** - See `lib/deposit-bonus.ts`
3. **Setup Discord webhooks** - For notifications
4. **Add admin UI** - Manage configs via web interface
5. **Monitor logs** - Setup log rotation

## 📚 Full Documentation

- `README.md` - Full overview
- `INSTALL.md` - Detailed installation
- `docs/FLOW.md` - System flow
- `docs/DATABASE.md` - Database schema
- `docs/API.md` - API documentation

## 🆘 Need Help?

1. Check logs: `tail -f logs/auto-topup.log`
2. Test API: `curl http://localhost:3000/api/cron/auto-topup`
3. Check database: `sqlite3 prisma/production.db`
4. Review documentation in `docs/` folder

---

**Total Setup Time: ~5 minutes**
**Auto-topup should now run every 2 minutes!** 🎉
