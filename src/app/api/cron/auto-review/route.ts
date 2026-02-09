
import { NextRequest, NextResponse } from 'next/server';
import { processAutoReviews } from '@/lib/auto-review';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const cronSecret = process.env.CRON_SECRET;

        // Check for Admin Session OR Cron Secret
        const session = await getSession();
        const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';
        const isCron = cronSecret && key === cronSecret;

        if (!isAdmin && !isCron) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await processAutoReviews();

        return NextResponse.json({
            success: true,
            message: 'Auto-review process completed',
            details: result,
        });
    } catch (error) {
        console.error('[AutoReview API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
