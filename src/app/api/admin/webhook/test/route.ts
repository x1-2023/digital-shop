import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { testDiscordWebhook } from '@/lib/discord-webhook';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookUrl } = await req.json();

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        message: 'Webhook URL is required',
      });
    }

    const result = await testDiscordWebhook(webhookUrl);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
