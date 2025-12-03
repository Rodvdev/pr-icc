/**
 * Facial Recognition Camera Integration API
 * 
 * POST /api/facial-recognition/cameras/connect - Connect camera to Python API
 * PUT /api/facial-recognition/cameras/stream - Update camera stream URL in Python API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { facialRecognitionService } from '@/services/facial-recognition.service'
import { cameraService } from '@/services/camera.service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cameraId } = body

    if (!cameraId) {
      return NextResponse.json(
        { error: 'Missing required field: cameraId' },
        { status: 400 }
      )
    }
    const camera = await cameraService.getCameraById(cameraId)

    if (!camera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      )
    }

    if (!camera.streamUrl) {
      return NextResponse.json(
        { error: 'Camera has no stream URL configured' },
        { status: 400 }
      )
    }

    // Update camera stream in Python API
    const result = await facialRecognitionService.updateCameraStreamInPythonAPI(
      cameraId,
      camera.streamUrl
    )

    return NextResponse.json({
      success: true,
      message: result.message,
      camera: {
        id: camera.id,
        name: camera.name,
        streamUrl: camera.streamUrl
      }
    })
  } catch (error) {
    console.error('Error connecting camera to Python API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect camera to Python API',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cameraId, streamUrl } = body

    if (!cameraId) {
      return NextResponse.json(
        { error: 'Missing required field: cameraId' },
        { status: 400 }
      )
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'Missing required field: streamUrl' },
        { status: 400 }
      )
    }

    const camera = await cameraService.getCameraById(cameraId)

    if (!camera) {
      return NextResponse.json(
        { error: 'Camera not found' },
        { status: 404 }
      )
    }

    // Update camera stream URL in database
    await cameraService.updateCamera(cameraId, {
      streamUrl
    }, session.user.id)

    // Update camera stream in Python API
    const result = await facialRecognitionService.updateCameraStreamInPythonAPI(
      cameraId,
      streamUrl
    )

    return NextResponse.json({
      success: true,
      message: result.message,
      camera: {
        id: camera.id,
        name: camera.name,
        streamUrl
      }
    })
  } catch (error) {
    console.error('Error updating camera stream:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update camera stream',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

