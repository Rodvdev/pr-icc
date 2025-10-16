/**
 * Camera Status API
 * 
 * PATCH /api/cameras/[id]/status - Update camera status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cameraService } from '@/services'

/**
 * PATCH /api/cameras/[id]/status
 * Update camera status
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
    const { status, message } = body

    // Validate status
    const validStatuses = ['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
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

    // Update camera status
    const camera = await cameraService.updateCameraStatus(
      id,
      status,
      message,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: camera,
      message: `Camera status updated to ${status}`
    })
  } catch (error) {
    console.error('[API] PATCH /api/cameras/[id]/status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

