import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

// Generate 8-character alphanumeric ID (lowercase)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Generate 8-character IDs
  const adminId = nanoid(); // e.g., 'a1b2c3d4'

  // Create Admin User with short ID
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotmmo.com' },
    update: {},
    create: {
      id: adminId,
      email: 'admin@hotmmo.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  // Create admin wallet
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balanceVnd: 0,
    },
  });

  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      // Website Settings
      websiteName: 'Digital Shop',
      websiteTitle: 'Digital Shop - Premium Digital Products',
      websiteDescription: 'Premium digital products and services for all your needs',
      websiteKeywords: 'digital products, premium, shop, accounts, licenses, tools',
      websiteLogo: null,
      websiteFavicon: null,

      // Payment Settings
      paymentMethods: JSON.stringify({
        manual: true,
        tpbank: false,
        momo: false,
        crypto: false,
      }),
      bankInfo: JSON.stringify({
        bankName: 'TPBank',
        accountNumber: '03097189801',
        accountHolder: 'NGUYEN MINH QUANG',
        bank: 'TPBank',
        account: '03097189801',
        name: 'NGUYEN MINH QUANG',
        instructions: 'Chuyển khoản với nội dung theo hướng dẫn để được xử lý nhanh nhất',
      }),
      topupRules: JSON.stringify({
        minVnd: 10000,
        maxVnd: 100000000,
      }),
      tpbankConfig: JSON.stringify({
        enabled: false,
        apiUrl: '',
        token: '',
        amountTolerance: 2000,
      }),

      // UI Settings
      uiTexts: JSON.stringify({
        welcomeMessage: 'Chào mừng đến với Digital Shop!',
        footerText: '© 2025 Digital Shop. All rights reserved.',
        maintenanceMessage: 'Website đang bảo trì, vui lòng quay lại sau.',
      }),
      themeSettings: JSON.stringify({
        primaryColor: '#3b82f6',
        darkMode: true,
        sidebarColor: '#1f2937',
        headerColor: '#111827',
      }),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@hotmmo.com / admin123');
  console.log(`🔑 Admin ID: ${admin.id} (8 characters)`);
  console.log('⚙️  Default settings created');

  // Create Categories
  const categories = [
    { name: 'Tài khoản Premium', slug: 'tai-khoan-premium', description: 'Netflix, Spotify, Youtube Premium...' },
    { name: 'Phần mềm bản quyền', slug: 'phan-mem-ban-quyen', description: 'Windows, Office, Adobe, JetBrains...' },
    { name: 'Game Steam/Epic', slug: 'game-steam-epic', description: 'Key game bản quyền giá rẻ' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        active: true,
      },
    });
  }
  console.log(`📦 Created ${categories.length} categories`);

  // Create Sample Products if needed (Optional)
  const premiumCat = await prisma.category.findUnique({ where: { slug: 'tai-khoan-premium' } });
  if (premiumCat) {
    const products = [
      { name: 'Youtube Premium 1 Năm', price: 299000, description: 'Nâng cấp chính chủ, bảo hành 1 năm' },
      { name: 'Netflix 4K 1 Tháng', price: 69000, description: 'Tài khoản dùng riêng, PROFILE riêng' },
    ];

    for (const p of products) {
      const slug = p.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: p.name,
          slug,
          categoryId: premiumCat.id,
          priceVnd: p.price,
          description: p.description,
          stock: 10,
          active: true,
          totalLines: 10,
          usedLines: 0,
        },
      });
    }
    console.log(`🛒 Created ${products.length} sample products`);
  }

  // Create Sample Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME' },
    update: {},
    create: {
      code: 'WELCOME',
      description: 'Giảm giá chào mừng thành viên mới',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountVnd: 50000,
      minOrderVnd: 100000,
      maxUses: 100,
      active: true,
    },
  });
  console.log('🎟️  Created sample coupon: WELCOME');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



