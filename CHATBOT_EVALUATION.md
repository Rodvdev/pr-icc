# Evaluación del Chatbot - Sistema de Métricas

## Resumen Ejecutivo

Este documento describe el sistema de evaluación y métricas implementado para el chatbot integrado en `/api/chat`, incluyendo métricas de rendimiento, calidad y uso.

## Métricas Implementadas

### 1. Métricas de Rendimiento (Latencia)

**Medición:**
- Latencia total de cada petición (tiempo de respuesta completo)
- Tiempo medido desde el inicio de la petición hasta la respuesta final
- Incluye:
  - Búsqueda de contexto (FAQs/QA pairs)
  - Generación de respuesta
  - Guardado en base de datos
  - Registro de métricas

**Ubicación:**
- Código: `src/app/api/chat/route.ts`
- Líneas 32 (startTime), 152 (latency calculation)
- Métricas registradas en: `chatbotService.recordMetrics()`

**Ejemplo de Salida:**
```json
{
  "success": true,
  "response": "...",
  "metadata": {
    "latency": "245ms",
    ...
  }
}
```

**Valores Esperados:**
- Latencia promedio: < 500ms (con contexto local)
- Latencia p95: < 1000ms
- Latencia p99: < 2000ms

---

### 2. Métricas de Tasa de Éxito

**Medición:**
- Tasa de éxito: Porcentaje de peticiones exitosas vs fallidas
- Cálculo: `(peticiones_exitosas / total_peticiones) * 100`

**Tipos de Errores Capturados:**
1. **Errores de Autenticación (401):** Usuario no autenticado
2. **Errores de Rate Limiting (429):** Límite de peticiones excedido
3. **Errores de Validación (400):** Input inválido o mal formado
4. **Errores de Seguridad (403):** CSRF inválido
5. **Errores del Servidor (500):** Errores internos

**Ubicación:**
- Código: `src/app/api/chat/route.ts`
- Líneas 153 (success flag), 156-162 (recordMetrics)
- Logs de errores: 180-208

**Ejemplo de Log:**
```
[Chatbot Metrics] {
  latency: 245,
  success: true,
  intent: 'query_hours',
  usedContext: true,
  timestamp: 2024-01-15T10:30:00.000Z
}
```

**Valores Esperados:**
- Tasa de éxito: > 95%
- Tasa de errores 5xx: < 1%
- Tasa de errores 4xx (clientes): < 5%

---

### 3. Métricas de Calidad de Respuesta

#### 3.1. Uso de Contexto (FAQs/QA Pairs)

**Medición:**
- Boolean: `usedContext` - Indica si se usó contexto de FAQs/QA pairs
- Integer: `contextItems` - Número de items de contexto utilizados
- Array: `sources` - Lista de fuentes utilizadas con relevancia

**Ubicación:**
- Código: `src/services/chatbot.service.ts`
- Líneas 123-129 (getRelevantContext)
- Líneas 87-177 (generateResponse con contexto)

**Ejemplo de Metadata:**
```json
{
  "metadata": {
    "sources": [
      {
        "type": "faq",
        "id": "faq_123",
        "title": "Horarios de Atención",
        "relevance": 0.9
      }
    ],
    "contextUsed": true,
    "confidence": 0.9
  }
}
```

#### 3.2. Intents Clasificados

**Medición:**
- String: `intent` - Intención detectada del mensaje
- Float: `confidence` - Nivel de confianza (0.0 - 1.0)

**Intents Soportados:**
- `query_hours` - Consulta de horarios
- `query_location` - Consulta de ubicaciones/sucursales
- `query_rates` - Consulta de tasas de interés
- `request_help` - Solicitud de ayuda general
- `query_account` - Consulta sobre cuentas
- `query_credit` - Consulta sobre créditos
- `query_withdrawal` - Consulta sobre retiros
- `query_payment` - Consulta sobre pagos/depósitos
- `general_query` - Consulta general (fallback)

**Ubicación:**
- Código: `src/services/chatbot.service.ts`
- Líneas 169-185 (detectIntent)

---

### 4. Métricas de Seguridad

#### 4.1. Rate Limiting

**Configuración:**
- Límite: 10 peticiones por minuto por usuario/IP
- Ventana: 60 segundos

**Medición:**
- Rechazos por rate limiting (código 429)
- Headers de respuesta: `Retry-After`

**Ubicación:**
- Código: `src/app/api/chat/route.ts`
- Líneas 8-18 (configuración)
- Líneas 48-60 (aplicación)

#### 4.2. Sanitización de Input

**Medición:**
- Longitud de mensajes validados
- Caracteres removidos/sanitizados
- Mensajes rechazados por validación

**Reglas:**
- Longitud mínima: 3 caracteres
- Longitud máxima: 1000 caracteres
- Sanitización: Remover caracteres HTML y límites de longitud

**Ubicación:**
- Código: `src/lib/security.ts` (sanitizeInput)
- Código: `src/app/api/chat/route.ts` (líneas 99-117)

---

### 5. Métricas de Uso

#### 5.1. Estadísticas de Chat

**Endpoint:** `GET /api/chat?clientId=optional`

