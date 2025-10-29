﻿import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1, 'Phải có ít nhất 1 sản phẩm'),
  couponCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Validate products exist and are active
    const productIds = validatedData.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Một số sản phẩm không tồn tại hoặc đã bị vô hiệu hóa' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of validatedData.items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) continue;

      const itemTotal = product.priceVnd * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceVnd: product.priceVnd,
      });
    }

    // Validate and apply coupon if provided
    let discountVnd = 0;
    let couponCode: string | null = null;

    if (validatedData.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: validatedData.couponCode },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: 'Mã giảm giá không tồn tại' },
          { status: 400 }
        );
      }

      if (!coupon.active) {
        return NextResponse.json(
          { error: 'Mã giảm giá đã bị vô hiệu hóa' },
          { status: 400 }
        );
      }

      // Check expiry date
      const now = new Date();
      if (coupon.expiryDate && coupon.expiryDate < now) {
        return NextResponse.json(
          { error: 'Mã giảm giá đã hết hạn' },
          { status: 400 }
        );
      }

      // Check start date
      if (coupon.startDate && coupon.startDate > now) {
        return NextResponse.json(
          { error: 'Mã giảm giá chưa có hiệu lực' },
          { status: 400 }
        );
      }

      // Check minimum order amount
      if (totalAmount < coupon.minOrderVnd) {
        return NextResponse.json(
          { error: `Đơn hàng tối thiểu ${coupon.minOrderVnd} VND để sử dụng mã này` },
          { status: 400 }
        );
      }

      // Calculate discount
      if (coupon.discountType === 'PERCENTAGE') {
        discountVnd = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscountVnd && discountVnd > coupon.maxDiscountVnd) {
          discountVnd = coupon.maxDiscountVnd;
        }
      } else {
        discountVnd = coupon.discountValue;
      }

      // Ensure discount doesn't exceed total
      if (discountVnd > totalAmount) {
        discountVnd = totalAmount;
      }

      couponCode = coupon.code;

      // ATOMIC UPDATE: Increment usage count only if under limit
      // This prevents race condition where multiple requests bypass the limit
      const updatedCoupon = await prisma.coupon.updateMany({
        where: {
          id: coupon.id,
          // Critical: Only update if still under limit (or no limit)
          OR: [
            { maxUses: null },
            { usedCount: { lt: coupon.maxUses || 999999 } }
          ]
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      // Check if update succeeded (if count = 0, coupon limit was reached)
      if (updatedCoupon.count === 0) {
        return NextResponse.json(
          { error: 'Mã giảm giá đã hết lượt sử dụng' },
          { status: 400 }
        );
      }
    }

    // Calculate final amount after discount
    const finalAmount = totalAmount - discountVnd;

    // Create order with order items
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmountVnd: finalAmount,
        discountVnd: discountVnd,
        couponCode: couponCode,
        currency: 'VND',
        itemsJson: JSON.stringify(orderItems),
        paymentMethod: 'WALLET',
        orderItems: {
          create: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceVnd: item.priceVnd,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
