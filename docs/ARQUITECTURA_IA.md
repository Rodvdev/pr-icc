# Arquitectura de Inteligencia Artificial

## Descripción General

El sistema Banking Agent ID utiliza dos componentes principales de IA/ML:

1. **Reconocimiento Facial**: Identificación automática de clientes mediante análisis de rostros
2. **Chatbot Inteligente**: Sistema de asistencia conversacional con base de conocimiento

## Arquitectura de Reconocimiento Facial

### Componentes del Sistema

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  ESP32 Camera│─────►│  Flask API   │─────►│  Next.js API │
│  (Hardware)  │ HTTP │  (Python)    │ Webhook│  (Backend)  │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  PostgreSQL  │
                      │  (Storage)   │
                      └──────────────┘
```

### Pipeline de Procesamiento

#### 1. Captura de Video

**Dispositivo**: ESP32 Camera Module
- Resolución: Configurable (típicamente 640x480 o 320x240)
- Formato: MJPEG stream HTTP
- FPS: 10-30 frames por segundo
- Protocolo: HTTP streaming en puerto 81

**Código de ejemplo ESP32**:
```cpp
// Stream HTTP desde ESP32
httpd_config_t config = HTTPD_DEFAULT_CONFIG();
config.server_port = 81;
httpd_handle_t stream_httpd = NULL;
httpd_start(&stream_httpd, &config);
```

#### 2. Procesamiento en Flask API

**Tecnología**: Python + OpenCV + face_recognition

**Librerías Clave**:
- `face_recognition`: Detección y encoding facial (basada en dlib)
- `opencv-python`: Procesamiento de video
- `numpy`: Operaciones matemáticas

**Flujo de Procesamiento**:

```python
# 1. Captura de frame desde stream
cap = cv2.VideoCapture(stream_url)
ret, frame = cap.read()

# 2. Redimensionamiento para acelerar
small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

# 3. Detección de rostros
face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")

# 4. Encoding de rostros detectados
face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

# 5. Comparación con encodings conocidos
for face_encoding in face_encodings:
    matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
    distances = face_recognition.face_distance(known_encodings, face_encoding)
    best_match_index = np.argmin(distances)
    
    if matches[best_match_index]:
        name = known_names[best_match_index]
        confidence = 1 - distances[best_match_index]
```

#### 3. Modelo de Encoding Facial

**Algoritmo**: HOG (Histogram of Oriented Gradients) + CNN

**Características**:
- **Dimensionalidad**: 128 números de punto flotante
- **Robustez**: Invariante a iluminación, expresión, pose ligera
- **Precisión**: ~99.38% en Labeled Faces in the Wild

**Encoding Vector**:
```python
encoding = [
    0.123456, -0.789012, 0.345678, ...,  # 128 números
]
```

**Almacenamiento**:
- **PostgreSQL**: Campo JSON en tabla `FacialProfile`
- **Flask API**: Archivo `encodings.npy` (numpy array) y `labels.json`

#### 4. Comparación y Matching

**Algoritmo**: Distancia euclidiana entre vectores

```python
def compare_faces(known_encoding, face_encoding, threshold=0.6):
    """
    Compara dos encodings usando distancia euclidiana
    
    Args:
        known_encoding: Encoding conocido (128-dim)
        face_encoding: Encoding detectado (128-dim)
        threshold: Umbral de distancia (0.6 = 60% similar)
    
    Returns:
        (match: bool, distance: float)
    """
    distance = np.linalg.norm(known_encoding - face_encoding)
    match = distance <= threshold
    confidence = 1 - min(distance, 1.0)
    return match, distance, confidence
```

**Umbral de Confianza**:
- `distance < 0.4`: Muy alta confianza (>90%)
- `distance < 0.6`: Alta confianza (80-90%)
- `distance >= 0.6`: No match o baja confianza

#### 5. Sincronización de Perfiles

**Proceso de Sincronización**:

1. **Creación en Next.js**: Cliente registrado con imagen facial
2. **Generación de Encoding**: Next.js genera encoding (o lo recibe del frontend)
3. **Almacenamiento en DB**: Guarda en `FacialProfile` (PostgreSQL)
4. **Sincronización a Flask API**: POST a `/api/register` con encoding
5. **Almacenamiento en Flask**: Guarda en `encodings.npy` y `labels.json`

**Endpoint de Sincronización**:
```typescript
// Next.js API Route
POST /api/facial-recognition/sync

