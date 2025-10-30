# Device Integration System

## Overview

Complete stable integration system for IoT devices with support for MQTT, HTTP, and Serial protocols. Features auto-reconnection, health checks, retry logic with exponential backoff, idempotency, persistent message queues, and comprehensive monitoring.

## Architecture

```
┌─────────────────┐
│   IoT Devices   │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Protocol │  (MQTT/HTTP/Serial)
    └────┬────┘
         │
┌────────▼─────────────────────────┐
│  Device Integration Service      │
│  - Auto-reconnection             │
│  - Health checks                 │
│  - Retry with backoff            │
│  - Idempotency                   │
│  - Message queue                 │
└────────┬─────────────────────────┘
         │
┌────────▼────────┐
│  Prisma Database │
└─────────────────┘
```

## Features

### 🔌 Multi-Protocol Support
- **MQTT**: Pub/sub messaging with automatic client management
- **HTTP**: RESTful API integration with authentication
- **Serial**: Direct serial port communication

### 🔄 Auto-Reconnection
- Configurable reconnection intervals
- Automatic reconnection on failure
- Connection status tracking

### 🏥 Health Checks
- Periodic health monitoring
- Configurable check intervals
- Automatic failure detection

### 🔁 Exponential Backoff Retry
- Configurable max retries
- Exponential delay increases
- Maximum delay cap
- Per-message retry tracking

### 🆔 Idempotency
- Unique message IDs
- Duplicate message detection
- Safe duplicate handling

### 📨 Message Queue
- Persistent offline queue
- Automatic processing on reconnect
- Configurable queue limits
- Database-backed storage

### 📊 Monitoring & Metrics
- Real-time status tracking
- Message counters
- Error tracking
- Uptime monitoring
- Last health check timestamps

## Database Schema

### Device Model
```prisma
model Device {
  id                  String            @id
  name                String
  protocol            DeviceProtocol    // MQTT | HTTP | Serial
  enabled             Boolean
  // MQTT config
  mqttBroker          String?
  mqttPort            Int?
  mqttTopic           String?
  mqttClientId        String?
  // HTTP config
  httpUrl             String?
  httpApiKey          String?
  // Serial config
  serialPort          String?
  serialBaudRate      Int?
  // Connection settings
  reconnectInterval   Int?
  healthCheckInterval Int?
  timeout             Int?
  maxRetries          Int?
  backoffMultiplier   Float?
  messages            DeviceMessage[]
}
```

### DeviceMessage Model
```prisma
model DeviceMessage {
  id         String    @id
  deviceId   String
  type       String
  payload    Json
  success    Boolean
  retryCount Int
  timestamp  DateTime
  device     Device    @relation(...)
}
```

## API Endpoints

### Device Management

#### `GET /api/devices`
List all registered devices

**Response:**
```json
{
  "devices": [
    {
      "id": "device-001",
      "name": "Demo HTTP Device",
      "protocol": "HTTP",
      "enabled": true
    }
  ]
}
```

#### `POST /api/devices`
Register a new device

**Request:**
```json
{
  "id": "device-001",
  "name": "Demo HTTP Device",
  "protocol": "HTTP",
  "httpUrl": "http://localhost:5001",
  "enabled": true,
  "reconnectInterval": 5,
  "healthCheckInterval": 30,
  "timeout": 10000,
  "maxRetries": 3,
  "backoffMultiplier": 2
}
```

#### `GET /api/devices/[deviceId]`
Get device health status

**Response:**
```json
{
  "deviceId": "device-001",
  "health": {
    "status": "connected",
    "lastHealthCheck": "2024-01-15T10:30:00Z",
    "uptime": 3600,
    "messageCount": 150,
    "errorCount": 3,
    "lastError": "Connection timeout",
    "lastErrorAt": "2024-01-15T09:00:00Z"
  }
}
```

#### `POST /api/devices/[deviceId]/connect`
Connect to a device

#### `POST /api/devices/[deviceId]/disconnect`
Disconnect from a device

#### `DELETE /api/devices/[deviceId]`
Remove a device

### Message Sending

#### `POST /api/devices/[deviceId]/messages`
Send message to device

**Request:**
```json
{
  "id": "msg-001",  // Optional: message ID for idempotency
  "type": "health_check",
  "payload": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "demo"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-001",
  "message": "Message sent successfully"
}
```

### Health Monitoring

#### `GET /api/devices/healthcheck`
Get health status of all devices

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "devices": [
    {
      "deviceId": "device-001",
      "name": "Demo HTTP Device",
      "protocol": "HTTP",
      "enabled": true,
      "status": "connected",
      "lastHealthCheck": "2024-01-15T10:29:30Z",
      "uptime": 3600,
      "messageCount": 150,
      "errorCount": 3
    }
  ],
  "summary": {
    "total": 1,
    "connected": 1,
    "disconnected": 0,
    "error": 0,
    "reconnecting": 0
  }
}
```

### Demo

#### `POST /api/devices/demo`
Initialize demo device for testing

**Response:**
```json
{
  "success": true,
  "message": "Demo device initialized",
  "device": {
    "id": "demo-http-device-001",
    "name": "Demo HTTP Device",
    "protocol": "HTTP",
    "health": {
      "status": "connected"
    }
  },
  "endpoints": {
    "healthcheck": "/api/devices/healthcheck",
    "deviceStatus": "/api/devices/demo-http-device-001",
    "sendMessage": "/api/devices/demo-http-device-001/messages",
    "connect": "/api/devices/demo-http-device-001/connect",
    "disconnect": "/api/devices/demo-http-device-001/disconnect"
  }
}
```

## Service Implementation

### DeviceIntegrationService

Main service class providing all device integration functionality:

```typescript
class DeviceIntegrationService {
  // Device management
  async registerDevice(config: DeviceConfig): Promise<void>
  async connectDevice(deviceId: string): Promise<void>
  async disconnectDevice(deviceId: string): Promise<void>
  
