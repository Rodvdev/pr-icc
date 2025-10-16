# Phase 4: Client Portal API Reference

Complete API documentation for all client-facing endpoints.

---

## Authentication

All endpoints require a valid NextAuth session. Include session cookie in requests.

**Authentication Method:** Session-based (NextAuth)

**Error Responses:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
Status: `401 Unauthorized`

---

## Client Profile

### Get Profile
**Endpoint:** `GET /api/client/profile`

**Description:** Retrieves the current authenticated client's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client-1",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "phone": "+51 987 654 321",
    "address": "Av. Principal 123, San Isidro",
    "city": "Lima",
    "country": "Perú",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "status": "ACTIVE",
    "createdAt": "2024-10-15T00:00:00.000Z"
  }
}
```

### Update Profile
**Endpoint:** `PATCH /api/client/profile`

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez García",
  "phone": "+51 999 888 777",
  "address": "Nueva dirección 456",
  "city": "Lima",
  "country": "Perú"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client-1",
    "firstName": "Juan",
    "lastName": "Pérez García",
    "email": "juan.perez@example.com",
    "phone": "+51 999 888 777",
    "address": "Nueva dirección 456",
    "city": "Lima",
    "country": "Perú",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "status": "ACTIVE",
    "updatedAt": "2024-10-15T10:30:00.000Z"
  }
}
```

---

## Visits

### Get Visit History
**Endpoint:** `GET /api/client/visits`

**Query Parameters:**
- `status` (optional): Filter by visit status (`COMPLETED`, `CANCELLED`, etc.)
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `GET /api/client/visits?status=COMPLETED&limit=10&offset=0`

**Response:**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": "visit-123",
        "date": "2024-10-10",
        "time": "14:30",
        "branch": "Sucursal San Isidro",
        "branchCode": "SI001",
        "module": "Módulo 3",
        "moduleCode": "M003",
        "purpose": "Apertura de cuenta",
        "status": "COMPLETED",
        "duration": "25 min",
        "startedAt": "2024-10-10T14:30:00.000Z",
        "finishedAt": "2024-10-10T14:55:00.000Z"
      }
    ],
    "total": 12,
    "stats": {
      "total": 12,
      "thisMonth": 3,
      "averageDuration": 18,
      "favoriteBranch": "Sucursal San Isidro"
    }
  }
}
```

---

## Statistics

### Get Dashboard Stats
**Endpoint:** `GET /api/client/stats`

**Description:** Returns statistics for the client dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisits": 12,
    "thisMonthVisits": 3,
    "nextAppointment": null,
    "unreadMessages": 2,
    "accountStatus": "ACTIVE",
    "registrationDate": "2024-01-15T00:00:00.000Z",
    "lastVisit": {
      "date": "2024-10-10T14:30:00.000Z",
      "branch": "Sucursal San Isidro",
      "purpose": "Consulta de préstamo"
    }
  }
}
```

---

## Documents

### Get Documents
**Endpoint:** `GET /api/client/documents`

**Description:** Retrieves all documents uploaded by the client.

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc-1",
        "name": "DNI - Anverso",
        "type": "Identificación",
        "uploadDate": "2024-10-01T00:00:00.000Z",
        "size": "2.3 MB",
        "sizeBytes": 2411724,
        "status": "approved",
        "url": "/documents/dni-front.jpg",
        "mimeType": "image/jpeg"
      }
    ],
    "stats": {
      "total": 4,
      "approved": 3,
      "pending": 1,
      "rejected": 0
    }
  }
}
```

### Upload Document
**Endpoint:** `POST /api/client/documents`

**Request:** `multipart/form-data`

**Form Fields:**
- `file`: File to upload (required)
- `type`: Document type (optional): "Identificación", "Comprobante de Domicilio", "Ingreso", etc.

**Constraints:**
- Max file size: 10 MB
- Allowed types: PDF, JPG, PNG

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-new",
    "name": "recibo-luz.pdf",
    "type": "Comprobante de Domicilio",
    "uploadDate": "2024-10-15T10:30:00.000Z",
    "size": "1.2 MB",
    "sizeBytes": 1258291,
    "status": "pending",
    "url": "/documents/recibo-luz.pdf",
    "mimeType": "application/pdf"
  },
  "message": "Documento subido exitosamente"
}
```

