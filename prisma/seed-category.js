const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default category
  const defaultCategory = await prisma.category.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default',
      slug: 'default',
      description: 'Default category',
      order: 0,
      active: true
    }
  });
  console.log('✅ Created category:', defaultCategory.name);

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@digitalshop.com' },
    update: {},
    create: {
      email: 'admin@digitalshop.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'ADMIN',
      wallet: {
        create: {
          balanceVnd: 0
        }
      }
    }
  });
  console.log('✅ Created admin user:', adminUser.email);

  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: bcrypt.hashSync('buyer123', 10),
      role: 'BUYER',
      wallet: {
        create: {
          balanceVnd: 500000
        }
      }
    }
  });
  console.log('✅ Created buyer user:', buyerUser.email);

  console.log('🌱 Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
