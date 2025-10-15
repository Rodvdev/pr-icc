# 🚀 Roadmap Integral - Sistema de Identificación Bancaria

## 📋 Resumen del Proyecto

**Objetivo**: Automatizar la identificación de clientes en módulos bancarios mediante reconocimiento facial e integrar un asistente virtual para mejorar la experiencia del usuario.

**Stack Tecnológico**:
- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Prisma ORM + PostgreSQL + Redis (colas/cache)
- **Autenticación**: NextAuth.js (admins/agentes) + Credentials (clientes)
- **IA**: Anthropic vía MCP + Azure Face API / AWS Rekognition
- **Visualización**: Recharts para métricas
- **Deploy**: Vercel + Railway/AWS + Sentry/O11y

---

## 🎯 Fases de Desarrollo Detalladas

### ✅ **FASE 1: Configuración Base y Autenticación** (Semana 1-2)

#### 1.1 Configuración del Proyecto
- [x] ✅ Setup inicial Next.js 15 + TypeScript
- [x] ✅ Configuración de Prisma + PostgreSQL
- [x] ✅ Schema de base de datos completo
- [x] ✅ ShadCN UI instalado y configurado
- [x] ✅ NextAuth.js configurado
- [x] ✅ Sistema de autenticación dual (User/Client)
- [x] ✅ RBAC con RoleGate component
- [ ] 🔄 Configurar ESLint/Prettier/Husky
- [ ] 🔄 Setup de next-safe headers y CSP
- [ ] 🔄 CI/CD con GitHub Actions

#### 1.2 Estructura de Carpetas
```
src/
├── app/
│   ├── (auth)/          # Rutas de autenticación
│   ├── (admin)/         # Panel de administración
│   ├── (agent)/         # Panel de agente
│   ├── (client)/        # Área de cliente
│   ├── (kiosk)/         # Módulo kiosco
│   └── api/             # API routes
├── components/
│   ├── ui/              # ShadCN components
│   ├── auth/            # Componentes de autenticación
│   ├── providers/       # Context providers
│   └── common/          # Componentes reutilizables
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # NextAuth config
│   ├── mcp.ts           # MCP client-broker
│   └── utils.ts         # Utilidades
└── types/               # TypeScript types
```

#### 1.3 MCP Client-Broker (Node)
```typescript
// Herramientas MCP implementadas como stubs
const mcpTools = {
  'faq.search': async (query: string, tags?: string[], topK?: number) => {
    // Implementación real en Fase 2
    return { items: [] }
  },
  'faq.upsert': async (faq: FAQData) => {
    // Implementación real en Fase 2
    return { success: true }
  },
  'qa.search': async (query: string, topK?: number) => {
    // Implementación real en Fase 2
    return { items: [] }
  },
  'client.lookup': async (dni?: string, email?: string, phone?: string) => {
    // Implementación real en Fase 2
    return { client: null }
  },
  'visit.createOrUpdate': async (clientId: string, purpose?: string) => {
    // Implementación real en Fase 2
    return { visitId: 'temp', status: 'WAITING' }
  },
  'metrics.getKpis': async (range: string) => {
    // Implementación real en Fase 7
    return { visitors: 0, newVsReturning: { new: 0, returning: 0 }, completionPct: 0 }
  },
  'chat.handOff': async (sessionId: string, reason?: string) => {
    // Implementación real en Fase 5
    return { status: 'QUEUED' }
  },
  'dataset.refresh': async () => {
    // Implementación real en Fase 3
    return { success: true }
  }
}
```

#### 1.4 Variables de Entorno
```bash
# Base de datos
DATABASE_URL="postgresql://username:password@localhost:5432/banking_agent_db?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Anthropic
ANTHROPIC_API_KEY="your-anthropic-key"

# Redis (para colas y cache)
REDIS_URL="redis://localhost:6379"

# Azure Face API (opcional)
AZURE_FACE_API_KEY="your-azure-key"
AZURE_FACE_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
```

