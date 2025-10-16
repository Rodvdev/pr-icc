/**
 * Client Activation API
 * 
 * POST /api/clients/[id]/activate - Activate/approve a client registration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clientService } from '@/services'

/**
 * POST /api/clients/[id]/activate
 * Activate a client (approve registration)
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

    // Check if client exists
    const existingClient = await clientService.getClientById(id)
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (existingClient.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Client is not pending approval' },
        { status: 400 }
      )
    }

    // Activate client
    const client = await clientService.activateClient(id, session.user.id)

    // Remove password from response
    const { password: _password, ...clientData } = client

    return NextResponse.json({
      success: true,
      data: clientData,
      message: 'Client activated successfully'
    })
  } catch (error) {
    console.error('[API] POST /api/clients/[id]/activate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

