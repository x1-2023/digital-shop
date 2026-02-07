# 🔌 API DOCUMENTATION

Complete API documentation for Auto-Topup System.

## Endpoints

### 1. Cron Auto-Topup Endpoint

**Endpoint:** `POST /api/cron/auto-topup`
**File:** `src/app/api/cron/auto-topup/route.ts`
**Authentication:** None (should be restricted to localhost or with API key)

**Description:**
Main endpoint called by cron job to process auto-topups.

**Request:**
```http
POST /api/cron/auto-topup HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true,
  "processed": 3,
  "succeeded": 2,
  "failed": 1,
  "message": "Processed 3 transactions",
  "details": [
    {
      "transactionId": "TXN123456",
      "topupCode": "NAP cm123456",
      "amount": 100000,
      "status": "success",
      "message": "Credited 110,000 VND to user@example.com (Base: 100,000, Bonus: +10% = +10,000)"
    },
    {
      "transactionId": "TXN123457",
      "topupCode": "NAP abc12345",
      "amount": 50000,
      "status": "success",
      "message": "Credited 50,000 VND to test@example.com"
    },
    {
      "transactionId": "TXN123458",
      "topupCode": "NAP unknown1",
      "amount": 75000,
      "status": "invalid",
      "message": "No matching deposit request"
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No bank configs found"
}
```

**Status Codes:**
- `200 OK` - Successfully processed (even if some transactions failed)
- `500 Internal Server Error` - Fatal error in processing

---

### 2. Health Check (Optional)

**Endpoint:** `GET /api/cron/auto-topup/health`
**Authentication:** None

**Description:**
Check if auto-topup system is running and when it last ran.

**Request:**
```http
GET /api/cron/auto-topup/health HTTP/1.1
Host: localhost:3000
```

**Response:**
```json
{
  "status": "ok",
  "lastChecked": "2025-01-06T10:32:00.000Z",
  "uptime": 12345
}
```

---

## Internal Functions

### `processAllBanks()`

**Location:** `lib/auto-topup.ts`
**Description:** Main function that orchestrates auto-topup processing

**Returns:**
```typescript
{
  success: boolean;
  processed: number;
  failed: number;
  details: Array<{
    transactionId: string;
    topupCode: string;
    amount: number;
    status: 'success' | 'failed' | 'duplicate' | 'invalid';
    message: string;
  }>;
}
```

**Flow:**
1. Load bank configs from database
2. For each enabled bank:
   - Fetch transactions via GenericBankAPI
   - Process each transaction
3. Update last checked timestamp
4. Return aggregated results

---

### `processAutoTopup(transactions, bankName)`

**Location:** `lib/auto-topup.ts`
**Parameters:**
- `transactions: GenericTransaction[]` - Array of normalized transactions
- `bankName: string` - Name of the bank for logging

**Description:**
Process individual transactions and match with deposit requests.

**Returns:** Same as `processAllBanks()`

**Flow for each transaction:**
1. Extract topup code from description
2. Check if already processed (duplicate prevention)
3. Find matching deposit request (PENDING status)
4. Calculate deposit bonus
5. Execute database transaction:
   - Update deposit request → APPROVED
   - Credit user wallet
   - Create wallet transaction record
   - Create auto-topup log
   - Create system log
6. Process referral rewards (if first deposit)
7. Send Discord webhook notification

---

### `extractTopupCode(description)`

**Location:** `lib/auto-topup.ts`
**Parameters:**
- `description: string` - Bank transaction description

**Returns:** `string | null` - Extracted topup code or null

**Pattern:** `/\b(NAP|nap)\s+([a-z0-9]{8})\b/i`

**Examples:**
```typescript
extractTopupCode("Chuyen tien NAP cm123456") // → "NAP cm123456"
extractTopupCode("NAP abc12345 payment")     // → "NAP abc12345"
extractTopupCode("Transfer 100k")            // → null
```

---

