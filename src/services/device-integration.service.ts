/**
 * Device Integration Service
 * 
 * Manages stable integration with IoT devices via MQTT, HTTP, and Serial protocols
 * Features: Auto-reconnection, healthchecks, retries, backoff, idempotency, event queues
 */

import axios, { AxiosInstance } from 'axios'
import { EventEmitter } from 'events'
import { prisma } from '@/lib/prisma'

// ========== TYPE DEFINITIONS ==========

export type DeviceProtocol = 'MQTT' | 'HTTP' | 'Serial'

export type DeviceConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

export interface DeviceConfig {
  id: string
  name: string
  protocol: DeviceProtocol
  // MQTT config
  mqttBroker?: string
  mqttPort?: number
  mqttTopic?: string
  mqttClientId?: string
  mqttUsername?: string
  mqttPassword?: string
  // HTTP config
  httpUrl?: string
  httpApiKey?: string
  // Serial config
  serialPort?: string
  serialBaudRate?: number
  // Common config
  enabled: boolean
  reconnectInterval?: number // seconds
  healthCheckInterval?: number // seconds
  timeout?: number // milliseconds
  maxRetries?: number
  backoffMultiplier?: number
}

export interface DeviceMessage {
  id: string // Unique message ID for idempotency
  deviceId: string
  type: string
  payload: Record<string, unknown>
  timestamp: Date
  retryCount: number
}

export interface DeviceHealth {
  deviceId: string
  status: DeviceConnectionStatus
  lastHealthCheck: Date | null
  uptime: number // seconds
  messageCount: number
  errorCount: number
  lastError: string | null
  lastErrorAt: Date | null
}

export interface RetryStrategy {
  maxRetries: number
  initialDelay: number // milliseconds
  backoffMultiplier: number
  maxDelay: number // milliseconds
}

// ========== DEVICE INTEGRATION SERVICE ==========

export class DeviceIntegrationService extends EventEmitter {
  private devices: Map<string, DeviceConfig> = new Map()
  private connections: Map<string, unknown> = new Map() // Protocol-specific connection objects
  private healthChecks: Map<string, NodeJS.Timeout> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private messageQueue: Map<string, DeviceMessage[]> = new Map() // Pending messages per device
  private healthStatus: Map<string, DeviceHealth> = new Map()
  private retryStrategies: Map<string, RetryStrategy> = new Map()
  private httpClients: Map<string, AxiosInstance> = new Map()
  private idempotencyCache: Set<string> = new Set() // Store processed message IDs

  constructor() {
    super()
    this.loadDevices()
  }

  /**
   * Register a new device configuration
   */
  async registerDevice(config: DeviceConfig): Promise<void> {
    this.devices.set(config.id, config)
    
    // Initialize retry strategy
    const retryStrategy: RetryStrategy = {
      maxRetries: config.maxRetries || 3,
      initialDelay: 1000,
      backoffMultiplier: config.backoffMultiplier || 2,
      maxDelay: 60000 // 1 minute max delay
    }
    this.retryStrategies.set(config.id, retryStrategy)

    // Initialize health status
    const health: DeviceHealth = {
      deviceId: config.id,
      status: 'disconnected',
      lastHealthCheck: null,
      uptime: 0,
      messageCount: 0,
      errorCount: 0,
      lastError: null,
      lastErrorAt: null
    }
    this.healthStatus.set(config.id, health)

    // Initialize message queue
    this.messageQueue.set(config.id, [])

    // Connect if enabled
    if (config.enabled) {
      await this.connectDevice(config.id)
    }

    // Persist to database
    await this.saveDeviceToDatabase(config)

    this.emit('device.registered', config.id)
  }

