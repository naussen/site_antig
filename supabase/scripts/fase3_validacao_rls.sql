-- =============================================================================
-- Script de validação de RLS — Fase 3 do plano de redesenho
-- Execute no SQL Editor do Supabase em seu projeto.
-- Objetivo: confirmar que o isolamento por usuário está funcionando corretamente
-- em todos os cenários de risco definidos no plano.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SEÇÃO 1: Inventário de RLS
-- Confirma quais tabelas têm RLS ativo e quais políticas estão cadastradas.
-- Resultado esperado: todas as tabelas pessoais com RLS ativo e 4 políticas cada.
-- -----------------------------------------------------------------------------

SELECT
  t.tablename,
  t.rowsecurity AS rls_ativo,
  COUNT(p.policyname) AS total_politicas,
  STRING_AGG(p.policyname, ', ' ORDER BY p.policyname) AS politicas
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'topics', 'sections',
    'user_notes', 'user_progress', 'user_dashboard_preferences',
    'user_entitlements',
    'laws', 'law_versions', 'legal_fragments',
    'topic_legal_fragment_relations', 'law_flashcards',
    'user_law_progress', 'user_law_flashcard_answers',
    'legis_editorial_audit'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Resultado esperado:
-- topics                    | true  | 1 | topics_select_entitled
-- sections                  | true  | 1 | sections_select_entitled
-- user_notes                | true  | 4 | notes_delete_own, notes_insert_own, notes_select_own, notes_update_own
-- user_progress             | true  | 4 | progress_delete_own, progress_insert_own, progress_select_own, progress_update_own
-- user_dashboard_preferences| true  | 4 | dashboard_preferences_delete_own, ...insert_own, ...select_own, ...update_own
-- user_entitlements         | true  | 1 | entitlements_select_own
-- laws/law_versions/legal_fragments/topic_legal_fragment_relations/law_flashcards
--                           | true  | 1 | política de SELECT permitido
-- user_law_progress         | true  | 4 | políticas *_own
-- user_law_flashcard_answers| true  | 1 | user_law_answers_select_own
-- legis_editorial_audit     | true  | 0 | sem acesso pelo Data API


-- -----------------------------------------------------------------------------
-- SEÇÃO 2: Confirmar estrutura das políticas de isolamento
-- Verifica se cada política usa o predicado correto de isolamento.
-- Resultado esperado: todas as políticas pessoais com auth.uid() = user_id.
-- -----------------------------------------------------------------------------

SELECT
  tablename,
  policyname,
  cmd,
  qual AS using_clause,
  with_check AS check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_notes', 'user_progress', 'user_dashboard_preferences',
    'user_entitlements', 'user_law_progress', 'user_law_flashcard_answers'
  )
ORDER BY tablename, cmd;


-- -----------------------------------------------------------------------------
-- SEÇÃO 3: Verificar FKs de user_id para auth.users
-- Confirma que as foreign keys da migration 006 foram aplicadas corretamente.
-- Resultado esperado: inclui tabelas pessoais e atores editoriais do Legis.
-- -----------------------------------------------------------------------------

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name   AS foreign_table,
  ccu.column_name  AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- Resultado esperado:
-- user_dashboard_preferences | user_id | auth | users | id | CASCADE
-- user_entitlements          | user_id | auth | users | id | CASCADE
-- user_notes                 | user_id | auth | users | id | CASCADE
-- user_progress              | user_id | auth | users | id | CASCADE


-- -----------------------------------------------------------------------------
-- SEÇÃO 4: Verificar índices criados
-- Confirma criação dos índices da migration 006.
-- Resultado esperado: pelo menos 2 novos índices.
-- -----------------------------------------------------------------------------

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_progress_user_section',
    'idx_topics_discipline'
  )
ORDER BY tablename;


-- -----------------------------------------------------------------------------
-- SEÇÃO 5: Cenário de risco — registros órfãos
-- Verifica se existe algum user_id nas tabelas pessoais sem correspondência
-- em auth.users. Resultado esperado: 0 linhas em cada query.
-- -----------------------------------------------------------------------------

