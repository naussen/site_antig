-- =============================================================================
-- Migration 009: Exigir assinatura ativa para leitura do acervo
-- =============================================================================

-- A tabela e a funcao de autorizacao sao a fonte de verdade do backend.
-- O navegador pode consultar o proprio estado, mas nunca cria ou altera acesso.
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                 TEXT NOT NULL CHECK (btrim(provider) <> ''),
  provider_subscription_id TEXT,
  status                   TEXT NOT NULL CHECK (
    status IN ('active', 'trialing', 'pending', 'past_due', 'canceled', 'expired')
  ),
  access_until             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_provider_subscription
  ON public.user_entitlements(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_entitlements FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_entitlements TO authenticated;

DROP POLICY IF EXISTS entitlements_select_own ON public.user_entitlements;
CREATE POLICY entitlements_select_own
  ON public.user_entitlements
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
  );

CREATE OR REPLACE TRIGGER trigger_user_entitlements_updated_at
  BEFORE UPDATE ON public.user_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Funcoes SECURITY DEFINER usadas por RLS ficam fora do schema exposto pelo
-- Data API. O wrapper publico retorna apenas o acesso da propria sessao.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_active_content_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (
      COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
      AND COALESCE((SELECT auth.jwt() ->> 'aal'), '') = 'aal2'
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_entitlements AS entitlement
      WHERE entitlement.user_id = (SELECT auth.uid())
        AND entitlement.status IN ('active', 'trialing')
        AND (
          entitlement.access_until IS NULL
          OR entitlement.access_until > now()
        )
    );
$$;

REVOKE ALL ON FUNCTION private.has_active_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_active_content_access() TO authenticated;

CREATE OR REPLACE FUNCTION public.has_active_content_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.has_active_content_access();
$$;

REVOKE ALL ON FUNCTION public.has_active_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_content_access() TO authenticated;

DROP POLICY IF EXISTS topics_select_authenticated ON public.topics;
DROP POLICY IF EXISTS sections_select_authenticated ON public.sections;
DROP POLICY IF EXISTS topics_select_entitled ON public.topics;
DROP POLICY IF EXISTS sections_select_entitled ON public.sections;

CREATE POLICY topics_select_entitled
  ON public.topics
  FOR SELECT
  TO authenticated
  USING ((SELECT private.has_active_content_access()));

CREATE POLICY sections_select_entitled
  ON public.sections
  FOR SELECT
  TO authenticated
  USING ((SELECT private.has_active_content_access()));

-- Objetos futuros continuam fechados por padrao. A service_role permanece
-- restrita ao backend e e a unica role autorizada a manter entitlements.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
