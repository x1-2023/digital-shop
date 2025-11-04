import { NextRequest, NextResponse } from 'next/server';
// Auth using custom JWT session
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;
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

    // Create error report
    const errorReport = await prisma.errorReport.create({
      data: {
        userId: order.userId,
        userEmail: session.user.email,
        orderId: orderId,
        status: 'PENDING',
        reportedProducts: JSON.stringify(reportedProducts),
      },
    });

    // Log system activity
    await prisma.systemLog.create({
      data: {
        userId: order.userId,
        userEmail: session.user.email,
        action: 'SYSTEM_WARNING',
        targetType: 'ERROR_REPORT',
        targetId: errorReport.id,
        description: `User reported ${reportedProducts.length} product(s) error for order ${orderId.slice(0, 10)}`,
        metadata: JSON.stringify({
          orderId,
          productCount: reportedProducts.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId: errorReport.id,
        message: `Đã gửi báo cáo ${reportedProducts.length} sản phẩm lỗi. Admin sẽ xử lý trong thời gian sớm nhất.`,
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
