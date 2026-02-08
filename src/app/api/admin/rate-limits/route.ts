import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET /api/admin/rate-limits
 * Get current rate limit configurations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get from database (or return defaults if not exist)
    const settings = await prisma.websiteSettings.findUnique({
      where: { key: 'rate_limits' }
    })

    if (settings) {
      return NextResponse.json({
        configs: JSON.parse(settings.value)
      })
    }

    // Return defaults
    return NextResponse.json({
      configs: {
        LOGIN: { limit: 5, window: 5, blockDuration: 15 },
        SIGNUP: { limit: 3, window: 60, blockDuration: 60 },
        FORGOT_PASSWORD: { limit: 3, window: 60, blockDuration: 60 },
        TOPUP_REQUEST: { limit: 5, window: 60 },
        CREATE_ORDER: { limit: 10, window: 1 },
        FILE_UPLOAD: { limit: 5, window: 1 },
        API_GENERAL: { limit: 60, window: 1 }
      }
    })
  } catch (error) {
    console.error('Error fetching rate limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/rate-limits
 * Update rate limit configurations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { configs } = body

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { error: 'Invalid configs format' },
        { status: 400 }
      )
    }

    // Validate configs
    for (const config of configs) {
      if (!config.key || !config.limit || !config.window) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      if (config.limit < 1 || config.limit > 1000) {
        return NextResponse.json(
          { error: 'Limit must be between 1 and 1000' },
          { status: 400 }
        )
      }

      if (config.window < 1 || config.window > 1440) {
        return NextResponse.json(
          { error: 'Window must be between 1 and 1440 minutes' },
          { status: 400 }
        )
      }
    }

    // Convert configs array to object for storage
    const configsObject: Record<string, any> = {}
    for (const config of configs) {
      configsObject[config.key] = {
        limit: config.limit,
        window: config.window * 60 * 1000, // Convert to milliseconds
        blockDuration: config.blockDuration
          ? config.blockDuration * 60 * 1000
          : undefined
      }
    }

    // Save to database
    await prisma.websiteSettings.upsert({
      where: { key: 'rate_limits' },
      create: {
        key: 'rate_limits',
        value: JSON.stringify(configsObject)
      },
      update: {
        value: JSON.stringify(configsObject)
      }
    })

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        action: 'UPDATE_RATE_LIMITS',
        targetType: 'SETTINGS',
        targetId: 'rate_limits',
        diffJson: JSON.stringify(configsObject)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Rate limit configurations updated'
    })
  } catch (error) {
    console.error('Error updating rate limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
