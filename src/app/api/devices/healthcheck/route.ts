import { NextRequest, NextResponse } from 'next/server'
import { deviceIntegrationService } from '@/services/device-integration.service'

/**
 * GET /api/devices/healthcheck
 * Health check endpoint for all devices
 */
export async function GET() {
  try {
    const devices = deviceIntegrationService.getAllDevices()
    
    const healthChecks = devices.map(device => {
      const health = deviceIntegrationService.getDeviceHealth(device.id)
      return {
        deviceId: device.id,
        name: device.name,
        protocol: device.protocol,
        enabled: device.enabled,
        status: health?.status || 'unknown',
        lastHealthCheck: health?.lastHealthCheck || null,
        uptime: health?.uptime || 0,
        messageCount: health?.messageCount || 0,
        errorCount: health?.errorCount || 0,
        lastError: health?.lastError || null,
        lastErrorAt: health?.lastErrorAt || null
      }
    })

    const overallStatus = healthChecks.every(h => h.status === 'connected') 
      ? 'healthy' 
      : 'degraded'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      devices: healthChecks,
      summary: {
        total: healthChecks.length,
        connected: healthChecks.filter(h => h.status === 'connected').length,
        disconnected: healthChecks.filter(h => h.status === 'disconnected').length,
        error: healthChecks.filter(h => h.status === 'error').length,
        reconnecting: healthChecks.filter(h => h.status === 'reconnecting').length
      }
    })
  } catch (error) {
    console.error('Error in healthcheck:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Healthcheck failed' 
      },
      { status: 500 }
    )
  }
}

