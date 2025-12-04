# Arquitectura de Base de Datos

Esta documentación describe la arquitectura completa de la base de datos PostgreSQL del sistema Banking Agent ID, incluyendo el esquema Prisma, relaciones, índices, optimizaciones y estrategias de backup.

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Modelo de Datos](#modelo-de-datos)
4. [Relaciones Entre Entidades](#relaciones-entre-entidades)
5. [Índices y Optimizaciones](#índices-y-optimizaciones)
6. [Enums y Tipos](#enums-y-tipos)
7. [Estrategias de Backup](#estrategias-de-backup)
8. [Mantenimiento](#mantenimiento)
9. [Escalabilidad](#escalabilidad)
10. [Seguridad](#seguridad)

## Descripción General

La base de datos PostgreSQL almacena toda la información del sistema:
- Usuarios y clientes
- Sucursales y módulos
- Perfiles faciales y detecciones
- Visitas y citas
- Conversaciones del chatbot
- FAQs y base de conocimiento
- Dispositivos IoT
- Logs y auditoría

## Tecnologías Utilizadas

### PostgreSQL

- **Versión Mínima**: PostgreSQL 14+
- **Recomendado**: PostgreSQL 15.4+
- **Características Utilizadas**:
  - JSON/JSONB para metadata flexible
  - Índices compuestos
  - Foreign keys con cascading
  - Full-text search (futuro)
  - Arrays para tags

### Prisma ORM

- **Versión**: Prisma 6.19+
- **Características**:
  - Type-safe queries
  - Migraciones automáticas
  - Cliente generado con TypeScript
  - Validación de esquema

## Modelo de Datos

### Entidades Principales

#### User (Usuarios del Sistema)

Almacena administradores y agentes del sistema.

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  phone             String?
  role              Role      @default(AGENT)  // ADMIN | AGENT
  isActive          Boolean   @default(true)
  password          String?
  passwordUpdatedAt DateTime?
  image             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  branches  Branch[]
  approvals RegistrationRequest[]
  cameras   Camera[]
  auditLogs AuditLog[]
  
  @@index([email])
  @@index([role, isActive])
}
```

**Características**:
- Autenticación con NextAuth
- Roles para autorización
- Soft delete mediante `isActive`

#### Client (Clientes)

Clientes/visitantes del agente bancario.

```prisma
model Client {
  id                String       @id @default(cuid())
  dni               String?      @unique
  name              String?
  email             String?      @unique
  phone             String?
  status            ClientStatus @default(ACTIVE)  // ACTIVE | BLOCKED | DELETED
  hashedPassword    String?
  passwordUpdatedAt DateTime?
  locale            String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  facialProfiles   FacialProfile[]
  detections       DetectionEvent[]
  visits           Visit[]
  appointments     Appointment[]
  chatSessions     ChatSession[]
  chatMetrics      ChatMetric[]
  registrationReqs RegistrationRequest[]
  resetTokens      PasswordResetToken[]
  auditLogs        AuditLog[]
  
  @@index([dni])
  @@index([email])
  @@index([status, createdAt])
  @@index([phone])
}
```

**Características**:
- DNI único para identificación
- Email opcional pero único si existe
- Estado para control de acceso
- Soft delete mediante status

#### Branch (Sucursales)

Ubicaciones físicas de agentes bancarios.

```prisma
model Branch {
  id      String  @id @default(cuid())
  name    String
  code    String  @unique
  address String?
  city    String?
  country String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  modules          AgentModule[]
  cameras          Camera[]
  admins           User[]
  visits           Visit[]
  appointments     Appointment[]
  registrationReqs RegistrationRequest[]
  
  @@index([code])
  @@index([country, city])
}
```

**Características**:
- Código único por sucursal
- Multi-tenant por sucursal
- Índice compuesto para búsquedas geográficas

#### FacialProfile (Perfiles Faciales)

Almacena encodings faciales de clientes.

```prisma
model FacialProfile {
  id             String  @id @default(cuid())
  clientId       String
  provider       String  // "python-api", "aws-rekognition", etc.
  providerFaceId String? @unique
  version        String?
  embedding      Json?   // Vector de 128 dimensiones
  imageUrl       String?
  isActive       Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([clientId])
  @@index([provider])
}
```

**Características**:
- Encoding almacenado como JSON (array de 128 números)
- Soporte para múltiples proveedores
- Versión del modelo para tracking
- Soft delete mediante `isActive`

#### DetectionEvent (Eventos de Detección)

Registra todas las detecciones faciales.

```prisma
model DetectionEvent {
  id          String          @id @default(cuid())
  cameraId    String
  clientId    String?         // Null si no hubo match
  status      DetectionStatus // MATCHED | NEW_FACE | MULTIPLE_MATCHES | UNKNOWN
  confidence  Float?
  snapshotUrl String?
  metadata    Json?           // Bounding boxes, landmarks, etc.
  occurredAt  DateTime        @default(now())
  
  camera Camera  @relation(fields: [cameraId], references: [id], onDelete: Cascade)
  client Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)
  visit  Visit?
  
  @@index([cameraId, occurredAt])
  @@index([clientId, occurredAt])
  @@index([status])
  @@index([status, occurredAt])
}
```

**Características**:
- Alta frecuencia de escritura
- Índices compuestos para queries temporales
- Metadata flexible en JSON

#### Visit (Visitas)

Registra visitas de clientes a sucursales.

```prisma
model Visit {
  id          String      @id @default(cuid())
  clientId    String?
  branchId    String
  moduleId    String?
  detectionId String?     @unique
  status      VisitStatus // WAITING | IN_SERVICE | COMPLETED | ABANDONED
  purpose     String?
  startedAt   DateTime    @default(now())
  assignedAt  DateTime?
  finishedAt  DateTime?
  
  client    Client?
  branch    Branch
  module    AgentModule?
  detection DetectionEvent?
  
  @@index([branchId, startedAt])
  @@index([status])
  @@index([clientId, status])
}
```

**Características**:
- Estados de visita rastreables
- Timestamps para métricas
- Relación opcional con detección

#### ChatSession y ChatMessage

Sesiones y mensajes del chatbot.

```prisma
model ChatSession {
  id            String    @id @default(cuid())
  clientId      String?
  tempVisitorId String?
  startedAt     DateTime  @default(now())
  endedAt       DateTime?
  
  client   Client?
  messages ChatMessage[]
  metrics  ChatMetric[]
  
  @@index([clientId, startedAt])
  @@index([tempVisitorId])
  @@index([startedAt])
}

model ChatMessage {
  id        String    @id @default(cuid())
  sessionId String
  actor     ChatActor // CLIENT | BOT | AGENT
  content   String
  intent    String?
  metadata  Json?
  createdAt DateTime  @default(now())
  
  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@index([sessionId, createdAt])
  @@index([actor])
  @@index([intent])
}
```

**Características**:
- Soporte para visitantes no registrados
- Tracking de intenciones
- Metadata flexible

## Relaciones Entre Entidades

### Diagrama de Relaciones Principales

```
User (1) ────< (N) Branch (Admins)
User (1) ────< (N) Camera (Owner)
User (1) ────< (N) RegistrationRequest (Approver)
User (1) ────< (N) AuditLog (Actor)

Client (1) ────< (N) FacialProfile
Client (1) ────< (N) DetectionEvent
Client (1) ────< (N) Visit
Client (1) ────< (N) Appointment
Client (1) ────< (N) ChatSession
Client (1) ────< (N) RegistrationRequest

Branch (1) ────< (N) AgentModule
Branch (1) ────< (N) Camera
Branch (1) ────< (N) Visit
Branch (1) ────< (N) Appointment

Camera (1) ────< (N) DetectionEvent
Camera (1) ────< (N) CameraLog

DetectionEvent (1) ────< (1) Visit

ChatSession (1) ────< (N) ChatMessage
ChatSession (1) ────< (N) ChatMetric
```

### Cascading Rules

- **Cascade Delete**: Al eliminar Branch, se eliminan módulos y cámaras
- **SetNull**: Al eliminar Client, se mantienen detecciones pero sin cliente
- **Restrict**: Prevenir eliminaciones que romperían integridad

## Índices y Optimizaciones

### Índices Existentes

#### Índices de Búsqueda

```sql
-- User
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- Client
CREATE INDEX "Client_dni_idx" ON "Client"("dni");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_status_createdAt_idx" ON "Client"("status", "createdAt");
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- DetectionEvent (alta frecuencia)
CREATE INDEX "DetectionEvent_cameraId_occurredAt_idx" ON "DetectionEvent"("cameraId", "occurredAt");
CREATE INDEX "DetectionEvent_clientId_occurredAt_idx" ON "DetectionEvent"("clientId", "occurredAt");
CREATE INDEX "DetectionEvent_status_idx" ON "DetectionEvent"("status");
CREATE INDEX "DetectionEvent_status_occurredAt_idx" ON "DetectionEvent"("status", "occurredAt");

-- Visit
CREATE INDEX "Visit_branchId_startedAt_idx" ON "Visit"("branchId", "startedAt");
CREATE INDEX "Visit_status_idx" ON "Visit"("status");
CREATE INDEX "Visit_clientId_status_idx" ON "Visit"("clientId", "status");

-- ChatMessage
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");
CREATE INDEX "ChatMessage_actor_idx" ON "ChatMessage"("actor");
CREATE INDEX "ChatMessage_intent_idx" ON "ChatMessage"("intent");
```

### Optimizaciones Adicionales

#### Particionado de Tablas (Futuro)

Para `DetectionEvent` (alta frecuencia):

```sql
-- Particionar por mes
CREATE TABLE DetectionEvent_2024_01 PARTITION OF DetectionEvent
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE DetectionEvent_2024_02 PARTITION OF DetectionEvent
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

#### Full-Text Search (Futuro)

Para búsqueda en FAQs y QA:

```sql
-- Agregar columna de búsqueda
ALTER TABLE "FAQ" ADD COLUMN search_vector tsvector;

-- Crear índice GIN
CREATE INDEX faq_search_idx ON "FAQ" USING gin(search_vector);

-- Actualizar trigger
CREATE TRIGGER faq_search_update BEFORE INSERT OR UPDATE ON "FAQ"
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(
  search_vector, 'pg_catalog.spanish', title, answer
);
```

#### Índices Parciales

Para queries frecuentes:

```sql
-- Solo FAQs publicadas
CREATE INDEX faq_published_idx ON "FAQ"("status", "createdAt")
WHERE status = 'PUBLISHED';

-- Solo detecciones recientes
CREATE INDEX detection_recent_idx ON "DetectionEvent"("occurredAt")
WHERE occurredAt > NOW() - INTERVAL '30 days';
```

### Análisis y Mantenimiento de Índices

```sql
-- Analizar uso de índices
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Reindexar periódicamente
REINDEX TABLE "DetectionEvent";
ANALYZE "DetectionEvent";
```

## Enums y Tipos

### Enums Definidos

```prisma
enum Role { ADMIN, AGENT }
enum ClientStatus { ACTIVE, BLOCKED, DELETED }
enum CameraStatus { ONLINE, OFFLINE, ERROR }
enum DetectionStatus { MATCHED, NEW_FACE, MULTIPLE_MATCHES, UNKNOWN }
enum RegistrationStatus { PENDING, APPROVED, REJECTED, CANCELLED }
enum VisitStatus { WAITING, IN_SERVICE, COMPLETED, ABANDONED }
enum AppointmentStatus { SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }
enum ChatActor { CLIENT, BOT, AGENT }
enum FAQStatus { DRAFT, PUBLISHED, ARCHIVED }
enum DeviceProtocol { MQTT, HTTP, Serial }
enum DeviceConnectionStatus { CONNECTING, CONNECTED, DISCONNECTED, ERROR, RECONNECTING }
```

**Ventajas**:
- Validación a nivel de base de datos
- Queries más eficientes
- Type-safety en Prisma

## Estrategias de Backup

### Backup Automático RDS

**Configuración**:
- **Retention**: 7 días
- **Window**: 03:00-04:00 UTC
- **Multi-AZ**: Snapshots automáticos

### Backup Manual

```bash
# Backup completo
pg_dump -h banking-agent-db.xxxxx.us-east-1.rds.amazonaws.com \
  -U admin \
  -d banking_agent_db \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# Backup solo esquema
pg_dump -h ... -U admin -d banking_agent_db \
  --schema-only -f schema_backup.sql

# Backup solo datos
pg_dump -h ... -U admin -d banking_agent_db \
  --data-only -f data_backup.sql
```

### Backup de Tablas Específicas

```bash
# Backup de detecciones recientes
pg_dump -h ... -U admin -d banking_agent_db \
  -t "DetectionEvent" \
  --where="occurredAt > NOW() - INTERVAL '30 days'" \
  -f detections_recent.dump
```

### Restauración

```bash
# Restaurar backup completo
pg_restore -h ... -U admin -d banking_agent_db \
  -c backup_20240115.dump

# Restaurar desde SQL
psql -h ... -U admin -d banking_agent_db < schema_backup.sql
```

## Mantenimiento

### Vacuum y Analyze

```sql
-- Vacuum automático (configurar en postgresql.conf)
autovacuum = on
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1

-- Vacuum manual para tablas grandes
VACUUM ANALYZE "DetectionEvent";

-- Vacuum completo (bloqueante)
VACUUM FULL "DetectionEvent";
```

### Limpieza de Datos Antiguos

```sql
-- Archivar detecciones antiguas (>90 días)
CREATE TABLE DetectionEvent_archive (LIKE "DetectionEvent" INCLUDING ALL);

INSERT INTO DetectionEvent_archive
SELECT * FROM "DetectionEvent"
WHERE occurredAt < NOW() - INTERVAL '90 days';

DELETE FROM "DetectionEvent"
WHERE occurredAt < NOW() - INTERVAL '90 days';
```

### Monitoreo de Tamaño

```sql
-- Tamaño de tablas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Tamaño de base de datos
SELECT pg_size_pretty(pg_database_size('banking_agent_db'));
```

## Escalabilidad

### Read Replicas (RDS)

Para distribuir carga de lectura:

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier banking-agent-db-read-1 \
  --source-db-instance-identifier banking-agent-db
```

### Connection Pooling

Usar PgBouncer o Prisma Connection Pooling:

```typescript
// En Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=10&pool_timeout=20"
    }
  }
})
```

### Sharding (Futuro)

Para escalar horizontalmente:
- Shard por `branchId` o `clientId`
- Usar herramientas como Citus o aplicación custom

## Seguridad

### Encriptación

- **En Tránsito**: SSL/TLS obligatorio
- **En Reposo**: RDS encryption habilitado
- **Connection String**: Usar SSL en DATABASE_URL

```typescript
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Roles y Permisos

```sql
-- Crear rol de solo lectura
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE banking_agent_db TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Crear usuario para reporting
CREATE USER reporter WITH PASSWORD 'secure_password';
GRANT readonly TO reporter;
```

### Audit Logging

El modelo `AuditLog` registra acciones sensibles:

```sql
-- Verificar actividad sospechosa
SELECT *
FROM "AuditLog"
WHERE action LIKE '%DELETE%'
  AND createdAt > NOW() - INTERVAL '1 day'
ORDER BY createdAt DESC;
```

### Row Level Security (Futuro)

Para multi-tenant más estricto:

```sql
ALTER TABLE "Visit" ENABLE ROW LEVEL SECURITY;

CREATE POLICY branch_isolation ON "Visit"
  FOR ALL
  USING (branch_id = current_setting('app.current_branch_id')::text);
```

## Referencias

- [Prisma Schema](../prisma/schema.prisma)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