**Criterios de Aceptación**:
- ✅ Admin inicia sesión y ve /admin
- ✅ Cliente se registra manualmente y accede
- ✅ MCP tools responden "hello world" (stubs)
- ✅ RBAC funciona correctamente

---

### 🔄 **FASE 2: Base de Datos y Modelos Core** (Semana 2-3)

#### 2.1 Modelos de Datos (Ya implementados)
- [x] ✅ Schema Prisma completo
- [ ] 🔄 Seed script con datos de prueba
- [ ] 🔄 Migraciones de base de datos
- [ ] 🔄 Tipos TypeScript generados

#### 2.2 Servicios/Repos por Agregado
```typescript
// Patrón Service + Repository
class ClientService {
  constructor(private clientRepo: ClientRepository) {}
  
  async registerClient(data: RegisterClientData): Promise<Client> {
    // Lógica de negocio
  }
  
  async approveRegistration(clientId: string, approverId: string): Promise<void> {
    // Lógica de aprobación
  }
}

class ClientRepository {
  async create(data: CreateClientData): Promise<Client> {
    // Acceso a datos
  }
  
  async findByEmail(email: string): Promise<Client | null> {
    // Búsqueda por email
  }
}
```

#### 2.3 Endpoints/GQL (Ejemplos)
```typescript
// API Routes implementadas
POST /api/auth/client/register    # Registro de cliente
POST /api/auth/client/login       # Login de cliente
POST /api/auth/client/reset       # Reset de contraseña

GET  /api/clients?status=         # Lista de clientes
POST /api/clients/:id/block       # Bloquear cliente
GET  /api/branches/:id/modules    # Módulos por sucursal

// MCP herramientas (DB real)
GET  /api/mcp/faq/search          # Búsqueda en FAQs
POST /api/mcp/faq/upsert          # Crear/actualizar FAQ
GET  /api/mcp/qa/search           # Búsqueda en QA
```

#### 2.4 Helper de Auditoría
```typescript
// Helper centralizado para logs de auditoría
export async function audit(
  actorUserId: string | null,
  action: string,
  targetClientId?: string | null,
  details?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetClientId,
      action,
      details: details ? JSON.stringify(details) : null,
    }
  })
}

// Uso:
await audit(session.user.id, 'CLIENT_BLOCKED', clientId, { reason: 'Fraud detected' })
```

**Criterios de Aceptación**:
- ✅ `prisma migrate dev` OK + seeds
- ✅ CRUD básico desde script o Postman
- ✅ MCP tools funcionan con datos reales

---

### 🔄 **FASE 3: Panel de Administración** (Semana 3-4)

#### 3.1 Dashboard Principal
- [ ] 🔄 Layout del panel de administración con sidebar
- [ ] 🔄 Navegación responsive
- [ ] 🔄 Header con información del usuario
- [ ] 🔄 Breadcrumbs y navegación contextual

#### 3.2 Gestión de Clientes
- [ ] 🔄 Lista de clientes con filtros avanzados
- [ ] 🔄 Aprobar/rechazar registros pendientes
- [ ] 🔄 CRUD completo de clientes
- [ ] 🔄 Bloquear/desbloquear clientes
- [ ] 🔄 Reset de contraseñas con tokens
- [ ] 🔄 Exportación a CSV/Excel

#### 3.3 Gestión de Sucursales
- [ ] 🔄 CRUD de sucursales
- [ ] 🔄 Gestión de módulos por sucursal
- [ ] 🔄 Asignación de administradores
- [ ] 🔄 Configuración de horarios

#### 3.4 Gestión de Cámaras
- [ ] 🔄 Lista de cámaras por sucursal
- [ ] 🔄 Estado de cámaras (ONLINE/OFFLINE/ERROR)
- [ ] 🔄 Configuración de cámaras
- [ ] 🔄 Logs de cámaras
- [ ] 🔄 Testing de stream

