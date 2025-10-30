-- =====================================================
-- Script de Verificación de Integridad Referencial
-- Banking Agent ID System - PostgreSQL
-- =====================================================
-- 
-- Este script verifica la integridad referencial de la base de datos
-- y detecta posibles problemas en las relaciones.
-- =====================================================

-- =====================================================
-- 1. VERIFICACIÓN DE CLAVES FORÁNEAS
-- =====================================================

DO $$
DECLARE
    fk_record RECORD;
    broken_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Verificación de Integridad Referencial ===';
    RAISE NOTICE '';
    
    -- Verificar todas las claves foráneas
    FOR fk_record IN
        SELECT
            tc.table_name AS child_table,
            kcu.column_name AS child_column,
            ccu.table_name AS parent_table,
            ccu.column_name AS parent_column,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        -- Verificar si hay registros huérfanos
        EXECUTE format(
            'SELECT COUNT(*) FROM %I WHERE %I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I WHERE %I = %I.%I)',
            fk_record.child_table,
            fk_record.child_column,
            fk_record.parent_table,
            fk_record.parent_column,
            fk_record.child_table,
            fk_record.child_column
        ) INTO broken_count;
        
        IF broken_count > 0 THEN
            RAISE WARNING '⚠ Tabla %: % registros huérfanos en columna % -> %',
                fk_record.child_table,
                broken_count,
                fk_record.child_column,
                fk_record.parent_table;
        ELSE
            RAISE NOTICE '✓ %: % -> % (OK)',
                fk_record.child_table,
                fk_record.child_column,
                fk_record.parent_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Verificación completada ===';
END $$;

-- =====================================================
-- 2. VERIFICACIÓN DE ÍNDICES
-- =====================================================

DO $$
DECLARE
    idx_record RECORD;
    missing_indices TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Verificación de Índices Críticos ===';
    RAISE NOTICE '';
    
    -- Lista de índices esperados
    DECLARE
        expected_indices TEXT[] := ARRAY[
            'idx_user_email_active',
            'idx_client_dni_status',
            'idx_client_email_status',
            'idx_detection_client_date',
            'idx_visit_branch_status',
            'idx_chatsession_client_started',
            'idx_chatmessage_session_created',
            'idx_faq_status_tags',
            'idx_qapair_active_created'
        ];
        idx_name TEXT;
    BEGIN
        FOREACH idx_name IN ARRAY expected_indices
        LOOP
            SELECT indexname INTO idx_record
            FROM pg_indexes
            WHERE indexname = idx_name
            LIMIT 1;
            
            IF idx_record.indexname IS NULL THEN
                missing_indices := array_append(missing_indices, idx_name);
                RAISE WARNING '⚠ Índice faltante: %', idx_name;
            ELSE
                RAISE NOTICE '✓ Índice encontrado: %', idx_name;
            END IF;
        END LOOP;
    END;
    
    IF array_length(missing_indices, 1) > 0 THEN
        RAISE WARNING '';
        RAISE WARNING 'Ejecutar script database-optimization.sql para crear índices faltantes';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Verificación de índices completada ===';
END $$;

-- =====================================================
-- 3. ESTADÍSTICAS DE TABLAS Y RELACIONES
-- =====================================================

SELECT 
    '=== Estadísticas de Tablas ===' AS info;

SELECT 
    schemaname,
    tablename,
    n_live_tup AS row_count,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =====================================================
-- 4. VERIFICACIÓN DE DATOS NULOS EN CAMPOS CRÍTICOS
-- =====================================================

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Verificación de Campos Críticos NO NULL ===';
    RAISE NOTICE '';
    
    -- Verificar emails nulos en usuarios activos
    SELECT COUNT(*) INTO null_count
    FROM "User"
    WHERE email IS NULL AND "isActive" = true;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Usuarios activos sin email: %', null_count;
    ELSE
        RAISE NOTICE '✓ Todos los usuarios activos tienen email';
    END IF;
    
    -- Verificar clientes activos sin DNI ni email
    SELECT COUNT(*) INTO null_count
    FROM "Client"
    WHERE status = 'ACTIVE' AND dni IS NULL AND email IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Clientes activos sin DNI ni email: %', null_count;
    ELSE
        RAISE NOTICE '✓ Todos los clientes activos tienen DNI o email';
    END IF;
    
    -- Verificar cámaras sin sucursal
    SELECT COUNT(*) INTO null_count
    FROM "Camera"
    WHERE "branchId" IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING '⚠ Cámaras sin sucursal: %', null_count;
    ELSE
        RAISE NOTICE '✓ Todas las cámaras tienen sucursal asignada';
    END IF;
END $$;

-- =====================================================
-- 5. RESUMEN FINAL
-- =====================================================

SELECT 
    '=== Resumen de Verificación ===' AS info;

SELECT 
    (SELECT COUNT(*) FROM "User") AS total_users,
    (SELECT COUNT(*) FROM "User" WHERE "isActive" = true) AS active_users,
    (SELECT COUNT(*) FROM "Client") AS total_clients,
    (SELECT COUNT(*) FROM "Client" WHERE status = 'ACTIVE') AS active_clients,
    (SELECT COUNT(*) FROM "Branch") AS total_branches,
    (SELECT COUNT(*) FROM "Camera") AS total_cameras,
    (SELECT COUNT(*) FROM "Camera" WHERE status = 'ONLINE') AS online_cameras,
    (SELECT COUNT(*) FROM "FAQ" WHERE status = 'PUBLISHED') AS published_faqs,
    (SELECT COUNT(*) FROM "QAPair" WHERE "isActive" = true) AS active_qa_pairs,
    (SELECT COUNT(*) FROM "ChatSession") AS total_chat_sessions,
    (SELECT COUNT(*) FROM "ChatMessage") AS total_chat_messages;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

