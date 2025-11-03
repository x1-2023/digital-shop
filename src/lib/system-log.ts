import { prisma } from './prisma';
import { SystemLogAction } from '@prisma/client';

interface LogOptions {
  userId?: string;
  userEmail?: string;
  action: SystemLogAction;
  targetType?: string;
  targetId?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a system log entry
 * Logs all important system events for admin monitoring
 */
export async function createSystemLog(options: LogOptions): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        userId: options.userId,
        userEmail: options.userEmail,
        action: options.action,
        targetType: options.targetType,
        targetId: options.targetId,
        amount: options.amount,
        description: options.description,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the app
    console.error('[SystemLog] Failed to create log:', error);
  }
}

/**
 * Helper functions for common log actions
 */

export async function logUserRegister(userId: string, email: string, ipAddress?: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'USER_REGISTER',
    description: `User registered: ${email}`,
    ipAddress,
  });
}

export async function logUserLogin(userId: string, email: string, ipAddress?: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'USER_LOGIN',
    description: `User logged in: ${email}`,
    ipAddress,
  });
}

export async function logDepositCreate(userId: string, email: string, amount: number, depositId: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'DEPOSIT_CREATE',
    targetType: 'DEPOSIT',
    targetId: depositId,
    amount,
    description: `User created deposit request: ${amount.toLocaleString('vi-VN')} VND`,
  });
}

export async function logDepositApprove(
  adminId: string,
  adminEmail: string,
  userId: string,
  userEmail: string,
  amount: number,
  depositId: string
) {
  await createSystemLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'DEPOSIT_APPROVE',
    targetType: 'DEPOSIT',
    targetId: depositId,
    amount,
    description: `Admin approved deposit for ${userEmail}: ${amount.toLocaleString('vi-VN')} VND`,
    metadata: { affectedUserId: userId, affectedUserEmail: userEmail },
  });
}

export async function logDepositReject(
  adminId: string,
  adminEmail: string,
  userId: string,
  userEmail: string,
  amount: number,
  depositId: string,
  reason: string
) {
  await createSystemLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'DEPOSIT_REJECT',
    targetType: 'DEPOSIT',
    targetId: depositId,
    amount,
    description: `Admin rejected deposit for ${userEmail}: ${amount.toLocaleString('vi-VN')} VND`,
    metadata: { affectedUserId: userId, affectedUserEmail: userEmail, reason },
  });
}

export async function logDepositAuto(userId: string, userEmail: string, amount: number, depositId: string) {
  await createSystemLog({
    userId,
    userEmail,
    action: 'DEPOSIT_AUTO',
    targetType: 'DEPOSIT',
    targetId: depositId,
    amount,
    description: `Auto-topup successful for ${userEmail}: ${amount.toLocaleString('vi-VN')} VND`,
  });
}

export async function logOrderCreate(userId: string, email: string, orderId: string, amount: number) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'ORDER_CREATE',
    targetType: 'ORDER',
    targetId: orderId,
    amount,
    description: `User created order: ${amount.toLocaleString('vi-VN')} VND`,
  });
}

export async function logOrderPaid(userId: string, email: string, orderId: string, amount: number) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'ORDER_PAID',
    targetType: 'ORDER',
    targetId: orderId,
    amount,
    description: `User paid order: ${amount.toLocaleString('vi-VN')} VND`,
  });
}

export async function logWalletCredit(userId: string, email: string, amount: number, reason: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'WALLET_CREDIT',
    targetType: 'WALLET',
    amount,
    description: `Wallet credited: ${amount.toLocaleString('vi-VN')} VND - ${reason}`,
  });
}

export async function logWalletDebit(userId: string, email: string, amount: number, reason: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'WALLET_DEBIT',
    targetType: 'WALLET',
    amount,
    description: `Wallet debited: ${amount.toLocaleString('vi-VN')} VND - ${reason}`,
  });
}

export async function logWalletAdjust(
  adminId: string,
  adminEmail: string,
  userId: string,
  userEmail: string,
  amount: number,
  reason: string
) {
  await createSystemLog({
    userId: adminId,
    userEmail: adminEmail,
    action: 'WALLET_ADJUST',
    targetType: 'WALLET',
    targetId: userId,
    amount,
    description: `Admin adjusted wallet for ${userEmail}: ${amount.toLocaleString('vi-VN')} VND - ${reason}`,
    metadata: { affectedUserId: userId, affectedUserEmail: userEmail },
  });
}

export async function logProductPurchase(userId: string, email: string, productId: string, productName: string, quantity: number) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'PRODUCT_PURCHASE',
    targetType: 'PRODUCT',
    targetId: productId,
    description: `User purchased: ${productName} x${quantity}`,
    metadata: { productName, quantity },
  });
}

export async function logAdminLogin(userId: string, email: string, ipAddress?: string) {
  await createSystemLog({
    userId,
    userEmail: email,
    action: 'ADMIN_LOGIN',
    description: `Admin logged in: ${email}`,
    ipAddress,
  });
}
