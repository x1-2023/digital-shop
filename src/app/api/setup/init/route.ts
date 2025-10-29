import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const setupSchema = z.object({
  adminEmail: z.string().email('Email không hợp lệ'),
  adminPassword: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  websiteName: z.string().min(1, 'Tên website không được để trống').optional(),
});

/**
 * POST /api/setup/init
 * Initialize the application with admin user and basic settings
 */
export async function POST(req: NextRequest) {
  try {
    // Check if setup already completed
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (adminExists) {
      return NextResponse.json(
        { error: 'Setup đã hoàn tất. Không thể setup lại.' },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const result = setupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: result.error.issues },
        { status: 400 }
      );
    }

    const { adminEmail, adminPassword, websiteName } = result.data;

    // Run database migrations (this should already be done via prisma generate/migrate)
    // But we'll ensure the database is accessible
    await prisma.$connect();

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(), // Auto-verify admin
      },
    });

    // Create default settings
    await prisma.settings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        websiteName: websiteName || 'Digital Shop',
        websiteTitle: websiteName ? `${websiteName} - Digital Products` : 'Digital Shop - Premium Digital Products',
        websiteDescription: 'Shop bán sản phẩm số chất lượng cao',
        websiteKeywords: 'digital products, online shop',
        paymentMethods: JSON.stringify({ manual: true, tpbank: false, momo: false, crypto: false }),
        bankInfo: JSON.stringify({ bank: '', account: '', name: '', instructions: '' }),
        topupRules: JSON.stringify({ minVnd: 5000, maxVnd: 10000000 }),
        tpbankConfig: JSON.stringify({ enabled: false, apiUrl: '', token: '', amountTolerance: 2000 }),
      },
      update: {},
    });

    // Create default categories (optional)
    const defaultCategories = [
      { name: 'Tài Khoản', slug: 'tai-khoan', description: 'Tài khoản các loại' },
      { name: 'Phần Mềm', slug: 'phan-mem', description: 'Phần mềm, license keys' },
      { name: 'Dịch Vụ', slug: 'dich-vu', description: 'Các dịch vụ số' },
    ];

    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        create: cat,
        update: {},
      });
    }

    console.log('✅ Setup completed successfully');
    console.log(`👤 Admin created: ${adminEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Setup hoàn tất thành công!',
      admin: {
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        error: 'Lỗi khi setup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
