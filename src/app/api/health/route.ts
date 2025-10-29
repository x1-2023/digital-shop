import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health Check Endpoint
 * Used by Docker healthcheck and monitoring systems
 */
export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    const dbResponseTime = Date.now() - startTime

    // Check if database is too slow
    if (dbResponseTime > 5000) {
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          checks: {
            database: {
              status: 'slow',
              responseTime: dbResponseTime
            }
          }
        },
        { status: 503 }
      )
    }

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: {
            status: 'connected',
            responseTime: dbResponseTime
          }
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
