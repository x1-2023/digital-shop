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
    const { errorContents } = body; // Array of error content strings

    if (!errorContents || !Array.isArray(errorContents) || errorContents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập ít nhất một sản phẩm lỗi' },
        { status: 400 }
      );
    }

    // Verify order ownership
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
        { success: false, error: 'Bạn không có quyền truy cập đơn hàng này' },
        { status: 403 }
      );
    }

    // Find matching product lines by content and mark as error
    const updated = [];
    const errorReportIds = [];

    for (const errorContent of errorContents) {
      const trimmedContent = errorContent.trim();
      if (!trimmedContent) continue;

      // Find product line with matching content
      const productLine = await prisma.productLineItem.findFirst({
        where: {
          orderId: orderId,
          content: trimmedContent,
        },
      });

      if (productLine && !productLine.errorReported) {
        // Update product line status
        const updatedLine = await prisma.productLineItem.update({
          where: { id: productLine.id },
          data: {
            errorReported: true,
            status: 'ERROR_REPORTED',
          },
        });
        updated.push(updatedLine);

        // Create ErrorReport
        const errorReport = await prisma.errorReport.create({
          data: {
            orderId: orderId,
            userId: order.userId,
            userEmail: order.user.email,
            productLineId: productLine.id,
            productName: productLine.productName,
            originalContent: productLine.content,
            userNote: 'Báo lỗi hàng loạt',
            status: 'PENDING',
          },
        });
        errorReportIds.push(errorReport.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã báo lỗi ${updated.length} sản phẩm`,
      updatedCount: updated.length,
      errorReportIds,
    });
  } catch (error) {
    console.error('Error bulk reporting products:', error);
    return NextResponse.json(
      { success: false, error: 'Có lỗi xảy ra khi gửi báo cáo' },
      { status: 500 }
    );
  }
}
