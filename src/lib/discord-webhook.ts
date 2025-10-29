// ==============================================================================
// Discord Webhook Service
// ==============================================================================
// Send notifications to Discord channel via webhook
// ==============================================================================

export interface DiscordWebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  notifyOnOrders: boolean;
  notifyOnDeposits: boolean;
}

export interface OrderNotification {
  orderId: string;
  userEmail: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface DepositNotification {
  userId: string;
  userEmail: string;
  amount: number;
  status: 'APPROVED' | 'REJECTED';
  method: 'AUTO' | 'MANUAL';
}

export interface ReferralNotification {
  referrerEmail: string;
  refereeEmail: string;
  referrerRewardVnd: number;
  refereeRewardVnd: number;
  firstDepositVnd: number;
}

/**
 * Send order notification to Discord
 */
export async function sendOrderNotification(
  config: DiscordWebhookConfig,
  order: OrderNotification
): Promise<boolean> {
  if (!config.enabled || !config.notifyOnOrders || !config.webhookUrl) {
    return false;
  }

  try {
    const itemsList = order.items
      .map(item => `• ${item.productName} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
      .join('\n');

    const embed = {
      title: '🛒 Đơn Hàng Mới',
      color: 0x00ff00, // Green
      fields: [
        {
          name: 'Mã Đơn',
          value: `\`${order.orderId}\``,
          inline: true,
        },
        {
          name: 'Khách Hàng',
          value: order.userEmail,
          inline: true,
        },
        {
          name: 'Tổng Tiền',
          value: `**${formatCurrency(order.totalAmount)}**`,
          inline: true,
        },
        {
          name: 'Sản Phẩm',
          value: itemsList || 'Không có sản phẩm',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Digital Shop',
      },
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Discord order notification:', error);
    return false;
  }
}

/**
 * Send deposit notification to Discord
 */
export async function sendDepositNotification(
  config: DiscordWebhookConfig,
  deposit: DepositNotification
): Promise<boolean> {
  if (!config.enabled || !config.notifyOnDeposits || !config.webhookUrl) {
    return false;
  }

  try {
    const isApproved = deposit.status === 'APPROVED';
    const color = isApproved ? 0x00ff00 : 0xff0000; // Green for approved, red for rejected
    const icon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'Đã Duyệt' : 'Từ Chối';
    const methodText = deposit.method === 'AUTO' ? 'Tự động' : 'Thủ công';

    const embed = {
      title: `${icon} Nạp Tiền ${statusText}`,
      color,
      fields: [
        {
          name: 'Khách Hàng',
          value: deposit.userEmail,
          inline: true,
        },
        {
          name: 'Số Tiền',
          value: `**${formatCurrency(deposit.amount)}**`,
          inline: true,
        },
        {
          name: 'Phương Thức',
          value: methodText,
          inline: true,
        },
        {
          name: 'Trạng Thái',
          value: statusText,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Digital Shop',
      },
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Discord deposit notification:', error);
    return false;
  }
}

/**
 * Send referral notification to Discord
 */
export async function sendReferralNotification(
  config: DiscordWebhookConfig,
  data: ReferralNotification
): Promise<boolean> {
  if (!config.enabled || !config.webhookUrl) {
    return false;
  }

  try {
    const embed = {
      title: '🎁 Giới Thiệu Thành Công',
      color: 0xff00ff, // Purple
      fields: [
        {
          name: 'Người Giới Thiệu',
          value: `${data.referrerEmail}\n💰 Thưởng: **${formatCurrency(data.referrerRewardVnd)}**`,
          inline: true,
        },
        {
          name: 'Người Được Giới Thiệu',
          value: `${data.refereeEmail}\n💰 Thưởng: **${formatCurrency(data.refereeRewardVnd)}**`,
          inline: true,
        },
        {
          name: 'Nạp Tiền Đầu Tiên',
          value: formatCurrency(data.firstDepositVnd),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Digital Shop - Referral System',
      },
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Discord referral notification:', error);
    return false;
  }
}

/**
 * Test Discord webhook connection
 */
export async function testDiscordWebhook(webhookUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return {
        success: false,
        message: 'URL webhook không hợp lệ. Phải bắt đầu với https://discord.com/api/webhooks/',
      };
    }

    const embed = {
      title: '🧪 Test Webhook',
      description: 'Đây là tin nhắn test từ Digital Shop',
      color: 0x3b82f6, // Blue
      fields: [
        {
          name: 'Status',
          value: '✅ Webhook hoạt động tốt!',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Digital Shop - Test Message',
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Lỗi: ${response.status} - ${errorText}`,
      };
    }

    return {
      success: true,
      message: 'Webhook hoạt động! Kiểm tra Discord channel của bạn.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi không xác định',
    };
  }
}

/**
 * Load webhook config from database
 */
export async function loadWebhookConfig(): Promise<DiscordWebhookConfig> {
  try {
    const { prisma } = await import('./prisma');

    const setting = await prisma.websiteSettings.findUnique({
      where: { key: 'discord_webhook' },
    });

    if (!setting?.value) {
      return {
        enabled: false,
        webhookUrl: '',
        notifyOnOrders: true,
        notifyOnDeposits: true,
      };
    }

    return JSON.parse(setting.value as string);
  } catch (error) {
    console.error('Failed to load webhook config:', error);
    return {
      enabled: false,
      webhookUrl: '',
      notifyOnOrders: true,
      notifyOnDeposits: true,
    };
  }
}

/**
 * Save webhook config to database
 */
export async function saveWebhookConfig(config: DiscordWebhookConfig): Promise<void> {
  const { prisma } = await import('./prisma');

  await prisma.websiteSettings.upsert({
    where: { key: 'discord_webhook' },
    create: {
      key: 'discord_webhook',
      value: JSON.stringify(config),
    },
    update: {
      value: JSON.stringify(config),
    },
  });
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
