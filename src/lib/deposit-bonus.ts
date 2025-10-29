import { prisma } from './prisma';

export interface DepositBonusTier {
  minAmount: number;
  maxAmount: number;
  bonusPercent: number;
}

export interface BonusCalculation {
  originalAmount: number;
  bonusAmount: number;
  bonusPercent: number;
  totalAmount: number;
  tier: DepositBonusTier | null;
}

/**
 * Calculate deposit bonus based on configured tiers
 */
export async function calculateDepositBonus(
  amount: number
): Promise<BonusCalculation> {
  const result: BonusCalculation = {
    originalAmount: amount,
    bonusAmount: 0,
    bonusPercent: 0,
    totalAmount: amount,
    tier: null,
  };

  try {
    // Load bonus tiers from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: { depositBonusTiers: true },
    });

    if (!settings?.depositBonusTiers) {
      return result; // No bonus configured
    }

    const tiers: DepositBonusTier[] = JSON.parse(settings.depositBonusTiers);

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return result; // No tiers configured
    }

    // Find matching tier
    const matchingTier = tiers.find(
      (tier) => amount >= tier.minAmount && amount <= tier.maxAmount
    );

    if (!matchingTier) {
      return result; // No matching tier
    }

    // Calculate bonus
    result.tier = matchingTier;
    result.bonusPercent = matchingTier.bonusPercent;
    result.bonusAmount = Math.floor((amount * matchingTier.bonusPercent) / 100);
    result.totalAmount = amount + result.bonusAmount;

    return result;
  } catch (error) {
    console.error('[DepositBonus] Error calculating bonus:', error);
    return result; // Return no bonus on error
  }
}

/**
 * Get all deposit bonus tiers (for display to user)
 */
export async function getDepositBonusTiers(): Promise<DepositBonusTier[]> {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: { depositBonusTiers: true },
    });

    if (!settings?.depositBonusTiers) {
      return [];
    }

    const tiers: DepositBonusTier[] = JSON.parse(settings.depositBonusTiers);
    return Array.isArray(tiers) ? tiers : [];
  } catch (error) {
    console.error('[DepositBonus] Error loading tiers:', error);
    return [];
  }
}
