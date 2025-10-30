-- =====================================================
-- Script de Optimización de Base de Datos
-- Banking Agent ID System - PostgreSQL
-- =====================================================
-- 
-- Este script incluye:
-- 1. Índices adicionales para consultas frecuentes
-- 2. Verificación de integridad referencial
-- 3. Índices compuestos para consultas complejas
-- =====================================================

-- =====================================================
-- 1. VERIFICACIÓN DE INTEGRIDAD REFERENCIAL
-- =====================================================

-- Verificar claves foráneas existentes
DO $$
BEGIN
    RAISE NOTICE '=== Verificación de Integridad Referencial ===';
    
    -- Verificar relaciones User -> Branch
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%BranchAdmins%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✓ Relación User -> Branch (BranchAdmins) existe';
    ELSE
        RAISE NOTICE '✗ Relación User -> Branch (BranchAdmins) NO encontrada';
    END IF;
    
    -- Verificar relaciones Client -> ChatSession
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%ChatSession_clientId%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✓ Relación Client -> ChatSession existe';
    ELSE
        RAISE NOTICE '✗ Relación Client -> ChatSession NO encontrada';
    END IF;
    
    -- Verificar relaciones Camera -> Branch
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%Camera_branchId%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '✓ Relación Camera -> Branch existe';
    ELSE
        RAISE NOTICE '✗ Relación Camera -> Branch NO encontrada';
    END IF;
END $$;

-- =====================================================
-- 2. ÍNDICES ADICIONALES PARA CONSULTAS FRECUENTES
-- =====================================================

-- Índice compuesto para búsquedas de usuarios por email y estado
CREATE INDEX IF NOT EXISTS idx_user_email_active 
ON "User"(email, "isActive");

-- Índice para búsquedas de clientes por DNI y estado
CREATE INDEX IF NOT EXISTS idx_client_dni_status 
ON "Client"(dni, status);

-- Índice para búsquedas de clientes por email y estado
CREATE INDEX IF NOT EXISTS idx_client_email_status 
ON "Client"(email, status);

-- Índice compuesto para búsquedas de sucursales por código y ciudad
CREATE INDEX IF NOT EXISTS idx_branch_code_city 
ON "Branch"(code, city);

-- Índice para búsquedas de cámaras por estado y última actualización
CREATE INDEX IF NOT EXISTS idx_camera_status_heartbeat 
ON "Camera"(status, "lastHeartbeat");

-- Índice compuesto para búsquedas de detecciones por cliente y fecha
CREATE INDEX IF NOT EXISTS idx_detection_client_date 
ON "DetectionEvent"("clientId", "occurredAt" DESC);

-- Índice compuesto para búsquedas de visitas por sucursal y estado
CREATE INDEX IF NOT EXISTS idx_visit_branch_status 
ON "Visit"("branchId", status);

-- Índice compuesto para búsquedas de visitas por cliente y fecha
CREATE INDEX IF NOT EXISTS idx_visit_client_started 
ON "Visit"("clientId", "startedAt" DESC);

-- Índice para búsquedas de solicitudes de registro por estado y fecha
CREATE INDEX IF NOT EXISTS idx_registration_status_created 
ON "RegistrationRequest"(status, "createdAt" DESC);

-- Índice compuesto para búsquedas de FAQs por estado y tags
CREATE INDEX IF NOT EXISTS idx_faq_status_tags 
ON "FAQ"(status) 
INCLUDE (tags);

-- Índice GIN para búsqueda full-text en FAQs (título y respuesta)
CREATE INDEX IF NOT EXISTS idx_faq_fulltext 
ON "FAQ" 
USING gin(to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(answer, '')));

-- Índice GIN para búsqueda en array de tags de FAQs
CREATE INDEX IF NOT EXISTS idx_faq_tags_gin 
ON "FAQ" 
USING gin(tags);

-- Índice para búsquedas de QA pairs por estado y búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_qapair_active_created 
ON "QAPair"("isActive", "createdAt" DESC);

-- Índice GIN para búsqueda full-text en QA pairs
CREATE INDEX IF NOT EXISTS idx_qapair_fulltext 
ON "QAPair" 
USING gin(to_tsvector('spanish', coalesce(question, '') || ' ' || coalesce(answer, '')));

-- Índice compuesto para búsquedas de sesiones de chat por cliente y fecha
CREATE INDEX IF NOT EXISTS idx_chatsession_client_started 
ON "ChatSession"("clientId", "startedAt" DESC);

-- Índice compuesto para búsquedas de mensajes por sesión y fecha
CREATE INDEX IF NOT EXISTS idx_chatmessage_session_created 
ON "ChatMessage"("sessionId", "createdAt" DESC);

-- Índice compuesto para búsquedas de mensajes por actor y fecha
CREATE INDEX IF NOT EXISTS idx_chatmessage_actor_created 
ON "ChatMessage"(actor, "createdAt" DESC);

-- Índice para búsquedas de logs de auditoría por acción y fecha
CREATE INDEX IF NOT EXISTS idx_auditlog_action_created 
ON "AuditLog"(action, "createdAt" DESC);

-- Índice compuesto para búsquedas de tokens de reset por cliente y expiración
CREATE INDEX IF NOT EXISTS idx_resettoken_client_expires 
ON "PasswordResetToken"("clientId", "expiresAt");

-- Índice para búsquedas de perfiles faciales por proveedor y estado
CREATE INDEX IF NOT EXISTS idx_facialprofile_provider_active 
ON "FacialProfile"(provider, "isActive");

-- =====================================================
-- 3. ÍNDICES PARA CONSULTAS DE AGRUPACIÓN Y ESTADÍSTICAS
-- =====================================================

-- Índice para consultas de estadísticas de visitas por sucursal
CREATE INDEX IF NOT EXISTS idx_visit_branch_status_started 
ON "Visit"("branchId", status, "startedAt" DESC);

-- Índice para consultas de estadísticas de detecciones por cámara
CREATE INDEX IF NOT EXISTS idx_detection_camera_status_date 
ON "DetectionEvent"("cameraId", status, "occurredAt" DESC);

-- Índice para consultas de logs de cámara por nivel y fecha
CREATE INDEX IF NOT EXISTS idx_cameralog_camera_level_created 
ON "CameraLog"("cameraId", level, "createdAt" DESC);

-- =====================================================
-- 4. ANÁLISIS Y OPTIMIZACIÓN
-- =====================================================

-- Analizar tablas para optimizar el plan de ejecución
ANALYZE "User";
ANALYZE "Client";
ANALYZE "Branch";
ANALYZE "Camera";
ANALYZE "DetectionEvent";
ANALYZE "Visit";
ANALYZE "RegistrationRequest";
ANALYZE "FAQ";
ANALYZE "QAPair";
ANALYZE "ChatSession";
ANALYZE "ChatMessage";
ANALYZE "AuditLog";

-- =====================================================
-- 5. VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Mostrar todos los índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 6. ESTADÍSTICAS DE ÍNDICES
-- =====================================================

-- Mostrar estadísticas de uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

