# 📦 INSTALLATION GUIDE

Step-by-step guide to install Auto-Topup System in your project.

## Prerequisites

- Node.js 18+ or 20+
- SQLite database (or PostgreSQL/MySQL with schema modifications)
- Prisma ORM
- Next.js 14+ (for API routes)
- Unix-like system (Linux/macOS) for cron

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
npm install @prisma/client
# or
yarn add @prisma/client
```

### Step 2: Setup Database

#### Option A: Using Prisma Migration (Recommended)

```bash
# Copy schema file to your project
cp database/schema.prisma ./prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_auto_topup_system

# Apply migration
npx prisma migrate deploy
```

#### Option B: Direct SQL Execution

```bash
# For SQLite
sqlite3 prisma/production.db < database/migrations.sql

# For PostgreSQL
psql -U postgres -d your_database < database/migrations-postgres.sql

# For MySQL
mysql -u root -p your_database < database/migrations-mysql.sql
```

### Step 3: Copy Source Files

```bash
# Create directories
mkdir -p src/lib src/app/api/cron/auto-topup scripts

# Copy library files
cp lib/auto-topup.ts src/lib/
cp lib/generic-bank-api.ts src/lib/
cp lib/types.ts src/lib/

# Copy API route
cp api/cron-auto-topup-route.ts src/app/api/cron/auto-topup/route.ts

# Copy cron script
cp scripts/auto-topup-simple.sh scripts/
chmod +x scripts/auto-topup-simple.sh
```

### Step 4: Configure Environment

```bash
# Add to .env file
echo 'DATABASE_URL="file:./prisma/production.db"' >> .env
echo 'NODE_ENV="production"' >> .env
```

### Step 5: Setup Bank Configuration

#### Insert bank config into database:

```sql
INSERT INTO website_settings (key, value, updatedAt)
VALUES (
  'bank_api_configs',
  '[
    {
      "id": "tpbank_001",
      "name": "TPBank",
      "enabled": true,
      "apiUrl": "https://your-bank-api.com/transactions",
      "method": "GET",
      "headers": {},
      "fieldMapping": {
        "transactionsPath": "data.transactions",
        "fields": {
          "transactionId": "id",
          "amount": "amount",
          "description": "description",
          "transactionDate": "date"
        }
      },
      "filters": {
        "onlyCredit": true,
        "creditIndicator": {
          "field": "type",
          "value": "IN",
          "condition": "equals"
        }
      },
      "credentials": {
        "token": "YOUR_API_TOKEN_HERE"
      }
    }
  ]',
  datetime('now')
);
```

**Or use config files:**

```bash
# TPBank example
cat config/tpbank-config.json | jq -c '.' > /tmp/config.json

# Then insert via SQL
sqlite3 prisma/production.db <<EOF
INSERT INTO website_settings (key, value, updatedAt)
VALUES ('bank_api_configs', readfile('/tmp/config.json'), datetime('now'));
EOF
```

### Step 6: Setup Cron Job

#### Option A: Automated Setup

```bash
./scripts/setup-cron.sh
```

#### Option B: Manual Setup

```bash
# Make script executable
chmod +x scripts/auto-topup-simple.sh

# Edit crontab
crontab -e

# Add this line (runs every 2 minutes):
*/2 * * * * /full/path/to/your/project/scripts/auto-topup-simple.sh

# Save and exit
```

### Step 7: Update Script Paths

Edit `scripts/auto-topup-simple.sh`:

```bash
# Change these lines to your actual paths:
API_URL="http://localhost:3000/api/cron/auto-topup"
LOG_DIR="/your/project/path/logs"
LOG_FILE="$LOG_DIR/auto-topup.log"
```

### Step 8: Test Installation

#### Test API Endpoint:

```bash
curl -X POST http://localhost:3000/api/cron/auto-topup
```

Expected response:
```json
{
  "success": true,
  "processed": 0,
  "succeeded": 0,
  "failed": 0,
  "message": "Processed 0 transactions"
}
```

#### Test Cron Script:

```bash
./scripts/auto-topup-simple.sh
```

Check logs:
```bash
cat logs/auto-topup.log
```

### Step 9: Verify Database

```bash
# Check if tables were created
sqlite3 prisma/production.db ".tables"

# Should include:
# - auto_topup_logs
# - manual_deposit_requests
# - website_settings
# - wallets
# - wallet_transactions
# - system_logs
```

### Step 10: Create Test Deposit Request

```sql
-- Insert test user (if needed)
INSERT INTO users (id, email, password, role, createdAt, updatedAt)
VALUES ('testuser1', 'test@example.com', 'hashed_password', 'BUYER', datetime('now'), datetime('now'));

-- Create test deposit request
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

---

## 🔧 Configuration

### Bank API Config Structure

