import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const validateSchema = z.object({
  code: z.string(),
  orderTotal: z.number().positive(),
});

// POST - Validate coupon and calculate discount
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { code, orderTotal } = validateSchema.parse(body);

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Mã coupon không tồn tại' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json(
        { error: 'Mã coupon đã bị vô hiệu hóa' },
        { status: 400 }
      );
    }

    // Check start date
    if (coupon.startDate && new Date() < coupon.startDate) {
      return NextResponse.json(
        { error: 'Mã coupon chưa có hiệu lực' },
        { status: 400 }
      );
    }

    // Check expiry date
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return NextResponse.json(
        { error: 'Mã coupon đã hết hạn' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'Mã coupon đã hết lượt sử dụng' },
        { status: 400 }
      );
    }

    // Check minimum order amount
    if (orderTotal < coupon.minOrderVnd) {
      return NextResponse.json(
        { 
          error: `Đơn hàng tối thiểu ${coupon.minOrderVnd.toLocaleString()} VND để sử dụng mã này` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      // Apply max discount limit if set
      if (coupon.maxDiscountVnd && discountAmount > coupon.maxDiscountVnd) {
        discountAmount = coupon.maxDiscountVnd;
      }
    } else {
      // FIXED discount
      discountAmount = coupon.discountValue;
    }

    // Discount cannot exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: discountAmount,
      finalTotal: orderTotal - discountAmount,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
