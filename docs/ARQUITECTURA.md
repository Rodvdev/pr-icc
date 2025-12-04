# Arquitectura del Sistema - Banking Agent ID

## Descripción General

El **Banking Agent ID System** es una aplicación completa para gestionar operaciones de agentes bancarios con reconocimiento facial, gestión de clientes y controles administrativos. El sistema está diseñado para operar en kioscos físicos donde los clientes pueden ser identificados mediante reconocimiento facial, interactuar con un chatbot, programar citas y gestionar visitas.

## Arquitectura Mínima Sugerida

### Componentes Principales

1. **Frontend**: Next.js 15 con TypeScript
2. **Backend**: Next.js API Routes + Flask API (Python)
3. **Base de Datos**: PostgreSQL con Prisma ORM
4. **IA/ML**: 
   - Reconocimiento Facial: Python API con `face_recognition`
   - Chatbot: Rule-based con matching semántico de FAQs
5. **Hardware**: ESP32/Raspberry Pi/Arduino → MQTT/HTTP → API
6. **Infraestructura AWS**:
   - EC2: nginx + gunicorn (Flask API)
   - RDS: PostgreSQL
   - S3: Almacenamiento de imágenes y snapshots
   - CloudWatch: Logs y monitoreo

## Arquitectura por Capas

### 1. Capa de Presentación (Frontend)

**Tecnologías**: Next.js 15, React 19, TypeScript, TailwindCSS

**Componentes Principales**:

- **Panel de Administración** (`/admin`)
  - Dashboard con métricas del sistema
  - Gestión de clientes, sucursales, cámaras
  - Aprobación de registros
  - Configuración de FAQs y chatbot
  - Monitoreo de reconocimiento facial

- **Portal del Cliente** (`/client`)
  - Perfil personal
  - Historial de visitas
  - Gestión de documentos
  - Sistema de ayuda

- **Interfaz de Kiosco** (`/kiosk`)
  - Reconocimiento facial en tiempo real
  - Chatbot interactivo
  - Registro de visitantes
  - Programación de citas
  - Pantalla de bienvenida

### 2. Capa de Aplicación (Backend)

**Next.js API Routes** (`src/app/api/`)

- **Autenticación**: NextAuth.js con autenticación basada en credenciales
- **Gestión de Clientes**: CRUD completo con validaciones
- **Gestión de Sucursales**: Multi-tenant por sucursal
- **Reconocimiento Facial**: Integración con Python API
- **Chatbot**: Endpoint para conversaciones con contexto
- **Kiosco**: Endpoints específicos para interfaz de kiosco
- **FAQs y QA**: Gestión de base de conocimiento

**Flask API (Python)** - Reconocimiento Facial

- Procesamiento de video streams
- Detección y reconocimiento facial
- Almacenamiento de encodings (face_recognition)
- Webhook para notificar detecciones a Next.js

### 3. Capa de Datos

**PostgreSQL** con **Prisma ORM**

**Modelos Principales**:

- `User`: Administradores y agentes
- `Client`: Clientes/visitantes
- `Branch`: Sucursales/ubicaciones
- `AgentModule`: Módulos físicos dentro de sucursales
- `Camera`: Dispositivos de cámara
- `FacialProfile`: Perfiles faciales (encodings)
- `DetectionEvent`: Eventos de detección
- `Visit`: Visitas/atenciones
- `Appointment`: Citas programadas
- `ChatSession` / `ChatMessage`: Conversaciones del chatbot
- `FAQ` / `QAPair`: Base de conocimiento
- `Device`: Configuración de dispositivos IoT

### 4. Capa de IA/ML

**Reconocimiento Facial**:
- Librería: `face_recognition` (basada en dlib)
- Encoding: Vectores de 128 dimensiones
- Proceso: Captura → Detección → Encoding → Comparación → Match

**Chatbot**:
- Enfoque: Rule-based con matching semántico
- Base de conocimiento: FAQs y QA pairs
- Búsqueda: Full-text search con relevancia
- Contexto: Datos del cliente cuando está autenticado

## Flujo de Datos Principal

### Flujo de Reconocimiento Facial

```
ESP32 Camera → HTTP Stream → Flask API → Face Detection → Encoding → 
Comparison → Match Result → Webhook → Next.js API → Database → 
Frontend Update
```

1. **Captura**: Cámara ESP32 transmite stream HTTP
2. **Procesamiento**: Flask API captura frames y procesa
3. **Detección**: Detecta rostros usando HOG detector
4. **Encoding**: Genera vector de 128 dimensiones
5. **Comparación**: Compara con encodings conocidos
6. **Match**: Identifica persona con nivel de confianza
7. **Notificación**: Envía webhook a Next.js
8. **Almacenamiento**: Guarda evento en PostgreSQL
9. **Visualización**: Frontend muestra resultado en tiempo real

### Flujo del Chatbot

```
User Query → Next.js API → Context Retrieval (FAQs/QA) → 
Response Generation → Database Logging → Response to User
```

