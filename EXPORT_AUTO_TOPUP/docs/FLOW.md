# 🔄 AUTO-TOPUP SYSTEM FLOW

Complete flow diagram of the auto-topup system.

## Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   AUTO-TOPUP SYSTEM FLOW                          │
└──────────────────────────────────────────────────────────────────┘
```

## 1️⃣ CRON TRIGGER

**Schedule:** Every 2 minutes
**Script:** `/path/to/scripts/auto-topup-simple.sh`

```bash
*/2 * * * * /path/to/scripts/auto-topup-simple.sh
```

**What it does:**
- Executes bash script
- Calls HTTP POST to `http://localhost:3000/api/cron/auto-topup`
- Logs response to `/logs/auto-topup.log`

---

## 2️⃣ API ENTRY POINT

**Endpoint:** `POST /api/cron/auto-topup`
**File:** `src/app/api/cron/auto-topup/route.ts`

```typescript
export async function POST() {
  const result = await processAllBanks();
  return NextResponse.json(result);
}
```

**What it does:**
- Receives cron HTTP request
- Calls `processAllBanks()` from `lib/auto-topup.ts`
- Returns processing result as JSON

---

## 3️⃣ LOAD BANK CONFIGS

**Function:** `loadBankConfigs()`
**File:** `lib/generic-bank-api.ts`

```sql
SELECT * FROM website_settings WHERE key='bank_api_configs';
```

**What it does:**
- Query database for bank API configurations
- Parse JSON array of bank configs
- Filter configs where `enabled = true`
- Return array of `BankAPIConfig[]`

**Example config:**
```json
{
  "id": "tpbank_001",
  "name": "TPBank",
  "enabled": true,
  "apiUrl": "https://api.bank.com/transactions",
  "method": "GET",
  "credentials": {
    "token": "xxx"
  }
}
```

---

## 4️⃣ FETCH TRANSACTIONS

**For each enabled bank config:**

### 4.1 Initialize Bank API Client
```typescript
const api = new GenericBankAPI(config);
```

### 4.2 Make HTTP Request
```typescript
const response = await fetch(config.apiUrl, {
  method: config.method,
  headers: {
    'Authorization': `Bearer ${config.credentials.token}`,
    ...config.headers
  }
});
```

### 4.3 Parse Response
```typescript
const data = await response.json();
const transactions = extractTransactions(data, config.fieldMapping.transactionsPath);
```

**Example response:**
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "id": "TXN123456",
        "amount": 100000,
        "description": "Chuyen tien NAP cm123456",
        "date": "2025-01-06T10:30:00Z",
        "type": "CREDIT"
      }
    ]
  }
}
```

### 4.4 Map to Generic Format
```typescript
{
  id: "TXN123456",
  amount: 100000,
  description: "Chuyen tien NAP cm123456",
  date: Date,
  raw: {...}
}
```

### 4.5 Filter Transactions
- Only CREDIT transactions (money IN)
- Amount > 0
- Apply custom filters from config

**Output:** `GenericTransaction[]`

---

## 5️⃣ PROCESS EACH TRANSACTION

**Function:** `processAutoTopup(transactions, bankName)`
**File:** `lib/auto-topup.ts`

### For Each Transaction:

### 5.1 Extract Topup Code
```typescript
function extractTopupCode(description: string): string | null {
  const pattern = /\b(NAP|nap)\s+([a-z0-9]{8})\b/i;
  const match = description.match(pattern);
  return match ? `NAP ${match[2].toLowerCase()}` : null;
}
```

**Example:**
- Input: `"Chuyen tien NAP cm123456 den tai khoan"`
- Output: `"NAP cm123456"`

### 5.2 Check Duplicate
```sql
SELECT * FROM auto_topup_logs
WHERE bankTransactionId = 'TXN123456';
```

**If exists:** Skip (status: 'duplicate')

### 5.3 Find Deposit Request
```sql
SELECT * FROM manual_deposit_requests
WHERE (
  transferContent LIKE '%NAP cm123456%'
  OR transferContent LIKE '%NAPcm123456%'
)
AND status = 'PENDING'
LIMIT 1;
```

**If not found:** Log as 'INVALID' status

### 5.4 Calculate Deposit Bonus
```typescript
const bonusCalc = await calculateDepositBonus(amount);
// Returns: { bonusAmount, bonusPercent, totalAmount }
```

**Example:**
- Amount: 100,000 VND
- Bonus: 10%
- Bonus Amount: 10,000 VND
- Total: 110,000 VND

---

## 6️⃣ DATABASE TRANSACTION

**All operations in single transaction (atomic):**

### 6.1 Update Deposit Request
```sql
UPDATE manual_deposit_requests
SET status = 'APPROVED',
    adminNote = 'Auto-approved via TPBank API. TxID: TXN123456 | Bonus: 10% (+10,000 VND)',
    decidedAt = NOW()
WHERE id = 123;
```

### 6.2 Credit Wallet
```sql
INSERT INTO wallets (userId, balanceVnd, updatedAt)
VALUES ('cm123456', 110000, NOW())
ON CONFLICT (userId) DO UPDATE
SET balanceVnd = balanceVnd + 110000,
    updatedAt = NOW();
