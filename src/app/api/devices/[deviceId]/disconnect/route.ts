import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'

/**
 * POST /api/devices/[deviceId]/disconnect
 * Disconnect from a device
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    await deviceIntegrationService.disconnectDevice(deviceId)

    return NextResponse.json({
      message: 'Device disconnected successfully'
    })
  } catch (error) {
    console.error('Error disconnecting device:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect device' },
      { status: 500 }
    )
  }
}

