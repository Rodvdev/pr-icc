/**
 * Cameras API - List and Create
 * 
 * GET  /api/cameras - List cameras with filters
 * POST /api/cameras - Create a new camera
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cameraService } from '@/services'

/**
 * GET /api/cameras
 * List cameras with optional filters
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
    const branchId = searchParams.get('branchId') || undefined
    const moduleId = searchParams.get('moduleId') || undefined
    const status = searchParams.get('status') as 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE' | undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Search cameras
    const result = await cameraService.searchCameras({
      branchId,
      moduleId,
      status,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.cameras,
      total: result.total,
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] GET /api/cameras error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cameras
 * Create a new camera
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
    const {
      name,
      ipAddress,
      branchId,
      moduleId,
      model,
      location,
      streamUrl
    } = body

    // Validate required fields
    if (!name || !ipAddress || !branchId) {
      return NextResponse.json(
        { error: 'Name, IP address, and branch are required' },
        { status: 400 }
      )
    }

    // Create camera
    const camera = await cameraService.createCamera(
      {
        name,
        ipAddress,
        branchId,
        moduleId,
        model,
        location,
        streamUrl
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: camera
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/cameras error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

