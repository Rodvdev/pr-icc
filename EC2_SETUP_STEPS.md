# EC2 Setup Steps for Facial Recognition Integration

This guide provides step-by-step instructions to update your Flask API on EC2 to work with your Next.js frontend at `pr-icc.vercel.app`.

## Prerequisites

- SSH access to your EC2 instance
- Flask API running on EC2
- Access to update environment variables

## Step 1: SSH into Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
# Or whatever user you use
```

## Step 2: Navigate to Your Flask API Directory

```bash
cd /path/to/your/flask-api
# Example: cd ~/facial-recognition-api
```

## Step 3: Update Your Flask API Code

### 3.1 Add Required Imports

Edit your `app.py` file and add these imports at the top (if not already present):

```python
import requests
import os
```

### 3.2 Add Webhook Configuration

Add this after your configuration section (around line 20-30):

```python
# Webhook configuration for Next.js integration
WEBHOOK_URL = os.getenv('NEXTJS_WEBHOOK_URL', '')
WEBHOOK_SECRET = os.getenv('FACIAL_RECOGNITION_WEBHOOK_SECRET', '')
```

### 3.3 Add Webhook Function

Add this function before your routes (around line 50-100):

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

### 3.4 Update `/api/register` Endpoint

Replace your existing `/api/register` route with this:

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

### 3.5 Update `recognition_loop()` Function

Find your `recognition_loop()` function and add the webhook call after creating the result. Look for this section:

```python
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
    # ... existing code ...
```

**Add this line right after `last_recognitions.append(result)`:**
```python
    # ✨ NUEVO: Enviar webhook a Next.js
    send_webhook(result, camera_id=None, camera_stream_url=stream_url)
```

## Step 4: Install Required Package

```bash
pip install requests
# Or if using a virtual environment:
source venv/bin/activate  # or your venv path
pip install requests
```

## Step 5: Set Environment Variables

### Option A: Export in Current Session (Temporary)

```bash
export NEXTJS_WEBHOOK_URL=https://pr-icc.vercel.app/api/facial-recognition/webhook
export FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final
```

### Option B: Add to .env File (Recommended)

```bash
# Create or edit .env file
nano .env
# Or
vim .env
```

Add these lines:
```env
NEXTJS_WEBHOOK_URL=https://pr-icc.vercel.app/api/facial-recognition/webhook
FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final
```

**Important:** Replace `proyecto-final` with a strong, random secret key. You'll use the same key in Next.js.

### Option C: Add to Systemd Service (If Running as Service)

If your Flask API runs as a systemd service:

```bash
sudo nano /etc/systemd/system/facial-recognition-api.service
```

Add these lines in the `[Service]` section:
```ini
Environment="NEXTJS_WEBHOOK_URL=https://pr-icc.vercel.app/api/facial-recognition/webhook"
Environment="FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final"
```

Then reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart facial-recognition-api
```

## Step 6: Update Next.js Environment Variables

Go to your Vercel project settings:

1. Navigate to: https://vercel.com/your-project/settings/environment-variables
2. Add these environment variables:

```
NEXT_PUBLIC_FACIAL_API_URL=http://your-ec2-ip:5001/api
# Or if you have a domain for your EC2:
# NEXT_PUBLIC_FACIAL_API_URL=https://your-api-domain.com/api

FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final
```

**Important:** 
- Use the **same** `FACIAL_RECOGNITION_WEBHOOK_SECRET` value in both EC2 and Vercel
- Replace `your-ec2-ip` with your actual EC2 public IP address
- If your EC2 has a domain name, use that instead

## Step 7: Restart Your Flask API

### If Running Directly:
```bash
# Stop current process (Ctrl+C if running in terminal)
# Or find and kill the process:
ps aux | grep "python app.py"
kill <process-id>

# Start again:
python app.py
```

### If Using systemd:
```bash
sudo systemctl restart facial-recognition-api
```

