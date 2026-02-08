import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { loadWebhookConfig, saveWebhookConfig } from '@/lib/discord-webhook';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await loadWebhookConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error loading webhook config:', error);
    return NextResponse.json(
      { error: 'Failed to load webhook config' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate
    if (body.enabled && !body.webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required when enabled' },
        { status: 400 }
      );
    }

    if (body.webhookUrl && !body.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return NextResponse.json(
        { error: 'Invalid Discord webhook URL' },
        { status: 400 }
      );
    }

    await saveWebhookConfig(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving webhook config:', error);
    return NextResponse.json(
      { error: 'Failed to save webhook config' },
      { status: 500 }
    );
  }
}
