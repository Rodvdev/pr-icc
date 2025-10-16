/**
 * Client Block API
 * 
 * POST /api/clients/[id]/block - Block a client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clientService } from '@/services'

/**
 * POST /api/clients/[id]/block
 * Block a client
 */
export async function POST(
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

    // Parse body
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Check if client exists
    const existingClient = await clientService.getClientById(id)
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Block client
    const client = await clientService.blockClient(
      id,
      reason,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client blocked successfully'
    })
  } catch (error) {
    console.error('[API] POST /api/clients/[id]/block error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