### If Using supervisor:
```bash
sudo supervisorctl restart facial-recognition-api
```

### If Using PM2:
```bash
pm2 restart app.py
# Or
pm2 restart all
```

## Step 8: Verify the Setup

### 8.1 Test Flask API Registration Endpoint

```bash
curl -X POST http://localhost:5001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "encoding": [0.1, 0.2, 0.3, ...] 
  }'
```

You should get a success response.

### 8.2 Check Flask API Logs

Monitor your Flask API logs to see if webhooks are being sent:

```bash
# If using systemd:
sudo journalctl -u facial-recognition-api -f

# If running directly, check the terminal output
```

### 8.3 Test from Next.js Frontend

1. Go to: https://pr-icc.vercel.app/admin/facial-recognition
2. Click "Sync Profiles" to sync users to Flask API
3. Start recognition from the admin panel
4. Check that detections appear in the database

## Step 9: Configure EC2 Security Group

Make sure your EC2 security group allows:

1. **Inbound:**
   - Port 5001 (or your Flask port) from your IP or 0.0.0.0/0 (if public)
   - Or restrict to specific IPs for security

2. **Outbound:**
   - HTTPS (port 443) to `pr-icc.vercel.app` for webhooks

## Step 10: Update CORS in Flask API

Make sure your Flask API allows requests from your Vercel domain:

```python
CORS(app, origins=[
    "https://pr-icc.vercel.app",
    "https://pr-icc.vercel.app/*"
])
```

## Troubleshooting

### Webhook Not Sending

1. **Check environment variable:**
   ```bash
   echo $NEXTJS_WEBHOOK_URL
   # Should output: https://pr-icc.vercel.app/api/facial-recognition/webhook
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST https://pr-icc.vercel.app/api/facial-recognition/webhook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-secret-key" \
     -d '{
       "result": {
         "timestamp": "2024-01-15T10:30:00",
         "name": "Test",
         "confidence": 0.95,
         "distance": 0.2
       },
       "camera_stream_url": "http://192.168.122.116:81/stream"
     }'
   ```

3. **Check Flask API logs for errors:**
   ```bash
   # Look for webhook error messages
   tail -f /var/log/your-app.log
   ```

### Registration Fails

1. **Check encoding format:**
   - Must be an array of exactly 128 numbers
   - All numbers should be floats

2. **Check file permissions:**
   ```bash
   ls -la encodings.npy labels.json
   # Make sure Flask API user can write to these files
   chmod 644 encodings.npy labels.json
   ```

### Connection Refused

1. **Check Flask API is running:**
   ```bash
   ps aux | grep python
   netstat -tulpn | grep 5001
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   # If needed, allow port 5001:
   sudo ufw allow 5001
   ```

3. **Check security group:**
   - Go to EC2 Console → Security Groups
   - Verify inbound rules allow port 5001

## Quick Reference

### Environment Variables Summary

**On EC2:**
```bash
NEXTJS_WEBHOOK_URL=https://pr-icc.vercel.app/api/facial-recognition/webhook
FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final
```

**On Vercel:**
```
NEXT_PUBLIC_FACIAL_API_URL=http://your-ec2-ip:5001/api
FACIAL_RECOGNITION_WEBHOOK_SECRET=proyecto-final
```

### Key Files to Modify

1. `app.py` - Add webhook function and update `/api/register`
2. `.env` - Add environment variables
3. Vercel project settings - Add environment variables

### Testing Checklist

- [ ] Flask API starts without errors
- [ ] `/api/register` endpoint accepts POST requests
- [ ] Webhook function is called during recognition
- [ ] Next.js can connect to Flask API
- [ ] Detections appear in Next.js database
- [ ] No CORS errors in browser console

## Support

If you encounter issues:

1. Check Flask API logs for errors
2. Check Next.js Vercel logs
3. Verify all environment variables are set correctly
4. Test endpoints individually with curl
5. Check EC2 security group and firewall settings

