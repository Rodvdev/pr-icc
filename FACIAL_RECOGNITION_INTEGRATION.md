# Facial Recognition Python API Integration

This document explains how the Next.js application integrates with the Python API that serves ESP32 cameras and face recognition users.

## Overview

The integration allows:
1. **Synchronizing facial profiles** from the database to the Python API
2. **Receiving detection events** from the Python API when faces are recognized
3. **Managing camera streams** in the Python API
4. **Storing detection events** in the database for analytics

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Next.js App   │◄───────►│   Python API     │◄───────►│  ESP32 Camera│
│                 │         │  (Face Recognition)       │              │
│  - Database     │         │  - User encodings │         │  - Stream    │
│  - API Routes   │         │  - Detection     │         │  - Images    │
│  - Services     │         │  - Recognition   │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
```

## Environment Variables

Add these to your `.env.local`:

```env
# Python Facial Recognition API
NEXT_PUBLIC_FACIAL_API_URL=http://localhost:5001/api

# ESP32 Camera Stream (optional, can be set per camera)
NEXT_PUBLIC_ESP32_STREAM_URL=http://192.168.122.116:81/stream

# Webhook secret for securing webhook endpoint (optional)
FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here
```

## API Endpoints

### Facial Recognition Profiles

#### `GET /api/facial-recognition/profiles`
List all facial profiles.

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `activeOnly` (optional): Only return active profiles

**Response:**
```json
{
  "success": true,
  "profiles": [...],
  "total": 10
}
```

#### `POST /api/facial-recognition/profiles`
Create a new facial profile.

**Request Body:**
```json
{
  "clientId": "client-id",
  "provider": "python-api",
  "providerFaceId": "optional-id",
  "version": "1.0",
  "embedding": [0.1, 0.2, ...],
  "imageUrl": "https://..."
}
```

### Detection Events

#### `GET /api/facial-recognition/detections`
List detection events.

**Query Parameters:**
- `cameraId` (optional): Filter by camera
- `clientId` (optional): Filter by client
- `status` (optional): MATCHED | NEW_FACE | MULTIPLE_MATCHES | UNKNOWN
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

### Sync Profiles

#### `POST /api/facial-recognition/sync`
Sync all active facial profiles to Python API.

**Request Body (optional):**
```json
{
  "clientId": "client-id"  // Optional: sync only this client's profiles
}
```

**Response:**
```json
{
  "success": true,
  "synced": 10,
  "failed": 0,
  "errors": [],
  "message": "Synced 10 profiles, 0 failed"
}
```

### Webhook (Python API → Next.js)

#### `POST /api/facial-recognition/webhook`
Receive detection events from Python API.

**Request Body:**
```json
{
  "result": {
    "timestamp": "2024-01-15T10:30:00Z",
    "name": "John Doe",
    "confidence": 0.95,
    "distance": 0.2,
    "box": {
      "top": 100,
      "right": 200,
      "bottom": 300,
      "left": 50
    }
  },
  "camera_id": "camera-id",
  "camera_stream_url": "http://..."
}
```

**Headers (if webhook secret is set):**
```
Authorization: Bearer your-secret-key-here
```

### Camera Integration

#### `POST /api/facial-recognition/cameras`
Connect a camera to Python API.

**Request Body:**
```json
{
  "cameraId": "camera-id"
}
```

#### `PUT /api/facial-recognition/cameras`
Update camera stream URL in Python API.

**Request Body:**
```json
{
  "cameraId": "camera-id",
  "streamUrl": "http://192.168.1.100:81/stream"
}
```

## Python API Expected Endpoints

Your Python API should implement these endpoints:

### Status & Control
- `GET /api/status` - Get system status
- `POST /api/start` - Start face recognition
- `POST /api/stop` - Stop face recognition
- `GET /api/results` - Get all detection results
- `GET /api/latest` - Get latest detection
- `GET /api/stats` - Get statistics
- `PUT /api/config` - Update configuration (stream_url, threshold, etc.)

### User Management
- `POST /api/users/register` - Register a user with facial encoding
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user
- `GET /api/users` - List all users

### Webhook Configuration
Configure your Python API to send detection events to:
```
POST http://your-nextjs-app.com/api/facial-recognition/webhook
```

With the webhook secret in the Authorization header if configured.

## Usage Flow

### 1. Register a Client with Facial Profile

```typescript
// Create facial profile in database
const profile = await facialRecognitionService.createFacialProfile({
  clientId: 'client-id',
  provider: 'python-api',
  embedding: [/* facial encoding array */],
  imageUrl: 'https://...'
})

