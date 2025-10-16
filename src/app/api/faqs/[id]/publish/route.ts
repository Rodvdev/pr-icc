/**
 * FAQ Publish API
 * 
 * POST /api/faqs/[id]/publish - Publish an FAQ
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * POST /api/faqs/[id]/publish
 * Publish an FAQ
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'AGENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if FAQ exists
    const existingFaq = await faqService.getFAQById(id)
    if (!existingFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Publish FAQ
    const faq = await faqService.publishFAQ(id, session.user.id)

    return NextResponse.json({
      success: true,
      data: faq,
      message: 'FAQ published successfully'
    })
  } catch (error) {
    console.error('[API] POST /api/faqs/[id]/publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

