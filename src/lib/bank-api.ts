// ==============================================================================
// Bank API Integration - Auto Topup
// ==============================================================================
// Support: MB Bank, VCB, TPBank, ACB
// ==============================================================================

export interface BankTransaction {
  postingDate: string;           // "21/01/2024 23:59:59"
  transactionDate: string;        // "21/01/2024 11:25:27"
  accountNo: string;              // "0650100588888"
  creditAmount: string;           // "500000"
  debitAmount: string;            // "0"
  currency: string;               // "VND"
  description: string;            // "BUI VAN TO chuyen tien..."
  availableBalance: string;       // "10616"
  beneficiaryAccount: string;     // ""
  refNo: string;                  // "FT24356877"
  benAccountName: string;         // ""
  bankName: string;               // ""
  benAccountNo: string;           // ""
  dueDate: string;                // ""
  docId: string;                  // ""
  transactionType: string;        // "" or "BI2B"
  pos: string;                    // ""
  tracingType: string;            // ""
}

export interface BankAPIResponse {
  refNo: string;
  result: {
    ok: boolean;
    message: string;
    responseCode: string;
  };
  transactionHistoryList: BankTransaction[];
}

// ==============================================================================
// MB Bank API Client
// ==============================================================================
export class MBBankAPI {
  private deviceId: string;
  private sessionId: string;
  private refNo: string;
  private accountNo: string;

  constructor(config: {
    deviceId: string;
    sessionId: string;
    refNo: string;
    accountNo: string;
  }) {
    this.deviceId = config.deviceId;
    this.sessionId = config.sessionId;
    this.refNo = config.refNo;
    this.accountNo = config.accountNo;
  }

  /**
   * Get transaction history from MB Bank API
   * @param fromDate Format: DD/MM/YYYY
   * @param toDate Format: DD/MM/YYYY
   */
  async getTransactionHistory(
    fromDate: string,
    toDate: string
  ): Promise<BankTransaction[]> {
    try {
      const response = await fetch(
        'https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionId}`,
            'DeviceId': this.deviceId,
            'RefNo': this.refNo,
          },
          body: JSON.stringify({
            accountNo: this.accountNo,
            fromDate,
            toDate,
            sessionId: this.sessionId,
            refNo: this.refNo,
            deviceIdCommon: this.deviceId,
          }),
        }
      );

      const data: BankAPIResponse = await response.json();

      if (!data.result?.ok) {
        throw new Error(data.result?.message || 'Failed to fetch transactions');
      }

      return data.transactionHistoryList || [];
    } catch (error) {
      console.error('[MBBank API] Error:', error);
      throw error;
    }
  }
}

// ==============================================================================
// VCB API Client (Similar structure)
// ==============================================================================
export class VCBankAPI {
  // TODO: Implement VCB API
  // Structure tương tự MBBank
}

// ==============================================================================
// Helper: Parse transfer content to extract topup code
// ==============================================================================
export function extractTopupCode(description: string): string | null {
  // Format: "BUI VAN TO chuyen tien.CT tu IG NAPTIEN ABC123"
  // Extract: ABC123
  
  const patterns = [
    /NAPTIEN\s+([A-Z0-9]+)/i,      // NAPTIEN ABC123
    /NAP\s+([A-Z0-9]+)/i,           // NAP ABC123
    /MA\s+([A-Z0-9]+)/i,            // MA ABC123
    /CODE\s+([A-Z0-9]+)/i,          // CODE ABC123
    /\[([A-Z0-9]+)\]/i,             // [ABC123]
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

// ==============================================================================
// Helper: Format date for API
// ==============================================================================
export function formatDateForAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ==============================================================================
// Helper: Parse VND amount
// ==============================================================================
export function parseVNDAmount(amount: string): number {
  return parseInt(amount.replace(/[,\.]/g, '')) || 0;
}
