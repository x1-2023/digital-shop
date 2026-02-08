import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resetRateLimit, getAllRateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { identifier } = await request.json();

    if (identifier) {
      // Reset specific identifier
      const success = resetRateLimit(identifier);
      return NextResponse.json({
        success,
        message: success ? 'Rate limit reset successfully' : 'Identifier not found',
      });
    } else {
      // Reset all rate limits
      const allLimits = getAllRateLimits();
      let count = 0;
      for (const key of allLimits.keys()) {
        if (resetRateLimit(key)) {
          count++;
        }
      }
      return NextResponse.json({
        success: true,
        message: `Reset ${count} rate limit entries`,
        count,
      });
    }
  } catch (error) {
    console.error('Reset rate limit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List all rate limits
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allLimits = getAllRateLimits();
    const entries = Array.from(allLimits.entries()).map(([key, value]) => ({
      identifier: key,
      count: value.count,
      resetTime: new Date(value.resetTime).toISOString(),
      blockedUntil: value.blockedUntil ? new Date(value.blockedUntil).toISOString() : null,
      isBlocked: value.blockedUntil ? value.blockedUntil > Date.now() : false,
    }));

    return NextResponse.json({
      total: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Get rate limits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
