// ==============================================================================
// Generic Bank API Client - Support any bank via config
// ==============================================================================

export interface BankAPIConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;

  fieldMapping: {
    transactionsPath: string;
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

export interface GenericTransaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  currency?: string;
  type?: string;
  raw: any;
}

export class GenericBankAPI {
  private config: BankAPIConfig;

  constructor(config: BankAPIConfig) {
    this.config = config;
  }

  async fetchTransactions(): Promise<GenericTransaction[]> {
    try {
      const options: RequestInit = {
        method: this.config.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
      };

      if (this.config.credentials?.token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${this.config.credentials.token}`,
        };
      }

      const response = await fetch(this.config.apiUrl, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const transactions = this.extractTransactions(data);

      return transactions
        .map(tx => this.mapTransaction(tx))
        .filter(tx => tx !== null) as GenericTransaction[];

    } catch (error) {
      console.error('[GenericBankAPI] Error:', error);
      throw error;
    }
  }

  private extractTransactions(data: any): any[] {
    const path = this.config.fieldMapping.transactionsPath;

    if (!path.includes('.')) {
      return data[path] || [];
    }

    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return [];
      }
    }

    return Array.isArray(current) ? current : [];
  }

  private mapTransaction(tx: any): GenericTransaction | null {
    try {
      const { fields } = this.config.fieldMapping;

      if (this.config.filters.onlyCredit && !this.isCreditTransaction(tx)) {
        return null;
      }

      const amountStr = this.getFieldValue(tx, fields.amount);
      const amount = this.parseAmount(amountStr);

      if (amount <= 0) {
        return null;
      }

      const id = this.getFieldValue(tx, fields.transactionId);
      const description = this.getFieldValue(tx, fields.description);
      const dateStr = this.getFieldValue(tx, fields.transactionDate);
      const date = this.parseDate(dateStr);

      return {
        id: String(id),
        amount,
        description: String(description),
        date,
        currency: fields.currency ? this.getFieldValue(tx, fields.currency) : 'VND',
        type: fields.type ? this.getFieldValue(tx, fields.type) : undefined,
        raw: tx,
      };

    } catch (error) {
      return null;
    }
  }

  private isCreditTransaction(tx: any): boolean {
    const indicator = this.config.filters.creditIndicator;

    if (!indicator) {
      return true;
    }

    const fieldValue = this.getFieldValue(tx, indicator.field);

    switch (indicator.condition) {
      case 'equals':
        return fieldValue == indicator.value;
      case 'greater':
        return Number(fieldValue) > Number(indicator.value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(indicator.value).toLowerCase());
      default:
        return true;
    }
  }

  private getFieldValue(obj: any, path: string): any {
    if (!path.includes('.')) {
      return obj[path];
    }

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private parseAmount(amount: any): number {
    if (typeof amount === 'number') {
      return amount;
    }
    const str = String(amount).replace(/[,\s]/g, '');
    return parseInt(str) || 0;
  }

  private parseDate(dateStr: any): Date {
    if (!dateStr) return new Date();

    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split(' ')[0].split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month}-${day}`);
      }
    }

    return new Date();
  }
}

export async function loadBankConfigs(): Promise<BankAPIConfig[]> {
  const { prisma } = await import('./prisma');

  const settings = await prisma.websiteSettings.findFirst({
    where: { key: 'bank_api_configs' },
  });

  if (!settings?.value) {
    return [];
  }

  try {
    const configs = JSON.parse(settings.value as string);
    return Array.isArray(configs) ? configs : [];
  } catch {
    return [];
  }
}

export async function saveBankConfigs(configs: BankAPIConfig[]): Promise<void> {
  const { prisma } = await import('./prisma');

  await prisma.websiteSettings.upsert({
    where: { key: 'bank_api_configs' },
    create: {
      key: 'bank_api_configs',
      value: JSON.stringify(configs),
    },
    update: {
      value: JSON.stringify(configs),
    },
  });
}
