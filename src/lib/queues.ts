// Simple in-memory queue (no Redis required)
// For production with scale, consider using Redis + BullMQ

// Email job types
export interface SendOTPJob {
  type: 'send-otp';
  email: string;
  code: string;
}

export interface TopupApprovedJob {
  type: 'topup-approved';
  email: string;
  amount: number;
  adminNote?: string;
}

export interface TopupRejectedJob {
  type: 'topup-rejected';
  email: string;
  amount: number;
  adminNote: string;
}

export interface OrderPaidJob {
  type: 'order-paid';
  email: string;
  orderId: string;
  totalAmount: number;
}

export type EmailJobData = SendOTPJob | TopupApprovedJob | TopupRejectedJob | OrderPaidJob;

// Fulfill job types
export interface FulfillOrderJob {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    productType: 'FILE' | 'LICENSE' | 'APP';
    quantity: number;
  }>;
}

// TPBank job types
export interface TPBankSyncJob {
  lastSyncTime?: string;
}

// Simple queue helpers (no Redis)
export async function addEmailJob(data: EmailJobData, delay?: number) {
  console.log('[Queue] Email job queued:', data.type, delay ? `(delayed ${delay}ms)` : '');
  // In production: Send email here or queue to a real service
  return Promise.resolve({ id: Date.now().toString(), data });
}

export async function addFulfillJob(data: FulfillOrderJob, delay?: number) {
  console.log('[Queue] Fulfill job queued:', data.orderId, delay ? `(delayed ${delay}ms)` : '');
  // In production: Process order fulfillment here or queue to a real service
  return Promise.resolve({ id: Date.now().toString(), data });
}

export async function addTPBankJob(data: TPBankSyncJob, delay?: number) {
  console.log('[Queue] TPBank sync job queued:', delay ? `(delayed ${delay}ms)` : '');
  // In production: Sync bank transactions here or queue to a real service
  return Promise.resolve({ id: Date.now().toString(), data });
}