  /**
   * Connect to a device
   */
  async connectDevice(deviceId: string): Promise<void> {
    const config = this.devices.get(deviceId)
    if (!config) {
      throw new Error(`Device ${deviceId} not found`)
    }

    this.updateHealthStatus(deviceId, 'connecting')

    try {
      switch (config.protocol) {
        case 'HTTP':
          await this.connectHTTP(config)
          break
        case 'MQTT':
          await this.connectMQTT(config)
          break
        case 'Serial':
          await this.connectSerial(config)
          break
      }

      this.updateHealthStatus(deviceId, 'connected')
      this.startHealthCheck(deviceId, config)
      this.processMessageQueue(deviceId)

      this.emit('device.connected', deviceId)
    } catch (error) {
      this.updateHealthStatus(deviceId, 'error', error instanceof Error ? error.message : 'Unknown error')
      this.scheduleReconnect(deviceId)
      this.emit('device.error', deviceId, error)
      throw error
    }
  }

  /**
   * Connect to device via HTTP
   */
  private async connectHTTP(config: DeviceConfig): Promise<void> {
    if (!config.httpUrl) {
      throw new Error('HTTP URL is required for HTTP devices')
    }

    const axiosClient = axios.create({
      baseURL: config.httpUrl,
      timeout: config.timeout || 10000,
      headers: config.httpApiKey ? {
        'X-API-Key': config.httpApiKey
      } : {}
    })

    this.httpClients.set(config.id, axiosClient)

    // Test connection with health check
    try {
      const response = await axiosClient.get('/health')
      if (response.status !== 200) {
        throw new Error('Health check failed')
      }
    } catch (error) {
      throw new Error(`HTTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Connect to device via MQTT
   */
  private async connectMQTT(config: DeviceConfig): Promise<void> {
    // MQTT implementation would go here
    // For now, we'll simulate with a timeout and successful connection
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In production, you would use an MQTT library like mqtt.js
    // const mqtt = require('mqtt')
    // const client = mqtt.connect({
    //   host: config.mqttBroker,
    //   port: config.mqttPort,
    //   clientId: config.mqttClientId,
    //   username: config.mqttUsername,
    //   password: config.mqttPassword
    // })
    // this.connections.set(config.id, client)
  }

  /**
   * Connect to device via Serial
   */
  private async connectSerial(config: DeviceConfig): Promise<void> {
    // Serial implementation would go here
    // For now, we'll simulate with a timeout
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In production, you would use serialport library
    // const SerialPort = require('serialport')
    // const port = new SerialPort(config.serialPort, { baudRate: config.serialBaudRate })
    // this.connections.set(config.id, port)
  }

  /**
   * Disconnect from a device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const config = this.devices.get(deviceId)
    if (!config) return

    // Stop health checks
    const healthCheck = this.healthChecks.get(deviceId)
    if (healthCheck) {
      clearInterval(healthCheck)
      this.healthChecks.delete(deviceId)
    }

    // Stop reconnect attempts
    const reconnectTimer = this.reconnectTimers.get(deviceId)
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      this.reconnectTimers.delete(deviceId)
    }

    // Close connection based on protocol
    switch (config.protocol) {
      case 'HTTP':
        this.httpClients.delete(deviceId)
        break
      case 'MQTT':
        // client.end()
        break
      case 'Serial':
        // port.close()
        break
    }

    this.connections.delete(deviceId)
    this.updateHealthStatus(deviceId, 'disconnected')

    this.emit('device.disconnected', deviceId)
  }

  /**
   * Send message to device with retry logic and idempotency
   */
  async sendMessage(deviceId: string, messageId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    const config = this.devices.get(deviceId)
    if (!config) {
      throw new Error(`Device ${deviceId} not found`)
    }

    // Check idempotency - if message already processed, return
    if (this.idempotencyCache.has(messageId)) {
      console.log(`[DeviceIntegration] Message ${messageId} already processed, skipping`)
      return
    }

    const message: DeviceMessage = {
      id: messageId,
      deviceId,
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0
    }

    const health = this.healthStatus.get(deviceId)
    if (!health || health.status !== 'connected') {
      // Queue message for later
      const queue = this.messageQueue.get(deviceId) || []
      queue.push(message)
      this.messageQueue.set(deviceId, queue)
      console.log(`[DeviceIntegration] Device ${deviceId} not connected, queuing message ${messageId}`)
      return
    }

    // Try to send immediately
    await this.sendMessageWithRetry(deviceId, message)
  }

  /**
   * Send message with exponential backoff retry
   */
  private async sendMessageWithRetry(deviceId: string, message: DeviceMessage): Promise<void> {
    const retryStrategy = this.retryStrategies.get(deviceId)
    if (!retryStrategy) {
      throw new Error(`Retry strategy not found for device ${deviceId}`)
    }

    const config = this.devices.get(deviceId)
    if (!config) {
      throw new Error(`Device ${deviceId} not found`)
    }

    let attempt = 0
    let delay = retryStrategy.initialDelay

    while (attempt <= retryStrategy.maxRetries) {
      try {
        await this.sendMessageToDevice(deviceId, message)
        
        // Success! Mark message as processed (idempotency)
        this.idempotencyCache.add(message.id)
        this.incrementMessageCount(deviceId)
        
        // Store in database for audit
        await this.saveMessageToDatabase(message, true)
        
        console.log(`[DeviceIntegration] Message ${message.id} sent successfully on attempt ${attempt + 1}`)
        return
      } catch (error) {
        attempt++
        
        if (attempt > retryStrategy.maxRetries) {
          // Max retries exceeded
          this.incrementErrorCount(deviceId, error instanceof Error ? error.message : 'Unknown error')
          
          // Store failed message for manual review
          await this.saveMessageToDatabase(message, false)
          
          console.error(`[DeviceIntegration] Message ${message.id} failed after ${retryStrategy.maxRetries} retries`)
          throw new Error(`Failed to send message after ${retryStrategy.maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * retryStrategy.backoffMultiplier, retryStrategy.maxDelay)
        
        console.log(`[DeviceIntegration] Retrying message ${message.id} (attempt ${attempt + 1}/${retryStrategy.maxRetries}) in ${delay}ms`)
      }
    }
  }

