# 🏧 Módulo Kiosco - Sistema de Identificación Bancaria

## 📋 Descripción General

El **Módulo Kiosco** es la interfaz de autoservicio para clientes en los módulos físicos del banco. Permite identificación facial automática, registro de nuevos clientes, login manual y chat con asistente virtual.

## 🎯 Características Principales

### 1. **Identificación Facial Automática**
- Detección y reconocimiento facial en tiempo real
- Acceso a cámara del dispositivo
- Integración con sistema de detección (DetectionEvent)
- Feedback visual del proceso de reconocimiento

### 2. **Flujo de Registro Guiado (Wizard)**
- **Paso 1**: Datos personales (nombre, DNI, email, teléfono)
- **Paso 2**: Configuración de contraseña
- **Paso 3**: Captura de foto para reconocimiento facial
- **Paso 4**: Revisión de información
- **Paso 5**: Confirmación y estado pendiente de aprobación

### 3. **Login Manual**
- Autenticación con DNI y contraseña
- Validaciones de seguridad
- Manejo de estados de cuenta (activo, bloqueado, eliminado)
- Recuperación de contraseña

### 4. **Chat con Asistente Virtual**
- Chat en tiempo real sin necesidad de autenticación
- Respuestas rápidas (quick replies)
- Integración con MCP tools (FAQ/QA search)
- Respuestas contextuales basadas en palabras clave

### 5. **Pantalla de Bienvenida**
- Vista personalizada después de identificación exitosa
- Estadísticas del cliente (última visita, documentos pendientes)
- Accesos rápidos a servicios
- Creación automática de visitas

## 📁 Estructura de Archivos

```
src/app/kiosk/
├── layout.tsx                    # Layout principal del kiosco
├── page.tsx                      # Página de inicio con detección facial
├── register/
│   └── page.tsx                  # Wizard de registro (5 pasos)
├── login/
│   └── page.tsx                  # Login manual
├── reset-password/
│   └── page.tsx                  # Recuperación de contraseña
├── chat/
│   └── page.tsx                  # Chat con asistente virtual
└── welcome/
    └── page.tsx                  # Pantalla de bienvenida personalizada

src/app/api/kiosk/
├── detect/
│   └── route.ts                  # POST - Detección facial
├── chat/
│   └── route.ts                  # POST - Chat con asistente
├── client/
│   └── [id]/
│       └── route.ts              # GET - Datos del cliente
└── visit/
    └── route.ts                  # POST - Crear visita

src/app/api/auth/client/
├── login/
│   └── route.ts                  # POST - Login de clientes
└── reset-password/
    └── route.ts                  # POST - Solicitar reset password
```

## 🔌 API Endpoints

### Detección Facial
```typescript
POST /api/kiosk/detect
Body: {
  cameraId: string,
  timestamp: string
}
Response: {
  status: 'recognized' | 'unknown' | 'error',
  clientId?: string,
  clientName?: string,
  confidence?: number,
  message: string
}
```

### Chat
```typescript
POST /api/kiosk/chat
Body: {
  sessionId: string,
  message: string,
  clientId?: string
}
Response: {
  response: string,
  metadata?: object
}
```

### Login
```typescript
POST /api/auth/client/login
Body: {
  dni: string,
  password: string
}
Response: {
  client: {
    id: string,
    name: string,
    email: string,
    status: string
  },
  message: string
}
```

### Crear Visita
```typescript
POST /api/kiosk/visit
Body: {
  clientId: string,
  purpose: string,
  branchId?: string
}
Response: {
  visitId: string,
  status: VisitStatus,
  message: string
}
```

### Datos de Cliente
```typescript
GET /api/kiosk/client/[id]
Response: {
  id: string,
  name: string,
  email: string,
  lastVisit?: Date,
  pendingDocuments?: number,
  upcomingAppointments?: number
}
```

## 🎨 Características de UI/UX

### Optimizado para Pantallas Táctiles
- **Botones grandes**: Altura mínima de 48px (h-12, h-14)
- **Texto legible**: Tamaños de fuente grandes (text-lg, text-xl)
- **Espaciado generoso**: Padding y margins amplios
- **Iconos claros**: Lucide icons con tamaños grandes

### Diseño Visual
- **Gradientes**: Fondos con gradientes sutiles
- **Cards elevadas**: Sombras y efectos hover
- **Colores semánticos**: 
  - Verde para éxito/activo
  - Azul para acciones principales
  - Rojo para errores/alertas
  - Naranja/Amarillo para advertencias
  - Púrpura para chat/asistente

### Feedback Visual
- **Loading states**: Spinners y estados de carga
- **Animaciones**: Transiciones suaves
- **Progress indicators**: Barras de progreso en wizard
- **Estados de mensaje**: Typing indicators en chat

## 🔐 Seguridad