// Sincroniza todos los perfiles activos
const result = await facialRecognitionService.syncProfilesToPythonAPI()
```

#### 6. Webhook de Detecciones

Cuando Flask API detecta un rostro, envía webhook a Next.js:

```python
# Flask API
def send_webhook(result, camera_id, camera_stream_url):
    payload = {
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
        "camera_id": camera_id,
        "camera_stream_url": camera_stream_url
    }
    
    requests.post(
        NEXTJS_WEBHOOK_URL,
        json=payload,
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"}
    )
```

**Next.js Webhook Handler**:
```typescript
// POST /api/facial-recognition/webhook
export async function POST(req: NextRequest) {
    const { result, camera_id } = await req.json()
    
    // Buscar cliente por nombre
    const client = await findClientByName(result.name)
    
    // Crear evento de detección
    await facialRecognitionService.createDetectionEvent({
        cameraId: camera_id,
        clientId: client?.id,
        status: client ? 'MATCHED' : 'UNKNOWN',
        confidence: result.confidence,
        metadata: result
    })
    
    return NextResponse.json({ success: true })
}
```

### Optimizaciones de Rendimiento

1. **Downscaling**: Redimensionar frames antes de procesar (0.25x)
2. **Frame Skipping**: Procesar cada N frames (ej: cada 3 frames)
3. **HOG vs CNN**: HOG más rápido, CNN más preciso (opcional)
4. **Caching**: Mantener encodings en memoria
5. **Paralelización**: Procesar múltiples rostros en paralelo

### Limitaciones y Consideraciones

1. **Iluminación**: Requiere buena iluminación para mejor precisión
2. **Ángulo**: Funciona mejor con rostros frontales
3. **Oclusión**: Gafas, barbas pueden afectar precisión
4. **Escalabilidad**: Comparación O(n) con todos los encodings
5. **Privacidad**: Cumplimiento con GDPR/LOPD

## Arquitectura del Chatbot

### Componentes del Sistema

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │─────►│  Next.js API │─────►│  PostgreSQL  │
│   (React)    │      │  /api/chat   │      │  (FAQs/QA)   │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Chatbot     │
                      │  Service     │
                      └──────────────┘
```

### Pipeline de Procesamiento

#### 1. Recepción de Consulta

**Endpoint**: `POST /api/chat`

**Input**:
```typescript
{
  message: string
  sessionId?: string
  clientId?: string
}
```

**Validaciones**:
- Sanitización de input
- Rate limiting (10 requests/min)
- Longitud máxima (1000 caracteres)
- CSRF protection

#### 2. Recuperación de Contexto

**Búsqueda en Base de Conocimiento**:

```typescript
// Buscar FAQs relevantes
const faqResults = await faqSearch(query, [], 3)

// Buscar QA pairs relevantes
const qaResults = await qaSearch(query, 3)

// Contexto relevante
const context = {
  faqs: faqResults.items,
  qaPairs: qaResults.items
}
```

**Algoritmo de Búsqueda** (Fase actual: Básico):
- Búsqueda por palabras clave en título/respuesta
- Filtrado por tags
- Ordenamiento por fecha de creación

**Futuro: Búsqueda Semántica**:
- Embeddings con modelos de lenguaje
- Similaridad coseno entre consulta y documentos
- Reranking con modelos de relevancia

#### 3. Generación de Respuesta

**Enfoque Rule-based**:

```typescript
async generateResponse(query: string, context: RelevantContext): Promise<ChatResponse> {
  // Priorizar FAQs con alta relevancia
  if (context.faqs.length > 0 && context.faqs[0].relevance > 0.6) {
    return {
      response: context.faqs[0].answer,
      intent: 'faq',
      confidence: context.faqs[0].relevance,
      sources: [`FAQ: ${context.faqs[0].title}`]
    }
  }
  
  // Fallback a QA pairs
  else if (context.qaPairs.length > 0 && context.qaPairs[0].relevance > 0.6) {
    return {
      response: context.qaPairs[0].answer,
      intent: 'qa',
      confidence: context.qaPairs[0].relevance,
      sources: [`QA: ${context.qaPairs[0].question}`]
    }
  }
  
  // Respuesta por defecto
  else {
    return {
      response: getDefaultResponse(query),
      intent: 'default',
      confidence: 0.3,
      sources: []
    }
  }
}
```