```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  enabled: boolean;        // Enable/disable this bank
  apiUrl: string;          // Bank API endpoint
  method: 'GET' | 'POST';  // HTTP method
  headers?: {              // Optional custom headers
    [key: string]: string;
  };
  fieldMapping: {
    transactionsPath: string;  // e.g., "data.transactions"
    fields: {
      transactionId: string;   // e.g., "id"
      amount: string;          // e.g., "amount"
      description: string;     // e.g., "description"
      transactionDate: string; // e.g., "date"
      type?: string;           // e.g., "type"
    };
  };
  filters: {
    onlyCredit: boolean;    // Filter only credit transactions
    creditIndicator?: {
      field: string;        // Field to check
      value: string | number; // Value to match
      condition: 'equals' | 'greater' | 'contains';
    };
  };
  credentials?: {
    token?: string;         // API token
    apiKey?: string;        // API key
  };
}
```

### Cron Schedule Options

```bash
# Every 2 minutes (default)
*/2 * * * * /path/to/script.sh

# Every 5 minutes
*/5 * * * * /path/to/script.sh

# Every 1 minute (not recommended - too frequent)
* * * * * /path/to/script.sh

# Every 10 minutes
*/10 * * * * /path/to/script.sh

# Every hour
0 * * * * /path/to/script.sh
```

---

## 🐛 Troubleshooting

### Issue: Cron not running

**Check:**
```bash
# Verify cron service is running
sudo systemctl status cron

# Check crontab
crontab -l

# Check syslog for cron errors
grep CRON /var/log/syslog
```

### Issue: Script permission denied

**Fix:**
```bash
chmod +x scripts/auto-topup-simple.sh
```

### Issue: API returns 404

**Check:**
- Next.js server is running
- API route file exists at correct path
- Try accessing directly: `http://localhost:3000/api/cron/auto-topup`

### Issue: No transactions found

**Check:**
- Bank API config is enabled
- API URL is correct
- API token is valid
- Field mapping matches actual API response

**Debug:**
```bash
# Test bank API manually
curl -H "Authorization: Bearer YOUR_TOKEN" https://bank-api.com/transactions
```

### Issue: Transactions not matching

**Check:**
- Transfer content format: Must contain "NAP [userId]"
- Deposit request status is "PENDING"
- User ID is exactly 8 characters

**Debug:**
```sql
-- Check pending requests
SELECT * FROM manual_deposit_requests WHERE status = 'PENDING';

-- Check auto-topup logs
SELECT * FROM auto_topup_logs ORDER BY createdAt DESC LIMIT 10;
```

### Issue: Database locked

**Fix:**
```bash
# If using SQLite, ensure no other processes are accessing DB
lsof | grep production.db

# Kill hanging processes if needed
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
tail -f logs/auto-topup.log

# Last 50 lines
tail -n 50 logs/auto-topup.log

# Search for errors
grep ERROR logs/auto-topup.log
```

### Database Queries

```sql
-- Recent successful topups
SELECT * FROM auto_topup_logs
WHERE status = 'SUCCESS'
ORDER BY createdAt DESC
LIMIT 10;

-- Failed topups
SELECT * FROM auto_topup_logs
WHERE status = 'FAILED'
ORDER BY createdAt DESC;

-- Pending deposit requests
SELECT * FROM manual_deposit_requests
WHERE status = 'PENDING';

-- Total topup amount today
SELECT SUM(amountVnd) as total
FROM auto_topup_logs
WHERE status = 'SUCCESS'
AND DATE(createdAt) = DATE('now');
```

### Health Check API

Create a health check endpoint:

```typescript
// src/app/api/cron/auto-topup/health/route.ts
export async function GET() {
  const lastChecked = await prisma.websiteSettings.findFirst({
    where: { key: 'bank_api_last_checked' }
  });

  return NextResponse.json({
    status: 'ok',
    lastChecked: lastChecked?.value,
    uptime: process.uptime()
  });
}
```

---

## 🔒 Security

### Best Practices

1. **Store API tokens in environment variables**
   ```bash
   echo 'BANK_API_TOKEN=your_token' >> .env
   ```

2. **Restrict API access**
   ```typescript
   // Add API key check
   if (request.headers.get('X-API-Key') !== process.env.CRON_API_KEY) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. **Use HTTPS for bank API calls**

4. **Enable rate limiting**

5. **Monitor logs for suspicious activity**

6. **Backup database regularly**
   ```bash
   # Daily backup cron
   0 0 * * * cp /path/to/production.db /path/to/backups/production-$(date +\%Y\%m\%d).db
   ```

---

## ✅ Post-Installation Checklist

- [ ] Database tables created
- [ ] Source files copied
- [ ] Bank config inserted
- [ ] Cron job setup
- [ ] Script permissions set
- [ ] Logs directory created
- [ ] Test API endpoint works
- [ ] Test cron script works
- [ ] Test deposit request created
- [ ] Monitor logs for first run
- [ ] Verify first transaction processes

---

## 📞 Support

If you encounter issues:

1. Check logs: `tail -f logs/auto-topup.log`
2. Check database: `sqlite3 prisma/production.db`
3. Check API response: `curl http://localhost:3000/api/cron/auto-topup`
4. Review documentation in `docs/` folder

---

**Installation complete!** 🎉

Your auto-topup system should now be running every 2 minutes.
