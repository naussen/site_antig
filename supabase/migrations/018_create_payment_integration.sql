-- Integração de pagamentos: idempotência, ordenação e atualização atômica.
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS provider_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  provider            TEXT NOT NULL CHECK (provider IN ('mercado_pago', 'paypal')),
  event_id            TEXT NOT NULL CHECK (btrim(event_id) <> ''),
  event_type          TEXT NOT NULL CHECK (btrim(event_type) <> ''),
  resource_id         TEXT NOT NULL CHECK (btrim(resource_id) <> ''),
  provider_created_at TIMESTAMPTZ NOT NULL,
  processing_status   TEXT NOT NULL CHECK (processing_status IN ('processing', 'processed', 'failed')),
  error_code          TEXT,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at        TIMESTAMPTZ,
  PRIMARY KEY (provider, event_id)
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.payment_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_webhook_events TO service_role;

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

  INSERT INTO public.user_entitlements (
    user_id, provider, provider_subscription_id, status, access_until, provider_updated_at
  ) VALUES (
    p_user_id, p_provider, p_provider_subscription_id, p_status, p_access_until, p_provider_updated_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    status = EXCLUDED.status,
    access_until = EXCLUDED.access_until,
    provider_updated_at = EXCLUDED.provider_updated_at
  WHERE (
      public.user_entitlements.provider = EXCLUDED.provider
      AND public.user_entitlements.provider_subscription_id = EXCLUDED.provider_subscription_id
      AND COALESCE(public.user_entitlements.provider_updated_at, '-infinity'::timestamptz) <= EXCLUDED.provider_updated_at
    )
    OR (
      public.user_entitlements.status NOT IN ('active', 'trialing')
      AND EXCLUDED.status IN ('active', 'trialing')
    );

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_payment_entitlement(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_payment_entitlement(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  TO service_role;
