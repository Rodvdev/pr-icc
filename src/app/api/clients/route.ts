/**
 * Clients API - List and Create
 * 
 * GET  /api/clients - List clients with filters
 * POST /api/clients - Create a new client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clientService } from '@/services'
import { ClientStatus } from '@/services/client.service'

/**
 * GET /api/clients
 * List clients with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'AGENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || undefined
    const status = searchParams.get('status') as ClientStatus | undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Search clients
    const result = await clientService.searchClients({
      query,
      status,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.clients,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] GET /api/clients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
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
    const { email, password, name, dni, phone, address, dateOfBirth } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if client already exists
    const existingClient = await clientService.getClientByEmail(email)
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Check DNI if provided
    if (dni) {
      const existingDni = await clientService.getClientByDni(dni)
      if (existingDni) {
        return NextResponse.json(
          { error: 'Client with this DNI already exists' },
          { status: 409 }
        )
      }
    }

    // Create client
    const client = await clientService.createClient(
      {
        email,
        password,
        name,
        dni,
        phone
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: client
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/clients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

