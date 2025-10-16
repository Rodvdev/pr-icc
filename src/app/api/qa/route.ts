/**
 * QA Pairs API - List and Create
 * 
 * GET  /api/qa - List QA pairs with filters
 * POST /api/qa - Create a new QA pair
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * GET /api/qa
 * List QA pairs with optional filters
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
    const query = request.nextUrl.searchParams.get('query') || undefined
    const isActive = request.nextUrl.searchParams.get('isActive') === 'false' ? false : true
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    // Search QA pairs
    const result = await faqService.searchQAPairs({
      query,
      isActive,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.qaPairs,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] GET /api/qa error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/qa
 * Create a new QA pair
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
    const { question, answer } = body

    // Validate required fields
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // Create QA pair
    const qaPair = await faqService.createQAPair(
      {
        question,
        answer
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: qaPair
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/qa error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