### GenericBankAPI Class

**Location:** `lib/generic-bank-api.ts`

#### Constructor
```typescript
new GenericBankAPI(config: BankAPIConfig)
```

#### Methods

**`fetchTransactions()`**
- Fetches transactions from bank API
- Maps response to GenericTransaction format
- Filters credit transactions
- Returns: `Promise<GenericTransaction[]>`

**Flow:**
1. Make HTTP request to bank API
2. Extract transactions array from response using fieldMapping.transactionsPath
3. Map each transaction to GenericTransaction format
4. Filter by creditIndicator (if configured)
5. Filter amount > 0
6. Return normalized transactions

---

### `loadBankConfigs()`

**Location:** `lib/generic-bank-api.ts`
**Description:** Load bank API configs from database

**Returns:** `Promise<BankAPIConfig[]>`

**SQL:**
```sql
SELECT * FROM website_settings WHERE key = 'bank_api_configs';
```

**Returns:**
```typescript
[
  {
    id: "tpbank_001",
    name: "TPBank",
    enabled: true,
    apiUrl: "https://...",
    // ... rest of config
  }
]
```

---

### `saveBankConfigs(configs)`

**Location:** `lib/generic-bank-api.ts`
**Parameters:**
- `configs: BankAPIConfig[]` - Array of bank configs

**Description:** Save bank configs to database

**SQL:**
```sql
INSERT OR REPLACE INTO website_settings (key, value, updatedAt)
VALUES ('bank_api_configs', JSON.stringify(configs), NOW());
```

---

### `calculateDepositBonus(amount)`

**Location:** `lib/deposit-bonus.ts` (you need to create this)
**Parameters:**
- `amount: number` - Deposit amount in VND

**Returns:**
```typescript
{
  bonusAmount: number;    // e.g., 10000
  bonusPercent: number;   // e.g., 10
  totalAmount: number;    // e.g., 110000
  tier?: {
    id: string;
    name: string;
    minAmount: number;
    bonusPercent: number;
  };
}
```

**Example Implementation:**
```typescript
export async function calculateDepositBonus(amount: number) {
  // Load bonus tiers from database or config
  const tiers = [
    { minAmount: 0, bonusPercent: 0 },
    { minAmount: 100000, bonusPercent: 5 },
    { minAmount: 500000, bonusPercent: 10 },
    { minAmount: 1000000, bonusPercent: 15 },
  ];

  // Find applicable tier
  const tier = tiers
    .filter(t => amount >= t.minAmount)
    .sort((a, b) => b.minAmount - a.minAmount)[0];

  const bonusAmount = (amount * tier.bonusPercent) / 100;
  const totalAmount = amount + bonusAmount;

  return {
    bonusAmount,
    bonusPercent: tier.bonusPercent,
    totalAmount,
    tier,
  };
}
```

---

## Database Queries

### Insert Bank Config

```sql
INSERT INTO website_settings (key, value, updatedAt)
VALUES (
  'bank_api_configs',
  '[
    {
      "id": "bank_001",
      "name": "TPBank",
      "enabled": true,
      "apiUrl": "https://api.bank.com/transactions",
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
        "token": "YOUR_TOKEN"
      }
    }
  ]',
  datetime('now')
);
```

### Query Recent Auto-Topups

```sql
SELECT
  atl.id,
  atl.bankTransactionId,
  atl.bankName,
  atl.topupCode,
  atl.amountVnd,
  atl.status,
  atl.createdAt,
  u.email as userEmail,
  mdr.id as depositRequestId,
  mdr.status as depositStatus
FROM auto_topup_logs atl
LEFT JOIN users u ON atl.userId = u.id
LEFT JOIN manual_deposit_requests mdr ON atl.depositRequestId = mdr.id
ORDER BY atl.createdAt DESC
LIMIT 20;
```

### Query Pending Deposit Requests

