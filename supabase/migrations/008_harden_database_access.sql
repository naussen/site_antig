-- =============================================================================
-- Migration 008: Menor privilégio no Data API e search_path determinístico
-- =============================================================================

-- O Data API deve permanecer fechado para visitantes anônimos. Usuários
-- autenticados leem o acervo global e acessam somente os próprios dados por RLS.
REVOKE ALL PRIVILEGES ON TABLE
  public.topics,
  public.sections,
  public.user_notes,
  public.user_progress,
  public.user_dashboard_preferences
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.topics,
  public.sections
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_notes,
  public.user_progress,
  public.user_dashboard_preferences
TO authenticated;

-- A função é usada apenas pelos triggers existentes. Não deve ser invocada pelo
-- Data API, e o search_path fixo elimina resolução de objetos controlável por role.
REVOKE ALL PRIVILEGES ON FUNCTION public.update_updated_at_column()
FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = pg_catalog;

-- Novos objetos em public passam a exigir GRANT explícito na mesma migration que
-- os criar. service_role não é alterado porque permanece restrito ao backend.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
