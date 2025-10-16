/**
 * Client API - Single Client Operations
 * 
 * GET    /api/clients/[id] - Get client by ID
 * PATCH  /api/clients/[id] - Update client
 * DELETE /api/clients/[id] - Delete client (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clientService } from '@/services'

/**
 * GET /api/clients/[id]
 * Get client by ID
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

    // Get client
    const client = await clientService.getClientById(id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Agents can only see basic info, admins see everything
    if (session.user.role === 'AGENT') {
      return NextResponse.json({
        success: true,
        data: {
          id: client.id,
          email: client.email,
          name: client.name,
          dni: client.dni,
          status: client.status
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('[API] GET /api/clients/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/clients/[id]
 * Update client information
 */
export async function PATCH(
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
    const { name, email, phone } = body

    // Check if client exists
    const existingClient = await clientService.getClientById(id)
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check email uniqueness if changed
    if (email && email !== existingClient.email) {
      const emailTaken = await clientService.getClientByEmail(email)
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // Update client
    const client = await clientService.updateClient(
      id,
      {
        name,
        email,
        phone
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('[API] PATCH /api/clients/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete client (soft delete)
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

    // Check if client exists
    const existingClient = await clientService.getClientById(id)
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Delete client (soft delete)
    await clientService.deleteClient(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/clients/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

