import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'

/**
 * POST /api/devices/[deviceId]/connect
 * Connect to a device
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = params.deviceId
    await deviceIntegrationService.connectDevice(deviceId)

    return NextResponse.json({
      message: 'Device connected successfully'
    })
  } catch (error) {
    console.error('Error connecting device:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect device' },
      { status: 500 }
    )
  }
}

