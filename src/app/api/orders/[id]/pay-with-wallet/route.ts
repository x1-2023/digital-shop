import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIdempotencyKey } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        status: 'PENDING',
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not pending' },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomicity and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // CRITICAL: Check balance INSIDE transaction to prevent race condition
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      });

      if (!wallet || wallet.balanceVnd < order.totalAmountVnd) {
        throw new Error('Số dư ví không đủ');
      }

      // ATOMIC UPDATE: Deduct from wallet only if balance is sufficient
      // This prevents double-spending if two requests happen simultaneously
      const updatedWallet = await tx.wallet.updateMany({
        where: {
          userId: session.user.id,
          balanceVnd: { gte: order.totalAmountVnd }, // Double-check balance
        },
        data: {
          balanceVnd: {
            decrement: order.totalAmountVnd,
          },
        },
      });

      // If no rows updated, balance was insufficient or changed
      if (updatedWallet.count === 0) {
        throw new Error('Số dư ví không đủ hoặc đã được sử dụng');
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: {
          status: 'PAID',
          updatedAt: new Date(),
        },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: 'MANUAL',
          providerTxid: generateIdempotencyKey(),
          amountVnd: order.totalAmountVnd,
          rawJson: JSON.stringify({}),
        },
      });

      // Get updated balance
      const finalWallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      });

      // Create wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId: session.user.id,
          type: 'PURCHASE',
          amountVnd: order.totalAmountVnd,
          balanceAfterVnd: finalWallet?.balanceVnd || 0,
          description: `Purchase order #${order.id}`,
          metadata: JSON.stringify({
            orderId: order.id,
            paymentId: payment.id,
            itemCount: order.orderItems.length,
          }),
        },
      });

      // Create ProductLog entries for product delivery
      for (const item of order.orderItems) {
        const product = item.product;

        // Read file content if product has a file
        let content = '';
        if (product.fileUrl) {
          try {
            // For now, read the entire file content
            // TODO: Implement proper line allocation for large files
            const fs = await import('fs/promises');
            const path = await import('path');
            const filePath = path.join(process.cwd(), 'uploads', product.fileUrl);

            try {
              content = await fs.readFile(filePath, 'utf-8');
            } catch (readError) {
              console.error(`Failed to read file for product ${product.id}:`, readError);
              content = 'Lỗi: Không thể đọc file sản phẩm. Vui lòng liên hệ support.';
            }
          } catch (importError) {
            console.error('Failed to import fs/path modules:', importError);
            content = 'Lỗi: Không thể truy cập file. Vui lòng liên hệ support.';
          }
        } else {
          content = `Sản phẩm: ${product.name}\nSố lượng: ${item.quantity}\n\nChưa có nội dung được cung cấp.`;
        }

        await tx.productLog.create({
          data: {
            productId: product.id,
            userId: session.user.id,
            orderId: order.id,
            action: 'PURCHASE',
            quantity: item.quantity,
            content: content,
            notes: `Purchased ${item.quantity} item(s)`,
          },
        });
      }

      return { order: updatedOrder, payment };
    });

    // TODO: Trigger fulfillment queue job
    // await fulfillQueue.add('fulfill-order', { orderId: order.id });

    // Send Discord webhook notification (async, don't wait)
    try {
      const { sendOrderNotification, loadWebhookConfig } = await import('@/lib/discord-webhook');
      const webhookConfig = await loadWebhookConfig();

      if (webhookConfig.enabled && webhookConfig.notifyOnOrders) {
        // Fetch full order with items for notification
        const fullOrder = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            user: { select: { email: true } },
            orderItems: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        });

        if (fullOrder) {
          sendOrderNotification(webhookConfig, {
            orderId: fullOrder.id,
            userEmail: fullOrder.user.email,
            totalAmount: fullOrder.totalAmountVnd,
            currency: 'VND',
            items: fullOrder.orderItems.map(item => ({
              productName: item.product.name,
              quantity: item.quantity,
              price: item.priceVnd,
            })),
          }).catch(err => console.error('Webhook error:', err));
        }
      }
    } catch (webhookError) {
      console.error('Failed to send webhook notification:', webhookError);
      // Don't throw - webhook failure shouldn't affect order processing
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing payment:', error);

    // Return specific error message if available
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}