**Respuestas por Defecto**:
- Detección de intenciones básicas (saludo, despedida, ayuda)
- Respuestas predefinidas
- Sugerencia de reformular consulta

#### 4. Enriquecimiento con Datos del Cliente

Cuando el cliente está autenticado, se incluyen datos relevantes:

```typescript
// Obtener datos del cliente
const clientData = await getClientDataForAI(clientId)

// Formatear para prompt
const clientContext = formatClientDataForPrompt(clientData)

// Incluir en respuesta si es relevante
if (shouldIncludeClientData(query, intent)) {
  response = personalizeResponse(response, clientContext)
}
```

**Datos Incluidos**:
- Nombre del cliente
- Estado de cuenta
- Visitas recientes
- Citas programadas
- Historial de transacciones

#### 5. Registro y Métricas

**Almacenamiento**:
```typescript
// Guardar mensajes
await prisma.chatMessage.create({
  data: {
    sessionId,
    actor: 'CLIENT',
    content: query
  }
})

await prisma.chatMessage.create({
  data: {
    sessionId,
    actor: 'BOT',
    content: response.response,
    intent: response.intent,
    metadata: {
      confidence: response.confidence,
      sources: response.sources
    }
  }
})

// Registrar métricas
await prisma.chatMetric.create({
  data: {
    sessionId,
    clientId,
    latency: Date.now() - startTime,
    success: true,
    intent: response.intent,
    usedContext: context.faqs.length + context.qaPairs.length > 0,
    contextItems: context.faqs.length + context.qaPairs.length
  }
})
```

### Base de Conocimiento

#### Estructura de FAQs

```typescript
model FAQ {
  id        String    @id
  title     String
  answer    String
  tags      String[]  // ["retiro", "pagos", "cuentas"]
  status    FAQStatus // DRAFT | PUBLISHED | ARCHIVED
  createdAt DateTime
  updatedAt DateTime
}
```

#### Estructura de QA Pairs

```typescript
model QAPair {
  id       String  @id
  question String
  answer   String
  metadata Json?
  isActive Boolean
  createdAt DateTime
  updatedAt DateTime
}
```

### Herramientas MCP (Model Context Protocol)

El sistema implementa herramientas MCP para integración futura con LLMs:

1. **faq.search**: Buscar en FAQs
2. **qa.search**: Buscar en QA pairs
3. **client.lookup**: Buscar cliente por DNI/email/teléfono
4. **visit.createOrUpdate**: Crear/actualizar visita
5. **metrics.getKpis**: Obtener KPIs
6. **chat.handOff**: Transferir a agente humano
7. **dataset.refresh**: Refrescar base de conocimiento

### Futuras Mejoras

#### Integración con LLM

**Opción 1: OpenAI GPT**:
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: query }
  ],
  context: relevantContext
})
```

**Opción 2: Claude (Anthropic)**:
- Mejor para razonamiento
- Contexto más largo
- Más costoso

**Opción 3: Modelo Local (Ollama)**:
- Sin costos de API
- Privacidad completa
- Menor rendimiento

#### Embeddings Vectoriales

1. Generar embeddings de FAQs/QA con modelo de embeddings
2. Almacenar en vector database (Pinecone, Weaviate, pgvector)
3. Búsqueda por similaridad semántica
4. Mejor matching de intenciones

#### Fine-tuning

1. Recopilar conversaciones reales
2. Annotar intenciones y entidades
3. Fine-tune modelo para dominio bancario
4. Mejor comprensión de contexto específico

## Métricas y Monitoreo

### Métricas de Reconocimiento Facial

- **Total de detecciones**: Conteo por período
- **Tasa de match**: Porcentaje de reconocimientos exitosos
- **Confianza promedio**: Nivel de confianza en matches
- **Tiempo de procesamiento**: Latencia por detección
- **Estado de cámaras**: Online/Offline

### Métricas del Chatbot

- **Latencia promedio**: Tiempo de respuesta
- **Tasa de éxito**: Porcentaje de respuestas útiles
- **Uso de contexto**: Porcentaje que usa FAQs/QA
- **Intenciones detectadas**: Distribución de intenciones
- **Transferencias a humano**: Número de hand-offs

## Referencias

- [Librería face_recognition](https://github.com/ageitgey/face_recognition)
- [Documentación de Arquitectura General](./ARQUITECTURA.md)
- [Documentación de Integración Hardware](./HARDWARE_INTEGRATION.md)

