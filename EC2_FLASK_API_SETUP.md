# EC2 Flask API Setup Instructions

This document provides instructions for updating your Flask API on EC2 to work with the Next.js frontend.

## Prerequisites

- Flask API running on EC2
- Access to EC2 instance (SSH)
- Next.js deployment URL

## Step 1: Update Flask API Code

On your EC2 instance, update your `app.py` file with the following changes:

### 1. Add Required Imports

Add at the top of your `app.py`:

```python
import requests
import os
```

### 2. Add Webhook Configuration

Add after your configuration section:

```python
# Webhook configuration for Next.js integration
WEBHOOK_URL = os.getenv('NEXTJS_WEBHOOK_URL', '')
WEBHOOK_SECRET = os.getenv('FACIAL_RECOGNITION_WEBHOOK_SECRET', '')
```

### 3. Add Webhook Function

Add this function before your routes:

```python
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
        
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"✅ Webhook enviado: {result['name']}")
        else:
            print(f"⚠️ Webhook falló: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error enviando webhook: {e}")
```

### 4. Update `/api/register` Endpoint

Replace your existing `/api/register` route with:

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
    
    try:
        # Convertir encoding a numpy array
        enc_array = np.array(encoding, dtype=np.float32)
        
        # Validar que sea un array de 128 dimensiones
        if enc_array.shape != (128,):
            return jsonify({
                "error": f"Encoding must be 128-dimensional, got {enc_array.shape}"
            }), 400
        
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
        
        print(f"✅ Usuario {name} registrado exitosamente")
        
        return jsonify({
            "success": True,
            "message": f"Usuario {name} registrado exitosamente",
            "total_users": len(labels)
        })
    except Exception as e:
        print(f"❌ Error registrando usuario: {e}")
        return jsonify({"error": str(e)}), 500