### Autenticación
- Contraseñas hasheadas con bcrypt
- Tokens de reset con expiración (1 hora)
- Validación de estado de cuenta

### Privacidad
- No revelar si un email existe en reset password
- Datos sensibles no expuestos en respuestas
- Consentimiento explícito para captura facial

### Validaciones
- DNI: 8 dígitos
- Teléfono: 9 dígitos
- Email: Formato válido
- Contraseña: Mínimo 6 caracteres

## 🚀 Flujos de Usuario

### Flujo 1: Cliente Reconocido
```
1. Cliente se para frente al kiosco
2. Sistema detecta rostro automáticamente
3. Match exitoso con perfil existente
4. Muestra pantalla de bienvenida personalizada
5. Cliente selecciona servicio
6. Se crea Visit automáticamente
```

### Flujo 2: Cliente Nuevo
```
1. Cliente se para frente al kiosco
2. Sistema no reconoce rostro
3. Cliente selecciona "Soy Nuevo Cliente"
4. Completa wizard de registro (5 pasos)
5. Solicitud queda pendiente de aprobación
6. Cliente recibe confirmación por email
```

### Flujo 3: Login Manual
```
1. Cliente selecciona "Ya Tengo Cuenta"
2. Ingresa DNI y contraseña
3. Sistema valida credenciales
4. Redirige a pantalla de bienvenida
5. Cliente accede a servicios
```

### Flujo 4: Chat Anónimo
```
1. Cliente selecciona "Solo Tengo Preguntas"
2. Accede a chat sin autenticación
3. Hace preguntas al asistente virtual
4. Recibe respuestas de FAQ/QA
5. Opción de hablar con agente humano
```

## 📊 Integración con Base de Datos

### Tablas Utilizadas
- **Client**: Datos del cliente
- **DetectionEvent**: Eventos de detección facial
- **Visit**: Visitas al banco
- **ChatSession**: Sesiones de chat
- **ChatMessage**: Mensajes del chat
- **PasswordResetToken**: Tokens de reset
- **Camera**: Cámaras del kiosco

### Relaciones
```
Client --1:N--> DetectionEvent
Client --1:N--> Visit
Client --1:N--> ChatSession
ChatSession --1:N--> ChatMessage
Camera --1:N--> DetectionEvent
```

## 🔄 Estados del Sistema

### Estados de Detección
- `idle`: Esperando inicio
- `detecting`: Procesando detección
- `recognized`: Cliente reconocido
- `unknown`: Cliente no reconocido
- `error`: Error en detección

### Estados de Visita (VisitStatus)
- `WAITING`: Cliente esperando atención
- `IN_SERVICE`: Siendo atendido
- `COMPLETED`: Atención completada
- `ABANDONED`: Cliente abandonó cola

### Estados de Cliente (ClientStatus)
- `ACTIVE`: Cuenta activa
- `BLOCKED`: Cuenta bloqueada
- `DELETED`: Cuenta eliminada

## 🎯 Próximos Pasos (Mejoras Futuras)

### Fase 1: Funcionalidad Básica ✅
- [x] Layout y navegación
- [x] Detección facial (stub)
- [x] Registro de clientes
- [x] Login manual
- [x] Chat básico

### Fase 2: Integraciones (Pendiente)
- [ ] Integración con Azure Face API / AWS Rekognition
- [ ] Envío de emails (reset password, confirmaciones)
- [ ] Integración con Anthropic para chat avanzado
- [ ] WebSockets para actualizaciones en tiempo real

### Fase 3: Mejoras de UX (Pendiente)
- [ ] Modo oscuro
- [ ] Soporte multiidioma (quechua, inglés)
- [ ] Accesibilidad (ARIA, screen readers)
- [ ] Tutorial interactivo para nuevos usuarios

### Fase 4: Analytics (Pendiente)
- [ ] Tracking de uso del kiosco
- [ ] Métricas de conversión (registro → aprobación)
- [ ] Análisis de preguntas frecuentes
- [ ] Heatmaps de interacción

## 📝 Notas Técnicas

### Dependencias Principales
- **Next.js 15**: App Router, Server Components
- **React 19**: Client components con hooks
- **TypeScript**: Tipado fuerte
- **Prisma**: ORM para base de datos
- **Lucide Icons**: Iconografía
- **ShadCN UI**: Componentes base

### Consideraciones de Rendimiento
- Lazy loading de componentes pesados
- Optimistic UI updates
- Cache de respuestas de chat
- Throttling de detección facial

### Testing
- Unit tests pendientes para utils
- Integration tests para API endpoints
- E2E tests para flujos críticos
- Visual regression tests

## 📞 Soporte

Para problemas o preguntas sobre el módulo kiosco:
- Revisar logs en `/api/kiosk/*`
- Verificar estado de cámaras en panel admin
- Consultar documentación de MCP tools
- Contactar al equipo de desarrollo

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
**Estado**: ✅ Funcional (Stub mode)

