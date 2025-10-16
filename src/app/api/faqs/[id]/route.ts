/**
 * FAQ API - Single FAQ Operations
 * 
 * GET    /api/faqs/[id] - Get FAQ by ID
 * PATCH  /api/faqs/[id] - Update FAQ
 * DELETE /api/faqs/[id] - Delete FAQ
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * GET /api/faqs/[id]
 * Get FAQ by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get FAQ
    const faq = await faqService.getFAQById(id)
    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: faq
    })
  } catch (error) {
    console.error('[API] GET /api/faqs/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/faqs/[id]
 * Update FAQ
 */
export async function PATCH(
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

    // Parse body
    const body = await request.json()
    const { title, answer, tags, status } = body

    // Check if FAQ exists
    const existingFaq = await faqService.getFAQById(id)
    if (!existingFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Update FAQ
    const faq = await faqService.updateFAQ(
      id,
      {
        title,
        answer,
        tags,
        status
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: faq
    })
  } catch (error) {
    console.error('[API] PATCH /api/faqs/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/faqs/[id]
 * Delete FAQ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
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

    // Delete FAQ
    await faqService.deleteFAQ(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/faqs/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

