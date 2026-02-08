import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOnlineUsersCount } from '@/lib/online-tracking';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = getOnlineUsersCount();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}
