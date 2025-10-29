import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/setup/status
 * Check if initial setup has been completed
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$connect();

    // Check if admin user exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // Check if settings exist
    const settingsExist = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    return NextResponse.json({
      setupCompleted: !!adminExists,
      databaseConnected: true,
      adminExists: !!adminExists,
      settingsExist: !!settingsExist,
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    return NextResponse.json({
      setupCompleted: false,
      databaseConnected: false,
      adminExists: false,
      settingsExist: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
    });
  }
}
