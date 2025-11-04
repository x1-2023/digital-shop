import { NextRequest, NextResponse } from 'next/server';
// Auth using custom JWT session
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, replacement, adminNote } = body;

    // Validate action
    if (!['replace', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "replace" or "reject"' },
        { status: 400 }
      );
    }

    // Get product line
    const productLine = await prisma.productLineItem.findUnique({
      where: { id },
    });

    if (!productLine) {
      return NextResponse.json(
        { success: false, error: 'Product line not found' },
        { status: 404 }
      );
    }

    // Update based on action
    const updateData: any = {
      adminNote: adminNote || productLine.adminNote,
      updatedAt: new Date(),
    };

    if (action === 'replace') {
      if (!replacement || !replacement.trim()) {
        return NextResponse.json(
          { success: false, error: 'Replacement content is required' },
          { status: 400 }
        );
      }
      updateData.replacement = replacement.trim();
      updateData.status = 'REPLACED';
      updateData.replacedAt = new Date();
      updateData.errorReported = false; // Clear error flag after replacement
    } else if (action === 'reject') {
      updateData.status = 'WARRANTY_REJECTED';
      updateData.rejectedAt = new Date();
      updateData.errorReported = false; // Clear error flag after rejection
    }

    const updated = await prisma.productLineItem.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'ADMIN_SETTINGS_UPDATE',
        targetType: 'PRODUCT_LINE',
        targetId: updated.id,
        description: `Admin ${action === 'replace' ? 'replaced' : 'rejected'} product line for order ${updated.orderId.slice(0, 10)}`,
        metadata: JSON.stringify({
          productLineId: updated.id,
          orderId: updated.orderId,
          action,
          productName: updated.productName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      productLine: updated,
    });
  } catch (error) {
    console.error('Error updating product line:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
