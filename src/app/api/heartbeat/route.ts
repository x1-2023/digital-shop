import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUserHeartbeat } from '@/lib/online-tracking';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Get or create session ID from cookie
    let sessionId = request.cookies.get('session_tracking_id')?.value;

    if (!sessionId) {
      sessionId = nanoid(16);
    }

    // Get authenticated user info
    const session = await getSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Update heartbeat
    updateUserHeartbeat(sessionId, userId, userEmail, userAgent);

    // Return response with session cookie
    const response = NextResponse.json({ success: true });

    // Set session cookie (30 days expiry)
    response.cookies.set('session_tracking_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}
