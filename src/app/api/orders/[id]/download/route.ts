import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
        productLogs: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order or is admin
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if order is paid
    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 400 });
    }

    // Generate download content from ProductLog
    let downloadContent = '';
    downloadContent += `Đơn hàng: ${order.id}\n`;
    downloadContent += `Ngày mua: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n`;
    downloadContent += `Trạng thái: ${order.status}\n`;
    downloadContent += `Tổng tiền: ${order.totalAmountVnd.toLocaleString('vi-VN')} VND\n\n`;
    downloadContent += `=== CHI TIẾT SẢN PHẨM ===\n\n`;

    for (const log of order.productLogs) {
      downloadContent += `Nội dung:\n`;
      downloadContent += log.content || 'Chưa có nội dung';
      downloadContent += `\n${'='.repeat(50)}\n\n`;
    }

    // Create filename
    const filename = `don-hang-${order.id}.txt`;

    // Return as downloadable file
    return new NextResponse(downloadContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