1. **Consulta**: Usuario envía mensaje
2. **Contexto**: Sistema busca FAQs y QA pairs relevantes
3. **Generación**: Genera respuesta basada en contexto
4. **Registro**: Guarda interacción en base de datos
5. **Métricas**: Registra latencia y éxito
6. **Respuesta**: Devuelve respuesta al usuario

### Flujo de Registro de Cliente

```
Client Registration → Admin Approval → Facial Profile Creation → 
Encoding Generation → Sync to Flask API → Ready for Recognition
```

1. **Registro**: Cliente se registra en kiosco
2. **Aprobación**: Admin revisa y aprueba
3. **Perfil Facial**: Se captura imagen y genera encoding
4. **Almacenamiento**: Se guarda en PostgreSQL
5. **Sincronización**: Se sincroniza con Flask API
6. **Reconocimiento**: Sistema puede reconocer al cliente

## Patrones Arquitectónicos

### 1. Modelo-Vista-Controlador (MVC)

- **Modelo**: Prisma Schema (`prisma/schema.prisma`)
- **Vista**: Componentes React (`src/components/`)
- **Controlador**: API Routes (`src/app/api/`) y Servicios (`src/services/`)

### 2. Service Layer Pattern

Servicios de negocio encapsulan lógica:
- `ClientService`: Gestión de clientes
- `FacialRecognitionService`: Lógica de reconocimiento facial
- `ChatbotService`: Lógica del chatbot
- `BranchService`: Gestión de sucursales
- `CameraService`: Gestión de cámaras

### 3. Repository Pattern

Prisma ORM actúa como capa de abstracción de datos, permitiendo:
- Cambios de base de datos sin modificar lógica de negocio
- Queries optimizadas
- Migraciones controladas

### 4. API Gateway Pattern

Next.js API Routes actúan como gateway único:
- Autenticación centralizada
- Rate limiting
- Validación de entrada
- Logging y monitoreo

## Decisiones Técnicas Clave

### 1. Next.js App Router

**Decisión**: Usar App Router de Next.js 15

**Razón**:
- Mejor rendimiento con React Server Components
- Routing basado en archivos
- API Routes integradas
- Optimizaciones automáticas

### 2. Prisma ORM

**Decisión**: Prisma en lugar de TypeORM o Sequelize

**Razón**:
- Type-safety completo
- Migraciones automáticas
- Cliente generado con TypeScript
- Excelente DX (Developer Experience)

### 3. Reconocimiento Facial con Python

**Decisión**: Flask API separada con `face_recognition`

**Razón**:
- Librerías Python más maduras para CV
- `face_recognition` es simple y efectiva
- Puede escalarse independientemente
- Procesamiento pesado fuera del servidor Next.js

### 4. Chatbot Rule-based

**Decisión**: Chatbot rule-based en lugar de LLM completo

**Razón**:
- Menor costo operativo
- Respuestas más predecibles
- Control total sobre respuestas
- Puede integrarse con LLM después

### 5. PostgreSQL

**Decisión**: PostgreSQL como base de datos principal

**Razón**:
- ACID compliance
- JSON support para metadata
- Excelente soporte en Prisma
- Escalable y confiable

## Integraciones

### Hardware

- **ESP32**: Cámaras que transmiten stream HTTP
- **Raspberry Pi**: Alternativa para cámaras más potentes
- **Protocolos**: HTTP (streaming), MQTT (para dispositivos IoT)

### Servicios Externos

- **AWS RDS**: Base de datos PostgreSQL
- **AWS S3**: Almacenamiento de imágenes
- **AWS CloudWatch**: Logging y monitoreo
- **NextAuth**: Autenticación (puede extenderse con OAuth)

## Seguridad

### 1. Autenticación y Autorización

- NextAuth.js para autenticación
- Roles: ADMIN y AGENT
- JWT tokens para sesiones
- Password hashing con bcrypt

### 2. Validación de Datos

- Validación en capa de API
- Sanitización de inputs
- CSRF protection
- Rate limiting

### 3. Protección de Datos

- Encriptación de contraseñas
- HTTPS en producción
- Variables de entorno para secrets
- Audit logs para acciones sensibles

## Escalabilidad

### Horizontal

- Next.js puede escalarse con múltiples instancias
- Flask API puede escalarse independientemente
- RDS puede escalarse verticalmente
- S3 es infinitamente escalable

### Vertical

- EC2 puede aumentar tamaño de instancia
- RDS puede aumentar recursos
- Cache layer puede agregarse (Redis)

## Monitoreo y Observabilidad

### Logs

- CloudWatch Logs para aplicaciones
- Prisma query logging
- Audit logs en base de datos

### Métricas

- CloudWatch Metrics
- Chatbot metrics (latency, success rate)
- Camera status monitoring
- Detection events tracking

## Referencias

- [Documentación de Arquitectura de IA](./ARQUITECTURA_IA.md)
- [Documentación de Despliegue AWS](./DEPLOYMENT_AWS.md)
- [Documentación de Integración Hardware](./HARDWARE_INTEGRATION.md)
- [Documentación de Base de Datos](./DATABASE_ARCHITECTURE.md)