SELECT 'user_notes' AS tabela, user_id
FROM user_notes
WHERE user_id NOT IN (SELECT id FROM auth.users)

UNION ALL

SELECT 'user_progress' AS tabela, user_id
FROM user_progress
WHERE user_id NOT IN (SELECT id FROM auth.users)

UNION ALL

SELECT 'user_dashboard_preferences' AS tabela, user_id
FROM user_dashboard_preferences
WHERE user_id NOT IN (SELECT id FROM auth.users)

UNION ALL

SELECT 'user_entitlements' AS tabela, user_id
FROM user_entitlements
WHERE user_id NOT IN (SELECT id FROM auth.users)

UNION ALL

SELECT 'user_law_progress' AS tabela, user_id
FROM user_law_progress
WHERE user_id NOT IN (SELECT id FROM auth.users)

UNION ALL

SELECT 'user_law_flashcard_answers' AS tabela, user_id
FROM user_law_flashcard_answers
WHERE user_id NOT IN (SELECT id FROM auth.users);


-- -----------------------------------------------------------------------------
-- SEÇÃO 6: Auditoria de cobertura de operações por tabela
-- Confirma que cada tabela pessoal tem políticas para ALL 4 operações.
-- Resultado esperado: cada tabela com 4 operações distintas cobertas.
-- -----------------------------------------------------------------------------

SELECT
  tablename,
  STRING_AGG(DISTINCT cmd, ', ' ORDER BY cmd) AS operacoes_cobertas,
  COUNT(DISTINCT cmd) AS total_operacoes
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_notes', 'user_progress', 'user_dashboard_preferences',
    'user_law_progress'
  )
GROUP BY tablename
ORDER BY tablename;

-- Resultado esperado: todas com total_operacoes = 4 (DELETE, INSERT, SELECT, UPDATE)


-- -----------------------------------------------------------------------------
-- SEÇÃO 7: Confirmar bloqueio do acervo por entitlement
-- Resultado esperado: topics/sections usam somente as políticas *_select_entitled.
-- -----------------------------------------------------------------------------

SELECT
  tablename,
  policyname,
  roles,
  qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('topics', 'sections')
ORDER BY tablename, policyname;


-- -----------------------------------------------------------------------------
-- SEÇÃO 8: Confirmar privilégios da tabela de entitlements
-- Resultado esperado para authenticated: somente SELECT.
-- -----------------------------------------------------------------------------

SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_entitlements'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;


-- -----------------------------------------------------------------------------
-- SEÇÃO 9: Menor privilégio das tabelas PRO Legis
-- -----------------------------------------------------------------------------

SELECT
  table_name,
  grantee,
  STRING_AGG(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'laws', 'law_versions', 'legal_fragments',
    'topic_legal_fragment_relations', 'law_flashcards',
    'user_law_progress', 'user_law_flashcard_answers',
    'legis_editorial_audit'
  )
  AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- -----------------------------------------------------------------------------
-- SEÇÃO 10: Funções estreitas e ausência de execução anônima
-- -----------------------------------------------------------------------------

SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema IN ('public', 'private')
  AND routine_name IN (
    'has_legis_permission', 'can_read_legis_drafts',
    'review_law_version', 'publish_law_version', 'answer_law_flashcard'
  )
  AND grantee IN ('PUBLIC', 'anon', 'authenticated')
ORDER BY routine_name, grantee;


-- -----------------------------------------------------------------------------
-- SEÇÃO 11: Constraints estruturais do workflow
-- -----------------------------------------------------------------------------

SELECT
  conrelid::regclass AS tabela,
  conname,
  pg_get_constraintdef(oid) AS definicao
FROM pg_constraint
WHERE conrelid IN (
    'public.laws'::regclass,
    'public.law_versions'::regclass,
    'public.legal_fragments'::regclass
  )
ORDER BY conrelid::regclass::text, conname;
