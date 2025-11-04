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

    const { id } = await params;

    // Get the product line
    const productLine = await prisma.productLineItem.findUnique({
      where: { id },
      include: {
        productLog: {
          include: {
            order: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!productLine) {
      return NextResponse.json(
        { success: false, error: 'Product line not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (productLine.productLog.order.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Toggle error status
    const newErrorStatus = !productLine.errorReported;
    const newStatus = newErrorStatus ? 'ERROR_REPORTED' : 'NORMAL';

    const updated = await prisma.productLineItem.update({
      where: { id },
      data: {
        errorReported: newErrorStatus,
        status: newStatus,
      },
    });

    // If marking as error, create ErrorReport record
    let errorReport = null;
    if (newErrorStatus) {
      errorReport = await prisma.errorReport.create({
        data: {
          userId: productLine.productLog.order.userId,
          userEmail: productLine.productLog.order.user.email,
          orderId: productLine.orderId,
          productLineId: productLine.id,
          productName: productLine.productName,
          originalContent: productLine.content,
          userNote: 'Đánh dấu lỗi từ giao diện',
          status: 'PENDING',
        },
      });

      // Log system activity
      await prisma.systemLog.create({
        data: {
          userId: productLine.productLog.order.userId,
          userEmail: productLine.productLog.order.user.email,
          action: 'SYSTEM_WARNING',
          targetType: 'ERROR_REPORT',
          targetId: errorReport.id,
          description: `User marked product line as error for order ${productLine.orderId.slice(0, 10)}`,
          metadata: JSON.stringify({
            orderId: productLine.orderId,
            productLineId: productLine.id,
            productName: productLine.productName,
          }),
        },
      });
    } else {
      // If unmarking error, delete the ErrorReport if it exists
      await prisma.errorReport.deleteMany({
        where: {
          productLineId: productLine.id,
          status: 'PENDING', // Only delete pending reports
        },
      });
    }

    return NextResponse.json({
      success: true,
      productLine: updated,
      errorReport,
    });
  } catch (error) {
    console.error('Error toggling product line error status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