#### 3.5 Gestión de FAQs/Dataset
- [ ] 🔄 CRUD de FAQs con categorías
- [ ] 🔄 CRUD de QAPair
- [ ] 🔄 Import/Export CSV/JSON
- [ ] 🔄 Publicación a MCP ("Publicar a Chatbot")
- [ ] 🔄 Preview de respuestas

#### 3.6 Detecciones en Tiempo Real
- [ ] 🔄 Timeline de detecciones
- [ ] 🔄 Filtros por fecha/estado/cámara
- [ ] 🔄 WebSocket para actualizaciones en vivo
- [ ] 🔄 Thumbnails de detecciones

**Criterios de Aceptación**:
- ✅ Todo CRUD auditado
- ✅ Detecciones visibles (mock hasta F6)
- ✅ Publicación de dataset refleja cambios en chatbot

---

### 🔄 **FASE 4: Módulo de Cliente** (Semana 4-5)

#### 4.1 Interfaz de Cliente
- [ ] 🔄 Pantalla de bienvenida responsive
- [ ] 🔄 Sistema de registro guiado (wizard)
- [ ] 🔄 Login de clientes
- [ ] 🔄 Reset de contraseña con tokens
- [ ] 🔄 Gestión de perfil

#### 4.2 Flujo de Registro
```typescript
// Wizard de registro paso a paso
const registrationSteps = [
  { id: 'personal', title: 'Datos Personales', fields: ['name', 'dni', 'email', 'phone'] },
  { id: 'security', title: 'Seguridad', fields: ['password', 'confirmPassword'] },
  { id: 'photo', title: 'Foto para Reconocimiento', fields: ['photo'] },
  { id: 'review', title: 'Revisar Información', fields: ['review'] },
  { id: 'waiting', title: 'Esperando Aprobación', fields: ['status'] }
]
```

#### 4.3 Estados de Visit
```typescript
enum VisitStatus {
  WAITING = 'WAITING',           // Cliente esperando
  IN_SERVICE = 'IN_SERVICE',     // En atención
  COMPLETED = 'COMPLETED',       // Atendido exitosamente
  ABANDONED = 'ABANDONED'        // Abandonó la cola
}
```

#### 4.4 Orquestador de Chat (Server)
```typescript
// Flujo de chat con MCP + Anthropic
export async function processChatMessage(
  sessionId: string,
  message: string,
  clientId?: string
) {
  // Paso 1: Buscar en base de conocimiento
  const faqResults = await mcpTools['faq.search'](message, [], 3)
  const qaResults = await mcpTools['qa.search'](message, 3)
  
  // Paso 2: Componer contexto
  const context = {
    faqs: faqResults.items,
    qas: qaResults.items,
    client: clientId ? await getClientInfo(clientId) : null
  }
  
  // Paso 3: Llamar a Anthropic
  const response = await anthropicClient.messages.create({
    model: 'claude-3-sonnet-20240229',
    system: getSystemPrompt(context),
    messages: [{ role: 'user', content: message }],
    tools: mcpTools
  })
  
  // Paso 4: Registrar en base de datos
  await prisma.chatMessage.create({
    data: {
      sessionId,
      actor: 'BOT',
      content: response.content[0].text,
      metadata: { context, tokens: response.usage }
    }
  })
  
  return response
}
```

**Criterios de Aceptación**:
- ✅ Registro/login/reset funcionando
- ✅ Chat responde con base en FAQ/QA
- ✅ Visit se crea/actualiza correctamente

---

### 🔄 **FASE 5: Sistema de Chatbot (Anthropic + MCP)** (Semana 5-6)

#### 5.1 Prompt de Sistema (es-PE)
```typescript
const systemPrompt = `
Eres un asistente virtual de un agente bancario en Perú. Tu objetivo es ayudar a los clientes con consultas sobre productos y servicios bancarios.

POLÍTICAS IMPORTANTES:
1. NO inventes información que no esté en la base de conocimiento
2. Si no tienes información suficiente, pide aclaración o deriva a un agente
3. Para operaciones sensibles (PIN, claves), deriva inmediatamente a un agente
4. Usa lenguaje claro y amigable en español peruano
5. Mantén la privacidad de los datos del cliente

