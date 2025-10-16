/**
 * Camera Statistics API
 * 
 * GET /api/cameras/stats - Get camera statistics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cameraService } from '@/services'

/**
 * GET /api/cameras/stats
 * Get camera statistics
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get stats
    const stats = await cameraService.getCameraStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('[API] GET /api/cameras/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

