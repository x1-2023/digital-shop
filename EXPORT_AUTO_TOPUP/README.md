# 🚀 AUTO-TOPUP SYSTEM - STANDALONE PACKAGE

Complete auto-topup system với Generic Bank API integration.

## 📦 Package Contents

```
EXPORT_AUTO_TOPUP/
├── README.md                          # This file
├── INSTALL.md                         # Installation guide
├── database/
│   ├── schema.prisma                  # Full Prisma schema
│   └── migrations.sql                 # SQL migration script
├── lib/
│   ├── auto-topup.ts                  # Core auto-topup logic
│   ├── generic-bank-api.ts            # Generic bank API client
│   ├── deposit-bonus.ts               # Bonus calculation
│   └── types.ts                       # TypeScript types
├── api/
│   └── cron-auto-topup-route.ts       # Next.js API route
├── scripts/
│   ├── auto-topup-simple.sh           # Cron bash script
│   └── setup-cron.sh                  # Auto setup crontab
├── config/
│   ├── bank-config-example.json       # Example bank configs
│   └── tpbank-config.json             # TPBank specific config
└── docs/
    ├── FLOW.md                        # System flow diagram
    ├── DATABASE.md                    # Database schema docs
    └── API.md                         # API documentation

```

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install @prisma/client
# or
yarn add @prisma/client
```

### 2. Setup Database
```bash
# Copy Prisma schema
cp database/schema.prisma ./prisma/schema.prisma

# Run migration
npx prisma migrate dev --name add_auto_topup

# Or apply SQL directly
sqlite3 prisma/production.db < database/migrations.sql
```

### 3. Copy Source Files
```bash
# Copy lib files
cp lib/* ./src/lib/

# Copy API route
cp api/cron-auto-topup-route.ts ./src/app/api/cron/auto-topup/route.ts

# Copy cron script
cp scripts/auto-topup-simple.sh ./scripts/
chmod +x ./scripts/auto-topup-simple.sh
```

### 4. Configure Bank API
```bash
# Insert bank config into database
# See config/bank-config-example.json for format
```

### 5. Setup Cron
```bash
# Run auto setup script
./scripts/setup-cron.sh

# Or manually add to crontab
crontab -e
# Add: */2 * * * * /path/to/scripts/auto-topup-simple.sh
```

## 🔧 Configuration

### Bank Config Format
Store in `website_settings` table:
```json
{
  "id": "bank_001",
  "name": "TPBank",
  "enabled": true,
  "apiUrl": "https://api.bank.com/transactions",
  "method": "GET",
  "headers": {
    "X-Custom-Header": "value"
  },
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
    "token": "your-api-token"
  }
}
```

### Environment Variables
```env
# Add to .env
DATABASE_URL="file:./prisma/production.db"
```

## 📊 Database Tables Required

- `manual_deposit_requests` - Deposit requests from users
- `auto_topup_logs` - Auto-topup processing logs
- `website_settings` - Bank configs storage
- `wallets` - User wallets
- `wallet_transactions` - Transaction history
- `system_logs` - System activity logs
- `users` - User accounts

## 🎯 Features

✅ Generic Bank API - Support any bank via config
✅ Automatic topup matching via code (NAP + userId)
✅ Duplicate prevention (unique bankTransactionId)
✅ Deposit bonus calculation
✅ Referral rewards integration
✅ Discord webhook notifications
✅ Comprehensive logging
✅ Error handling & recovery

## 🔄 Flow

1. Cron triggers every 2 minutes
2. Fetch bank transactions via Generic API
3. Extract topup codes from descriptions
4. Match with pending deposit requests
5. Calculate bonuses
6. Credit wallet automatically
7. Send notifications
8. Log everything

## 📝 Topup Code Format

User transfers with description: `NAP cm123456`
- Pattern: `NAP [8-char userId]`
- Example: `NAP abc12345`
- Regex: `/\b(NAP|nap)\s+([a-z0-9]{8})\b/i`

## 🛠️ Customization

### Add New Bank
1. Create config in `config/your-bank-config.json`
2. Insert into `website_settings` table:
```sql
INSERT INTO website_settings (key, value, updatedAt)
VALUES ('bank_api_configs', '[{...your config...}]', datetime('now'));
```

### Modify Bonus Calculation
Edit `lib/deposit-bonus.ts`:
```typescript
export async function calculateDepositBonus(amount: number) {
  // Your custom logic here
}
```

### Change Topup Code Pattern
Edit `lib/auto-topup.ts`, function `extractTopupCode()`:
```typescript
function extractTopupCode(description: string): string | null {
  // Your custom pattern here
}
```

## 🐛 Troubleshooting

### Check Logs
```bash
tail -f /root/digital-shop/logs/auto-topup.log
```

### Test API Manually
```bash
curl -X POST http://localhost:3000/api/cron/auto-topup
```

### Check Database
```bash
sqlite3 prisma/production.db "SELECT * FROM auto_topup_logs ORDER BY createdAt DESC LIMIT 10;"
```

## 📚 Documentation

See `docs/` folder for detailed documentation:
- `FLOW.md` - Complete system flow
- `DATABASE.md` - Database schema
- `API.md` - API endpoints

## 🔐 Security Notes

- Store API tokens in environment variables
- Use HTTPS for bank API calls
- Validate all transaction data
- Implement rate limiting
- Log all activities
- Monitor for suspicious patterns

## 📄 License

MIT License - Use freely in your projects

## 🤝 Support

For issues or questions, check the documentation or logs.

---

**Created with ❤️ by Claude Code**