HERRAMIENTAS DISPONIBLES:
- faq.search: Buscar en preguntas frecuentes
- qa.search: Buscar en base de conocimiento
- client.lookup: Verificar información del cliente
- visit.createOrUpdate: Crear o actualizar visita
- chat.handOff: Derivar a agente humano

CONTEXTO ACTUAL:
- Cliente: ${client?.name || 'No identificado'}
- Sucursal: ${branch?.name || 'No especificada'}
- Horario: ${getCurrentHours()}
`
```

#### 5.2 Memoria de Sesión
```typescript
// Sistema de resúmenes para mantener contexto
class SessionMemory {
  private summaries: Map<string, string> = new Map()
  
  async getContext(sessionId: string): Promise<string> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    // Si hay muchos mensajes, crear resumen
    if (messages.length > 5) {
      const summary = await this.createSummary(messages)
      this.summaries.set(sessionId, summary)
    }
    
    return this.summaries.get(sessionId) || ''
  }
}
```

#### 5.3 Botones de Sugerencia
```typescript
// Quick replies basados en intents comunes
const quickReplies = [
  { text: "¿Cómo retirar dinero?", intent: "withdrawal" },
  { text: "¿Cuáles son los horarios?", intent: "hours" },
  { text: "¿Cómo abrir una cuenta?", intent: "open_account" },
  { text: "¿Cuánto cuesta el mantenimiento?", intent: "fees" }
]
```

#### 5.4 CSAT y Métricas de Calidad
```typescript
// Sistema de satisfacción del cliente
interface ChatMetrics {
  responseTime: number
  resolutionRate: number
  handOffRate: number
  csatScore: number
  tokenUsage: number
}
```

**Criterios de Aceptación**:
- ✅ 80% de FAQs resueltas sin agente
- ✅ Latencia media < 1.5-2.0s
- ✅ Handoff visible en /admin/chat
- ✅ CSAT implementado

---

### 🔄 **FASE 6: Reconocimiento Facial** (Semana 6-7)

#### 6.1 Arquitectura de Pipeline
```typescript
// Worker de Ingesta (Node/Python)
class FacialRecognitionWorker {
  async processFrame(cameraId: string, frame: Buffer) {
    // 1. Detectar rostros
    const faces = await this.detectFaces(frame)
    
    // 2. Extraer embeddings
    const embeddings = await this.extractEmbeddings(faces)
    
    // 3. Buscar matches
    const matches = await this.findMatches(embeddings)
    
    // 4. Crear DetectionEvent
    await this.createDetectionEvent({
      cameraId,
      status: matches.length > 0 ? 'MATCHED' : 'UNKNOWN',
      confidence: matches[0]?.confidence || 0,
      clientId: matches[0]?.clientId || null,
      snapshotUrl: await this.saveSnapshot(frame)
    })
  }
}
```

#### 6.2 Integración con APIs de IA
```typescript
// Soporte para múltiples proveedores
interface FacialRecognitionProvider {
  detectFaces(image: Buffer): Promise<Face[]>
  extractEmbedding(face: Face): Promise<number[]>
  compareEmbeddings(embedding1: number[], embedding2: number[]): Promise<number>
}

class AzureFaceProvider implements FacialRecognitionProvider {
  // Implementación con Azure Face API
}

class AWSRekognitionProvider implements FacialRecognitionProvider {
  // Implementación con AWS Rekognition
}

class LocalOpenCVProvider implements FacialRecognitionProvider {
  // Implementación local con OpenCV
}
```

#### 6.3 Sistema de Colas (BullMQ/Redis)
```typescript
// Cola para procesamiento de frames
import Queue from 'bull'

const frameQueue = new Queue('frame processing', process.env.REDIS_URL)

frameQueue.process(async (job) => {
  const { cameraId, frame } = job.data
  await facialRecognitionWorker.processFrame(cameraId, frame)
})

// Enviar frames a la cola
async function sendFrameToQueue(cameraId: string, frame: Buffer) {
  await frameQueue.add('process-frame', { cameraId, frame }, {
    attempts: 3,
    backoff: 'exponential'
  })
}
```

