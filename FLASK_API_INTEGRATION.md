# Flask API Integration Guide

This document explains how to integrate the Flask Python API (deployed on EC2) with the Next.js frontend.

**Note:** The Flask API code should be updated on your EC2 server. This document describes what needs to be added/modified.

## Flask API Endpoints

The Flask API provides these endpoints:

### Status & Control
- `GET /api/status` - Get system status
- `POST /api/start` - Start face recognition
- `POST /api/stop` - Stop face recognition
- `GET /api/results` - Get all detection results (with optional `limit` param)
- `GET /api/results/<name>` - Get results filtered by user name
- `GET /api/latest` - Get latest detection
- `GET /api/stats` - Get statistics
- `PUT /api/config` - Update configuration (stream_url, threshold)

### User Registration
- `POST /api/register` - Register a new person (currently returns instructions)

## Required Flask API Updates

To fully integrate with the Next.js frontend, you need to add these features to your Flask API:

### 1. Enhanced User Registration Endpoint

Update `/api/register` to actually register users:

```python
@app.route('/api/register', methods=['POST'])
def register_person():
    """Registrar una nueva persona con encoding facial"""
    global known_encs, labels
    
    data = request.json
    name = data.get('name')
    encoding = data.get('encoding')  # Array de 128 números
    image_url = data.get('image_url')
    client_id = data.get('client_id')
    
    if not name or not encoding:
        return jsonify({"error": "name and encoding are required"}), 400
    
    # Convertir encoding a numpy array
    enc_array = np.array(encoding, dtype=np.float32)
    
    # Cargar encodings existentes
    if Path(ENCODINGS_NPY).exists() and Path(LABELS_JSON).exists():
        known_encs = np.load(ENCODINGS_NPY)
        with open(LABELS_JSON, "r", encoding="utf-8") as f:
            labels = json.load(f)
    else:
        known_encs = np.array([]).reshape(0, 128)
        labels = []
    
    # Agregar nuevo encoding
    known_encs = np.vstack([known_encs, enc_array.reshape(1, -1)])
    labels.append(name)
    
    # Guardar
    np.save(ENCODINGS_NPY, known_encs)
    with open(LABELS_JSON, "w", encoding="utf-8") as f:
        json.dump(labels, f, ensure_ascii=False, indent=2)
    
    return jsonify({
        "success": True,
        "message": f"Usuario {name} registrado exitosamente",
        "total_users": len(labels)
    })
```

### 2. Webhook Support for Detection Events

Add webhook functionality to send detection events to Next.js:

```python
import requests

# Configuración de webhook
WEBHOOK_URL = os.getenv('NEXTJS_WEBHOOK_URL', 'http://localhost:3005/api/facial-recognition/webhook')
WEBHOOK_SECRET = os.getenv('FACIAL_RECOGNITION_WEBHOOK_SECRET', '')

def send_webhook(result, camera_id=None, camera_stream_url=None):
    """Enviar resultado de detección al webhook de Next.js"""
    try:
        payload = {
            "result": result,
            "camera_id": camera_id,
            "camera_stream_url": camera_stream_url or stream_url
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        if WEBHOOK_SECRET:
            headers["Authorization"] = f"Bearer {WEBHOOK_SECRET}"
        
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"✅ Webhook enviado: {result['name']}")
        else:
            print(f"⚠️ Webhook falló: {response.status_code}")
    except Exception as e:
        print(f"❌ Error enviando webhook: {e}")
```

Then update the `recognition_loop()` function to call the webhook:

```python
def recognition_loop():
    # ... existing code ...
    
    for i, (enc, (t, r, b, l)) in enumerate(zip(encs, boxes)):
        name, dist = best_match(enc, known_encs, labels, THRESHOLD)
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "name": name,
            "confidence": round(1 - dist, 2),
            "distance": round(dist, 3),
            "box": {
                "top": int(t / DOWNSCALE),
                "right": int(r / DOWNSCALE),
                "bottom": int(b / DOWNSCALE),
                "left": int(l / DOWNSCALE)
            }
        }
        
        # ... existing code ...
        
        # Enviar webhook a Next.js
        send_webhook(result, camera_id=None, camera_stream_url=stream_url)
```

### 3. Environment Variables for Flask

Add to your Flask app's environment:

```python
# .env or environment variables
NEXTJS_WEBHOOK_URL=http://localhost:3005/api/facial-recognition/webhook
FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here
```

### 4. Install Required Package

```bash
pip install requests
```

## Integration Flow

### 1. Register Users from Next.js

