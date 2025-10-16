/**
 * Client Statistics API
 * 
 * GET /api/clients/stats - Get client statistics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clientService } from '@/services'

/**
 * GET /api/clients/stats
 * Get client statistics
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
    const stats = await clientService.getClientStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('[API] GET /api/clients/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

