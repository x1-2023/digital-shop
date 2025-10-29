import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

const updateCouponSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().positive().optional(),
  maxDiscountVnd: z.number().positive().optional(),
  minOrderVnd: z.number().min(0).optional(),
  maxUses: z.number().positive().optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().optional(),
  active: z.boolean().optional(),
});

// GET - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update coupon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateCouponSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.expiryDate) {
      updateData.expiryDate = new Date(validatedData.expiryDate);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_COUPON_UPDATE', {
      targetType: 'COUPON',
      targetId: coupon.id,
      metadata: {
        code: coupon.code,
        changes: validatedData,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    // Get coupon details before deletion
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_COUPON_DELETE', {
      targetType: 'COUPON',
      targetId: id,
      metadata: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