```

### 6.3 Create Wallet Transaction
```sql
INSERT INTO wallet_transactions (
  id, userId, type, amountVnd, balanceAfterVnd,
  description, metadata, createdAt
) VALUES (
  'cuid()', 'cm123456', 'DEPOSIT', 110000, 0,
  'Auto topup - NAP cm123456 (Bonus: +10%)',
  '{"depositRequestId":123,"bankTransactionId":"TXN123456",...}',
  NOW()
);
```

### 6.4 Create Auto-Topup Log
```sql
INSERT INTO auto_topup_logs (
  id, bankTransactionId, bankName, depositRequestId,
  userId, topupCode, amountVnd, description,
  status, transactionDate, createdAt
) VALUES (
  'cuid()', 'TXN123456', 'TPBank', 123,
  'cm123456', 'NAP cm123456', 100000, 'Chuyen tien NAP cm123456',
  'SUCCESS', '2025-01-06 10:30:00', NOW()
);
```

### 6.5 Create System Log
```sql
INSERT INTO system_logs (
  id, userId, userEmail, action, targetType, targetId,
  amount, description, metadata, createdAt
) VALUES (
  'cuid()', 'cm123456', 'user@example.com', 'DEPOSIT_AUTO', 'DEPOSIT', '123',
  110000, 'Auto-topup successful: 110,000 VND (Base: 100,000, Bonus: 10,000)',
  '{"bankName":"TPBank","bankTransactionId":"TXN123456",...}',
  NOW()
);
```

**Transaction complete!** ✅

---

## 7️⃣ POST-PROCESSING (Non-critical, errors ignored)

### 7.1 Process Referral Rewards
```typescript
try {
  await processReferralRewards(userId, amount);
} catch (error) {
  console.error('Referral error:', error);
}
```

**Check if this is user's first deposit:**
- If yes, give rewards to both referrer and referee
- Update referral record

### 7.2 Send Discord Webhook
```typescript
try {
  await sendDepositNotification({
    userId, userEmail, amount, status: 'APPROVED', method: 'AUTO'
  });
} catch (error) {
  console.error('Webhook error:', error);
}
```

**Send notification to Discord channel**

---

## 8️⃣ UPDATE LAST CHECKED TIMESTAMP

```sql
INSERT OR REPLACE INTO website_settings (key, value, updatedAt)
VALUES ('bank_api_last_checked', '2025-01-06T10:32:00Z', NOW());
```

---

## 9️⃣ RETURN RESULT

**API Response:**
```json
{
  "success": true,
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "details": [
    {
      "transactionId": "TXN123456",
      "topupCode": "NAP cm123456",
      "amount": 100000,
      "status": "success",
      "message": "Credited 110,000 VND to user@example.com (Base: 100,000, Bonus: +10% = +10,000)"
    }
  ]
}
```

**Logged to file:**
```
[2025-01-06 10:32:00] Running auto-topup...
[2025-01-06 10:32:01] SUCCESS (HTTP 200)
[2025-01-06 10:32:01] Response: {"success":true,"processed":2,...}
```

---

## 🔄 Complete Flow Summary

```
CRON (every 2 min)
  ↓
Bash Script
  ↓
POST /api/cron/auto-topup
  ↓
processAllBanks()
  ↓
loadBankConfigs() → [BankAPIConfig]
  ↓
For Each Bank:
  ├─ GenericBankAPI.fetchTransactions()
  │   ├─ HTTP GET/POST to bank API
  │   ├─ Parse response (fieldMapping)
  │   ├─ Extract transactions array
  │   ├─ Map to GenericTransaction[]
  │   └─ Filter (onlyCredit, amount > 0)
  │
  └─ processAutoTopup(transactions, bankName)
      └─ For Each Transaction:
          ├─ extractTopupCode() → "NAP cm123456"
          ├─ Check duplicate (auto_topup_logs)
          ├─ Find deposit request (PENDING)
          ├─ Calculate bonus
          └─ DB Transaction (atomic):
              ├─ Update deposit request (APPROVED)
              ├─ Credit wallet (+bonus)
              ├─ Create wallet_transaction
              ├─ Create auto_topup_log (SUCCESS)
              └─ Create system_log
          └─ Post-processing:
              ├─ Referral rewards (try-catch)
              └─ Discord webhook (try-catch)
  ↓
updateLastChecked()
  ↓
Return result JSON
  ↓
Log to file
```

---

## ⚠️ Error Handling

### Duplicate Transaction
- **Status:** DUPLICATE
- **Action:** Skip processing
- **Log:** Not logged (already exists)

### No Matching Deposit Request
- **Status:** INVALID
- **Action:** Log with error message
- **Database:** Create auto_topup_log with status='INVALID'

### Processing Error
- **Status:** FAILED
- **Action:** Catch exception, continue to next transaction
- **Database:** Create auto_topup_log with status='FAILED' and errorMessage

### Non-Critical Errors
- Referral rewards failure
- Discord webhook failure
- Email notification failure
- **Action:** Log error, continue (doesn't fail main flow)

---

## 📊 Status Types

| Status | Meaning | Logged to DB? | Wallet Credited? |
|--------|---------|---------------|------------------|
| SUCCESS | Transaction processed successfully | ✅ Yes | ✅ Yes |
| DUPLICATE | Already processed before | ❌ No (skipped) | ❌ No |
| INVALID | No matching deposit request | ✅ Yes | ❌ No |
| FAILED | Processing error occurred | ✅ Yes | ❌ No |

---

## 🎯 Key Features

✅ **Atomic Operations:** All DB updates in single transaction
✅ **Duplicate Prevention:** Unique index on bankTransactionId
✅ **Error Recovery:** Non-critical errors don't break flow
✅ **Comprehensive Logging:** All actions logged to database
✅ **Bonus Calculation:** Automatic deposit bonus
✅ **Referral Integration:** First deposit triggers rewards
✅ **Notifications:** Discord webhook alerts
✅ **Generic API:** Support any bank via config

---

**Last Updated:** 2025-01-06
