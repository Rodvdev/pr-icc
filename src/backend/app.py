# app.py - API Flask para reconocimiento facial
from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import json
import time
import threading
import numpy as np
import face_recognition
from pathlib import Path
from datetime import datetime, timedelta
import os
import base64
import re
from collections import defaultdict
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configuración
ENCODINGS_NPY = "encodings.npy"
LABELS_JSON = "labels.json"
THRESHOLD = 0.6
DOWNSCALE = 0.5
FRAMES_DIR = "captured_frames"
RESULTS_DIR = "recognition_results"
REG_DIR = "capturas_registro"

# Estado global
recognition_active = False
stream_url = os.getenv("STREAM_URL", "0")  # 0 = webcam local, o cambiar por URL de ESP32
last_recognitions = []
current_frame = None
recognition_thread = None

# Estado global para chatbot
chat_metrics = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "total_latency_ms": 0,
    "request_times": [],
    "requests_per_session": defaultdict(int),
    "error_types": defaultdict(int),
    "last_reset": datetime.now()
}

# Rate limiting para chatbot
chat_rate_limits = defaultdict(list)  # {client_id: [timestamps]}
RATE_LIMIT_MAX_REQUESTS = 30  # máx 30 requests
RATE_LIMIT_WINDOW_SECONDS = 60  # por minuto
MAX_MESSAGE_LENGTH = 2000  # caracteres
MIN_MESSAGE_LENGTH = 1

# Crear directorios
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(REG_DIR, exist_ok=True)

def load_encodings():
    """Cargar encodings faciales desde archivos"""
    if not Path(ENCODINGS_NPY).exists() or not Path(LABELS_JSON).exists():
        return None, None
    
    encs = np.load(ENCODINGS_NPY)
    with open(LABELS_JSON, "r", encoding="utf-8") as f:
        labels = json.load(f)
    
    if encs.dtype != np.float32:
        encs = encs.astype(np.float32)
    
    return encs, labels

def load_latest_meta_by_name(name: str):
    """Buscar el último archivo de metadata para un nombre dado y retornar sus datos.
    Asume que los archivos se guardan como <dni>_<timestamp>.json con key name en el contenido.
    """
    try:
        metas = []
        for fn in os.listdir(REG_DIR):
            if fn.endswith('.json'):
                fp = os.path.join(REG_DIR, fn)
                with open(fp, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('name') == name:
                        metas.append((fp, data))
        if not metas:
            return None
        # Tomar el más reciente por fecha de archivo
        metas.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)
        return metas[0][1]
    except Exception:
        return None

def best_match(unknown_enc: np.ndarray, known_encs: np.ndarray, labels: list, thr=THRESHOLD):
    """Encontrar la mejor coincidencia"""
    dists = np.linalg.norm(known_encs - unknown_enc.astype(np.float32), axis=1)
    idx = int(np.argmin(dists))
    name = labels[idx]
    dist = float(dists[idx])
    if dist <= thr:
        return name, dist
    return "Desconocido", dist

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
        
        # Procesar cada AVA Frame para acelerar
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
            if len(last_recognitions) > 50:  # Mantener solo últimos 50
                last_recognitions.pop(0)
            
            print(f"👤 Reconocido: {name} (confianza: {result['confidence']:.2f})")
            
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