#### 6.4 Privacidad y Consentimiento
```typescript
// Política de retención de datos
const RETENTION_POLICY = {
  snapshots: 30, // días
  embeddings: 365, // días
  detectionLogs: 90 // días
}

// Opt-out para clientes
async function deactivateFacialProfile(clientId: string) {
  await prisma.facialProfile.updateMany({
    where: { clientId },
    data: { isActive: false }
  })
}
```

**Criterios de Aceptación**:
- ✅ Match en entorno controlado ≥95%
- ✅ Latencia pipeline ~1-2s por rostro
- ✅ Panel muestra detecciones y thumbnails

---

### 🔄 **FASE 7: Métricas y Dashboard** (Semana 7-8)

#### 7.1 KPIs Principales
```typescript
interface KPIs {
  // Visitantes
  dailyVisitors: number
  weeklyVisitors: number
  monthlyVisitors: number
  
  // Nuevos vs Recurrentes
  newVsReturning: {
    new: number
    returning: number
    ratio: number
  }
  
  // Registros
  registrationCompletionRate: number
  approvalRate: number
  
  // Cámaras
  cameraUptime: number
  detectionAccuracy: number
  
  // Chatbot
  chatResolutionRate: number
  averageResponseTime: number
  csatScore: number
}
```

#### 7.2 Dashboard Ejecutivo
```typescript
// Componentes de visualización con Recharts
const DashboardMetrics = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <VisitorTrendChart data={visitorData} />
      <CameraUptimeChart data={cameraData} />
      <ChatMetricsChart data={chatData} />
      <RegistrationFunnelChart data={registrationData} />
    </div>
  )
}
```

#### 7.3 Sistema de Caché
```typescript
// Caché con Redis para métricas
class MetricsCache {
  private redis = new Redis(process.env.REDIS_URL)
  
  async getKPIs(range: string): Promise<KPIs> {
    const cacheKey = `kpis:${range}:${getDateKey()}`
    const cached = await this.redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }
    
    const kpis = await this.calculateKPIs(range)
    await this.redis.setex(cacheKey, 900, JSON.stringify(kpis)) // 15 min
    
    return kpis
  }
}
```

#### 7.4 Alertas Automáticas
```typescript
// Sistema de alertas
const alerts = [
  {
    condition: 'cameraUptime < 95%',
    severity: 'warning',
    action: 'sendEmail'
  },
  {
    condition: 'detectionAccuracy < 90%',
    severity: 'critical',
    action: 'sendSlack'
  },
  {
    condition: 'csatScore < 7',
    severity: 'warning',
    action: 'createTicket'
  }
]
```

**Criterios de Aceptación**:
- ✅ Dashboard < 2s con caché caliente
- ✅ Exportación CSV/Excel funcional
- ✅ Alertas automáticas funcionando

---

### 🔄 **FASE 8: Despliegue y Optimización** (Semana 8-9)

#### 8.1 Infraestructura
```yaml
# docker-compose.yml para desarrollo local
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/banking_agent_db
      - REDIS_URL=redis://redis:6379
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=banking_agent_db
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
  
  facial-worker:
    build: ./facial-worker
    environment:
      - REDIS_URL=redis://redis:6379
      - AZURE_FACE_API_KEY=${AZURE_FACE_API_KEY}
```

#### 8.2 Despliegue en Vercel
```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  }
}
```

#### 8.3 Optimizaciones de Performance
```typescript
// Server Components y optimizaciones
export default async function AdminDashboard() {
  // Datos cargados en el servidor
  const [clients, branches, metrics] = await Promise.all([
    prisma.client.findMany({ take: 10 }),
    prisma.branch.findMany(),
    getKPIs('today')
  ])
  
  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <ClientsList clients={clients} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <MetricsDashboard metrics={metrics} />
      </Suspense>
    </div>
  )
}
```