// Sync to Python API
await facialRecognitionService.registerUserToPythonAPI({
  name: 'John Doe',
  encoding: profile.embedding,
  imageUrl: profile.imageUrl,
  clientId: profile.clientId
})
```

### 2. Connect Camera to Python API

```typescript
// Update camera stream in Python API
await facialRecognitionService.updateCameraStreamInPythonAPI(
  'camera-id',
  'http://192.168.1.100:81/stream'
)
```

### 3. Receive Detection Events

When the Python API detects a face, it should POST to the webhook endpoint:

```typescript
// Python API sends detection
POST /api/facial-recognition/webhook
{
  "result": {
    "name": "John Doe",
    "confidence": 0.95,
    "timestamp": "..."
  },
  "camera_id": "camera-id"
}
```

The webhook handler will:
1. Find the client by name/email/DNI
2. Create a DetectionEvent in the database
3. Link it to the camera and client (if matched)

### 4. Sync All Profiles

```typescript
// Sync all active profiles to Python API
const result = await facialRecognitionService.syncProfilesToPythonAPI()
// Returns: { success: 10, failed: 0, errors: [] }
```

## Services

### FacialRecognitionService

Located in `src/services/facial-recognition.service.ts`

**Key Methods:**
- `createFacialProfile()` - Create profile in database
- `registerUserToPythonAPI()` - Register user to Python API
- `syncProfilesToPythonAPI()` - Sync all profiles
- `processPythonAPIDetection()` - Process detection from Python API
- `updateCameraStreamInPythonAPI()` - Update camera stream
- `getDetectionEvents()` - Query detection events

### Facial Recognition API Client

Located in `src/lib/facial-recognition-api.ts`

**Key Functions:**
- `getFacialAPIStatus()` - Get Python API status
- `startFacialRecognition()` - Start recognition
- `stopFacialRecognition()` - Stop recognition
- `registerUser()` - Register user
- `getFacialResults()` - Get detection results
- `updateFacialConfig()` - Update configuration

## Database Models

### FacialProfile
Stores facial encodings and metadata for each client.

### DetectionEvent
Stores detection events from cameras, linked to clients and cameras.

## Security

1. **Authentication**: All API endpoints require authentication (except webhook if configured)
2. **Webhook Secret**: Optional secret for webhook endpoint validation
3. **Admin Only**: Sync endpoint requires admin role

## Testing

1. Start your Python API on `http://localhost:5001`
2. Set `NEXT_PUBLIC_FACIAL_API_URL=http://localhost:5001/api`
3. Create a facial profile in the database
4. Call `POST /api/facial-recognition/sync` to sync profiles
5. Configure a camera with stream URL
6. Call `POST /api/facial-recognition/cameras` to connect camera
7. Start recognition via Python API
8. Detection events will be received via webhook

## Troubleshooting

### Python API Connection Issues
- Check `NEXT_PUBLIC_FACIAL_API_URL` is correct
- Verify Python API is running and accessible
- Check CORS settings on Python API

### Webhook Not Receiving Events
- Verify webhook URL is correct in Python API config
- Check webhook secret if configured
- Check network connectivity between Python API and Next.js app

### Profiles Not Syncing
- Ensure profiles have `embedding` field populated
- Check Python API `/api/users/register` endpoint
- Review error messages in sync response


