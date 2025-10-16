/**
 * FAQ Statistics API
 * 
 * GET /api/faqs/stats - Get FAQ statistics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * GET /api/faqs/stats
 * Get FAQ statistics
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
    const stats = await faqService.getFAQStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('[API] GET /api/faqs/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

