// ==============================================================================
// AUTO-TOPUP SYSTEM - TYPE DEFINITIONS
// ==============================================================================

/**
 * Bank API Configuration
 */
export interface BankAPIConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;

  fieldMapping: {
    transactionsPath: string; // Path to transactions array in response (e.g., "data.transactions")
    fields: {
      transactionId: string;
      amount: string;
      description: string;
      transactionDate: string;
      currency?: string;
      type?: string;
    };
  };

  filters: {
    onlyCredit: boolean;
    creditIndicator?: {
      field: string;
      value: string | number;
      condition: 'equals' | 'greater' | 'contains';
    };
  };

  credentials?: {
    token?: string;
    apiKey?: string;
  };
}

/**
 * Generic Transaction (normalized from any bank)
 */
export interface GenericTransaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  currency?: string;
  type?: string;
  raw: any; // Original response data
}

/**
 * Auto-Topup Processing Result
 */
export interface AutoTopupResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  details: {
    transactionId: string;
    topupCode: string;
    amount: number;
    status: 'success' | 'failed' | 'duplicate' | 'invalid';
    message: string;
  }[];
}

/**
 * Deposit Bonus Calculation Result
 */
export interface DepositBonusResult {
  bonusAmount: number;
  bonusPercent: number;
  totalAmount: number;
  tier?: {
    id: string;
    name: string;
    minAmount: number;
    bonusPercent: number;
  };
}

/**
 * Manual Deposit Request (from database)
 */
export interface ManualDepositRequest {
  id: number;
  internalId: string | null;
  userId: string;
  amountVnd: number;
  note: string | null;
  qrCode: string | null;
  transferContent: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Auto-Topup Log Entry (from database)
 */
export interface AutoTopupLog {
  id: string;
  bankTransactionId: string;
  bankName: string;
  depositRequestId: number | null;
  userId: string | null;
  topupCode: string;
  amountVnd: number;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'INVALID' | 'DUPLICATE';
  errorMessage: string | null;
  transactionDate: Date;
  createdAt: Date;
}

/**
 * Wallet (from database)
 */
export interface Wallet {
  id: string;
  userId: string;
  balanceVnd: number;
  updatedAt: Date;
}

/**
 * Wallet Transaction (from database)
 */
export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND';
  amountVnd: number;
  balanceAfterVnd: number;
  description: string | null;
  metadata: string | null; // JSON string
  createdAt: Date;
}

/**
 * System Log (from database)
 */
export interface SystemLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  amount: number | null;
  description: string;
  metadata: string | null; // JSON string
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
