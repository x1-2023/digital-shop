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

    // Try to get from ProductLineItems first (new system)
    const productLines = await prisma.productLineItem.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
    });

    let downloadContent = '';

    if (productLines.length > 0) {
      // New system: use ProductLineItems
      downloadContent = `Đơn hàng #${order.id.slice(0, 10).toUpperCase()}\n`;
      downloadContent += `Tổng: ${order.totalAmountVnd.toLocaleString('vi-VN')} đ\n`;
      downloadContent += `Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}\n\n`;
      downloadContent += `${'='.repeat(60)}\n\n`;

      for (const line of productLines) {
        // Show replacement if exists, otherwise original
        const content = line.replacement || line.content;
        downloadContent += `${content}\n`;
      }
    } else {
      // Old system: extract from ProductLog
      downloadContent = `Đơn hàng #${order.id.slice(0, 10).toUpperCase()}\n`;
      downloadContent += `Tổng: ${order.totalAmountVnd.toLocaleString('vi-VN')} đ\n`;
      downloadContent += `Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}\n\n`;
      downloadContent += `${'='.repeat(60)}\n\n`;

      for (const log of order.productLogs) {
        const content = log.content || '';
        const lines = content.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          // Extract numbered format (1. content) or plain content
          const match = trimmed.match(/^\d+\.\s+(.+)$/);
          if (match) {
            downloadContent += `${match[1]}\n`;
          } else if (trimmed &&
            !trimmed.startsWith('===') &&
            !trimmed.startsWith('Sản phẩm:') &&
            !trimmed.startsWith('Số lượng:') &&
            !trimmed.startsWith('LICENSE KEYS') &&
            !trimmed.startsWith('NỘI DUNG') &&
            !trimmed.startsWith('⚠️')) {
            downloadContent += `${trimmed}\n`;
          }
        }
      }
    }

    // Create filename
    const filename = `${order.id.slice(0, 10)}.txt`;

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