**Error Response (file too large):**
```json
{
  "success": false,
  "error": "El archivo es demasiado grande (máx 10MB)"
}
```
Status: `400 Bad Request`

**Error Response (invalid file type):**
```json
{
  "success": false,
  "error": "Tipo de archivo no permitido"
}
```
Status: `400 Bad Request`

---

## Activity

### Get Activity Feed
**Endpoint:** `GET /api/client/activity`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Example:** `GET /api/client/activity?limit=5`

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "visit-123",
        "type": "visit",
        "title": "Visita completada",
        "description": "Sucursal San Isidro - Apertura de cuenta",
        "timestamp": "2024-10-10T14:30:00.000Z",
        "status": "COMPLETED",
        "icon": "CheckCircle"
      },
      {
        "id": "profile-update",
        "type": "profile",
        "title": "Perfil actualizado",
        "description": "Información de contacto",
        "timestamp": "2024-10-01T10:00:00.000Z",
        "status": "completed",
        "icon": "FileText"
      }
    ]
  }
}
```

---

## Notifications

### Get Notifications
**Endpoint:** `GET /api/client/notifications`

**Query Parameters:**
- `unread` (optional): Filter unread notifications (`true`/`false`)

**Example:** `GET /api/client/notifications?unread=true`

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "title": "Nueva funcionalidad disponible",
        "message": "Ahora puedes agendar citas directamente desde el portal",
        "type": "info",
        "read": false,
        "timestamp": "2024-10-15T08:00:00.000Z"
      },
      {
        "id": "notif-2",
        "title": "Documento aprobado",
        "message": "Tu comprobante de domicilio ha sido aprobado",
        "type": "success",
        "read": false,
        "timestamp": "2024-10-14T14:30:00.000Z"
      }
    ],
    "unreadCount": 2
  }
}
```

### Mark Notification as Read
**Endpoint:** `PATCH /api/client/notifications`

**Request Body:**
```json
{
  "id": "notif-1",
  "read": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notificación actualizada"
}
```

---

## Registration

### Submit Registration
**Endpoint:** `POST /api/register`

**Request Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+51 987 654 321",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "address": "Av. Principal 123",
  "city": "Lima",
  "country": "Perú",
  "acceptTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "req-123",
    "status": "PENDING",
    "message": "Solicitud enviada exitosamente"
  }
}
```

**Error Response (validation):**
```json
{
  "success": false,
  "error": "Todos los campos son requeridos"
}
```
Status: `400 Bad Request`

**Error Response (duplicate):**
```json
{
  "success": false,
  "error": "Ya existe una solicitud con este email"
}
```
Status: `409 Conflict`

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message in Spanish"
}
```

### Common HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate)
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding in production:
- API key-based rate limiting
- Per-user rate limits
- IP-based throttling

---

## Security Notes

1. All endpoints require valid NextAuth session
2. CSRF protection enabled via NextAuth
3. Secure cookies (httpOnly, sameSite)
4. File upload validation (type, size)
5. Input sanitization on all endpoints
6. No sensitive data in error messages

---

## Future Enhancements

1. WebSocket support for real-time notifications
2. GraphQL endpoint for flexible queries
3. Batch operations support
4. Advanced filtering and sorting
5. Export functionality (PDF, Excel)
6. Webhook support for external integrations

---

## Testing

### Example cURL Requests

```bash
# Get profile (with session cookie)
curl -X GET http://localhost:3000/api/client/profile \
  -H "Cookie: next-auth.session-token=<token>"

# Update profile
curl -X PATCH http://localhost:3000/api/client/profile \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Juan","lastName":"Pérez García"}'

# Get visits with filter
curl -X GET "http://localhost:3000/api/client/visits?status=COMPLETED&limit=10" \
  -H "Cookie: next-auth.session-token=<token>"

# Upload document
curl -X POST http://localhost:3000/api/client/documents \
  -H "Cookie: next-auth.session-token=<token>" \
  -F "file=@document.pdf" \
  -F "type=Comprobante de Domicilio"
```

---

Last Updated: October 15, 2024  
Version: 1.0.0

