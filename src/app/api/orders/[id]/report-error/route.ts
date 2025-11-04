import { NextRequest, NextResponse } from 'next/server';
// Auth using custom JWT session
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    const { id: orderId } = await params;
    const body = await request.json();
    const { reportedProducts } = body;

    if (!reportedProducts || !Array.isArray(reportedProducts) || reportedProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn ít nhất một sản phẩm để báo lỗi' },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    if (order.user.email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền báo lỗi đơn hàng này' },
        { status: 403 }
      );
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Chỉ có thể báo lỗi đơn hàng đã thanh toán' },
        { status: 400 }
      );
    }

    // Process each reported product
    const errorReports = [];
    for (const item of reportedProducts) {
      const { productLineId, userNote } = item;

      // Get product line info
      const productLine = await prisma.productLineItem.findUnique({
        where: { id: productLineId },
      });

      if (!productLine || productLine.orderId !== orderId) {
        continue;
      }

      // Update product line status
      await prisma.productLineItem.update({
        where: { id: productLineId },
        data: {
          errorReported: true,
          status: 'ERROR_REPORTED',
        },
      });

      // Create error report for this product line
      const errorReport = await prisma.errorReport.create({
        data: {
          userId: order.userId,
          userEmail: session.user.email,
          orderId: orderId,
          productLineId: productLineId,
          productName: productLine.productName,
          originalContent: productLine.content,
          userNote: userNote || 'Sản phẩm lỗi',
          status: 'PENDING',
        },
      });
      errorReports.push(errorReport);
    }

    // Log system activity
    if (errorReports.length > 0) {
      await prisma.systemLog.create({
        data: {
          userId: order.userId,
          userEmail: session.user.email,
          action: 'SYSTEM_WARNING',
          targetType: 'ERROR_REPORT',
          targetId: errorReports[0].id,
          description: `User reported ${errorReports.length} product(s) error for order ${orderId.slice(0, 10)}`,
          metadata: JSON.stringify({
            orderId,
            productCount: errorReports.length,
            errorReportIds: errorReports.map(r => r.id),
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reportIds: errorReports.map(r => r.id),
        message: `Đã gửi báo cáo ${errorReports.length} sản phẩm lỗi. Admin sẽ xử lý trong thời gian sớm nhất.`,
      },
    });
  } catch (error) {
    console.error('Error creating error report:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi gửi báo cáo' },
      { status: 500 }
    );
  }
}