```sql
SELECT
  id,
  userId,
  amountVnd,
  transferContent,
  createdAt,
  (SELECT email FROM users WHERE id = manual_deposit_requests.userId) as userEmail
FROM manual_deposit_requests
WHERE status = 'PENDING'
ORDER BY createdAt DESC;
```

### Query Failed Auto-Topups

```sql
SELECT
  bankTransactionId,
  topupCode,
  amountVnd,
  description,
  status,
  errorMessage,
  createdAt
FROM auto_topup_logs
WHERE status IN ('FAILED', 'INVALID')
ORDER BY createdAt DESC
LIMIT 50;
```

---

## Webhook Integration (Optional)

### Discord Webhook

**Function:** `sendDepositNotification(config, data)`
**Location:** `lib/discord-webhook.ts` (you need to create this)

**Example:**
```typescript
export async function sendDepositNotification(config, data) {
  const webhookUrl = config.webhookUrl;

  const payload = {
    embeds: [{
      title: "💰 New Auto-Topup",
      color: 0x00ff00,
      fields: [
        { name: "User", value: data.userEmail, inline: true },
        { name: "Amount", value: `${data.amount.toLocaleString('vi-VN')} VND`, inline: true },
        { name: "Status", value: data.status, inline: true },
        { name: "Method", value: data.method, inline: true },
      ],
      timestamp: new Date().toISOString(),
    }]
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
```

---

## Error Codes & Messages

| Status | Description | Action Required |
|--------|-------------|-----------------|
| SUCCESS | Transaction processed successfully | None |
| DUPLICATE | Already processed (duplicate bankTransactionId) | None (skip) |
| INVALID | No matching deposit request found | Check transfer content format |
| FAILED | Processing error occurred | Check logs and errorMessage field |

---

## Testing

### Test Bank API Manually

```bash
# Test with curl
curl -X GET "https://bank-api.com/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Auto-Topup Endpoint

```bash
# Trigger auto-topup manually
curl -X POST http://localhost:3000/api/cron/auto-topup
```

### Test with Mock Data

```typescript
// Create test transaction
const mockTransaction: GenericTransaction = {
  id: "TEST123",
  amount: 100000,
  description: "Chuyen tien NAP testuser1",
  date: new Date(),
  currency: "VND",
  raw: {}
};

// Process
const result = await processAutoTopup([mockTransaction], "TestBank");
console.log(result);
```

---

## Performance Considerations

### Database Indexes

Ensure these indexes exist:
```sql
CREATE INDEX idx_auto_topup_logs_userId ON auto_topup_logs(userId);
CREATE INDEX idx_auto_topup_logs_status ON auto_topup_logs(status);
CREATE UNIQUE INDEX idx_auto_topup_logs_bankTxId ON auto_topup_logs(bankTransactionId);
CREATE INDEX idx_deposit_requests_status ON manual_deposit_requests(status);
```

### Rate Limiting

Recommended cron frequency:
- **Every 2 minutes** - Default (good balance)
- **Every 1 minute** - High frequency (may stress bank API)
- **Every 5 minutes** - Conservative (slower detection)

### Batch Size

If bank API returns many transactions:
- Process in batches of 50-100
- Add pagination support
- Implement cursor-based fetching

---

## Security Best Practices

1. **API Token Storage**
   ```bash
   # Store in environment variables
   BANK_API_TOKEN=your_token_here
   ```

2. **Restrict Cron Endpoint**
   ```typescript
   // Add IP whitelist
   const allowedIPs = ['127.0.0.1', '::1'];
   if (!allowedIPs.includes(clientIP)) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

3. **Add API Key**
   ```bash
   # In cron script
   curl -H "X-API-Key: your_secret_key" http://localhost:3000/api/cron/auto-topup
   ```

4. **HTTPS Only for Bank API**
   ```typescript
   if (!config.apiUrl.startsWith('https://')) {
     throw new Error('Bank API must use HTTPS');
   }
   ```

---

**Last Updated:** 2025-01-06
