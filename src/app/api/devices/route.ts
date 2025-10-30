import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'
import { DeviceConfig } from '@/services/device-integration.service'

/**
 * GET /api/devices
 * List all devices
 */
export async function GET() {
  try {
    const devices = deviceIntegrationService.getAllDevices()
    return NextResponse.json({ devices })
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/devices
 * Register a new device
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.id || !body.name || !body.protocol) {
      return NextResponse.json(
        { error: 'id, name, and protocol are required' },
        { status: 400 }
      )
    }

    const config: DeviceConfig = {
      id: body.id,
      name: body.name,
      protocol: body.protocol,
      mqttBroker: body.mqttBroker,
      mqttPort: body.mqttPort,
      mqttTopic: body.mqttTopic,
      mqttClientId: body.mqttClientId,
      mqttUsername: body.mqttUsername,
      mqttPassword: body.mqttPassword,
      httpUrl: body.httpUrl,
      httpApiKey: body.httpApiKey,
      serialPort: body.serialPort,
      serialBaudRate: body.serialBaudRate,
      enabled: body.enabled !== undefined ? body.enabled : true,
      reconnectInterval: body.reconnectInterval,
      healthCheckInterval: body.healthCheckInterval,
      timeout: body.timeout,
      maxRetries: body.maxRetries,
      backoffMultiplier: body.backoffMultiplier
    }

    await deviceIntegrationService.registerDevice(config)

    return NextResponse.json({
      message: 'Device registered successfully',
      device: config
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering device:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register device' },
      { status: 500 }
    )
  }
}

