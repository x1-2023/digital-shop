import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixWallets() {
  console.log('🔧 Checking and creating missing wallets...');

  // Get all users without wallets
  const users = await prisma.user.findMany({
    include: {
      wallet: true,
    },
  });

  let fixed = 0;
  for (const user of users) {
    if (!user.wallet) {
      console.log(`Creating wallet for user: ${user.email}`);
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balanceVnd: 0,
        },
      });
      fixed++;
    }
  }

  console.log(`✅ Fixed ${fixed} missing wallets`);
  console.log(`📊 Total users: ${users.length}`);
}

fixWallets()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
