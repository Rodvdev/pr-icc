# Implementación: Chatbot y Optimización de Base de Datos

## 📋 Resumen Ejecutivo

Este documento resume la implementación del plan de optimización de base de datos y la integración del chatbot con contexto FAQ/QAPair, incluyendo guardas de seguridad y métricas de evaluación.

---

## 1. ✅ Base de Datos - Optimización de Schema

### 1.1 Revisión y Mejoras del Schema Prisma

**Archivo:** `prisma/schema.prisma`

#### Índices Agregados:

1. **User**
   - `@@index([email])` - Búsquedas rápidas por email
   - `@@index([role, isActive])` - Filtrado por rol y estado

2. **Client**
   - `@@index([dni])` - Búsquedas rápidas por DNI
   - `@@index([email])` - Búsquedas rápidas por email
   - `@@index([status, createdAt])` - Consultas ordenadas por estado y fecha

3. **Branch**
   - `@@index([code])` - Búsquedas rápidas por código
   - `@@index([country, city])` - Búsquedas por ubicación

4. **RegistrationRequest**
   - `@@index([status, createdAt])` - Consultas de solicitudes pendientes ordenadas
   - `@@index([branchId, status])` - Filtrado por sucursal y estado

5. **ChatSession**
   - `@@index([tempVisitorId])` - Búsquedas para visitantes temporales
   - `@@index([startedAt])` - Consultas ordenadas por fecha de inicio

#### Verificación de Claves Foráneas:

Todas las relaciones están correctamente definidas con:
- `onDelete: Cascade` para relaciones dependientes
- `onDelete: SetNull` para relaciones opcionales
- `@@unique` constraints donde corresponde

---

## 2. 📊 Script SQL de Optimización e Integridad

**Archivo:** `prisma/migrations/optimize_indexes.sql`

### Contenido del Script:

1. **Verificación de Integridad Referencial**
   - Listado de todas las claves foráneas existentes
   - Consultas de chequeo para detectar registros huérfanos

2. **Índices Adicionales Optimizados**
   - Índices parciales (WHERE) para queries frecuentes
   - Índices compuestos para consultas multi-campo
   - Índice GIN para búsqueda en arrays (tags de FAQ)

3. **Análisis de Estadísticas**
   - `ANALYZE` en todas las tablas para optimización del query planner

4. **Consultas de Verificación**
   - Detección de detecciones huérfanas
   - Detección de visitas huérfanas
   - Detección de sesiones de chat huérfanas
   - Verificación de claves foráneas inconsistentes

### Cómo Ejecutar:

```bash
# Conectar a PostgreSQL y ejecutar:
psql $DATABASE_URL -f prisma/migrations/optimize_indexes.sql
```

---

## 3. 🤖 Chatbot - Endpoint `/api/chat`

**Archivo:** `src/backend/app.py`

### 3.1 Funcionalidades Implementadas

#### Integración con Contexto (FAQ/QAPair)

1. **Búsqueda de FAQ** (`search_faq_context`)
   - Búsqueda por palabras clave en título y respuesta
   - Filtrado por estado `PUBLISHED`
   - Ordenamiento por relevancia (match en título > match en respuesta)
   - Límite de 3 resultados

2. **Búsqueda de QAPair** (`search_qa_context`)
   - Búsqueda por palabras clave en pregunta y respuesta
   - Filtrado por `isActive = true`
   - Ordenamiento por relevancia
   - Límite de 2 resultados

3. **Generación de Respuesta** (`generate_bot_response`)
   - Prioriza FAQs sobre QAPairs
   - Retorna respuesta con metadata (source, confidence, relatedTopics)
   - Respuesta genérica si no hay contexto encontrado

#### Guardas de Seguridad

1. **Validación de Entrada**
   - Mensaje no vacío
   - Longitud mínima (1 carácter)
   - Longitud máxima (2000 caracteres)

2. **Sanitización**
   - Remoción de caracteres de control
   - Normalización de espacios múltiples
   - Truncado a longitud máxima

3. **Rate Limiting**
   - 30 requests por minuto por cliente
   - Ventana deslizante de 60 segundos
   - Identificación por `clientId` o `sessionId`

4. **Manejo de Errores**
   - Try-catch en todas las operaciones
   - Logging de errores sin exponer detalles sensibles
   - Respuestas de error apropiadas

### 3.2 Endpoints Implementados

#### `POST /api/chat`
Mensaje principal del chatbot.

**Request:**
```json
{
  "message": "¿Cómo hago un retiro?",
  "sessionId": "session_123",
  "clientId": "client_456"
}
```

**Response:**
```json
{
  "response": "Para hacer un retiro...",
  "metadata": {
    "source": "FAQ",
    "sourceId": "faq_123",
    "confidence": "high",
    "relatedTopics": ["retiro", "transacciones"]
  },
  "metrics": {
    "latencyMs": 45.23
  }
}
```

#### `GET /api/chat/metrics`
Obtener métricas de evaluación del chatbot.