```typescript
// In Next.js
const profile = await facialRecognitionService.createFacialProfile({
  clientId: 'client-id',
  provider: 'python-api',
  embedding: [/* 128 numbers */],
  imageUrl: 'https://...'
})

// Sync to Flask API
await facialRecognitionService.registerUserToPythonAPI({
  name: 'John Doe',
  encoding: profile.embedding as number[],
  imageUrl: profile.imageUrl,
  clientId: profile.clientId
})
```

### 2. Start Recognition

```typescript
// Start recognition via Flask API
await startFacialRecognition()
```

### 3. Receive Detections

When Flask API detects a face:
1. Flask calls `send_webhook()` with the detection result
2. Next.js webhook endpoint receives the detection
3. Next.js finds the client by name/email/DNI
4. Next.js creates a DetectionEvent in the database

### 4. View Results

```typescript
// Get results from Flask API
const results = await getFacialResults()

// Or get from Next.js database
const detections = await facialRecognitionService.getDetectionEvents({
  limit: 100
})
```

## Complete Flask API Update

Here's the complete updated `register_person` function and webhook support:

```python
import requests
import os

# Add at top of file
WEBHOOK_URL = os.getenv('NEXTJS_WEBHOOK_URL', 'http://localhost:3005/api/facial-recognition/webhook')
WEBHOOK_SECRET = os.getenv('FACIAL_RECOGNITION_WEBHOOK_SECRET', '')

def send_webhook(result, camera_id=None, camera_stream_url=None):
    """Enviar resultado de detección al webhook de Next.js"""
    if not WEBHOOK_URL:
        return
    
    try:
        payload = {
            "result": result,
            "camera_id": camera_id,
            "camera_stream_url": camera_stream_url or stream_url
        }
        
        headers = {"Content-Type": "application/json"}
        if WEBHOOK_SECRET:
            headers["Authorization"] = f"Bearer {WEBHOOK_SECRET}"
        
        requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=5)
    except Exception as e:
        print(f"❌ Error webhook: {e}")

@app.route('/api/register', methods=['POST'])
def register_person():
    """Registrar una nueva persona con encoding facial"""
    global known_encs, labels
    
    data = request.json
    name = data.get('name')
    encoding = data.get('encoding')
    
    if not name or not encoding:
        return jsonify({"error": "name and encoding are required"}), 400
    
    try:
        enc_array = np.array(encoding, dtype=np.float32)
        
        if Path(ENCODINGS_NPY).exists() and Path(LABELS_JSON).exists():
            known_encs = np.load(ENCODINGS_NPY)
            with open(LABELS_JSON, "r", encoding="utf-8") as f:
                labels = json.load(f)
        else:
            known_encs = np.array([]).reshape(0, 128)
            labels = []
        
        known_encs = np.vstack([known_encs, enc_array.reshape(1, -1)])
        labels.append(name)
        
        np.save(ENCODINGS_NPY, known_encs)
        with open(LABELS_JSON, "w", encoding="utf-8") as f:
            json.dump(labels, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "success": True,
            "message": f"Usuario {name} registrado",
            "total_users": len(labels)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update recognition_loop to call send_webhook after each detection
```

## Testing the Integration

1. **On EC2 - Update Flask API:**
   - Add the webhook function and updated `/api/register` endpoint
   - Set environment variables
   - Restart the Flask service

2. **In Next.js - Set environment variables:**
   ```env
   # .env.local or production environment
   NEXT_PUBLIC_FACIAL_API_URL=http://your-ec2-ip:5001/api
   # Or if using domain:
   NEXT_PUBLIC_FACIAL_API_URL=https://your-api-domain.com/api
   FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here
   ```

3. **Test the connection:**
   - The Next.js frontend will connect to your EC2 Flask API
   - Flask API will send webhooks to your Next.js deployment

4. **Register a user:**
   ```bash
   curl -X POST http://localhost:5001/api/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "encoding": [0.1, 0.2, ...]  # 128 numbers
     }'
   ```

5. **Start recognition:**
   ```bash
   curl -X POST http://localhost:5001/api/start
   ```

6. **Check webhook:**
   - Flask API will send detections to Next.js webhook
   - Check Next.js database for DetectionEvent records

## Troubleshooting

### Webhook not working
- Check `NEXTJS_WEBHOOK_URL` is correct
- Verify Next.js is running
- Check webhook secret matches
- Review Flask API logs for errors

### User registration fails
- Ensure encoding is array of 128 numbers
- Check file permissions for `encodings.npy` and `labels.json`
- Verify numpy array shape is correct

### Detection events not appearing
- Check Flask API is sending webhooks
- Verify webhook endpoint is accessible
- Check Next.js logs for webhook errors
- Ensure client matching logic works