**Métricas Incluidas:**
- `totalSessions` - Total de sesiones de chat
- `totalMessages` - Total de mensajes (bot + usuario)
- `averageResponseTime` - Tiempo promedio de respuesta (TODO: calcular)
- `topIntents` - Top 5 intents más frecuentes con conteo

**Ubicación:**
- Código: `src/app/api/chat/route.ts` (GET handler, líneas 216-253)
- Código: `src/services/chatbot.service.ts` (getChatStats, líneas 306-346)

**Ejemplo de Respuesta:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 150,
    "totalMessages": 450,
    "averageResponseTime": 0,
    "topIntents": [
      { "intent": "query_hours", "count": 45 },
      { "intent": "query_location", "count": 32 },
      { "intent": "general_query", "count": 28 }
    ]
  }
}
```

#### 5.2. Sesiones y Mensajes Almacenados

**Tablas:**
- `ChatSession` - Sesiones de chat por cliente
- `ChatMessage` - Mensajes individuales (CLIENT, BOT, AGENT)

**Índices Optimizados:**
- `idx_chatsession_client_started` - Búsqueda por cliente y fecha
- `idx_chatmessage_session_created` - Búsqueda por sesión y fecha
- `idx_chatmessage_actor_created` - Búsqueda por actor y fecha

---

## Evidencia de Evaluación

### Casos de Prueba Implementados

1. **Test de Latencia:**
   - Ejecutar múltiples peticiones y medir tiempos de respuesta
   - Verificar que las respuestas incluyan metadata de latencia

2. **Test de Tasa de Éxito:**
   - Monitorear logs de métricas
   - Verificar registro de éxitos y fallos

3. **Test de Contexto:**
   - Enviar mensajes que deberían hacer match con FAQs
   - Verificar que se retorne `contextUsed: true` y `sources`

4. **Test de Seguridad:**
   - Exceder rate limit (11 peticiones en 1 minuto)
   - Enviar input malicioso (XSS, SQL injection attempts)
   - Verificar rechazo con códigos apropiados

5. **Test de Intents:**
   - Probar cada intent soportado
   - Verificar clasificación correcta y confianza

### Métricas Recolectadas

**Fuente de Datos:**
1. **Logs en Consola:**
   - `[Chatbot Metrics]` - Métricas por petición
   - `[API] POST /api/chat error` - Errores

2. **Base de Datos:**
   - `ChatSession` - Sesiones de chat
   - `ChatMessage` - Mensajes con intents
   - `AuditLog` - Actividades de auditoría

3. **Headers de Respuesta:**
   - `X-Content-Type-Options`
   - `X-Frame-Options`
   - `X-XSS-Protection`
   - `Referrer-Policy`
   - `Permissions-Policy`

### Dashboard de Métricas (TODO)

Para producción, se recomienda implementar:

1. **Prometheus + Grafana:**
   - Exponer métricas en formato Prometheus
   - Crear dashboard con gráficos de latencia, tasa de éxito, intents

2. **Tabla de Métricas en Prisma:**
   - Modelo `ChatMetrics` con campos:
     - `latency` (Integer)
     - `success` (Boolean)
     - `intent` (String?)
     - `usedContext` (Boolean)
     - `timestamp` (DateTime)

3. **Alertas:**
   - Alerta si latencia p95 > 1000ms
   - Alerta si tasa de éxito < 90%
   - Alerta si rate limiting excede 5% de peticiones

---

## Ejecución de Evaluación

### 1. Ejecutar Script de Integridad de Base de Datos

```bash
psql $DATABASE_URL -f scripts/integrity-check.sql
```

### 2. Ejecutar Script de Optimización de Índices

```bash
psql $DATABASE_URL -f scripts/database-optimization.sql
```

### 3. Probar Endpoint de Chat

```bash
# Autenticarse primero y obtener token
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "¿Cuáles son los horarios de atención?"}'
```

### 4. Consultar Estadísticas

```bash
curl -X GET "http://localhost:3000/api/chat?clientId=optional" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Monitorear Logs

```bash
# En desarrollo
npm run dev

# En producción
# Ver logs de la aplicación para métricas
tail -f logs/app.log | grep "Chatbot Metrics"
```

---

## Conclusiones

El sistema de métricas implementado proporciona:

1. ✅ **Latencia:** Medición precisa del tiempo de respuesta
2. ✅ **Tasa de Éxito:** Seguimiento de peticiones exitosas vs fallidas
3. ✅ **Contexto:** Verificación de uso de FAQs/QA pairs
4. ✅ **Seguridad:** Rate limiting, sanitización, validación
5. ✅ **Intents:** Clasificación de intenciones del usuario
6. ✅ **Estadísticas:** Endpoint GET para consultar métricas agregadas

**Próximos Pasos:**
- Implementar tabla `ChatMetrics` para almacenamiento persistente
- Integrar con sistema de monitoreo (Prometheus/Grafana)
- Crear dashboard de métricas en tiempo real
- Implementar alertas automatizadas

---

## Referencias

- Código del endpoint: `src/app/api/chat/route.ts`
- Servicio de chatbot: `src/services/chatbot.service.ts`
- Servicio de FAQs: `src/services/faq.service.ts`
- Seguridad: `src/lib/security.ts`
- Script de optimización: `scripts/database-optimization.sql`
- Script de integridad: `scripts/integrity-check.sql`

