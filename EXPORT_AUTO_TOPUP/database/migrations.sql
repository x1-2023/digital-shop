-- ==============================================================================
-- AUTO-TOPUP DATABASE SCHEMA
-- ==============================================================================
-- SQLite Database Schema for Auto-Topup System
-- Run this migration to add auto-topup tables to your database
-- ==============================================================================

-- Table: auto_topup_logs
-- Stores all auto-topup processing attempts
CREATE TABLE IF NOT EXISTS "auto_topup_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankTransactionId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "depositRequestId" INTEGER,
    "userId" TEXT,
    "topupCode" TEXT NOT NULL,
    "amountVnd" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,  -- SUCCESS, FAILED, INVALID, DUPLICATE
    "errorMessage" TEXT,
    "transactionDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prevent duplicate processing
CREATE UNIQUE INDEX "auto_topup_logs_bankTransactionId_key"
ON "auto_topup_logs"("bankTransactionId");

-- Performance indexes
CREATE INDEX "auto_topup_logs_userId_idx"
ON "auto_topup_logs"("userId");

CREATE INDEX "auto_topup_logs_status_idx"
ON "auto_topup_logs"("status");

-- Table: manual_deposit_requests
-- User deposit requests (topup requests)
CREATE TABLE IF NOT EXISTS "manual_deposit_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "internalId" TEXT,  -- Unique topup code (e.g., "NAP cm123456")
    "userId" TEXT NOT NULL,
    "amountVnd" REAL NOT NULL,
    "note" TEXT,
    "qrCode" TEXT,
    "transferContent" TEXT,  -- Contains topup code for matching
    "status" TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
    "adminNote" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "manual_deposit_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "manual_deposit_requests_internalId_key"
ON "manual_deposit_requests"("internalId");

-- Table: website_settings
-- Store bank API configs and other settings
CREATE TABLE IF NOT EXISTS "website_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- Table: wallets
-- User wallet balances
CREATE TABLE IF NOT EXISTS "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balanceVnd" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- Table: wallet_transactions
-- Transaction history for wallets
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,  -- DEPOSIT, WITHDRAW, PAYMENT, etc.
    "amountVnd" REAL NOT NULL,
    "balanceAfterVnd" REAL NOT NULL,
    "description" TEXT,
    "metadata" TEXT,  -- JSON string with additional data
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");

-- Table: system_logs
-- System-wide activity logs
CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "amount" REAL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "system_logs_userId_idx" ON "system_logs"("userId");
CREATE INDEX "system_logs_action_idx" ON "system_logs"("action");
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- ==============================================================================
-- SAMPLE DATA
-- ==============================================================================

-- Insert default bank API config placeholder
INSERT OR IGNORE INTO website_settings (key, value, updatedAt)
VALUES (
    'bank_api_configs',
    '[]',
    datetime('now')
);

-- Insert last checked timestamp placeholder
INSERT OR IGNORE INTO website_settings (key, value, updatedAt)
VALUES (
    'bank_api_last_checked',
    datetime('now'),
    datetime('now')
);

-- ==============================================================================
-- NOTES
-- ==============================================================================
-- 1. Ensure 'users' table exists before running this migration
-- 2. Bank configs are stored in website_settings.value as JSON array
-- 3. Topup code format: "NAP [8-char userId]" (e.g., "NAP cm123456")
-- 4. bankTransactionId must be unique to prevent duplicate processing
-- ==============================================================================