@app.route('/')
def index():
    """Página principal con HTML"""
    html = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Reconocimiento Facial</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            h1 {
                color: white;
                text-align: center;
                margin-bottom: 10px;
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
            
            .subtitle {
                color: rgba(255,255,255,0.9);
                text-align: center;
                margin-bottom: 30px;
                font-size: 1.1em;
            }
            
            .dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                transition: transform 0.3s ease;
            }
            
            .card:hover {
                transform: translateY(-5px);
            }
            
            .card h2 {
                color: #667eea;
                margin-bottom: 15px;
                font-size: 1.5em;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .card h2::before {
                content: '🎯';
                font-size: 1.2em;
            }
            
            .status-badge {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 0.9em;
                margin: 10px 0;
            }
            
            .status-active {
                background: #4CAF50;
                color: white;
            }
            
            .status-inactive {
                background: #f44336;
                color: white;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .stat-item {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 10px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
                display: block;
            }
            
            .stat-label {
                color: #666;
                font-size: 0.9em;
                margin-top: 5px;
            }
            
            .controls {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
                margin-bottom: 30px;
            }
            
            button {
                flex: 1;
                min-width: 200px;
                padding: 15px 30px;
                border: none;
                border-radius: 10px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                color: white;
            }
            
            .btn-start {
                background: linear-gradient(135deg, #4CAF50, #45a049);
            }
            
            .btn-start:hover {
                background: linear-gradient(135deg, #45a049, #3d8b40);
                transform: scale(1.05);
            }
            
            .btn-stop {
                background: linear-gradient(135deg, #f44336, #da190b);
            }
            
            .btn-stop:hover {
                background: linear-gradient(135deg, #da190b, #c62828);
                transform: scale(1.05);
            }
            
            .btn-refresh {
                background: linear-gradient(135deg, #2196F3, #0b7dda);
            }
            
            .btn-refresh:hover {
                background: linear-gradient(135deg, #0b7dda, #1976D2);
                transform: scale(1.05);
            }
            
            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .endpoints {
                background: white;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .endpoints h2 {
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            
            .endpoint-item {
                padding: 15px;
                background: #f9f9f9;
                border-left: 4px solid #667eea;
                margin-bottom: 10px;
                border-radius: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .method {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 5px;
                font-weight: bold;
                font-size: 0.85em;
                margin-right: 10px;
            }
            
            .method-get { background: #2196F3; color: white; }
            .method-post { background: #4CAF50; color: white; }
            .method-put { background: #FF9800; color: white; }
            
            .loading {
                text-align: center;
                color: white;
                font-size: 1.2em;
                padding: 20px;
            }
            
            .error {
                background: #ffebee;
                color: #c62828;
                padding: 15px;
                border-radius: 10px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎭 Face Recognition API</h1>
            <p class="subtitle">Sistema de Reconocimiento Facial con ESP32-CAM</p>
            
            <div class="controls">
                <button class="btn-start" id="btnStart">▶️ Iniciar Reconocimiento</button>
                <button class="btn-stop" id="btnStop" disabled>⏹️ Detener Reconocimiento</button>
                <button class="btn-refresh" id="btnRefresh">🔄 Actualizar Datos</button>
            </div>
            
            <div class="loading" id="loading">Cargando datos...</div>
            
            <div class="dashboard" id="dashboard" style="display: none;">
                <div class="card">
                    <h2>Estado del Sistema</h2>
                    <div id="statusContent">Cargando...</div>
                </div>
                
                <div class="card">
                    <h2>📊 Estadísticas</h2>
                    <div class="stats-grid" id="statsContent">
                        <div class="stat-item">
                            <span class="stat-value" id="totalDetections">0</span>
                            <span class="stat-label">Detecciones Totales</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="uniquePersons">0</span>
                            <span class="stat-label">Personas Únicas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="unknownCount">0</span>
                            <span class="stat-label">Desconocidos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value" id="totalResults">0</span>
                            <span class="stat-label">Total Resultados</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoints">
                <h2>📡 Endpoints de la API</h2>
                <div class="endpoint-item">
                    <span><span class="method method-get">GET</span> <strong>/api/status</strong> - Estado actual</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-post">POST</span> <strong>/api/start</strong> - Iniciar reconocimiento</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-post">POST</span> <strong>/api/stop</strong> - Detener reconocimiento</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-get">GET</span> <strong>/api/results</strong> - Últimos resultados</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-get">GET</span> <strong>/api/results/&lt;name&gt;</strong> - Resultados por usuario</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-get">GET</span> <strong>/api/latest</strong> - Último resultado</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-get">GET</span> <strong>/api/stats</strong> - Estadísticas</span>
                </div>
                <div class="endpoint-item">
                    <span><span class="method method-put">PUT</span> <strong>/api/config</strong> - Cambiar configuración</span>
                </div>
            </div>
        </div>
        
        <script>
            const API_URL = window.location.origin + '/api';
            
            async function fetchData() {
                try {
                    const [statusRes, statsRes] = await Promise.all([
                        fetch(API_URL + '/status'),
                        fetch(API_URL + '/stats')
                    ]);
                    
                    const status = await statusRes.json();
                    const stats = await statsRes.json();
                    
                    // Mostrar dashboard
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'grid';
                    
                    // Actualizar estado
                    const statusHtml = `
                        <div class="status-badge ${status.active ? 'status-active' : 'status-inactive'}">
                            ${status.active ? '🔴 ACTIVO' : '⚪ INACTIVO'}
                        </div>
                        <p><strong>Stream:</strong> ${status.stream_url}</p>
                        <p><strong>Encodings:</strong> ${status.encodings_loaded ? '✅ Cargados' : '❌ No cargados'}</p>
                        <p><strong>Total Resultados:</strong> ${status.total_results}</p>
                    `;
                    document.getElementById('statusContent').innerHTML = statusHtml;
                    
                    // Actualizar estadísticas
                    document.getElementById('totalDetections').textContent = stats.total_detections || 0;
                    document.getElementById('uniquePersons').textContent = stats.unique_persons || 0;
                    document.getElementById('unknownCount').textContent = stats.unknown_count || 0;
                    document.getElementById('totalResults').textContent = status.total_results || 0;
                    
                    // Actualizar botones
                    document.getElementById('btnStart').disabled = status.active;
                    document.getElementById('btnStop').disabled = !status.active;
                    
                } catch (error) {
                    document.getElementById('loading').innerHTML = '<div class="error">❌ Error al cargar datos: ' + error.message + '</div>';
                }
            }
            
            document.getElementById('btnStart').addEventListener('click', async () => {
                try {
                    const response = await fetch(API_URL + '/start', { method: 'POST' });
                    const data = await response.json();
                    alert('✅ ' + data.message);
                    fetchData();
                } catch (error) {
                    alert('❌ Error: ' + error.message);
                }
            });
            
            document.getElementById('btnStop').addEventListener('click', async () => {
                try {
                    const response = await fetch(API_URL + '/stop', { method: 'POST' });
                    const data = await response.json();
                    alert('🛑 ' + data.message);
                    fetchData();
                } catch (error) {
                    alert('❌ Error: ' + error.message);
                }
            });
            
            document.getElementById('btnRefresh').addEventListener('click', () => {
                fetchData();
            });
            
            // Cargar datos iniciales
            fetchData();
            
            // Actualizar cada 5 segundos
            setInterval(fetchData, 5000);
        </script>
    </body>
    </html>
    """
    return html

@app.route('/api/start', methods=['POST'])
def start_recognition():
    """Iniciar reconocimiento facial"""
    global recognition_active, recognition_thread
    
    if recognition_active:
        return jsonify({"error": "El reconocimiento ya está activo"}), 400
    
    recognition_active = True
    recognition_thread = threading.Thread(target=recognition_loop, daemon=True)
    recognition_thread.start()
    
    return jsonify({
        "status": "started",
        "message": "Reconocimiento facial iniciado",
        "stream_url": stream_url
    })

@app.route('/api/stop', methods=['POST'])
def stop_recognition():
    """Detener reconocimiento facial"""
    global recognition_active
    
    recognition_active = False
    return jsonify({
        "status": "stopped",
        "message": "Reconocimiento facial detenido"
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Obtener estado actual"""
    return jsonify({
        "active": recognition_active,
        "stream_url": stream_url,
        "total_results": len(last_recognitions),
        "encodings_loaded": Path(ENCODINGS_NPY).exists()
    })

@app.route('/api/results', methods=['GET'])
def get_results():
    """Obtener últimos resultados"""
    limit = request.args.get('limit', 20, type=int)
    return jsonify({
        "results": last_recognitions[-limit:],
        "total": len(last_recognitions)
    })

@app.route('/api/results/<name>', methods=['GET'])
def get_results_by_name(name):
    """Obtener resultados filtrados por nombre de usuario"""
    limit = request.args.get('limit', 20, type=int)
    
    # Filtrar resultados por nombre
    filtered_results = [r for r in last_recognitions if r.get("name", "").lower() == name.lower()]
    
    # Aplicar límite
    limited_results = filtered_results[-limit:] if len(filtered_results) > limit else filtered_results
    
    return jsonify({
        "user": name,
        "results": limited_results,
        "total": len(filtered_results),
        "returned": len(limited_results)
    })

@app.route('/api/latest', methods=['GET'])
def get_latest():
    """Obtener último resultado"""
    if not last_recognitions:
        return jsonify({"error": "No hay resultados disponibles"}), 404
    
    return jsonify(last_recognitions[-1])

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtener estadísticas de reconocimiento"""
    if not last_recognitions:
        return jsonify({
            "total_detections": 0,
            "recognized": {},
            "unknown_count": 0
        })
    
    recognized = {}
    unknown_count = 0
    
    for result in last_recognitions:
        if result["name"] == "Desconocido":
            unknown_count += 1
        else:
            if result["name"] not in recognized:
                recognized[result["name"]] = 0
            recognized[result["name"]] += 1
    
    return jsonify({
        "total_detections": len(last_recognitions),
        "recognized": recognized,
        "unknown_count": unknown_count,
        "unique_persons": len(recognized)
    })

@app.route('/api/config', methods=['PUT'])
def update_config():
    """Actualizar configuración"""
    global stream_url, THRESHOLD
    
    data = request.json
    if 'stream_url' in data:
        if recognition_active:
            return jsonify({"error": "Detén el reconocimiento antes de cambiar la URL"}), 400
        stream_url = data['stream_url']
        os.environ['STREAM_URL'] = stream_url
    
    if 'threshold' in data:
        THRESHOLD = data['threshold']
    
    return jsonify({
        "stream_url": stream_url,
        "threshold": THRESHOLD
    })

@app.route('/api/register', methods=['POST'])
def register_person():
    """Registrar una nueva persona"""
    global ENCODINGS_NPY, LABELS_JSON

    try:
        data = request.get_json(silent=True) or {}

        name = (data.get("name") or "").strip()
        dni = (data.get("dni") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        password = (data.get("password") or "").strip()  # No se almacena en texto plano
        photo_data = data.get("photoData")

        # Validaciones mínimas
        if not name:
            return jsonify({"error": "El nombre es obligatorio"}), 400
        if not dni:
            return jsonify({"error": "El DNI es obligatorio"}), 400
        if not email:
            return jsonify({"error": "El email es obligatorio"}), 400
        if not phone:
            return jsonify({"error": "El teléfono es obligatorio"}), 400
        if not password or len(password) < 6:
            return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
        if not photo_data:
            return jsonify({"error": "La foto (photoData) es obligatoria"}), 400

        # Decodificar imagen base64 (data URL o base64 pura)
        try:
            if "," in photo_data:
                photo_data = photo_data.split(",", 1)[1]
            img_bytes = base64.b64decode(photo_data)
        except Exception:
            return jsonify({"error": "No se pudo decodificar la imagen base64"}), 400

        # Convertir bytes a imagen OpenCV
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"error": "Imagen inválida"}), 400

        # Extraer encoding facial (exigir exactamente un rostro)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        boxes = face_recognition.face_locations(rgb, model="hog")
        encs = face_recognition.face_encodings(rgb, boxes)

        if len(encs) == 0:
            return jsonify({"error": "No se detectó ningún rostro en la foto"}), 400
        if len(encs) > 1:
            return jsonify({"error": "Se detectaron múltiples rostros. Usa una foto con una sola persona"}), 400

        new_enc = encs[0].astype(np.float32)

        # Cargar existentes y agregar nuevo encoding/label
        existing_encs, labels = load_encodings()
        if existing_encs is None:
            updated_encs = new_enc.reshape(1, -1)
            labels = [name]
        else:
            updated_encs = np.vstack([existing_encs.astype(np.float32), new_enc.reshape(1, -1)])
            labels.append(name)

        # Persistir en disco
        np.save(ENCODINGS_NPY, updated_encs.astype(np.float32))
        with open(LABELS_JSON, "w", encoding="utf-8") as f:
            json.dump(labels, f, ensure_ascii=False, indent=2)

        # Guardar foto de registro con metadatos mínimos
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{dni}_{timestamp}.jpg"
        filepath = os.path.join(REG_DIR, filename)
        cv2.imwrite(filepath, frame)

        # Opcional: almacenar metadata ligera por registro
        meta = {
            "name": name,
            "dni": dni,
            "email": email,
            "phone": phone,
            "registered_at": datetime.now().isoformat(),
            "photo_file": os.path.join(REG_DIR, filename)
        }
        meta_file = os.path.join(REG_DIR, f"{dni}_{timestamp}.json")
        with open(meta_file, "w", encoding="utf-8") as mf:
            json.dump(meta, mf, ensure_ascii=False, indent=2)

        return jsonify({
            "status": "created",
            "message": "Usuario registrado y encoding guardado",
            "user": {"name": name, "dni": dni, "email": email, "phone": phone},
            "encodings_total": int(updated_encs.shape[0])
        }), 201

    except Exception as e:
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500

@app.route('/api/kiosk/detect', methods=['POST'])
def kiosk_detect():
    """Detectar rostro a partir de una imagen base64 y retornar estado simple para el kiosko."""
    try:
        data = request.get_json(silent=True) or {}
        image_data = data.get('imageData')
        if not image_data:
            return jsonify({"message": "imageData requerido"}), 400

        # Cargar encodings existentes
        known_encs, labels = load_encodings()
        if known_encs is None or labels is None:
            return jsonify({
                "status": "error",
                "message": "No hay encodings disponibles. Registra usuarios primero."
            }), 503

        # Decodificar data URL/base64
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)

        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({"status": "error", "message": "Imagen inválida"}), 400

        # Extraer encodings del frame (tomar el primer rostro)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        boxes = face_recognition.face_locations(rgb, model="hog")
        encs = face_recognition.face_encodings(rgb, boxes)

        if not encs:
            return jsonify({
                "status": "unknown",
                "message": "No se detectó ningún rostro"
            }), 200

        unknown = encs[0]
        name, dist = best_match(unknown, known_encs, labels, THRESHOLD)
        confidence = max(0.0, min(1.0, 1 - float(dist)))

        if name != "Desconocido":
            meta = load_latest_meta_by_name(name) or {}
            return jsonify({
                "status": "recognized",
                "clientName": name,
                "clientId": meta.get("dni"),
                "confidence": round(confidence, 2),
                "message": "Cliente reconocido"
            })
        else:
            return jsonify({
                "status": "unknown",
                "message": "No se encontró coincidencia",
                "confidence": round(confidence, 2)
            })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/kiosk/client/<client_id>', methods=['GET'])
def kiosk_client(client_id):
    """Devolver datos básicos del cliente por id (usar DNI como id)."""
    try:
        # Buscar el meta más reciente con ese DNI
        metas = []
        for fn in os.listdir(REG_DIR):
            if fn.endswith('.json') and fn.startswith(f"{client_id}_"):
                fp = os.path.join(REG_DIR, fn)
                with open(fp, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    metas.append((fp, data))
        if not metas:
            return jsonify({"message": "Cliente no encontrado"}), 404
        metas.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)
        data = metas[0][1]

        resp = {
            "id": data.get("dni"),
            "name": data.get("name"),
            "email": data.get("email"),
            "lastVisit": None,
            "pendingDocuments": 0,
            "upcomingAppointments": 0,
        }
        return jsonify(resp)
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/api/kiosk/visit', methods=['POST'])
def kiosk_visit():
    """Crear una visita simple y devolver un id sintético."""
    try:
        data = request.get_json(silent=True) or {}
        client_id = data.get('clientId')
        purpose = data.get('purpose')
        if not client_id or not purpose:
            return jsonify({"message": "clientId y purpose son requeridos"}), 400
        visit_id = f"v_{int(time.time())}"
        return jsonify({"visitId": visit_id, "clientId": client_id, "purpose": purpose})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/api/auth/client/login', methods=['POST'])
def client_login():
    """Autenticación de clientes por DNI y contraseña."""
    try:
        data = request.get_json(silent=True) or {}
        dni = (data.get('dni') or "").strip()
        password = data.get('password') or ""
        
        if not dni or not password:
            return jsonify({"message": "DNI y contraseña son requeridos"}), 400
        
        # Buscar metadata del cliente por DNI
        metas = []
        for fn in os.listdir(REG_DIR):
            if fn.endswith('.json') and fn.startswith(f"{dni}_"):
                fp = os.path.join(REG_DIR, fn)
                with open(fp, 'r', encoding='utf-8') as f:
                    data_meta = json.load(f)
                    metas.append((fp, data_meta))
        
        if not metas:
            return jsonify({"message": "Credenciales inválidas"}), 401
        
        # Tomar el más reciente
        metas.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)
        client_data = metas[0][1]
        
        # Validación simple de contraseña (en producción usar hash)
        # Por ahora, asumimos que la contraseña es "client123" o se valida de otra forma
        # TODO: Implementar hashing de contraseñas
        stored_password = "client123"  # Placeholder
        
        if password != stored_password:
            return jsonify({"message": "Credenciales inválidas"}), 401
        
        return jsonify({
            "client": {
                "id": client_data.get("dni"),
                "name": client_data.get("name"),
                "email": client_data.get("email"),
                "status": "ACTIVE"
            },
            "message": "Inicio de sesión exitoso"
        })
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/api/auth/client/reset-password', methods=['POST'])
def client_reset_password():
    """Solicitar reset de contraseña por email."""
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or "").strip()
        
        if not email:
            return jsonify({"message": "Email es requerido"}), 400
        
        # Buscar si existe un cliente con ese email
        found = False
        for fn in os.listdir(REG_DIR):
            if fn.endswith('.json'):
                fp = os.path.join(REG_DIR, fn)
                with open(fp, 'r', encoding='utf-8') as f:
                    client_data = json.load(f)
                    if client_data.get('email') == email:
                        found = True
                        break
        
        # Por seguridad, siempre retornar éxito (no revelar si el email existe)
        return jsonify({
            "message": "Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña"
        })
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/api/admin/encodings', methods=['GET'])
def admin_encodings():
    """Listar todos los usuarios registrados con sus encodings."""
    try:
        _, labels = load_encodings()
        if labels is None:
            return jsonify({"encodings": [], "total": 0})
        
        # Obtener metadata de cada usuario
        users = []
        unique_names = list(set(labels))
        for name in unique_names:
            meta = load_latest_meta_by_name(name)
            if meta:
                users.append({
                    "name": meta.get("name"),
                    "dni": meta.get("dni"),
                    "email": meta.get("email"),
                    "phone": meta.get("phone"),
                    "registeredAt": meta.get("registered_at"),
                    "photoFile": meta.get("photo_file")
                })
        
        return jsonify({
            "encodings": users,
            "total": len(users),
            "encodingCount": len(labels)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/clients/<dni>', methods=['DELETE'])
def admin_delete_client(dni):
    """Eliminar un cliente y su encoding facial."""
    try:
        # Buscar y eliminar archivos de metadata
        deleted = []
        for fn in os.listdir(REG_DIR):
            if fn.startswith(f"{dni}_"):
                fp = os.path.join(REG_DIR, fn)
                os.remove(fp)
                deleted.append(fn)
        
        if not deleted:
            return jsonify({"message": "Cliente no encontrado"}), 404
        
        # Eliminar del encoding y labels
        known_encs, labels = load_encodings()
        if known_encs is not None and labels is not None:
            # Buscar el nombre asociado al DNI
            meta = None
            for fn in os.listdir(REG_DIR):
                if fn.endswith('.json') and fn.startswith(f"{dni}_"):
                    fp = os.path.join(REG_DIR, fn)
                    with open(fp, 'r', encoding='utf-8') as f:
                        meta = json.load(f)
                        break
            
            if meta:
                name = meta.get('name')
                # Eliminar todas las ocurrencias del nombre
                updated_labels = [l for l in labels if l != name]
                if len(updated_labels) < len(labels):
                    # Reconstruir encodings sin ese usuario
                    indices_to_keep = [i for i, l in enumerate(labels) if l != name]
                    updated_encs = known_encs[indices_to_keep]
                    np.save(ENCODINGS_NPY, updated_encs.astype(np.float32))
                    with open(LABELS_JSON, 'w', encoding='utf-8') as f:
                        json.dump(updated_labels, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            "message": "Cliente eliminado correctamente",
            "deletedFiles": deleted
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# CHATBOT ENDPOINT CON INTEGRACIÓN FAQ/QAPAIR
# ============================================

def get_db_connection():
    """Obtener conexión a PostgreSQL usando variable de entorno DATABASE_URL"""
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return None
        conn = psycopg2.connect(database_url)
        return conn
    except ImportError:
        print("⚠️ psycopg2 no está instalado. Instalar con: pip install psycopg2-binary")
        return None
    except Exception as e:
        print(f"❌ Error conectando a BD: {str(e)}")
        return None

def sanitize_message(message: str) -> str:
    """Sanitizar mensaje de usuario: remover caracteres peligrosos"""
    # Remover caracteres de control y limitar longitud
    sanitized = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', message)
    sanitized = sanitized[:MAX_MESSAGE_LENGTH]
    # Remover múltiples espacios
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    return sanitized

def check_rate_limit(client_id: str):
    """Verificar rate limiting por cliente. Retorna (puede_proceder, mensaje_error)"""
    now = time.time()
    # Limpiar timestamps fuera de la ventana
    chat_rate_limits[client_id] = [
        ts for ts in chat_rate_limits[client_id]
        if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]
    
    if len(chat_rate_limits[client_id]) >= RATE_LIMIT_MAX_REQUESTS:
        return False, "Límite de solicitudes excedido. Intenta más tarde."
    
    chat_rate_limits[client_id].append(now)
    return True, ""

def search_faq_context(query: str, limit: int = 3) -> list:
    """Buscar FAQs relevantes en la base de datos"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            # Búsqueda simple por palabras clave en título y respuesta
            search_terms = query.lower().split()[:5]  # Máximo 5 términos
            conditions = []
            params = []
            
            for term in search_terms:
                conditions.append("(LOWER(title) LIKE %s OR LOWER(answer) LIKE %s)")
                params.extend([f"%{term}%", f"%{term}%"])
            
            sql = f"""
                SELECT id, title, answer, tags, status
                FROM "FAQ"
                WHERE status = 'PUBLISHED'
                AND ({' OR '.join(conditions)})
                ORDER BY 
                    CASE 
                        WHEN LOWER(title) LIKE %s THEN 1
                        ELSE 2
                    END,
                    CASE 
                        WHEN LOWER(answer) LIKE %s THEN 1
                        ELSE 2
                    END
                LIMIT %s
            """
            params.extend([f"%{search_terms[0]}%", f"%{search_terms[0]}%", limit])
            cursor.execute(sql, params)
            results = cursor.fetchall()
            
            faqs = []
            for row in results:
                faqs.append({
                    "id": row[0],
                    "title": row[1],
                    "answer": row[2],
                    "tags": row[3] if row[3] else [],
                    "status": row[4]
                })
            return faqs
    except Exception as e:
        print(f"❌ Error buscando FAQ: {str(e)}")
        return []
    finally:
        conn.close()

def search_qa_context(query: str, limit: int = 2) -> list:
    """Buscar QAPairs relevantes en la base de datos"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            search_terms = query.lower().split()[:5]
            conditions = []
            params = []
            
            for term in search_terms:
                conditions.append("(LOWER(question) LIKE %s OR LOWER(answer) LIKE %s)")
                params.extend([f"%{term}%", f"%{term}%"])
            
            sql = f"""
                SELECT id, question, answer, is_active
                FROM "QAPair"
                WHERE is_active = true
                AND ({' OR '.join(conditions)})
                ORDER BY 
                    CASE 
                        WHEN LOWER(question) LIKE %s THEN 1
                        ELSE 2
                    END
                LIMIT %s
            """
            params.extend([f"%{search_terms[0]}%", limit])
            cursor.execute(sql, params)
            results = cursor.fetchall()
            
            qas = []
            for row in results:
                qas.append({
                    "id": row[0],
                    "question": row[1],
                    "answer": row[2],
                    "isActive": row[3]
                })
            return qas
    except Exception as e:
        print(f"❌ Error buscando QAPair: {str(e)}")
        return []
    finally:
        conn.close()

def generate_bot_response(user_message: str, faq_context: list, qa_context: list) -> dict:
    """Generar respuesta del bot basada en contexto de FAQ/QAPair"""
    # Si hay FAQs o QAs relevantes, usar la primera respuesta más relevante
    if faq_context:
        best_match = faq_context[0]
        return {
            "message": best_match["answer"],
            "source": "FAQ",
            "sourceId": best_match["id"],
            "confidence": "high",
            "relatedTopics": best_match.get("tags", [])
        }
    
    if qa_context:
        best_match = qa_context[0]
        return {
            "message": best_match["answer"],
            "source": "QAPair",
            "sourceId": best_match["id"],
            "confidence": "medium",
            "relatedTopics": []
        }
    
    # Respuesta genérica si no hay contexto
    return {
        "message": "No encontré información específica sobre tu consulta. Por favor, contacta con un agente para más detalles.",
        "source": "generic",
        "sourceId": None,
        "confidence": "low",
        "relatedTopics": []
    }

def record_metrics(latency_ms: float, success: bool, error_type: str = None):
    """Registrar métricas de la solicitud"""
    chat_metrics["total_requests"] += 1
    chat_metrics["total_latency_ms"] += latency_ms
    chat_metrics["request_times"].append(latency_ms)
    
    # Mantener solo últimos 1000 tiempos
    if len(chat_metrics["request_times"]) > 1000:
        chat_metrics["request_times"] = chat_metrics["request_times"][-1000:]
    
    if success:
        chat_metrics["successful_requests"] += 1
    else:
        chat_metrics["failed_requests"] += 1
        if error_type:
            chat_metrics["error_types"][error_type] += 1

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Endpoint de chatbot con integración de FAQ/QAPair y guardas de seguridad.
    Evidencia de evaluación: métricas de latencia y tasa de éxito.
    """
    start_time = time.time()
    error_type = None
    
    try:
        # 1. Validación de entrada
        data = request.get_json(silent=True) or {}
        message = data.get('message', '').strip()
        session_id = data.get('sessionId')
        client_id = data.get('clientId') or session_id or 'anonymous'
        
        # Validar mensaje
        if not message:
            error_type = "empty_message"
            record_metrics((time.time() - start_time) * 1000, False, error_type)
            return jsonify({"error": "El mensaje no puede estar vacío"}), 400
        
        if len(message) < MIN_MESSAGE_LENGTH:
            error_type = "message_too_short"
            record_metrics((time.time() - start_time) * 1000, False, error_type)
            return jsonify({"error": f"El mensaje debe tener al menos {MIN_MESSAGE_LENGTH} caracteres"}), 400
        
        if len(message) > MAX_MESSAGE_LENGTH:
            error_type = "message_too_long"
            record_metrics((time.time() - start_time) * 1000, False, error_type)
            return jsonify({"error": f"El mensaje no puede exceder {MAX_MESSAGE_LENGTH} caracteres"}), 400
        
        # 2. Sanitización
        sanitized_message = sanitize_message(message)
        if not sanitized_message:
            error_type = "sanitization_failed"
            record_metrics((time.time() - start_time) * 1000, False, error_type)
            return jsonify({"error": "El mensaje contiene caracteres inválidos"}), 400
        
        # 3. Rate limiting
        can_proceed, rate_limit_msg = check_rate_limit(client_id)
        if not can_proceed:
            error_type = "rate_limit_exceeded"
            record_metrics((time.time() - start_time) * 1000, False, error_type)
            return jsonify({"error": rate_limit_msg}), 429
        
        # 4. Búsqueda de contexto (FAQ y QAPair)
        faq_context = search_faq_context(sanitized_message, limit=3)
        qa_context = search_qa_context(sanitized_message, limit=2)
        
        # 5. Generar respuesta
        bot_response = generate_bot_response(sanitized_message, faq_context, qa_context)
        
        # 6. Registrar métricas de éxito
        latency_ms = (time.time() - start_time) * 1000
        record_metrics(latency_ms, True)
        chat_metrics["requests_per_session"][session_id or client_id] += 1
        
        # 7. Guardar mensaje en BD (si hay conexión)
        conn = get_db_connection()
        if conn and session_id:
            try:
                with conn.cursor() as cursor:
                    # Verificar si existe la sesión
                    cursor.execute('SELECT id FROM "ChatSession" WHERE id = %s', (session_id,))
                    if not cursor.fetchone():
                        # Crear sesión si no existe
                        cursor.execute(
                            'INSERT INTO "ChatSession" (id, client_id, started_at) VALUES (%s, %s, %s)',
                            (session_id, client_id if client_id != 'anonymous' else None, datetime.now())
                        )
                    
                    # Guardar mensaje del usuario
                    cursor.execute(
                        'INSERT INTO "ChatMessage" (id, session_id, actor, content, created_at) VALUES (%s, %s, %s, %s, %s)',
                        (f"msg_{int(time.time() * 1000)}", session_id, 'CLIENT', sanitized_message, datetime.now())
                    )
                    
                    # Guardar respuesta del bot
                    cursor.execute(
                        'INSERT INTO "ChatMessage" (id, session_id, actor, content, metadata, created_at) VALUES (%s, %s, %s, %s, %s, %s)',
                        (
                            f"msg_{int(time.time() * 1000) + 1}",
                            session_id,
                            'BOT',
                            bot_response["message"],
                            json.dumps({
                                "source": bot_response["source"],
                                "sourceId": bot_response["sourceId"],
                                "confidence": bot_response["confidence"]
                            }),
                            datetime.now()
                        )
                    )
                    conn.commit()
            except Exception as e:
                print(f"⚠️ Error guardando mensaje en BD: {str(e)}")
                conn.rollback()
            finally:
                conn.close()
        
        return jsonify({
            "response": bot_response["message"],
            "metadata": {
                "source": bot_response["source"],
                "sourceId": bot_response["sourceId"],
                "confidence": bot_response["confidence"],
                "relatedTopics": bot_response["relatedTopics"]
            },
            "metrics": {
                "latencyMs": round(latency_ms, 2)
            }
        })
        
    except Exception as e:
        error_type = "internal_error"
        latency_ms = (time.time() - start_time) * 1000
        record_metrics(latency_ms, False, error_type)
        print(f"❌ Error en /api/chat: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route('/api/chat/metrics', methods=['GET'])
def chat_metrics_endpoint():
    """Obtener métricas del chatbot"""
    try:
        total = chat_metrics["total_requests"]
        successful = chat_metrics["successful_requests"]
        failed = chat_metrics["failed_requests"]
        
        avg_latency = 0
        if chat_metrics["request_times"]:
            avg_latency = sum(chat_metrics["request_times"]) / len(chat_metrics["request_times"])
        
        success_rate = (successful / total * 100) if total > 0 else 0
        
        # Calcular percentiles de latencia
        latencies = sorted(chat_metrics["request_times"])
        p50 = latencies[len(latencies) // 2] if latencies else 0
        p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
        p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
        
        return jsonify({
            "totalRequests": total,
            "successfulRequests": successful,
            "failedRequests": failed,
            "successRate": round(success_rate, 2),
            "averageLatencyMs": round(avg_latency, 2),
            "latencyP50": round(p50, 2),
            "latencyP95": round(p95, 2),
            "latencyP99": round(p99, 2),
            "errorTypes": dict(chat_metrics["error_types"]),
            "requestsPerSession": dict(chat_metrics["requests_per_session"]),
            "lastReset": chat_metrics["last_reset"].isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/session', methods=['POST'])
def create_chat_session():
    """Crear nueva sesión de chat"""
    try:
        data = request.get_json(silent=True) or {}
        client_id = data.get('clientId')
        temp_visitor_id = data.get('tempVisitorId')
        
        if not client_id and not temp_visitor_id:
            return jsonify({"error": "clientId o tempVisitorId requerido"}), 400
        
        session_id = f"session_{int(time.time() * 1000)}"
        
        # Guardar en BD si hay conexión
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(
                        'INSERT INTO "ChatSession" (id, client_id, temp_visitor_id, started_at) VALUES (%s, %s, %s, %s)',
                        (session_id, client_id, temp_visitor_id, datetime.now())
                    )
                    conn.commit()
            except Exception as e:
                print(f"⚠️ Error creando sesión en BD: {str(e)}")
                conn.rollback()
            finally:
                conn.close()
        
        return jsonify({
            "sessionId": session_id,
            "clientId": client_id,
            "tempVisitorId": temp_visitor_id,
            "startedAt": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def add_seed_results():
    """Agregar 5 resultados de prueba al inicio"""
    global last_recognitions
    
    # Obtener usuarios únicos de labels.json
    if Path(LABELS_JSON).exists():
        with open(LABELS_JSON, 'r', encoding='utf-8') as f:
            all_labels = json.load(f)
        unique_users = list(set(all_labels))
    else:
        unique_users = ["sharon", "taylor"]
    
    # Crear 5 resultados de prueba con usuarios existentes
    base_time = datetime.now()
    seed_results = []
    
    for i in range(5):
        # Alternar entre los usuarios disponibles
        user = unique_users[i % len(unique_users)]
        confidence = round(0.75 + (i * 0.04), 2)  # Variar confianza entre 0.75 y 0.91
        
        result = {
            "timestamp": (base_time - timedelta(seconds=(5-i)*30)).isoformat(),
            "name": user,
            "confidence": confidence,
            "distance": round(1 - confidence, 3),
            "box": {
                "top": 100 + i * 20,
                "right": 200 + i * 15,
                "bottom": 300 + i * 20,
                "left": 150 + i * 15
            }
        }
        seed_results.append(result)
    
    last_recognitions.extend(seed_results)
    print(f"🌱 {len(seed_results)} resultados de prueba agregados")

if __name__ == '__main__':
    print("🚀 Iniciando API de Reconocimiento Facial")
    print("📡 Stream URL:", stream_url)
    print("📝 Cargando encodings...")
    
    if Path(ENCODINGS_NPY).exists():
        encs, labels = load_encodings()
        print(f"✅ {len(labels)} encodings cargados")
        # Agregar resultados de prueba basados en los usuarios registrados
        add_seed_results()
    else:
        print("⚠️ No se encontraron encodings. Registra personas primero con register_auto.py")
    
    app.run(host='0.0.0.0', port=5001, debug=False)

