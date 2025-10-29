import { NextResponse } from 'next/server';
import { startCronJobs, restartCronJobs } from '@/lib/cron';

// This endpoint is called to initialize or restart cron jobs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'restart') {
      await restartCronJobs();
      return NextResponse.json({
        success: true,
        message: 'Cron jobs restarted'
      });
    }

    await startCronJobs();
    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized'
    });
  } catch (error) {
    console.error('[CronInit] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize cron jobs'
    }, { status: 500 });
  }
}
