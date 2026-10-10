-- Preserva todos os vínculos de assinatura e registra a saúde dos jobs de operação.
-- Esta migration é aditiva e mantém user_entitlements como a fonte do acesso atual.

CREATE TABLE public.payment_subscription_links (
  provider                 TEXT NOT NULL CHECK (provider IN ('mercado_pago', 'paypal')),
  provider_subscription_id TEXT NOT NULL CHECK (btrim(provider_subscription_id) <> ''),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                   TEXT NOT NULL CHECK (
    status IN ('active', 'trialing', 'pending', 'past_due', 'canceled', 'expired')
  ),
  access_until             TIMESTAMPTZ,
  provider_updated_at      TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_subscription_id)
);

CREATE INDEX idx_payment_subscription_links_user_status
  ON public.payment_subscription_links(user_id, status, provider_updated_at DESC);

ALTER TABLE public.payment_subscription_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.payment_subscription_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_subscription_links TO service_role;

CREATE OR REPLACE TRIGGER trigger_payment_subscription_links_updated_at
  BEFORE UPDATE ON public.payment_subscription_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payment_audit_events
  DROP CONSTRAINT payment_audit_events_action_check;

ALTER TABLE public.payment_audit_events
  ADD CONSTRAINT payment_audit_events_action_check CHECK (action IN (
    'checkout_created',
    'checkout_failed',
    'checkout_blocked',
    'cancellation_confirmed',
    'cancellation_failed'
  ));

CREATE TABLE public.ops_job_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    TEXT NOT NULL CHECK (job_name ~ '^[a-z0-9_.-]{1,80}$'),
  status      TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  metrics     JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metrics) = 'object'),
  error_code  TEXT CHECK (error_code IS NULL OR error_code ~ '^[a-z0-9_.-]{1,100}$')
);

CREATE INDEX idx_ops_job_runs_name_started
  ON public.ops_job_runs(job_name, started_at DESC);

ALTER TABLE public.ops_job_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.ops_job_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ops_job_runs TO service_role;

CREATE OR REPLACE FUNCTION public.apply_payment_entitlement(
  p_user_id UUID,
  p_provider TEXT,
  p_provider_subscription_id TEXT,
  p_status TEXT,
  p_access_until TIMESTAMPTZ,
  p_provider_updated_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF p_provider NOT IN ('mercado_pago', 'paypal')
     OR p_status NOT IN ('active', 'trialing', 'pending', 'past_due', 'canceled', 'expired')
     OR NULLIF(btrim(p_provider_subscription_id), '') IS NULL
     OR p_provider_updated_at IS NULL THEN
    RAISE EXCEPTION 'invalid payment entitlement';
  END IF;

  INSERT INTO public.payment_subscription_links (
    provider, provider_subscription_id, user_id, status, access_until, provider_updated_at
  ) VALUES (
    p_provider, p_provider_subscription_id, p_user_id, p_status, p_access_until, p_provider_updated_at
  )
  ON CONFLICT (provider, provider_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    access_until = CASE
      WHEN EXCLUDED.status = 'canceled' AND EXCLUDED.access_until IS NULL
        THEN public.payment_subscription_links.access_until
      ELSE EXCLUDED.access_until
    END,
    provider_updated_at = EXCLUDED.provider_updated_at
  WHERE public.payment_subscription_links.user_id = EXCLUDED.user_id
    AND public.payment_subscription_links.provider_updated_at < EXCLUDED.provider_updated_at;

  IF p_status IN ('active', 'trialing') AND EXISTS (
    SELECT 1 FROM public.payment_access_blocks AS block
    WHERE block.user_id = p_user_id AND block.active
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_entitlements (
    user_id, provider, provider_subscription_id, status, access_until, provider_updated_at
  ) VALUES (
    p_user_id, p_provider, p_provider_subscription_id, p_status, p_access_until, p_provider_updated_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    status = EXCLUDED.status,
    access_until = CASE
      WHEN EXCLUDED.status = 'canceled' AND EXCLUDED.access_until IS NULL
        THEN public.user_entitlements.access_until
      ELSE EXCLUDED.access_until
    END,
    provider_updated_at = EXCLUDED.provider_updated_at
  WHERE COALESCE(public.user_entitlements.provider_updated_at, '-infinity'::timestamptz)
        < EXCLUDED.provider_updated_at;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_payment_entitlement(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_payment_entitlement(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  TO service_role;
