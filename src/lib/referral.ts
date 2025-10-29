// ==============================================================================
// Referral System
// ==============================================================================
// Handle referral code generation, tracking, and rewards
// ==============================================================================

import { prisma } from './prisma';
import { nanoid } from 'nanoid';

// ==============================================================================
// Types
// ==============================================================================
export interface ReferralSettings {
  enabled: boolean;
  referrerRewardPercent: number; // Percentage reward for referrer (e.g., 5 = 5%)
  maxReferrerRewardPerTransactionVnd: number; // Max cap per transaction for referrer
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalRewardsEarnedVnd: number;
  pendingRewards: number;
}

// ==============================================================================
// Settings
// ==============================================================================
export async function loadReferralSettings(): Promise<ReferralSettings> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' },
    select: { referralSettings: true },
  });

  if (!settings) {
    // Default settings
    return {
      enabled: true,
      referrerRewardPercent: 5, // 5% for referrer
      maxReferrerRewardPerTransactionVnd: 250000, // Max 250k per transaction
    };
  }

  try {
    return JSON.parse(settings.referralSettings);
  } catch {
    return {
      enabled: true,
      referrerRewardPercent: 5,
      maxReferrerRewardPerTransactionVnd: 250000,
    };
  }
}

export async function saveReferralSettings(settings: ReferralSettings): Promise<void> {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      referralSettings: JSON.stringify(settings),
    },
    update: {
      referralSettings: JSON.stringify(settings),
    },
  });
}

// ==============================================================================
// Referral Code Generation
// ==============================================================================
/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    // Generate 8-character alphanumeric code (uppercase)
    code = nanoid(8).toUpperCase();
    attempts++;

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!existing) {
      return code;
    }
  } while (attempts < maxAttempts);

  throw new Error('Failed to generate unique referral code');
}

/**
 * Assign referral code to user if they don't have one
 * Uses user ID as the referral code for simplicity (e.g., "cm123456", "98flsu2p")
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  // If user already has a referral code, return it
  if (user?.referralCode) {
    return user.referralCode;
  }

  // Use user ID as referral code (same as transfer code format)
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: userId },
  });

  return userId;
}

// ==============================================================================
// Referral Registration
// ==============================================================================
/**
 * Register a referral when a new user signs up with a referral code
 */
export async function registerReferral(
  refereeId: string,
  referralCode: string
): Promise<boolean> {
  const settings = await loadReferralSettings();

  if (!settings.enabled) {
    console.log('[Referral] System disabled');
    return false;
  }

  // Find referrer by code (can be referralCode field or user ID)
  let referrer = await prisma.user.findUnique({
    where: { referralCode: referralCode },
    select: { id: true },
  });

  // If not found by referralCode, try finding by user ID directly
  if (!referrer) {
    referrer = await prisma.user.findUnique({
      where: { id: referralCode },
      select: { id: true },
    });
  }

  if (!referrer) {
    console.log('[Referral] Invalid referral code:', referralCode);
    return false;
  }

  // Can't refer yourself
  if (referrer.id === refereeId) {
    console.log('[Referral] Cannot refer yourself');
    return false;
  }

  // Check if referee already has a referrer
  const existing = await prisma.referral.findUnique({
    where: { refereeId: refereeId },
  });

  if (existing) {
    console.log('[Referral] User already has a referrer');
    return false;
  }

  // Create referral record
  await prisma.$transaction(async (tx) => {
    // Update referee's referredById
    await tx.user.update({
      where: { id: refereeId },
      data: { referredById: referrer.id },
    });

    // Create referral record (rewards calculated per transaction now)
    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: refereeId,
        referralCode: referralCode,
        referrerRewardVnd: 0, // Will be calculated per deposit
        refereeRewardVnd: 0, // Will be calculated per deposit
        rewardPaid: false,
      },
    });
  });

  console.log(`[Referral] Registered: ${referrer.id} → ${refereeId}`);
  return true;
}

// ==============================================================================
// Referral Rewards
// ==============================================================================
/**
 * Process referral rewards for a deposit transaction
 * Called from auto-topup or manual deposit approval
 * Applies percentage-based rewards with max cap
 * Only referrer receives commission, applied to all deposits
 */
