/**
 * FAQs API - List and Create
 * 
 * GET  /api/faqs - List FAQs with filters
 * POST /api/faqs - Create a new FAQ
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * GET /api/faqs
 * List FAQs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || undefined
    const status = searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined
    const category = searchParams.get('category') || undefined
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',') : undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Search FAQs
    const result = await faqService.searchFAQs({
      query,
      status,
      category,
      tags,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.faqs,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] GET /api/faqs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/faqs
 * Create a new FAQ
 */
export async function POST(request: NextRequest) {
  try {
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
    const { title, answer, tags, category, status } = body

    // Validate required fields
    if (!title || !answer) {
      return NextResponse.json(
        { error: 'Title and answer are required' },
        { status: 400 }
      )
    }

    // Create FAQ
    const faq = await faqService.createFAQ(
      {
        title,
        answer,
        tags: tags || [],
        category,
        status: status || 'DRAFT'
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: faq
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/faqs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

