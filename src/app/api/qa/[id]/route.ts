/**
 * QA Pair API - Single QA Pair Operations
 * 
 * GET    /api/qa/[id] - Get QA pair by ID
 * PATCH  /api/qa/[id] - Update QA pair
 * DELETE /api/qa/[id] - Delete QA pair
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { faqService } from '@/services'

/**
 * GET /api/qa/[id]
 * Get QA pair by ID
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

    // Get QA pair
    const qaPair = await faqService.getQAPairById(id)
    if (!qaPair) {
      return NextResponse.json(
        { error: 'QA pair not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: qaPair
    })
  } catch (error) {
    console.error('[API] GET /api/qa/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/qa/[id]
 * Update QA pair
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
    const { question, answer, isActive } = body

    // Check if QA pair exists
    const existingQA = await faqService.getQAPairById(id)
    if (!existingQA) {
      return NextResponse.json(
        { error: 'QA pair not found' },
        { status: 404 }
      )
    }

    // Update QA pair
    const qaPair = await faqService.updateQAPair(
      id,
      {
        question,
        answer,
        isActive
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: qaPair
    })
  } catch (error) {
    console.error('[API] PATCH /api/qa/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/qa/[id]
 * Delete QA pair
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

    // Check if QA pair exists
    const existingQA = await faqService.getQAPairById(id)
    if (!existingQA) {
      return NextResponse.json(
        { error: 'QA pair not found' },
        { status: 404 }
      )
    }

    // Delete QA pair
    await faqService.deleteQAPair(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'QA pair deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/qa/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

