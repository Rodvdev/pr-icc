# Facial Recognition Integration Guide

## Overview

This document explains how the Next.js frontend integrates with an external Python API for facial recognition connected to ESP32 devices.

## Architecture

```
ESP32 Device → Python API → Next.js API → Prisma Database
                                    ↓
                              Admin UI / Kiosk UI
```

## Environment Configuration

Create a `.env.local` file in the root directory with the following configuration:

```env
# External Facial Recognition API (Python/ESP32)
EXTERNAL_FACIAL_API_URL="http://localhost:8000"
```

For different environments:

- **Development**: `http://localhost:8000`
- **Production**: `http://your-api-server:8000`
- **ESP32 Network Device**: `http://192.168.1.100:8000`

## Python API Requirements

Your Python API should implement the following endpoints:

### 1. Face Detection - `/detect`

**Method**: `POST`

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "camera_id": "kiosk-001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "status": "matched",
  "client_id": "clm123...",
  "confidence": 0.95,
  "face_id": "face_abc123",
  "embedding": [0.123, 0.456, ...],
  "metadata": {}
}
```

**Status Values**:
- `"matched"` - Face recognized and matched to a known client
- `"new_face"` - New face detected, not in database
- `"unknown"` - Face detected but not recognized
- `"multiple_matches"` - Multiple possible matches found
- `"error"` - Error occurred during processing

### 2. Face Registration - `/register`

**Method**: `POST`

**Request Body**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "client_data": {
    "dni": "12345678",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Response**:
```json
{
  "success": true,
  "face_id": "face_abc123",
  "embedding": [0.123, 0.456, ...]
}
```

### 3. List Faces - `/faces`

**Method**: `GET`

**Response**:
```json
脸庞{
  "faces": [
    {
      "face_id": "face_abc123",
      "client_id": "clm123..."
    }
  ]
}
```

### 4. Delete Face - `/faces/{face_id}`

**Method**: `DELETE`

**Response**:
```json
{
  "success": true
}
```

### 5. Health Check - `/health`

**Method**: `GET`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Frontend Integration

### API Endpoints Created

1. **POST `/api/kiosk/detect`** - Detect faces from camera stream
2. **POST `/api/facial-recognition/register`** - Register new facial profiles
3. **GET `/api/facial-recognition/detections`** - Get detection history
4. **GET `/api/facial-recognition/profiles`** - Get all facial profiles

### Services

**Location**: `src/services/facial-recognition.service.ts`

The `FacialRecognitionService` class handles all communication with the external Python API using axios.

### Database Models

The following Prisma models store facial recognition data:

- **FacialProfile**: Stores facial templates/embeddings for each client
- **DetectionEvent**: Logs all facial detection events from cameras
- **Client**: User/client information linked to facial profiles

### UI Components

#### Kiosk Page (`/kiosk`)
- Captures image from camera stream
- Sends image to detection API
- Displays detection results
- Provides options for registration

#### Admin Page (`/admin/facial-recognition`)
- Displays all facial profiles
- Shows detection event history
- Statistics dashboard
- Client-face associations

## Usage Flow

### 1. Registration Flow

1. Client visits kiosk
2. Captures face image
3. Sends to `/api/facial-recognition/register`
4. External API processes image and creates face profile
5. System creates/updates client in Prisma database
6. Facial profile stored in database

### 2. Detection Flow

1. Client approaches kiosk
2. Camera captures face image
3. Image sent to `/api/kiosk/detect`
4. Next.js API forwards to external Python API
5. Python API performs facial recognition
6. Result stored in Prisma database
7. UI displays recognition result

### 3. Admin Monitoring

1. Admin accesses `/admin/facial-recognition`
2. View all facial profiles
3. Monitor detection events in real-time
4. Track statistics and performance

## Testing

### Test the Integration

1. Start your Python API server
2. Start the Next.js application: `npm run dev`
3. Visit `/kiosk` to test face detection
4. Visit `/admin/facial-recognition` to view results

### Mock Testing

If the Python API is not available, the service will gracefully handle errors and log them.

## Error Handling

The integration includes comprehensive error handling:

- Network timeouts (30 seconds)
- API errors
- Invalid responses
- Database failures

Errors are logged and returned to the frontend with appropriate messages.

## Security Considerations

1. **Image Data**: Images are sent as base64-encoded strings
2. **Authentication**: Admin endpoints require authentication
3. **Validation**: All inputs are validated before processing
4. **Logging**: All detection events are logged for audit

## Troubleshooting

### API Connection Issues

Check the following:
- Is the Python API running?
- Is the URL correct in `.env.local`?
- Are there any firewall issues?
- Check browser console for errors

### Detection Not Working

- Verify camera access permissions
- Check image quality and lighting
- Ensure face is clearly visible
- Review Python API logs

### Database Issues

- Run migrations: `npm run db:migrate`
- Verify DATABASE_URL in `.env.local`
- Check Prisma connection

## Future Enhancements

- Real-time detection streaming
- Multiple camera support
- Face enrollment UI
- Detection analytics dashboard
- Biometric authentication integration

## Support

For issues or questions about the integration, please check:
- Python API documentation
- ESP32 device documentation
- Project README

