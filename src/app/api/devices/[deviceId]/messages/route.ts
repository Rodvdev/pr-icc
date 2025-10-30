import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'
import { randomUUID } from 'crypto'

/**
 * POST /api/devices/[deviceId]/messages
 * Send message to device with idempotency and retries
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = params.deviceId
    const body = await request.json()

    if (!body.type || !body.payload) {
      return NextResponse.json(
        { error: 'type and payload are required' },
        { status: 400 }
      )
    }

    // Generate unique message ID for idempotency
    const messageId = body.id || randomUUID()

    await deviceIntegrationService.sendMessage(
      deviceId,
      messageId,
      body.type,
      body.payload
    )

    return NextResponse.json({
      success: true,
      messageId,
      message: 'Message sent successfully'
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message' 
      },
      { status: 500 }
    )
  }
}

