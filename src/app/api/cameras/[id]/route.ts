/**
 * Camera API - Single Camera Operations
 * 
 * GET    /api/cameras/[id] - Get camera by ID
 * PATCH  /api/cameras/[id] - Update camera
 * DELETE /api/cameras/[id] - Delete camera
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cameraService } from '@/services'

/**
 * GET /api/cameras/[id]
 * Get camera by ID
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

    // Get camera
    const camera = await cameraService.getCameraById(id)
    if (!camera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: camera
    })
  } catch (error) {
    console.error('[API] GET /api/cameras/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/cameras/[id]
 * Update camera information
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
    const {
      name,
      ipAddress,
      model,
      location,
      streamUrl,
      status,
      branchId,
      moduleId
    } = body

    // Check if camera exists
    const existingCamera = await cameraService.getCameraById(id)
    if (!existingCamera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      )
    }

    // Update camera
    const camera = await cameraService.updateCamera(
      id,
      {
        name,
        ipAddress,
        model,
        location,
        streamUrl,
        status,
        branchId,
        moduleId
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: camera
    })
  } catch (error) {
    console.error('[API] PATCH /api/cameras/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cameras/[id]
 * Delete camera
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

    // Check if camera exists
    const existingCamera = await cameraService.getCameraById(id)
    if (!existingCamera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      )
    }

    // Delete camera
    await cameraService.deleteCamera(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Camera deleted successfully'
    })
  } catch (error) {
    console.error('[API] DELETE /api/cameras/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

