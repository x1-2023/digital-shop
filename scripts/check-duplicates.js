/**
 * Script to check for duplicate auto-topup processing
 * Run periodically to ensure no duplicate credits
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate auto-topup logs...\n');

    // Check for duplicate bankTransactionId (should be 0)
    const duplicates = await prisma.$queryRaw`
      SELECT
        bankTransactionId,
        COUNT(*) as count,
        GROUP_CONCAT(id) as log_ids,
        GROUP_CONCAT(status) as statuses
      FROM auto_topup_logs
      GROUP BY bankTransactionId
      HAVING count > 1
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! System is working correctly.\n');
    } else {
      console.log('⚠️  WARNING: Found duplicate transactions:\n');
      for (const dup of duplicates) {
        console.log(`  Transaction: ${dup.bankTransactionId}`);
        console.log(`  Count: ${dup.count}`);
        console.log(`  Log IDs: ${dup.log_ids}`);
        console.log(`  Statuses: ${dup.statuses}`);
        console.log('');
      }
    }

    // Check wallet balance consistency
    console.log('💰 Checking wallet balance consistency...\n');

    const wallets = await prisma.$queryRaw`
      SELECT
        w.userId,
        w.balanceVnd as wallet_balance,
        COALESCE(SUM(
          CASE
            WHEN wt.type = 'DEPOSIT' THEN wt.amountVnd
            WHEN wt.type = 'PURCHASE' THEN -wt.amountVnd
            ELSE 0
          END
        ), 0) as calculated_balance
      FROM wallets w
      LEFT JOIN wallet_transactions wt ON w.userId = wt.userId
      GROUP BY w.userId, w.balanceVnd
      HAVING ABS(wallet_balance - calculated_balance) > 0.01
    `;

    if (wallets.length === 0) {
      console.log('✅ All wallet balances are consistent!\n');
    } else {
      console.log('⚠️  WARNING: Found wallet balance inconsistencies:\n');
      for (const wallet of wallets) {
        console.log(`  User: ${wallet.userId}`);
        console.log(`  Wallet Balance: ${wallet.wallet_balance.toLocaleString('vi-VN')} VND`);
        console.log(`  Calculated Balance: ${wallet.calculated_balance.toLocaleString('vi-VN')} VND`);
        console.log(`  Difference: ${(wallet.wallet_balance - wallet.calculated_balance).toLocaleString('vi-VN')} VND`);
        console.log('');
      }
    }

    // Summary stats
    console.log('📊 Summary Statistics:\n');

    const stats = await prisma.autoTopupLog.groupBy({
      by: ['status'],
      _count: true,
    });

    for (const stat of stats) {
      console.log(`  ${stat.status}: ${stat._count} transactions`);
    }

    console.log('');

    const totalAmount = await prisma.autoTopupLog.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amountVnd: true },
      _count: true,
    });

    console.log(`  Total Successful: ${totalAmount._count} transactions`);
    console.log(`  Total Amount: ${(totalAmount._sum.amountVnd || 0).toLocaleString('vi-VN')} VND`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