  // Message handling
  async sendMessage(deviceId: string, messageId: string, type: string, payload: Record<string, unknown>): Promise<void>
  
  // Health monitoring
  getDeviceHealth(deviceId: string): DeviceHealth | null
  getAllDevices(): DeviceConfig[]
}
```

### Connection Status

Status values:
- `connecting`: Initial connection attempt in progress
- `connected`: Successfully connected and operational
- `disconnected`: Not connected
- `error`: Connection error or failure
- `reconnecting`: Attempting to reconnect after failure

### Retry Strategy

Default configuration:
- Max retries: 3
- Initial delay: 1000ms
- Backoff multiplier: 2
- Max delay: 60000ms (1 minute)

Delay progression:
1. First retry: 1000ms
2. Second retry: 2000ms
3. Third retry: 4000ms
4. All subsequent: 8000ms, 16000ms, ... up to 60000ms

### Idempotency

Each message requires a unique ID. Duplicate messages with the same ID are safely ignored:
1. Client sends message with ID
2. Service checks idempotency cache
3. If ID exists: message is silently ignored
4. If ID is new: message is processed and added to cache
5. Cache persists across service restarts (database-backed)

### Message Queue

When a device is offline:
1. Messages are added to persistent queue
2. Queue is stored in database
3. On reconnection, queued messages are automatically processed
4. Failed messages are retried with exponential backoff
5. Successfully sent messages are removed from queue

## Evidence Page

Access the evidence page at `/admin/devices` to:
- View all registered devices
- Monitor real-time health status
- Check connection statistics
- View error history
- Initialize demo devices
- Test integration features

## Usage Examples

### Register HTTP Device
```typescript
await fetch('/api/devices', {
  method: 'POST',
  body: JSON.stringify({
    id: 'esp32-camera-001',
    name: 'ESP32 Camera',
    protocol: 'HTTP',
    httpUrl: 'http://192.168.1.100:80',
    enabled: true,
    reconnectInterval: 5,
    healthCheckInterval: 30,
    maxRetries: 3
  })
})
```

### Register MQTT Device
```typescript
await fetch('/api/devices', {
  method: 'POST',
  body: JSON.stringify({
    id: 'sensor-room-001',
    name: 'Room Sensor',
    protocol: 'MQTT',
    mqttBroker: 'mqtt.broker.com',
    mqttPort: 1883,
    mqttTopic: 'sensors/room001',
    mqttClientId: 'sensor-cli-001',
    enabled: true,
    reconnectInterval: 10,
    maxRetries: 5
  })
})
```

### Send Message
```typescript
await fetch('/api/devices/esp32-camera-001/messages', {
  method: 'POST',
  body: JSON.stringify({
    type: 'capture_image',
    payload: {
      resolution: '1920x1080',
      format: 'JPEG'
    }
  })
})
```

### Check Health
```typescript
const response = await fetch('/api/devices/healthcheck')
const data = await response.json()
console.log('System status:', data.status)
console.log('Connected devices:', data.summary.connected)
```

## Integration with Existing System

The device integration service works alongside the facial recognition system:
- Facial recognition cameras can be registered as HTTP devices
- MQTT devices can provide sensor data
- Serial devices can handle hardware interactions
- All communication is robust and fault-tolerant

## Configuration

Default values can be set at device registration:

| Parameter | Default | Description |
|-----------|---------|-------------|
| reconnectInterval | 5 | Seconds between reconnection attempts |
| healthCheckInterval | 30 | Seconds between health checks |
| timeout | 10000 | HTTP request timeout in ms |
| maxRetries | 3 | Maximum message retry attempts |
| backoffMultiplier | 2 | Exponential backoff multiplier |
| maxDelay | 60000 | Maximum retry delay in ms |

## Error Handling

All errors are tracked and reported:
- Connection errors
- Message send failures
- Health check failures
- Retry exhaustion

Error details are stored in database and visible on evidence page.

## Performance

Designed for high-volume production use:
- Database-backed persistence
- Efficient queuing mechanism
- Automatic cleanup of old messages
- Configurable timeouts and limits
- Non-blocking async operations

## Security

Recommended security measures:
- Use HTTPS for HTTP devices
- Use MQTTS for MQTT devices
- Store credentials securely
- Implement API key authentication
- Monitor for unusual activity

## Future Enhancements

Potential additions:
- Webhook notifications
- Batch message sending
- Message prioritization
- Device group management
- Cloud deployment support
- Advanced analytics dashboard

## Testing

Run the demo endpoint to test the system:
```bash
curl -X POST http://localhost:3005/api/devices/demo
```

Then access the evidence page to view results.