export async function processReferralRewards(
  refereeId: string,
  depositAmountVnd: number
): Promise<boolean> {
  const settings = await loadReferralSettings();

  if (!settings.enabled) {
    return false;
  }

  // Find referral record
  const referral = await prisma.referral.findUnique({
    where: { refereeId: refereeId },
    include: {
      referrer: { select: { id: true, email: true } },
      referee: { select: { id: true, email: true } },
    },
  });

  if (!referral) {
    // No referral found
    return false;
  }

  // Calculate reward based on percentage
  const referrerRewardCalculated = Math.floor(
    (depositAmountVnd * settings.referrerRewardPercent) / 100
  );

  // Apply max cap
  const referrerReward = Math.min(
    referrerRewardCalculated,
    settings.maxReferrerRewardPerTransactionVnd
  );

  // Skip if reward is 0
  if (referrerReward === 0) {
    console.log('[Referral] Reward calculated as 0, skipping');
    return false;
  }

  // Process rewards in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Credit referrer's wallet
    await tx.wallet.upsert({
      where: { userId: referral.referrerId },
      create: {
        userId: referral.referrerId,
        balanceVnd: referrerReward,
      },
      update: {
        balanceVnd: { increment: referrerReward },
      },
    });

    // 2. Log referrer's transaction
    const referrerWallet = await tx.wallet.findUnique({
      where: { userId: referral.referrerId },
    });

    await tx.walletTransaction.create({
      data: {
        userId: referral.referrerId,
        type: 'REFERRAL_REWARD',
        amountVnd: referrerReward,
        balanceAfterVnd: referrerWallet?.balanceVnd || 0,
        description: `Hoa hồng giới thiệu ${settings.referrerRewardPercent}% - ${referral.referee.email} nạp ${depositAmountVnd.toLocaleString('vi-VN')}đ`,
        metadata: JSON.stringify({
          referralId: referral.id,
          refereeId: referral.refereeId,
          refereeEmail: referral.referee.email,
          depositAmountVnd: depositAmountVnd,
          rewardPercent: settings.referrerRewardPercent,
          maxCapVnd: settings.maxReferrerRewardPerTransactionVnd,
          calculatedReward: referrerRewardCalculated,
          actualReward: referrerReward,
          cappedReward: referrerReward < referrerRewardCalculated,
        }),
      },
    });

    // 3. Update referral stats (increment total rewards earned)
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        referrerRewardVnd: { increment: referrerReward },
        rewardPaid: true,
        rewardPaidAt: new Date(),
      },
    });
  });

  console.log(
    `[Referral] ✅ Commission paid: ${referral.referrer.email} received ${referrerReward.toLocaleString('vi-VN')}đ (${settings.referrerRewardPercent}% of ${depositAmountVnd.toLocaleString('vi-VN')}đ)`
  );

  // Send Discord webhook notification (async, don't wait)
  try {
    const { sendReferralNotification, loadWebhookConfig } = await import('./discord-webhook');
    const webhookConfig = await loadWebhookConfig();

    if (webhookConfig.enabled) {
      sendReferralNotification(webhookConfig, {
        referrerEmail: referral.referrer.email,
        refereeEmail: referral.referee.email,
        referrerRewardVnd: referrerReward,
        refereeRewardVnd: 0, // No reward for referee
        firstDepositVnd: depositAmountVnd,
      }).catch((err) => console.error('[Referral] Webhook error:', err));
    }
  } catch (webhookError) {
    console.error('[Referral] Failed to send webhook notification:', webhookError);
  }

  return true;
}

// ==============================================================================
// Referral Stats
// ==============================================================================
/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
  });

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.rewardPaid).length;
  const totalRewardsEarnedVnd = referrals
    .filter((r) => r.rewardPaid)
    .reduce((sum, r) => sum + r.referrerRewardVnd, 0);
  const pendingRewards = referrals.filter((r) => !r.rewardPaid).length;

  return {
    totalReferrals,
    activeReferrals,
    totalRewardsEarnedVnd,
    pendingRewards,
  };
}
