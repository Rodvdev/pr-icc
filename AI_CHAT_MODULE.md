# Módulo IA de Chat - Documentación Completa

## Descripción General

El módulo IA de chat proporciona asistencia virtual inteligente para clientes del sistema bancario, integrando OpenAI GPT-3.5-turbo con acceso a datos del cliente, FAQs preconfiguradas, y un system prompt avanzado de seguridad bancaria.

## Tabla de Contenidos

1. [Fuentes de Datos](#fuentes-de-datos)
2. [Preprocesamiento](#preprocesamiento)
3. [Métricas](#métricas)
4. [Prompts y FAQs Preconfiguradas](#prompts-y-faqs-preconfiguradas)
5. [Configuración de API Keys](#configuración-de-api-keys)
6. [Arquitectura](#arquitectura)
7. [Guía de Uso](#guía-de-uso)

---

## Fuentes de Datos

El módulo IA accede a múltiples fuentes de datos para proporcionar respuestas contextualizadas:

### 1. Perfil del Cliente (`/api/client/profile`)
- **Datos disponibles:**
  - Nombre completo, nombre, apellido
  - Email
  - Teléfono
  - DNI (parcialmente oculto por seguridad)
  - Estado del cliente (ACTIVE, BLOCKED, DELETED)
  - Fecha de creación de la cuenta

- **Uso:** Consultas sobre información personal del cliente
- **Acceso:** Solo cuando el cliente está autenticado

### 2. Historial de Visitas (`/api/client/visits`)
- **Datos disponibles:**
  - Últimas 10 visitas (limitado para optimización)
  - Fecha y hora de cada visita
  - Sucursal y módulo visitados
  - Propósito de la visita
  - Estado (WAITING, IN_SERVICE, COMPLETED, ABANDONED)
  - Duración de la visita

- **Uso:** Consultas sobre visitas pasadas, historial de atención
- **Acceso:** Solo cuando el cliente está autenticado

### 3. Citas Programadas (`/api/kiosk/appointments`)
- **Datos disponibles:**
  - Próximas 5 citas (limitado para optimización)
  - Fecha y hora programada
  - Propósito de la cita
  - Notas adicionales
  - Estado (SCHEDULED, CONFIRMED)
  - Sucursal y dirección

- **Uso:** Consultas sobre citas futuras, programación
- **Acceso:** Solo cuando el cliente está autenticado

### 4. Estadísticas del Cliente (`/api/client/stats`)
- **Datos disponibles:**
  - Total de visitas (últimos 6 meses)
  - Visitas este mes
  - Duración promedio de visitas
  - Sucursal favorita
  - Número de citas próximas

- **Uso:** Consultas sobre estadísticas y resúmenes
- **Acceso:** Solo cuando el cliente está autenticado

### 5. FAQs y QA Pairs (Base de Datos)
- **Datos disponibles:**
  - FAQs publicadas con tags y respuestas
  - Pares pregunta-respuesta activos
  - Relevancia calculada por búsqueda semántica

- **Uso:** Respuestas a preguntas frecuentes y consultas generales
- **Acceso:** Público (no requiere autenticación)

---

## Preprocesamiento

### Consolidación de Datos del Cliente

El servicio `ClientDataService` (`src/services/client-data.service.ts`) consolida y preprocesa los datos del cliente:

1. **Agregación en Paralelo:** Todas las fuentes de datos se consultan simultáneamente para optimizar el tiempo de respuesta.

2. **Límites de Datos:**
   - Visitas: Últimas 10 visitas
   - Citas: Próximas 5 citas
   - Estadísticas: Últimos 6 meses

3. **Formateo:**
   - Fechas: Formato `dd/MM/yyyy HH:mm` (español)
   - Duración: Minutos redondeados
   - Texto legible para el contexto de IA

4. **Filtrado de Información Sensible:**
   - DNI parcialmente oculto
   - No se incluyen contraseñas ni tokens
   - Solo información necesaria para el contexto

### Formato para Prompt de IA

Los datos se formatean en un string estructurado:

```
=== INFORMACIÓN DEL CLIENTE ===
Nombre: [Nombre completo]
Email: [Email]
Teléfono: [Teléfono]
Estado: [Estado]
Cliente desde: [Fecha]

=== ESTADÍSTICAS ===
Total de visitas (últimos 6 meses): [Número]
Visitas este mes: [Número]
Duración promedio: [Minutos] minutos
Sucursal favorita: [Nombre]
Citas próximas: [Número]

=== VISITAS RECIENTES ===
- [Fecha] [Hora] | [Sucursal] | [Propósito] | [Estado] | [Duración]
...

=== CITAS PROGRAMADAS ===
- [Fecha] [Hora] | [Sucursal] | [Propósito] | [Estado]
...
```

### Detección de Intención

El sistema detecta automáticamente si una consulta requiere datos del cliente:

- **Palabras clave que activan acceso a datos:**
  - "mi perfil", "mis datos", "mi información"
  - "mis visitas", "cuándo visité", "historial"
  - "mis citas", "próxima cita", "tengo cita"
  - "cuántas visitas", "estadísticas"

- **Si no se detecta necesidad de datos personales:** El sistema no carga información del cliente, optimizando el rendimiento.

---

## Métricas

El sistema registra métricas extendidas para monitoreo y análisis:

### Métricas Básicas (ChatMetric)

- `latency`: Tiempo de respuesta en milisegundos
- `success`: Si la operación fue exitosa
- `intent`: Categoría de la consulta (greeting, hours, profile, visits, etc.)
- `usedContext`: Si se usaron FAQs/QA pairs
- `contextItems`: Número de items de contexto usados

### Métricas Extendidas (Almacenadas en metadata JSON)

- `usedClientData`: Boolean - Si se accedió a datos del cliente
- `usedOpenAI`: Boolean - Si se usó OpenAI para generar la respuesta
- `promptTokens`: Número de tokens de entrada
- `completionTokens`: Número de tokens de salida
- `totalTokens`: Total de tokens usados
- `estimatedCost`: Costo estimado en USD

### Cálculo de Costos

**Pricing gpt-3.5-turbo (2024):**
- Input: $0.50 por 1M tokens
- Output: $1.50 por 1M tokens

**Ejemplo:**
- 100 tokens de entrada + 50 tokens de salida
- Costo: (100/1,000,000 * 0.50) + (50/1,000,000 * 1.50) = $0.000125

### Consulta de Métricas

```typescript
// Obtener estadísticas
const stats = await chatbotService.getChatStats(clientId)

// Resultado:
{
  totalMessages: number,
  successfulMessages: number,
  totalSessions: number,
  avgLatency: number,
  successRate: number
}
```

---

## Prompts y FAQs Preconfiguradas

### System Prompt de Seguridad Bancaria

El system prompt (`src/lib/ai-prompts.ts`) incluye:

1. **Reglas de Seguridad Críticas:**
   - NUNCA solicitar/revelar información sensible
   - NUNCA realizar transacciones financieras
   - NUNCA compartir información de otros clientes
   - Validar identidad antes de proporcionar datos personales
   - Redirigir consultas complejas a agentes humanos

2. **Compliance y Regulaciones:**
   - Cumplimiento con regulaciones bancarias peruanas (SBS)
   - Protección de datos según Ley N° 29733
   - Reporte de actividad sospechosa
   - Registros para auditoría

3. **Capacidades:**
   - Responder preguntas sobre servicios bancarios
   - Consultar información del perfil del cliente
   - Informar sobre visitas y citas
   - Proporcionar información general
   - Ayudar con FAQs

4. **Tono y Estilo:**
   - Profesional pero amigable
   - Claro y conciso
   - En español de Perú
   - Empático y servicial

### Respuestas Preconfiguradas

Categorías disponibles en `PRE_CONFIGURED_RESPONSES`:

- **greeting:** Saludos variados
- **farewell:** Despedidas amigables
- **hours:** Información de horarios
- **location:** Información de ubicaciones
- **contact:** Información de contacto
- **services:** Información de servicios
- **profile:** Consultas sobre perfil
- **visits:** Consultas sobre visitas
- **appointments:** Consultas sobre citas
- **error:** Mensajes de error
- **limit:** Mensajes de límite de alcance
- **security:** Mensajes de seguridad

### Detección de Intención

El sistema detecta automáticamente la intención de la consulta:

```typescript
const intent = detectQueryIntent(query)
// Retorna: { category, confidence, requiresClientData }
```

**Categorías detectadas:**
- `greeting`: Saludos
- `farewell`: Despedidas
- `hours`: Horarios
- `location`: Ubicaciones
- `contact`: Contacto
- `profile`: Perfil (requiere datos del cliente)
- `visits`: Visitas (requiere datos del cliente)
- `appointments`: Citas (requiere datos del cliente)
- `services`: Servicios
- `general`: Consulta general

---

## Configuración de API Keys

### OpenAI API Key

1. **Obtener API Key:**
   - Visitar: https://platform.openai.com/api-keys
   - Crear una nueva API key
   - Copiar la key generada

2. **Configurar Variable de Entorno:**

   Crear o editar `.env.local`:

   ```bash
   OPENAI_API_KEY=sk-...
   ```

   **Importante:** Nunca commitear la API key en el repositorio.

3. **Validación:**

   El sistema valida automáticamente si la API key está configurada:

   ```typescript
   import { isOpenAIConfigured } from '@/lib/openai'
   
   if (isOpenAIConfigured()) {
     // Usar OpenAI
   } else {
     // Fallback a FAQs/QA
   }
   ```

4. **Modelo Usado:**
   - **Modelo:** `gpt-3.5-turbo`
   - **Temperatura:** 0.7 (balance entre creatividad y precisión)
   - **Max Tokens:** 500 (respuestas concisas)

### Seguridad

- La API key se almacena solo en variables de entorno
- No se expone en el frontend
- Validación en cada request
- Manejo de errores para keys inválidas

---

## Arquitectura

### Componentes Principales

1. **OpenAI Service** (`src/lib/openai.ts`)
   - Cliente de OpenAI
   - Generación de completions
   - Cálculo de costos
   - Manejo de errores

2. **Client Data Service** (`src/services/client-data.service.ts`)
   - Consolidación de datos del cliente
   - Preprocesamiento
   - Formateo para prompts

3. **AI Prompts** (`src/lib/ai-prompts.ts`)
   - System prompts
   - Respuestas preconfiguradas
   - Detección de intención

4. **Chatbot Service** (`src/services/chatbot.service.ts`)
   - Lógica de negocio principal
   - Integración OpenAI + FAQs/QA
   - Gestión de sesiones
   - Métricas

5. **API Routes:**
   - `/api/chat`: Chat para clientes autenticados
   - `/api/kiosk/chat`: Chat para kiosk (con/sin autenticación)

### Flujo de Procesamiento

```
1. Cliente envía mensaje
   ↓
2. Validación y sanitización
   ↓
3. Detección de intención
   ↓
4. ¿Requiere datos del cliente?
   ├─ Sí → Cargar datos del cliente
   └─ No → Continuar
   ↓
5. Buscar contexto en FAQs/QA
   ↓
6. ¿OpenAI configurado?
   ├─ Sí → Generar respuesta con OpenAI
   │        (con contexto de cliente + FAQs/QA)
   └─ No → Usar respuesta de FAQs/QA o preconfigurada
   ↓
7. Guardar interacción en BD
   ↓
8. Registrar métricas
   ↓
9. Retornar respuesta al cliente
```

### Fallback Strategy

El sistema tiene múltiples niveles de fallback:

1. **OpenAI** (si está configurado)
2. **FAQs/QA pairs** (búsqueda semántica)
3. **Respuestas preconfiguradas** (por categoría)
4. **Respuesta genérica** (último recurso)

---

## Guía de Uso

### Para Desarrolladores

#### Uso del Chatbot Service

```typescript
import { chatbotService } from '@/services/chatbot.service'

// Obtener contexto relevante
const context = await chatbotService.getRelevantContext(query)

// Generar respuesta
const response = await chatbotService.generateResponse(
  query,
  context,
  clientId // opcional
)

// Guardar interacción
await chatbotService.saveChatInteraction(
  clientId,
  message,
  response.response,
  response.intent,
  metadata
)

// Registrar métricas
await chatbotService.recordMetrics({
  latency: 150,
  success: true,
  intent: response.intent,
  usedContext: true,
  contextItems: 3,
  usedClientData: response.usedClientData,
  usedOpenAI: response.usedOpenAI,
  // ... más métricas
  timestamp: new Date()
})
```

#### Uso del Client Data Service

```typescript
import { getClientDataForAI, formatClientDataForPrompt } from '@/services/client-data.service'

// Obtener datos consolidados
const clientData = await getClientDataForAI(clientId)

// Formatear para prompt
const formatted = formatClientDataForPrompt(clientData)
```

#### Uso de OpenAI Service

```typescript
import { generateChatCompletion, isOpenAIConfigured } from '@/lib/openai'

if (isOpenAIConfigured()) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]
  
  const result = await generateChatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 500
  })
  
  console.log(result.response)
  console.log('Tokens:', result.usage?.totalTokens)
  console.log('Costo:', result.usage?.estimatedCost)
}
```

### Para Administradores

#### Configurar FAQs

1. Acceder a `/admin/faqs`
2. Crear nuevas FAQs con:
   - Título descriptivo
   - Respuesta completa
   - Tags relevantes
   - Estado: PUBLISHED

#### Configurar QA Pairs

1. Acceder a `/admin/chatbot` (si está disponible)
2. Agregar pares pregunta-respuesta
3. Activar los pares relevantes

#### Monitorear Métricas

```typescript
// Obtener estadísticas generales
const stats = await chatbotService.getChatStats()

// Obtener estadísticas por cliente
const clientStats = await chatbotService.getChatStats(clientId)
```

#### Verificar Configuración

```bash
# Verificar que OpenAI está configurado
node -e "console.log(process.env.OPENAI_API_KEY ? 'Configurado' : 'No configurado')"
```

### Para Usuarios Finales

#### Uso del Chat

1. **Acceso:**
   - Clientes autenticados: `/chat` o widget flotante
   - Kiosk: `/kiosk/chat`

2. **Tipos de Consultas:**
   - Preguntas generales sobre servicios
   - Consultas sobre horarios y ubicaciones
   - Información sobre perfil personal (requiere autenticación)
   - Consultas sobre visitas pasadas (requiere autenticación)
   - Consultas sobre citas programadas (requiere autenticación)

3. **Ejemplos de Consultas:**
   - "¿Cuáles son los horarios de atención?"
   - "¿Cuándo fue mi última visita?"
   - "¿Tengo alguna cita programada?"
   - "¿Cuál es mi información de perfil?"

---

## Troubleshooting

### OpenAI no responde

1. Verificar que `OPENAI_API_KEY` está configurada
2. Verificar que la key es válida
3. Verificar límites de rate limiting de OpenAI
4. Revisar logs para errores específicos

### Datos del cliente no se cargan

1. Verificar que el cliente está autenticado
2. Verificar que `clientId` se pasa correctamente
3. Revisar permisos de acceso a datos
4. Verificar que el cliente existe en la BD

### Respuestas genéricas

1. Verificar que hay FAQs/QA pairs en la BD
2. Verificar que OpenAI está configurado
3. Revisar logs de detección de intención
4. Agregar más FAQs relevantes

### Alto costo de OpenAI

1. Revisar métricas de tokens usados
2. Optimizar system prompt (reducir tamaño)
3. Limitar cantidad de contexto incluido
4. Considerar usar más FAQs/QA en lugar de OpenAI para consultas simples

---

## Mejores Prácticas

1. **Seguridad:**
   - Nunca exponer API keys en el frontend
   - Validar y sanitizar todas las entradas
   - Limitar acceso a datos del cliente
   - Registrar todas las interacciones

2. **Rendimiento:**
   - Cargar datos del cliente solo cuando sea necesario
   - Limitar cantidad de datos históricos
   - Usar caché cuando sea apropiado
   - Monitorear latencia y optimizar

3. **Costo:**
   - Usar FAQs/QA para consultas comunes
   - Limitar tokens en prompts
   - Monitorear uso de tokens
   - Optimizar system prompt

4. **Experiencia de Usuario:**
   - Proporcionar respuestas claras y concisas
   - Ofrecer redirección a agentes humanos cuando sea necesario
   - Mantener contexto de conversación
   - Proporcionar feedback apropiado

---

## Referencias

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Prisma Schema](../prisma/schema.prisma)
- [Security Best Practices](../src/lib/security.ts)

---

## Changelog

### v1.0.0 (2024)
- Implementación inicial del módulo IA
- Integración con OpenAI GPT-3.5-turbo
- Acceso a datos del cliente
- System prompt de seguridad bancaria
- Métricas extendidas
- Documentación completa

