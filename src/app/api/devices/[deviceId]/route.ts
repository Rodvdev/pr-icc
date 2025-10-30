import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'

/**
 * GET /api/devices/[deviceId]
 * Get device details and health status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = params.deviceId
    const health = deviceIntegrationService.getDeviceHealth(deviceId)

    if (!health) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      deviceId,
      health
    })
  } catch (error) {
    console.error('Error fetching device:', error)
    return NextResponse.json(
      { error: 'Failed to fetch device' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/devices/[deviceId]
 * Remove device
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = params.deviceId
    await deviceIntegrationService.disconnectDevice(deviceId)

    return NextResponse.json({
      message: 'Device disconnected and removed'
    })
  } catch (error) {
    console.error('Error removing device:', error)
    return NextResponse.json(
      { error: 'Failed to remove device' },
      { status: 500 }
    )
  }
}

