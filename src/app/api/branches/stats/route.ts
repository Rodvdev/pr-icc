/**
 * Branch Statistics API
 * 
 * GET /api/branches/stats - Get branch statistics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { branchService } from '@/services'

/**
 * GET /api/branches/stats
 * Get branch statistics
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
    const stats = await branchService.getBranchStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('[API] GET /api/branches/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

