// ==============================================================================
// User Activity Logging
// ==============================================================================
// Comprehensive tracking of all user actions for security and analytics
// ==============================================================================

import { prisma } from './prisma';

export type UserAction =
  // Auth
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'EMAIL_VERIFY'
  // Browsing
  | 'VIEW_PRODUCT'
  | 'VIEW_CATEGORY'
  | 'SEARCH'
  // Shopping
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT'
  | 'PURCHASE'
  | 'DOWNLOAD'
  // Wallet
  | 'DEPOSIT_REQUEST'
  | 'DEPOSIT_COMPLETE'
  | 'WALLET_VIEW'
  // Referral
  | 'REFERRAL_CODE_VIEW'
  | 'REFERRAL_SIGNUP'
  | 'REFERRAL_REWARD_EARNED'
  // Profile
  | 'PROFILE_VIEW'
  | 'PROFILE_UPDATE'
  | '2FA_ENABLE'
  | '2FA_DISABLE'
  | '2FA_VIEW'
  // Other
  | 'SETTINGS_VIEW'
  | 'COUPON_APPLY'
  // Admin - User Management
  | 'ADMIN_USER_VIEW'
  | 'ADMIN_USER_BAN'
  | 'ADMIN_USER_UNBAN'
  | 'ADMIN_USER_ROLE_CHANGE'
  | 'ADMIN_USER_BALANCE_ADJUST'
  | 'ADMIN_USER_DELETE'
  // Admin - Deposit Management
  | 'ADMIN_DEPOSIT_APPROVE'
  | 'ADMIN_DEPOSIT_REJECT'
  | 'ADMIN_DEPOSIT_VIEW'
  // Admin - Order Management
  | 'ADMIN_ORDER_VIEW'
  | 'ADMIN_ORDER_UPDATE_STATUS'
  | 'ADMIN_ORDER_COMPLETE'
  | 'ADMIN_ORDER_CANCEL'
  | 'ADMIN_ORDER_REFUND'
  // Admin - Product Management
  | 'ADMIN_PRODUCT_CREATE'
  | 'ADMIN_PRODUCT_UPDATE'
  | 'ADMIN_PRODUCT_DELETE'
  | 'ADMIN_PRODUCT_STOCK_UPDATE'
  // Admin - Category Management
  | 'ADMIN_CATEGORY_CREATE'
  | 'ADMIN_CATEGORY_UPDATE'
  | 'ADMIN_CATEGORY_DELETE'
  // Admin - Coupon Management
  | 'ADMIN_COUPON_CREATE'
  | 'ADMIN_COUPON_UPDATE'
  | 'ADMIN_COUPON_DELETE'
  // Admin - Settings
  | 'ADMIN_SETTINGS_UPDATE'
  | 'ADMIN_BANK_CONFIG_UPDATE'
  | 'ADMIN_WEBHOOK_CONFIG_UPDATE'
  | 'ADMIN_DEPOSIT_BONUS_CREATE'
  | 'ADMIN_DEPOSIT_BONUS_UPDATE'
  | 'ADMIN_DEPOSIT_BONUS_DELETE'
  // Admin - Advertisement
  | 'ADMIN_AD_CREATE'
  | 'ADMIN_AD_UPDATE'
  | 'ADMIN_AD_DELETE'
  // Admin - Dashboard & Reports
  | 'ADMIN_DASHBOARD_VIEW'
  | 'ADMIN_LOGS_VIEW'
  | 'ADMIN_STATS_VIEW'
  | 'ADMIN_EXPORT_DATA';

export interface ActivityMetadata {
  [key: string]: any;
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  action: UserAction,
  options?: {
    targetType?: string;
    targetId?: string;
    metadata?: ActivityMetadata;
    ip?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId,
        action,
        targetType: options?.targetType,
        targetId: options?.targetId,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
        ip: options?.ip,
        userAgent: options?.userAgent,
      },
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to log activity:', error);
  }
}

/**
 * Get user activity history
 */
export async function getUserActivity(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: UserAction;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = { userId };

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const activities = await prisma.userActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
  }));
}

/**
 * Get all user activity (admin view)
 */
export async function getAllUserActivity(options?: {
  limit?: number;
  offset?: number;
  action?: UserAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const activities = await prisma.userActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });

  return activities.map((activity) => ({
    ...activity,
    metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
  }));
}

/**
 * Get activity stats for a user
 */
export async function getUserActivityStats(userId: string) {
  const [
    totalActivities,
    recentLogins,
    totalPurchases,
    totalDeposits,
  ] = await Promise.all([
    prisma.userActivityLog.count({ where: { userId } }),
    prisma.userActivityLog.count({
      where: {
        userId,
        action: 'LOGIN',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    }),
    prisma.userActivityLog.count({
      where: { userId, action: 'PURCHASE' },
    }),
    prisma.userActivityLog.count({
      where: { userId, action: 'DEPOSIT_COMPLETE' },
    }),
  ]);

  return {
    totalActivities,
    recentLogins,
    totalPurchases,
    totalDeposits,
  };
}

/**
 * Detect suspicious activity
 */
export async function detectSuspiciousActivity(userId: string): Promise<{
  isSuspicious: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  // Check for rapid login attempts
  const recentLogins = await prisma.userActivityLog.count({
    where: {
      userId,
      action: 'LOGIN',
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
    },
  });

  if (recentLogins > 10) {
    reasons.push('Rapid login attempts detected');
  }

  // Check for unusual wallet activity
  const recentWalletViews = await prisma.userActivityLog.count({
    where: {
      userId,
      action: 'WALLET_VIEW',
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });

  if (recentWalletViews > 50) {
    reasons.push('Excessive wallet views');
  }

  // Check for deposit without purchase history
  const deposits = await prisma.userActivityLog.count({
    where: { userId, action: 'DEPOSIT_COMPLETE' },
  });

  const purchases = await prisma.userActivityLog.count({
    where: { userId, action: 'PURCHASE' },
  });

  if (deposits > 0 && purchases === 0) {
    // This is actually normal for new users, so just flag if deposits > 3
    if (deposits > 3) {
      reasons.push('Multiple deposits without purchases');
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Helper to get IP and user agent from Next.js request
 */
export function getRequestInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}
