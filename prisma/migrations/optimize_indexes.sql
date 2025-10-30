-- ============================================
-- Script SQL: Optimización de Índices e Integridad
-- Banking Agent ID System - PostgreSQL
-- ============================================

-- ============================================
-- 1. VERIFICACIÓN DE INTEGRIDAD REFERENCIAL
-- ============================================

-- Verificar claves foráneas existentes
DO $$
DECLARE
    missing_fk RECORD;
BEGIN
    FOR missing_fk IN
        SELECT 
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        RAISE NOTICE 'FK encontrada: %.% -> %.%', 
            missing_fk.table_name, missing_fk.column_name,
            missing_fk.foreign_table_name, missing_fk.foreign_column_name;
    END LOOP;
END $$;

-- ============================================
-- 2. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para búsquedas frecuentes en User
CREATE INDEX IF NOT EXISTS idx_user_email_active 
ON "User"(email) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_role_active 
ON "User"(role, is_active) WHERE is_active = true;

-- Índices para búsquedas en Client
CREATE INDEX IF NOT EXISTS idx_client_dni_status 
ON "Client"(dni) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_client_email_status 
ON "Client"(email) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_client_status_created 
ON "Client"(status, created_at DESC);

-- Índices para Branch
CREATE INDEX IF NOT EXISTS idx_branch_code_active 
ON "Branch"(code);

CREATE INDEX IF NOT EXISTS idx_branch_location 
ON "Branch"(country, city) WHERE country IS NOT NULL;

-- Índices para AgentModule
CREATE INDEX IF NOT EXISTS idx_agent_module_branch_active 
ON "AgentModule"(branch_id, is_active) WHERE is_active = true;

-- Índices para Camera
CREATE INDEX IF NOT EXISTS idx_camera_status_heartbeat 
ON "Camera"(status, last_heartbeat) WHERE status = 'ONLINE';

CREATE INDEX IF NOT EXISTS idx_camera_branch_module 
ON "Camera"(branch_id, module_id) WHERE module_id IS NOT NULL;