**Response:**
```json
{
  "totalRequests": 150,
  "successfulRequests": 142,
  "failedRequests": 8,
  "successRate": 94.67,
  "averageLatencyMs": 52.3,
  "latencyP50": 48.1,
  "latencyP95": 95.2,
  "latencyP99": 120.5,
  "errorTypes": {
    "rate_limit_exceeded": 5,
    "empty_message": 3
  },
  "requestsPerSession": {
    "session_123": 12,
    "session_456": 8
  },
  "lastReset": "2024-01-01T00:00:00"
}
```

#### `POST /api/chat/session`
Crear nueva sesión de chat.

**Request:**
```json
{
  "clientId": "client_123",
  "tempVisitorId": "visitor_456"
}
```

**Response:**
```json
{
  "sessionId": "session_1704067200000",
  "clientId": "client_123",
  "tempVisitorId": "visitor_456",
  "startedAt": "2024-01-01T12:00:00"
}
```

---

## 4. 📈 Sistema de Métricas

### 4.1 Métricas Capturadas

1. **Métricas de Rendimiento**
   - Latencia por request (ms)
   - Latencia promedio
   - Percentiles P50, P95, P99

2. **Métricas de Éxito**
   - Total de requests
   - Requests exitosos
   - Requests fallidos
   - Tasa de éxito (%)

3. **Métricas de Uso**
   - Requests por sesión
   - Tipos de errores y frecuencia

### 4.2 Evidencia de Evaluación

Las métricas proporcionan:
- **Latencia:** Tiempo de respuesta promedio y percentiles
- **Tasa de Éxito:** Porcentaje de requests que completan exitosamente
- **Casos de Uso:** Análisis de tipos de errores y patrones de uso

### 4.3 Almacenamiento

- Métricas en memoria (variable global `chat_metrics`)
- Persistencia opcional a base de datos (si hay conexión)
- Historial de últimos 1000 tiempos de respuesta

---

## 5. 🔧 Configuración Requerida

### 5.1 Dependencias Python

```bash
pip install psycopg2-binary  # Para conexión a PostgreSQL
```

### 5.2 Variables de Entorno

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 5.3 Base de Datos

El endpoint `/api/chat` requiere:
- Tabla `FAQ` con columnas: `id`, `title`, `answer`, `tags`, `status`
- Tabla `QAPair` con columnas: `id`, `question`, `answer`, `is_active`
- Tabla `ChatSession` con columnas: `id`, `client_id`, `temp_visitor_id`, `started_at`, `ended_at`
- Tabla `ChatMessage` con columnas: `id`, `session_id`, `actor`, `content`, `metadata`, `created_at`

---

## 6. 🧪 Pruebas Recomendadas

### 6.1 Pruebas del Chatbot

1. **Prueba de Búsqueda de FAQ:**
```bash
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "retiro", "sessionId": "test_1"}'
```

2. **Prueba de Rate Limiting:**
```bash
# Enviar 31 requests rápidas y verificar que la 31ª retorne 429
for i in {1..31}; do
  curl -X POST http://localhost:5001/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"test $i\", \"sessionId\": \"test_ratelimit\"}"
done
```

3. **Prueba de Métricas:**
```bash
curl http://localhost:5001/api/chat/metrics
```

### 6.2 Pruebas de Base de Datos

1. **Ejecutar script de optimización:**
```bash
psql $DATABASE_URL -f prisma/migrations/optimize_indexes.sql
```

2. **Verificar índices creados:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

---

## 7. 📝 Notas Adicionales

### 7.1 Manejo de Errores de BD

El endpoint `/api/chat` funciona de manera degradada si no hay conexión a PostgreSQL:
- Las búsquedas de FAQ/QAPair retornan vacío
- El guardado de mensajes se omite
- El chatbot retorna respuesta genérica

### 7.2 Rate Limiting

El rate limiting es en memoria y se reinicia al reiniciar el servidor. Para producción, considerar:
- Redis para rate limiting distribuido
- Configuración por cliente/rol
- Rate limiting diferenciado

### 7.3 Mejoras Futuras

1. **Búsqueda Semántica:** Integrar embeddings vectoriales para búsqueda semántica
2. **Cache:** Cachear FAQs frecuentes en Redis
3. **Análisis de Sentimiento:** Detectar urgencia en mensajes
4. **Transferencia a Agente:** Detectar cuándo transferir a agente humano
5. **Aprendizaje:** Mejorar respuestas basadas en feedback

---

## 8. ✅ Checklist de Implementación

- [x] Revisión y optimización de schema.prisma
- [x] Índices agregados en modelos clave
- [x] Script SQL de índices adicionales
- [x] Script SQL de verificación de integridad
- [x] Endpoint `/api/chat` implementado
- [x] Integración con FAQ desde BD
- [x] Integración con QAPair desde BD
- [x] Guardas de seguridad (validación, sanitización, rate limiting)
- [x] Sistema de métricas implementado
- [x] Endpoint `/api/chat/metrics` para evaluación
- [x] Endpoint `/api/chat/session` para gestión de sesiones
- [x] Persistencia de mensajes en BD
- [x] Documentación completa

---

**Fecha de Implementación:** 2024-10-30
**Autor:** Rodrigo VdeV

