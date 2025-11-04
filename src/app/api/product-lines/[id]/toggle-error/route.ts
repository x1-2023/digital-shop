import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

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

    return NextResponse.json({
      success: true,
      productLine: updated,
    });
  } catch (error) {
    console.error('Error toggling product line error status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
