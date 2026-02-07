// ==============================================================================
// DEPOSIT BONUS CALCULATION
// ==============================================================================
// Calculate bonus amount based on deposit tiers
// ==============================================================================

import { prisma } from './prisma'; // Adjust import path as needed

/**
 * Deposit Bonus Tier
 */
export interface BonusTier {
  id: string;
  name: string;
  minAmount: number;
  bonusPercent: number;
  enabled: boolean;
  order: number;
}

/**
 * Bonus Calculation Result
 */
export interface BonusResult {
  bonusAmount: number;
  bonusPercent: number;
  totalAmount: number;
  tier?: BonusTier;
}

/**
 * Calculate deposit bonus based on amount
 * @param amount - Deposit amount in VND
 * @returns Bonus calculation result
 */
export async function calculateDepositBonus(amount: number): Promise<BonusResult> {
  try {
    // Load bonus tiers from database or config
    const tiers = await loadBonusTiers();

    if (!tiers || tiers.length === 0) {
      // No bonus tiers configured
      return {
        bonusAmount: 0,
        bonusPercent: 0,
        totalAmount: amount,
      };
    }

    // Find applicable tier (highest tier where amount >= minAmount)
    const applicableTier = tiers
      .filter(tier => tier.enabled && amount >= tier.minAmount)
      .sort((a, b) => b.minAmount - a.minAmount)[0];

    if (!applicableTier) {
      // Amount is below minimum tier
      return {
        bonusAmount: 0,
        bonusPercent: 0,
        totalAmount: amount,
      };
    }

    // Calculate bonus
    const bonusAmount = Math.floor((amount * applicableTier.bonusPercent) / 100);
    const totalAmount = amount + bonusAmount;

    return {
      bonusAmount,
      bonusPercent: applicableTier.bonusPercent,
      totalAmount,
      tier: applicableTier,
    };
  } catch (error) {
    console.error('[DepositBonus] Error calculating bonus:', error);
    // Return no bonus on error
    return {
      bonusAmount: 0,
      bonusPercent: 0,
      totalAmount: amount,
    };
  }
}

/**
 * Load bonus tiers from database
 * @returns Array of bonus tiers
 */
async function loadBonusTiers(): Promise<BonusTier[]> {
  try {
    // Option 1: Load from database settings table
    const settings = await prisma.websiteSettings.findFirst({
      where: { key: 'deposit_bonus_tiers' },
    });

    if (settings?.value) {
      const tiers = JSON.parse(settings.value as string);
      return Array.isArray(tiers) ? tiers : getDefaultTiers();
    }

    // Option 2: Return default tiers
    return getDefaultTiers();
  } catch (error) {
    console.error('[DepositBonus] Error loading tiers:', error);
    return getDefaultTiers();
  }
}

/**
 * Get default bonus tiers
 * @returns Default bonus tier configuration
 */
function getDefaultTiers(): BonusTier[] {
  return [
    {
      id: 'tier_1',
      name: 'Không thưởng',
      minAmount: 0,
      bonusPercent: 0,
      enabled: true,
      order: 1,
    },
    {
      id: 'tier_2',
      name: 'Thưởng 5%',
      minAmount: 100000,     // 100k VND
      bonusPercent: 5,
      enabled: true,
      order: 2,
    },
    {
      id: 'tier_3',
      name: 'Thưởng 10%',
      minAmount: 500000,     // 500k VND
      bonusPercent: 10,
      enabled: true,
      order: 3,
    },
    {
      id: 'tier_4',
      name: 'Thưởng 15%',
      minAmount: 1000000,    // 1M VND
      bonusPercent: 15,
      enabled: true,
      order: 4,
    },
    {
      id: 'tier_5',
      name: 'Thưởng 20%',
      minAmount: 5000000,    // 5M VND
      bonusPercent: 20,
      enabled: true,
      order: 5,
    },
  ];
}

/**
 * Save bonus tiers to database
 * @param tiers - Array of bonus tiers to save
 */
export async function saveBonusTiers(tiers: BonusTier[]): Promise<void> {
  await prisma.websiteSettings.upsert({
    where: { key: 'deposit_bonus_tiers' },
    create: {
      key: 'deposit_bonus_tiers',
      value: JSON.stringify(tiers),
    },
    update: {
      value: JSON.stringify(tiers),
    },
  });
}

/**
 * Get all bonus tiers
 * @returns Array of all configured bonus tiers
 */
export async function getBonusTiers(): Promise<BonusTier[]> {
  return loadBonusTiers();
}

/**
 * Example usage:
 *
 * const result = await calculateDepositBonus(150000);
 * // Returns:
 * // {
 * //   bonusAmount: 7500,
 * //   bonusPercent: 5,
 * //   totalAmount: 157500,
 * //   tier: { id: 'tier_2', name: 'Thưởng 5%', ... }
 * // }
 */
