/**
 * Facial Recognition Webhook API
 * 
 * POST /api/facial-recognition/webhook - Receive detection events from Python API
 * 
 * This endpoint receives detection results from the Python API when faces are detected.
 * It can be called by the Python API or by a webhook system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { facialRecognitionService } from '@/services/facial-recognition.service'
import type { FacialAPIResult } from '@/lib/facial-recognition-api'

// Optional: Add webhook secret validation for security
const WEBHOOK_SECRET = process.env.FACIAL_RECOGNITION_WEBHOOK_SECRET

interface WebhookPayload {
  result: FacialAPIResult
  camera_id?: string
  camera_stream_url?: string
  timestamp?: string
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Validate webhook secret
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body: WebhookPayload = await request.json()
    const { result, camera_id, camera_stream_url } = body

    if (!result) {
      return NextResponse.json(
        { error: 'Missing required field: result' },
        { status: 400 }
      )
    }

    // Find camera by stream URL or ID
    let cameraId = camera_id

    if (!cameraId && camera_stream_url) {
      // Try to find camera by stream URL
      const { prisma } = await import('@/lib/prisma')
      const camera = await prisma.camera.findFirst({
        where: {
          streamUrl: camera_stream_url
        }
      })

      if (camera) {
        cameraId = camera.id
      }
    }

    // If still no camera ID, try to find default camera or create a detection without camera
    if (!cameraId) {
      // Try to find any online camera as fallback
      const { prisma } = await import('@/lib/prisma')
      const defaultCamera = await prisma.camera.findFirst({
        where: {
          status: 'ONLINE'
        },
        orderBy: {
          lastHeartbeat: 'desc'
        }
      })

      if (defaultCamera) {
        cameraId = defaultCamera.id
      } else {
        return NextResponse.json(
          { error: 'No camera found. Please provide camera_id or ensure a camera is online.' },
          { status: 400 }
        )
      }
    }

    // Process the detection
    const detection = await facialRecognitionService.processPythonAPIDetection(
      result,
      cameraId
    )

    return NextResponse.json({
      success: true,
      detection: {
        id: detection.id,
        status: detection.status,
        clientId: detection.clientId,
        confidence: detection.confidence,
        occurredAt: detection.occurredAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