```

### 5. Update `recognition_loop()` Function

In your `recognition_loop()` function, add the webhook call after creating the result:

```python
def recognition_loop():
    """Loop principal de reconocimiento"""
    global recognition_active, last_recognitions, current_frame
    
    known_encs, labels = load_encodings()
    if known_encs is None:
        print("❌ No se encontraron encodings. Registra personas primero.")
        return
    
    print(f"✅ Encodings cargados: {len(labels)} personas")
    
    cap = cv2.VideoCapture(stream_url)
    if not cap.isOpened():
        print(f"❌ No se pudo abrir el stream: {stream_url}")
        return
    
    print(f"✅ Conectado al stream: {stream_url}")
    
    frame_count = 0
    
    while recognition_active:
        ok, frame = cap.read()
        if not ok:
            time.sleep(1)
            continue
        
        frame_count += 1
        current_frame = frame.copy()
        
        # Procesar cada N frames para acelerar
        if frame_count % 3 != 0:
            continue
        
        # Redimensionar para acelerar
        small = cv2.resize(frame, (0, 0), fx=DOWNSCALE, fy=DOWNSCALE)
        rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        
        # Detectar y encodear
        boxes = face_recognition.face_locations(rgb_small, model="hog")
        encs = face_recognition.face_encodings(rgb_small, boxes)
        
        # Procesar detecciones
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
            
            # Guardar en lista de resultados
            last_recognitions.append(result)
            if len(last_recognitions) > 50:
                last_recognitions.pop(0)
            
            print(f"👤 Reconocido: {name} (confianza: {result['confidence']:.2f})")
            
            # ✨ NUEVO: Enviar webhook a Next.js
            send_webhook(result, camera_id=None, camera_stream_url=stream_url)
            
            # Guardar frame si es reconocido
            if name != "Desconocido":
                filename = f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}.jpg"
                filepath = os.path.join(FRAMES_DIR, filename)
                cv2.imwrite(filepath, frame)
                
                # Guardar resultado en JSON
                result_file = os.path.join(RESULTS_DIR, f"result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
                with open(result_file, 'w') as f:
                    json.dump(result, f, indent=2)
    
    cap.release()
    print("🛑 Reconocimiento detenido")
```

## Step 2: Install Required Package

On your EC2 instance, install the `requests` library:

```bash
pip install requests
# Or if using a virtual environment:
source venv/bin/activate  # or your venv path
pip install requests
```

## Step 3: Set Environment Variables

On your EC2 instance, set the environment variables:

```bash
# Option 1: Export in current session
export NEXTJS_WEBHOOK_URL=https://your-nextjs-domain.com/api/facial-recognition/webhook
export FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here

# Option 2: Add to .env file (if using python-dotenv)
echo "NEXTJS_WEBHOOK_URL=https://your-nextjs-domain.com/api/facial-recognition/webhook" >> .env
echo "FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here" >> .env

# Option 3: Add to systemd service file (if running as service)
# Edit your service file and add:
# Environment="NEXTJS_WEBHOOK_URL=https://your-nextjs-domain.com/api/facial-recognition/webhook"
# Environment="FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here"
```

**Important:** Replace `https://your-nextjs-domain.com` with your actual Next.js deployment URL.

## Step 4: Update Next.js Environment Variables

In your Next.js deployment (Vercel, AWS, etc.), set:

```env
NEXT_PUBLIC_FACIAL_API_URL=http://your-ec2-ip:5001/api
# Or if using a domain:
NEXT_PUBLIC_FACIAL_API_URL=https://your-api-domain.com/api

FACIAL_RECOGNITION_WEBHOOK_SECRET=your-secret-key-here
```

**Important:** 
- Use the same `FACIAL_RECOGNITION_WEBHOOK_SECRET` in both Flask API and Next.js
- Update `NEXT_PUBLIC_FACIAL_API_URL` with your EC2 Flask API URL
- If your EC2 has a domain, use HTTPS

## Step 5: Restart Flask API

After making changes, restart your Flask API:

```bash
# If running directly:
pkill -f "python app.py"
python app.py

# If using systemd:
sudo systemctl restart facial-recognition-api

# If using supervisor:
sudo supervisorctl restart facial-recognition-api

# If using PM2:
pm2 restart app.py
```

## Step 6: Test the Integration

1. **Test Flask API registration:**
   ```bash
   curl -X POST http://your-ec2-ip:5001/api/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "encoding": [0.1, 0.2, ...]  # 128 numbers
     }'
   ```

2. **Test from Next.js:**
   - Go to the facial recognition admin page
   - Click "Sync Profiles" to sync users to Flask API
   - Start recognition from the admin panel
   - Check that detections appear in the Next.js database

3. **Check webhook logs:**
   - Monitor Flask API logs for webhook messages
   - Check Next.js logs for incoming webhook requests

## Security Considerations

1. **CORS:** Make sure your Flask API allows requests from your Next.js domain:
   ```python
   CORS(app, origins=["https://your-nextjs-domain.com"])
   ```

2. **HTTPS:** Use HTTPS for both Flask API and Next.js in production

3. **Webhook Secret:** Use a strong, random secret key for webhook authentication

4. **Firewall:** Ensure EC2 security group allows:
   - Inbound: Port 5001 (or your Flask port) from Next.js server
   - Outbound: HTTPS to Next.js webhook URL

## Troubleshooting

### Webhook not sending
- Check `NEXTJS_WEBHOOK_URL` is set correctly
- Verify Next.js webhook endpoint is accessible
- Check EC2 security group allows outbound HTTPS
- Review Flask API logs for errors

### Registration fails
- Verify encoding is 128-dimensional array
- Check file permissions for `encodings.npy` and `labels.json`
- Ensure numpy array conversion works correctly

### CORS errors
- Update CORS configuration in Flask API
- Add your Next.js domain to allowed origins

### Connection refused
- Check Flask API is running
- Verify port is correct
- Check EC2 security group allows inbound connections
- Ensure firewall rules are correct