#### 8.4 Observabilidad
```typescript
// Configuración de Sentry
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
})

// Métricas personalizadas
Sentry.metrics.increment('chat.message.processed', 1, {
  tags: { actor: 'bot', success: 'true' }
})
```

**Criterios de Aceptación**:
- ✅ Stress test: ≥5 cámaras/sucursal
- ✅ Chatbot 50 req/min estable
- ✅ Downtime <0.5% mensual

---

## 🛠️ Herramientas y Recursos

### Desarrollo
- **IDE**: VS Code con extensiones TypeScript/React
- **Git**: Control de versiones con GitHub
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Documentación**: Markdown + Storybook

### Producción
- **Frontend**: Vercel
- **Base de datos**: Railway PostgreSQL
- **Cache/Colas**: Upstash Redis
- **Monitoreo**: Sentry + Vercel Analytics

### IA y Reconocimiento
- **Azure Face API**: Reconocimiento facial
- **AWS Rekognition**: Alternativa cloud
- **OpenCV**: Procesamiento local
- **Anthropic Claude**: Chatbot inteligente

---

## 📊 Métricas de Éxito Finales

Según las especificaciones del SRS:
- **Reducción del tiempo de registro**: 60%
- **Precisión de identificación facial**: >95%
- **Satisfacción del usuario**: >8/10
- **Downtime**: <0.5% mensual

### KPIs Adicionales
- **Tasa de resolución del chatbot**: >80%
- **Tiempo promedio de respuesta**: <2s
- **Uptime de cámaras**: >95%
- **Tasa de conversión de registros**: >85%

---

## 📅 Timeline Estimado

| Fase | Duración | Entregables |
|------|----------|-------------|
| F1-F2 | 2 semanas | Auth + DB + APIs base |
| F3 | 1.5 semanas | Panel de administración |
| F4 | 1.5 semanas | Módulo de cliente |
| F5 | 1 semana | Chatbot con Anthropic |
| F6 | 1.5 semanas | Reconocimiento facial |
| F7 | 0.75 semanas | Métricas y dashboard |
| F8 | 0.75 semanas | Deploy y optimización |

**Total**: 9 semanas para MVP completo

---

## 🚀 Próximos Pasos Inmediatos

1. **Completar Fase 1**: Configurar ESLint, CI/CD, y MCP stubs
2. **Implementar Fase 2**: Seed script, servicios, y APIs reales
3. **Desarrollar Fase 3**: Panel de administración completo
4. **Continuar con Fases 4-8**: Siguiendo el roadmap detallado

---

## 📝 Definition of Done (DoD) por Fase

### F1-F2: Fundación Sólida
- ✅ Autenticación dual funcionando
- ✅ Base de datos con seeds
- ✅ CI/CD pipeline verde
- ✅ MCP tools básicos

### F3: Panel Admin Completo
- ✅ CRUDs auditados
- ✅ Dataset publicable a MCP
- ✅ Detecciones visibles (mock)

### F4: Módulo Cliente
- ✅ Registro/login/reset operativo
- ✅ Chat básico estable
- ✅ Visit management

### F5: Chatbot Avanzado
- ✅ Tool-use completo
- ✅ Handoff funcional
- ✅ CSAT implementado

### F6: Reconocimiento Facial
- ✅ Detección real con precisión validada
- ✅ Pipeline optimizado
- ✅ Privacidad implementada

### F7: Métricas Ejecutivas
- ✅ KPIs con caché
- ✅ Export funcional
- ✅ Alertas automáticas

### F8: Producción
- ✅ Observabilidad completa
- ✅ Seguridad implementada
- ✅ Performance optimizada

---

Este roadmap integral proporciona una guía completa para desarrollar el Sistema de Identificación Bancaria desde cero hasta producción, con todas las fases, entregables, criterios de aceptación y herramientas necesarias.