-- Índices para FacialProfile
CREATE INDEX IF NOT EXISTS idx_facial_profile_client_active 
ON "FacialProfile"(client_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_facial_profile_provider_active 
ON "FacialProfile"(provider, is_active) WHERE is_active = true;

-- Índices para DetectionEvent (consultas temporales críticas)
CREATE INDEX IF NOT EXISTS idx_detection_camera_time_desc 
ON "DetectionEvent"(camera_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_detection_client_time_desc 
ON "DetectionEvent"(client_id, occurred_at DESC) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_detection_status_time 
ON "DetectionEvent"(status, occurred_at DESC);

-- Índices para Visit
CREATE INDEX IF NOT EXISTS idx_visit_branch_status_time 
ON "Visit"(branch_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_visit_status_time 
ON "Visit"(status, started_at DESC) WHERE status IN ('WAITING', 'IN_SERVICE');

-- Índices para RegistrationRequest
CREATE INDEX IF NOT EXISTS idx_registration_status_created 
ON "RegistrationRequest"(status, created_at DESC) WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_registration_branch_status 
ON "RegistrationRequest"(branch_id, status) WHERE branch_id IS NOT NULL;

-- Índices para PasswordResetToken
CREATE INDEX IF NOT EXISTS idx_password_reset_token_expires 
ON "PasswordResetToken"(token, expires_at) WHERE used_at IS NULL;

-- Índices para FAQ (búsquedas de texto)
CREATE INDEX IF NOT EXISTS idx_faq_status_tags 
ON "FAQ"(status) WHERE status = 'PUBLISHED';

-- Índice GIN para búsqueda en tags array
CREATE INDEX IF NOT EXISTS idx_faq_tags_gin 
ON "FAQ" USING GIN(tags) WHERE status = 'PUBLISHED';

-- Índices para QAPair
CREATE INDEX IF NOT EXISTS idx_qa_pair_active_created 
ON "QAPair"(is_active, created_at DESC) WHERE is_active = true;

-- Índices para ChatSession
CREATE INDEX IF NOT EXISTS idx_chat_session_client_active 
ON "ChatSession"(client_id, started_at DESC) WHERE client_id IS NOT NULL AND ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_session_temp_active 
ON "ChatSession"(temp_visitor_id, started_at DESC) WHERE temp_visitor_id IS NOT NULL AND ended_at IS NULL;

-- Índices para ChatMessage
CREATE INDEX IF NOT EXISTS idx_chat_message_session_time 
ON "ChatMessage"(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_message_actor_time 
ON "ChatMessage"(actor, created_at DESC);

-- Índices para CameraLog
CREATE INDEX IF NOT EXISTS idx_camera_log_camera_time_desc 
ON "CameraLog"(camera_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_camera_log_level_time 
ON "CameraLog"(level, created_at DESC) WHERE level IN ('ERROR', 'WARN');

-- Índices para AuditLog
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_time 
ON "AuditLog"(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_target_time 
ON "AuditLog"(target_client_id, created_at DESC) WHERE target_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_action_time 
ON "AuditLog"(action, created_at DESC);

-- ============================================
-- 3. ANÁLISIS DE ESTADÍSTICAS
-- ============================================

-- Actualizar estadísticas del optimizador
ANALYZE "User";
ANALYZE "Client";
ANALYZE "Branch";
ANALYZE "AgentModule";
ANALYZE "Camera";
ANALYZE "FacialProfile";
ANALYZE "DetectionEvent";
ANALYZE "Visit";
ANALYZE "RegistrationRequest";
ANALYZE "PasswordResetToken";
ANALYZE "FAQ";
ANALYZE "QAPair";
ANALYZE "ChatSession";
ANALYZE "ChatMessage";
ANALYZE "CameraLog";
ANALYZE "AuditLog";

-- ============================================
-- 4. VERIFICACIÓN DE ÍNDICES CREADOS
-- ============================================

-- Listar todos los índices creados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================
-- 5. CONSULTAS DE CHEQUEO DE INTEGRIDAD
-- ============================================

-- Verificar integridad referencial: Detecciones huérfanas
SELECT COUNT(*) as orphan_detections
FROM "DetectionEvent" d
LEFT JOIN "Camera" c ON d.camera_id = c.id
WHERE c.id IS NULL;

-- Verificar integridad referencial: Visitas huérfanas
SELECT COUNT(*) as orphan_visits
FROM "Visit" v
LEFT JOIN "Branch" b ON v.branch_id = b.id
WHERE b.id IS NULL;

-- Verificar integridad referencial: Registros huérfanos
SELECT COUNT(*) as orphan_registrations
FROM "RegistrationRequest" r
LEFT JOIN "Client" c ON r.client_id = c.id
WHERE c.id IS NULL;

-- Verificar integridad referencial: Sesiones de chat huérfanas
SELECT COUNT(*) as orphan_chat_sessions
FROM "ChatSession" cs
WHERE cs.client_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM "Client" c WHERE c.id = cs.client_id);

-- Verificar integridad referencial: Mensajes huérfanos
SELECT COUNT(*) as orphan_messages
FROM "ChatMessage" cm
LEFT JOIN "ChatSession" cs ON cm.session_id = cs.id
WHERE cs.id IS NULL;

-- Verificar claves foráneas con datos inconsistentes
SELECT 
    'Camera' as table_name,
    COUNT(*) as orphan_records
FROM "Camera" cam
LEFT JOIN "Branch" br ON cam.branch_id = br.id
WHERE br.id IS NULL

UNION ALL

SELECT 
    'FacialProfile',
    COUNT(*)
FROM "FacialProfile" fp
LEFT JOIN "Client" cl ON fp.client_id = cl.id
WHERE cl.id IS NULL

UNION ALL

SELECT 
    'AgentModule',
    COUNT(*)
FROM "AgentModule" am
LEFT JOIN "Branch" br ON am.branch_id = br.id
WHERE br.id IS NULL;

-- ============================================
-- 6. OPTIMIZACIONES ADICIONALES
-- ============================================

-- Vacuum y reindexación (ejecutar en horarios de bajo tráfico)
-- VACUUM ANALYZE;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