  /**
   * Send message to device via appropriate protocol
   */
  private async sendMessageToDevice(deviceId: string, message: DeviceMessage): Promise<void> {
    const config = this.devices.get(deviceId)
    if (!config) {
      throw new Error(`Device ${deviceId} not found`)
    }

    switch (config.protocol) {
      case 'HTTP':
        await this.sendHTTPMessage(deviceId, message)
        break
      case 'MQTT':
        await this.sendMQTTMessage(deviceId, message)
        break
      case 'Serial':
        await this.sendSerialMessage(deviceId, message)
        break
    }
  }

  /**
   * Send HTTP message
   */
  private async sendHTTPMessage(deviceId: string, message: DeviceMessage): Promise<void> {
    const httpClient = this.httpClients.get(deviceId)
    if (!httpClient) {
      throw new Error(`HTTP client not found for device ${deviceId}`)
    }

    const response = await httpClient.post('/message', {
      id: message.id,
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp.toISOString()
    })

    if (response.status !== 200) {
      throw new Error(`HTTP request failed with status ${response.status}`)
    }
  }

  /**
   * Send MQTT message
   */
  private async sendMQTTMessage(deviceId: string, message: DeviceMessage): Promise<void> {
    const mqttClient = this.connections.get(deviceId)
    if (!mqttClient) {
      throw new Error(`MQTT client not found for device ${deviceId}`)
    }

    // In production:
    // mqttClient.publish(config.mqttTopic, JSON.stringify({
    //   id: message.id,
    //   type: message.type,
    //   payload: message.payload,
    //   timestamp: message.timestamp
    // }))

    // Simulate for now
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Send Serial message
   */
  private async sendSerialMessage(deviceId: string, message: DeviceMessage): Promise<void> {
    const serialPort = this.connections.get(deviceId)
    if (!serialPort) {
      throw new Error(`Serial port not found for device ${deviceId}`)
    }

    // In production:
    // const data = JSON.stringify(message)
    // serialPort.write(data)

    // Simulate for now
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Process queued messages for a device
   */
  private async processMessageQueue(deviceId: string): Promise<void> {
    const queue = this.messageQueue.get(deviceId)
    if (!queue || queue.length === 0) return

    console.log(`[DeviceIntegration] Processing ${queue.length} queued messages for device ${deviceId}`)

    for (const message of queue) {
      try {
        await this.sendMessageWithRetry(deviceId, message)
      } catch (error) {
        console.error(`[DeviceIntegration] Failed to send queued message ${message.id}:`, error)
      }
    }

    // Clear queue after processing
    this.messageQueue.set(deviceId, [])
  }

  /**
   * Start health check for a device
   */
  private startHealthCheck(deviceId: string, config: DeviceConfig): void {
    const interval = (config.healthCheckInterval || 30) * 1000 // Convert to milliseconds

    const healthCheck = setInterval(async () => {
      await this.performHealthCheck(deviceId, config)
    }, interval)

    this.healthChecks.set(deviceId, healthCheck)
  }

  /**
   * Perform health check on a device
   */
  private async performHealthCheck(deviceId: string, config: DeviceConfig): Promise<void> {
    try {
      const health = this.healthStatus.get(deviceId)
      if (!health) return

      let isHealthy = false

      switch (config.protocol) {
        case 'HTTP':
          const httpClient = this.httpClients.get(deviceId)
          if (httpClient) {
            const response = await httpClient.get('/health')
            isHealthy = response.status === 200
          }
          break
        case 'MQTT':
          // Check if client is connected
          // isHealthy = mqttClient.connected
          isHealthy = true // Simulate
          break
        case 'Serial':
          // Check if port is open
          // isHealthy = serialPort.isOpen
          isHealthy = true // Simulate
          break
      }

      if (isHealthy) {
        this.updateHealthStatus(deviceId, 'connected')
      } else {
        this.updateHealthStatus(deviceId, 'error', 'Health check failed')
        this.scheduleReconnect(deviceId)
      }

      health.lastHealthCheck = new Date()
    } catch (error) {
      this.updateHealthStatus(deviceId, 'error', error instanceof Error ? error.message : 'Health check error')
      this.scheduleReconnect(deviceId)
    }
  }

  /**
   * Schedule reconnection for a device
   */
  private scheduleReconnect(deviceId: string): void {
    const config = this.devices.get(deviceId)
    if (!config || !config.enabled) return

    // Clear any existing reconnect timer
    const existingTimer = this.reconnectTimers.get(deviceId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const interval = (config.reconnectInterval || 5) * 1000 // Convert to milliseconds
    this.updateHealthStatus(deviceId, 'reconnecting')

    const reconnectTimer = setTimeout(async () => {
      try {
        await this.connectDevice(deviceId)
      } catch (error) {
        console.error(`[DeviceIntegration] Reconnection failed for ${deviceId}:`, error)
        this.scheduleReconnect(deviceId) // Try again
      }
    }, interval)

    this.reconnectTimers.set(deviceId, reconnectTimer)
  }

  /**
   * Update health status
   */
  private updateHealthStatus(deviceId: string, status: DeviceConnectionStatus, error?: string): void {
    const health = this.healthStatus.get(deviceId)
    if (!health) return

    health.status = status
    if (error) {
      health.lastError = error
      health.lastErrorAt = new Date()
    }

    this.healthStatus.set(deviceId, health)
  }

  /**
   * Increment message count
   */
  private incrementMessageCount(deviceId: string): void {
    const health = this.healthStatus.get(deviceId)
    if (health) {
      health.messageCount++
    }
  }

  /**
   * Increment error count
   */
  private incrementErrorCount(deviceId: string, error: string): void {
    const health = this.healthStatus.get(deviceId)
    if (health) {
      health.errorCount++
      health.lastError = error
      health.lastErrorAt = new Date()
    }
  }

  /**
   * Get device health status
   */
  getDeviceHealth(deviceId: string): DeviceHealth | null {
    return this.healthStatus.get(deviceId) || null
  }

  /**
   * Get all devices
   */
  getAllDevices(): DeviceConfig[] {
    return Array.from(this.devices.values())
  }

  /**
   * Load devices from database
   */
  private async loadDevices(): Promise<void> {
    try {
      const devices = await prisma.device.findMany()
      for (const device of devices) {
        const config: DeviceConfig = {
          id: device.id,
          name: device.name,
          protocol: device.protocol as DeviceProtocol,
          mqttBroker: device.mqttBroker || undefined,
          mqttPort: device.mqttPort || undefined,
          mqttTopic: device.mqttTopic || undefined,
          mqttClientId: device.mqttClientId || undefined,
          httpUrl: device.httpUrl || undefined,
          serialPort: device.serialPort || undefined,
          serialBaudRate: device.serialBaudRate || undefined,
          enabled: device.enabled,
          reconnectInterval: device.reconnectInterval || undefined,
          healthCheckInterval: device.healthCheckInterval || undefined,
          timeout: device.timeout || undefined,
          maxRetries: device.maxRetries || undefined,
          backoffMultiplier: device.backoffMultiplier || undefined
        }
        this.devices.set(device.id, config)
        await this.registerDevice(config)
      }
    } catch (error) {
      console.error('[DeviceIntegration] Error loading devices:', error)
    }
  }

  /**
   * Save device to database
   */
  private async saveDeviceToDatabase(config: DeviceConfig): Promise<void> {
    try {
      await prisma.device.upsert({
        where: { id: config.id },
        update: {
          name: config.name,
          protocol: config.protocol,
          mqttBroker: config.mqttBroker,
          mqttPort: config.mqttPort,
          mqttTopic: config.mqttTopic,
          mqttClientId: config.mqttClientId,
          httpUrl: config.httpUrl,
          serialPort: config.serialPort,
          serialBaudRate: config.serialBaudRate,
          enabled: config.enabled,
          reconnectInterval: config.reconnectInterval,
          healthCheckInterval: config.healthCheckInterval,
          timeout: config.timeout,
          maxRetries: config.maxRetries,
          backoffMultiplier: config.backoffMultiplier
        },
        create: {
          id: config.id,
          name: config.name,
          protocol: config.protocol,
          mqttBroker: config.mqttBroker,
          mqttPort: config.mqttPort,
          mqttTopic: config.mqttTopic,
          mqttClientId: config.mqttClientId,
          httpUrl: config.httpUrl,
          serialPort: config.serialPort,
          serialBaudRate: config.serialBaudRate,
          enabled: config.enabled,
          reconnectInterval: config.reconnectInterval,
          healthCheckInterval: config.healthCheckInterval,
          timeout: config.timeout,
          maxRetries: config.maxRetries,
          backoffMultiplier: config.backoffMultiplier
        }
      })
    } catch (error) {
      console.error('[DeviceIntegration] Error saving device:', error)
    }
  }

  /**
   * Save message to database
   */
  private async saveMessageToDatabase(message: DeviceMessage, success: boolean): Promise<void> {
    try {
      await prisma.deviceMessage.create({
        data: {
          id: message.id,
          deviceId: message.deviceId,
          type: message.type,
          payload: message.payload,
          success,
          retryCount: message.retryCount,
          timestamp: message.timestamp
        }
      })
    } catch (error) {
      console.error('[DeviceIntegration] Error saving message:', error)
    }
  }
}

// ========== SINGLETON EXPORT ==========

export const deviceIntegrationService = new DeviceIntegrationService()

