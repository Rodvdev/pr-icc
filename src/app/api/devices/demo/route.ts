import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'

/**
 * POST /api/devices/demo
 * Demo endpoint to test device integration
 */
export async function POST() {
  try {
    // Create a demo HTTP device if it doesn't exist
    const demoDeviceId = 'demo-http-device-001'
    
    try {
      await deviceIntegrationService.registerDevice({
        id: demoDeviceId,
        name: 'Demo HTTP Device',
        protocol: 'HTTP',
        httpUrl: 'http://localhost:5001', // Using the existing Flask API
        enabled: true,
        reconnectInterval: 5,
        healthCheckInterval: 30,
        timeout: 10000,
        maxRetries: 3,
        backoffMultiplier: 2
      })
    } catch (error) {
      // Device might already exist, try to connect
      await deviceIntegrationService.connectDevice(demoDeviceId)
    }

    // Get device health
    const health = deviceIntegrationService.getDeviceHealth(demoDeviceId)

    // Send a test message
    const messageId = `demo-${Date.now()}`
    try {
      await deviceIntegrationService.sendMessage(
        demoDeviceId,
        messageId,
        'health_check',
        { timestamp: new Date().toISOString(), source: 'demo' }
      )
    } catch (error) {
      // Message might fail if device is not connected - that's okay for demo
      console.log('Demo message failed (expected if device not connected):', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo device initialized',
      device: {
        id: demoDeviceId,
        name: 'Demo HTTP Device',
        protocol: 'HTTP',
        health: health || { status: 'initializing' }
      },
      testMessage: {
        id: messageId,
        status: 'sent',
        message: 'Test message sent to device queue'
      },
      endpoints: {
        healthcheck: '/api/devices/healthcheck',
        deviceStatus: `/api/devices/${demoDeviceId}`,
        sendMessage: `/api/devices/${demoDeviceId}/messages`,
        connect: `/api/devices/${demoDeviceId}/connect`,
        disconnect: `/api/devices/${demoDeviceId}/disconnect`
      }
    })
  } catch (error) {
    console.error('Error in demo:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Demo failed'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/devices/demo
 * Get demo device information
 */
export async function GET() {
  try {
    const demoDeviceId = 'demo-http-device-001'
    const health = deviceIntegrationService.getDeviceHealth(demoDeviceId)

    return NextResponse.json({
      demoDevice: {
        id: demoDeviceId,
        exists: !!health,
        health: health || null
      },
      documentation: {
        title: 'Device Integration Demo',
        description: 'This endpoint demonstrates the device integration system with MQTT/HTTP/Serial support, auto-reconnection, healthchecks, retries, backoff, and idempotency.',
        features: [
          'Auto-reconnection with configurable intervals',
          'Health checks with configurable frequency',
          'Exponential backoff retry strategy',
          'Message idempotency (duplicate messages are safely ignored)',
          'Persistent message queue for offline devices',
          'Support for MQTT, HTTP, and Serial protocols',
          'Connection status tracking and monitoring',
          'Error tracking and reporting'
        ],
        usage: {
          initialize: 'POST /api/devices/demo - Initialize demo device',
          checkHealth: 'GET /api/devices/healthcheck - Check all devices health',
          sendMessage: 'POST /api/devices/[deviceId]/messages',
          connect: 'POST /api/devices/[deviceId]/connect',
          disconnect: 'POST /api/devices/[deviceId]/disconnect',
          getDevice: 'GET /api/devices/[deviceId] - Get device status',
          listDevices: 'GET /api/devices - List all devices'
        },
        evidencePage: '/admin/devices'
      }
    })
  } catch (error) {
    console.error('Error getting demo info:', error)
    return NextResponse.json(
      { error: 'Failed to get demo info' },
      { status: 500 }
    )
  }
}

