"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plug, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Activity,
  AlertTriangle,
  Loader2
} from "lucide-react"

interface DeviceHealth {
  deviceId: string
  name: string
  protocol: string
  enabled: boolean
  status: string
  lastHealthCheck: string | null
  uptime: number
  messageCount: number
  errorCount: number
  lastError: string | null
  lastErrorAt: string | null
}

interface HealthCheckResponse {
  status: string
  timestamp: string
  devices: DeviceHealth[]
  summary: {
    total: number
    connected: number
    disconnected: number
    error: number
    reconnecting: number
  }
}

export default function DevicesPage() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealthData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/devices/healthcheck')
      if (!response.ok) throw new Error('Failed to fetch health data')
      const data = await response.json()
      setHealthData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const initializeDemo = async () => {
    setInitializing(true)
    setError(null)
    try {
      const response = await fetch('/api/devices/demo', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to initialize demo')
      const data = await response.json()
      console.log('Demo initialized:', data)
      await fetchHealthData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setInitializing(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-gray-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Plug className="w-8 h-8 text-blue-600" />
              Device Integration
            </h1>
            <p className="text-gray-600 mt-2">
              Stable integration with IoT devices via MQTT, HTTP, and Serial protocols
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={initializeDemo}
              disabled={initializing}
              variant="outline"
            >
              {initializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Initialize Demo
                </>
              )}
            </Button>
            <Button
              onClick={fetchHealthData}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{healthData.summary.total}</p>
                </div>
                <Plug className="w-8 h-8 text-gray-400" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Connected</p>
                  <p className="text-2xl font-bold text-green-600">{healthData.summary.connected}</p>
                </div>
                <Wifi className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disconnected</p>
                  <p className="text-2xl font-bold text-gray-600">{healthData.summary.disconnected}</p>
                </div>
                <WifiOff className="w-8 h-8 text-gray-400" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Error</p>
                  <p className="text-2xl font-bold text-red-600">{healthData.summary.error}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reconnecting</p>
                  <p className="text-2xl font-bold text-yellow-600">{healthData.summary.reconnecting}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
          </div>
        )}

        {/* System Status */}
        {healthData && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">System Status</h2>
              <div className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                healthData.status === 'healthy' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}>
                {healthData.status === 'healthy' ? 'HEALTHY' : 'DEGRADED'}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Last updated: {new Date(healthData.timestamp).toLocaleString()}
            </p>
          </Card>
        )}

        {/* Devices List */}
        {healthData && healthData.devices.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Devices</h2>
            {healthData.devices.map((device) => (
              <Card key={device.deviceId} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getStatusIcon(device.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{device.name}</h3>
                        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${getStatusColor(device.status)}`}>
                          {device.status.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          {device.protocol}
                        </span>
                        {!device.enabled && (
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">ID: {device.deviceId}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500">Uptime</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatUptime(device.uptime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Messages Sent</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {device.messageCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Errors</p>
                          <p className={`text-lg font-semibold ${
                            device.errorCount > 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {device.errorCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Health Check</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {device.lastHealthCheck 
                              ? new Date(device.lastHealthCheck).toLocaleTimeString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>

                      {device.lastError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600 font-semibold mb-1">Last Error</p>
                          <p className="text-sm text-red-700">{device.lastError}</p>
                          {device.lastErrorAt && (
                            <p className="text-xs text-red-600 mt-1">
                              {new Date(device.lastErrorAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Plug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Devices Found</h3>
            <p className="text-gray-600 mb-6">
              Click &quot;Initialize Demo&quot; to set up a demo device and test the integration system.
            </p>
            <Button onClick={initializeDemo} disabled={initializing}>
              {initializing ? 'Initializing...' : 'Initialize Demo Device'}
            </Button>
          </Card>
        )}

        {/* Features Documentation */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Auto-Reconnection</p>
                  <p className="text-sm text-gray-600">Automatic reconnection with configurable intervals</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Health Checks</p>
                  <p className="text-sm text-gray-600">Regular health monitoring with configurable frequency</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Exponential Backoff</p>
                  <p className="text-sm text-gray-600">Smart retry strategy with exponential delays</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Idempotency</p>
                  <p className="text-sm text-gray-600">Duplicate messages are safely ignored</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Message Queue</p>
                  <p className="text-sm text-gray-600">Persistent queue for offline devices</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Multi-Protocol</p>
                  <p className="text-sm text-gray-600">Support for MQTT, HTTP, and Serial</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Status Tracking</p>
                  <p className="text-sm text-gray-600">Real-time connection status monitoring</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Error Tracking</p>
                  <p className="text-sm text-gray-600">Comprehensive error reporting and logging</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

