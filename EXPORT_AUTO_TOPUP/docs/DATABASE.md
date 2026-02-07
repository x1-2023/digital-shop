# 🗄️ DATABASE SCHEMA DOCUMENTATION

Complete database schema for Auto-Topup System.

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Sample Data](#sample-data)

---

## Overview

The auto-topup system uses 7 main tables:

- `auto_topup_logs` - Processing logs
- `manual_deposit_requests` - User topup requests
- `website_settings` - Bank API configs
- `wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `system_logs` - System activity logs
- `users` - User accounts (existing)

---

## Tables

### 1. auto_topup_logs

Stores all auto-topup processing attempts.

```sql
CREATE TABLE auto_topup_logs (
  id                TEXT PRIMARY KEY,
  bankTransactionId TEXT UNIQUE NOT NULL,
  bankName          TEXT NOT NULL,
  depositRequestId  INTEGER,
  userId            TEXT,
  topupCode         TEXT NOT NULL,
  amountVnd         REAL NOT NULL,
  description       TEXT NOT NULL,
  status            TEXT NOT NULL,
  errorMessage      TEXT,
  transactionDate   DATETIME NOT NULL,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique identifier (CUID)
- `bankTransactionId` - Bank's transaction ID (UNIQUE to prevent duplicates)
- `bankName` - Name of the bank (e.g., "TPBank")
- `depositRequestId` - FK to manual_deposit_requests (nullable)
- `userId` - FK to users (nullable)
- `topupCode` - Extracted topup code (e.g., "NAP cm123456")
- `amountVnd` - Transaction amount in VND
- `description` - Original bank transaction description
- `status` - SUCCESS | FAILED | INVALID | DUPLICATE
- `errorMessage` - Error details if failed
- `transactionDate` - When transaction occurred at bank
- `createdAt` - When record was created

**Indexes:**
```sql
CREATE UNIQUE INDEX auto_topup_logs_bankTransactionId_key
ON auto_topup_logs(bankTransactionId);

CREATE INDEX auto_topup_logs_userId_idx
ON auto_topup_logs(userId);

CREATE INDEX auto_topup_logs_status_idx
ON auto_topup_logs(status);
```

**Status Values:**
- `SUCCESS` - Transaction processed successfully
- `FAILED` - Processing error occurred
- `INVALID` - No matching deposit request found
- `DUPLICATE` - Already processed (skipped)

---

### 2. manual_deposit_requests

User topup requests (created when user wants to deposit).

```sql
CREATE TABLE manual_deposit_requests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  internalId      TEXT UNIQUE,
  userId          TEXT NOT NULL,
  amountVnd       REAL NOT NULL,
  note            TEXT,
  qrCode          TEXT,
  transferContent TEXT,
  status          TEXT DEFAULT 'PENDING',
  adminNote       TEXT,
  decidedAt       DATETIME,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `id` - Auto-increment ID
- `internalId` - Unique topup code (e.g., "TOP123456")
- `userId` - FK to users
- `amountVnd` - Requested deposit amount
- `note` - User's note
- `qrCode` - QR code image URL
- `transferContent` - Transfer content for matching (contains topup code)
- `status` - PENDING | APPROVED | REJECTED
- `adminNote` - Admin's note when approving/rejecting
- `decidedAt` - When admin decided
- `createdAt` - When request was created

**Indexes:**
```sql
CREATE UNIQUE INDEX manual_deposit_requests_internalId_key
ON manual_deposit_requests(internalId);
```

**Status Values:**
- `PENDING` - Waiting for payment
- `APPROVED` - Payment received and approved
- `REJECTED` - Rejected by admin

---

### 3. website_settings

Key-value store for configs (including bank API configs).

```sql
CREATE TABLE website_settings (
  key       TEXT PRIMARY KEY,
  value     TEXT NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

**Important Keys:**

**`bank_api_configs`** - Array of bank API configurations
```json
{
  "key": "bank_api_configs",
  "value": "[{\"id\":\"tpbank_001\",\"name\":\"TPBank\",\"enabled\":true,...}]",
  "updatedAt": "2025-01-06T10:00:00Z"
}
```

**`bank_api_last_checked`** - Last time cron ran
```json
{
  "key": "bank_api_last_checked",
  "value": "2025-01-06T10:32:00Z",
  "updatedAt": "2025-01-06T10:32:00Z"
}
```

**`deposit_bonus_tiers`** - Bonus tier configuration
```json
{
  "key": "deposit_bonus_tiers",
  "value": "[{\"id\":\"tier_1\",\"minAmount\":100000,\"bonusPercent\":5,...}]",
  "updatedAt": "2025-01-06T10:00:00Z"
}
```

---

### 4. wallets

User wallet balances.

```sql
CREATE TABLE wallets (
  id         TEXT PRIMARY KEY,
  userId     TEXT UNIQUE NOT NULL,
  balanceVnd REAL DEFAULT 0,
  updatedAt  DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `id` - Unique identifier (CUID)
- `userId` - FK to users (UNIQUE - one wallet per user)
- `balanceVnd` - Current balance in VND
- `updatedAt` - Last update timestamp

**Indexes:**
```sql
CREATE UNIQUE INDEX wallets_userId_key ON wallets(userId);
```

---

### 5. wallet_transactions

Transaction history for wallets.

```sql
CREATE TABLE wallet_transactions (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL,
  type            TEXT NOT NULL,
  amountVnd       REAL NOT NULL,
  balanceAfterVnd REAL NOT NULL,
  description     TEXT,
  metadata        TEXT,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique identifier (CUID)
- `userId` - FK to users
- `type` - DEPOSIT | WITHDRAW | PAYMENT | REFUND
- `amountVnd` - Transaction amount
- `balanceAfterVnd` - Balance after transaction
- `description` - Transaction description
- `metadata` - JSON string with additional data
- `createdAt` - Transaction timestamp

**Indexes:**
```sql
CREATE INDEX wallet_transactions_userId_idx
ON wallet_transactions(userId);
```

**Metadata Example:**
```json
{
  "depositRequestId": 123,
  "bankTransactionId": "TXN123456",
  "bankName": "TPBank",
  "originalAmount": 100000,
  "bonusAmount": 10000,
  "bonusPercent": 10,
  "totalAmount": 110000
}
```

---

### 6. system_logs

System-wide activity logs.

```sql
CREATE TABLE system_logs (
  id          TEXT PRIMARY KEY,
  userId      TEXT,
  userEmail   TEXT,
  action      TEXT NOT NULL,
  targetType  TEXT,
  targetId    TEXT,
  amount      REAL,
  description TEXT NOT NULL,
  metadata    TEXT,
  ipAddress   TEXT,
  userAgent   TEXT,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Unique identifier (CUID)
- `userId` - FK to users (nullable)
- `userEmail` - User's email for easier searching
- `action` - Action type (e.g., "DEPOSIT_AUTO", "DEPOSIT_MANUAL")
- `targetType` - Type of target (e.g., "DEPOSIT", "ORDER")
- `targetId` - ID of target record
- `amount` - Amount involved (nullable)
- `description` - Human-readable description
- `metadata` - JSON string with additional data
- `ipAddress` - IP address (nullable)
- `userAgent` - User agent string (nullable)
- `createdAt` - Log timestamp

**Indexes:**
```sql
CREATE INDEX system_logs_userId_idx ON system_logs(userId);
CREATE INDEX system_logs_action_idx ON system_logs(action);
CREATE INDEX system_logs_createdAt_idx ON system_logs(createdAt);
```

**Common Actions:**
- `DEPOSIT_AUTO` - Auto-topup deposit
- `DEPOSIT_MANUAL` - Manual deposit approval
- `WITHDRAW` - Wallet withdrawal
- `PAYMENT` - Order payment

---

### 7. users

User accounts (existing table - minimal fields shown).

```sql
CREATE TABLE users (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  role      TEXT DEFAULT 'BUYER',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);
```

---

## Relationships

```
users
  ├─ 1:1  → wallets (userId)
  ├─ 1:n  → wallet_transactions (userId)
  ├─ 1:n  → manual_deposit_requests (userId)
  └─ 1:n  → auto_topup_logs (userId)

manual_deposit_requests
  ├─ n:1  → users (userId)
  └─ 1:n  → auto_topup_logs (depositRequestId)

auto_topup_logs
  ├─ n:1  → users (userId)
  └─ n:1  → manual_deposit_requests (depositRequestId)

wallets
  └─ 1:1  → users (userId)

wallet_transactions
  └─ n:1  → users (userId)

system_logs
  └─ n:1  → users (userId) [optional]
```

---

## Sample Data

### Bank API Config

```sql
INSERT INTO website_settings (key, value, updatedAt)
VALUES (
  'bank_api_configs',
  '[
    {
      "id": "tpbank_001",
      "name": "TPBank",
      "enabled": true,
      "apiUrl": "https://api.tpbank.com/transactions",
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
        "token": "your_api_token_here"
      }
    }
  ]',
  datetime('now')
);
```

### User & Wallet

```sql
-- User
INSERT INTO users (id, email, password, role, createdAt, updatedAt)
VALUES ('cm123456', 'user@example.com', 'hashed_password', 'BUYER', datetime('now'), datetime('now'));

-- Wallet
INSERT INTO wallets (id, userId, balanceVnd, updatedAt)
VALUES ('wallet_1', 'cm123456', 0, datetime('now'));
```

### Deposit Request

```sql
INSERT INTO manual_deposit_requests (
  internalId, userId, amountVnd, transferContent, status, createdAt
) VALUES (
  'TOP123456',
  'cm123456',
  100000,
  'NAP cm123456',
  'PENDING',
  datetime('now')
);
```

### Auto-Topup Log

```sql
INSERT INTO auto_topup_logs (
  id, bankTransactionId, bankName, depositRequestId,
  userId, topupCode, amountVnd, description,
  status, transactionDate, createdAt
) VALUES (
  'log_1',
  'TXN123456',
  'TPBank',
  1,
  'cm123456',
  'NAP cm123456',
  100000,
  'Chuyen tien NAP cm123456 den tai khoan',
  'SUCCESS',
  datetime('now'),
  datetime('now')
);
```

### Wallet Transaction

```sql
INSERT INTO wallet_transactions (
  id, userId, type, amountVnd, balanceAfterVnd,
  description, metadata, createdAt
) VALUES (
  'tx_1',
  'cm123456',
  'DEPOSIT',
  110000,
  110000,
  'Auto topup - NAP cm123456 (Bonus: +10%)',
  '{"depositRequestId":1,"bankTransactionId":"TXN123456","bonusAmount":10000}',
  datetime('now')
);
```

### System Log

```sql
INSERT INTO system_logs (
  id, userId, userEmail, action, targetType, targetId,
  amount, description, metadata, createdAt
) VALUES (
  'syslog_1',
  'cm123456',
  'user@example.com',
  'DEPOSIT_AUTO',
  'DEPOSIT',
  '1',
  110000,
  'Auto-topup successful: 110,000 VND (Base: 100,000, Bonus: 10,000)',
  '{"bankName":"TPBank","bankTransactionId":"TXN123456"}',
  datetime('now')
);
```

---

## Queries

### Get User's Balance

```sql
SELECT balanceVnd
FROM wallets
WHERE userId = 'cm123456';
```

### Get User's Transaction History

```sql
SELECT
  wt.id,
  wt.type,
  wt.amountVnd,
  wt.balanceAfterVnd,
  wt.description,
  wt.createdAt
FROM wallet_transactions wt
WHERE wt.userId = 'cm123456'
ORDER BY wt.createdAt DESC
LIMIT 20;
```

### Get Pending Deposit Requests

```sql
SELECT
  mdr.id,
  mdr.internalId,
  mdr.amountVnd,
  mdr.transferContent,
  mdr.createdAt,
  u.email
FROM manual_deposit_requests mdr
JOIN users u ON mdr.userId = u.id
WHERE mdr.status = 'PENDING'
ORDER BY mdr.createdAt ASC;
```

### Get Recent Auto-Topups

```sql
SELECT
  atl.bankTransactionId,
  atl.topupCode,
  atl.amountVnd,
  atl.status,
  atl.createdAt,
  u.email
FROM auto_topup_logs atl
LEFT JOIN users u ON atl.userId = u.id
ORDER BY atl.createdAt DESC
LIMIT 20;
```

### Get Failed Auto-Topups

```sql
SELECT
  bankTransactionId,
  topupCode,
  amountVnd,
  status,
  errorMessage,
  createdAt
FROM auto_topup_logs
WHERE status IN ('FAILED', 'INVALID')
ORDER BY createdAt DESC;
```

### Daily Topup Statistics

```sql
SELECT
  DATE(createdAt) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'SUCCESS' THEN amountVnd ELSE 0 END) as total_amount
FROM auto_topup_logs
GROUP BY DATE(createdAt)
ORDER BY date DESC
LIMIT 30;
```

---

## Migration Path

### From No Auto-Topup to Auto-Topup

1. **Backup existing database**
   ```bash
   cp production.db production-backup-$(date +%Y%m%d).db
   ```

2. **Run migration**
   ```bash
   sqlite3 production.db < migrations.sql
   ```

3. **Verify tables created**
   ```bash
   sqlite3 production.db ".tables"
   ```

4. **Insert bank config**
   ```sql
   INSERT INTO website_settings (key, value, updatedAt)
   VALUES ('bank_api_configs', '[]', datetime('now'));
   ```

5. **Test query**
   ```sql
   SELECT * FROM website_settings WHERE key = 'bank_api_configs';
   ```

---

**Last Updated:** 2025-01-06
