-- A confirmed refund or chargeback must survive later subscription webhooks
-- and reconciliation until an operator explicitly reviews the case.

CREATE TABLE public.payment_access_blocks (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                 TEXT NOT NULL CHECK (provider IN ('mercado_pago', 'paypal')),
  provider_subscription_id TEXT NOT NULL CHECK (btrim(provider_subscription_id) <> ''),
  resource_id              TEXT NOT NULL CHECK (btrim(resource_id) <> ''),
  reason                   TEXT NOT NULL CHECK (reason IN ('refund', 'chargeback', 'reversal')),
  provider_updated_at      TIMESTAMPTZ NOT NULL,
  active                   BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at              TIMESTAMPTZ,
  resolved_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note          TEXT,
  UNIQUE (provider, resource_id, reason)
);

CREATE INDEX idx_payment_access_blocks_active_user
  ON public.payment_access_blocks(user_id)
  WHERE active;

ALTER TABLE public.payment_access_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.payment_access_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_access_blocks TO service_role;

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
    OR (
      NOT EXISTS (
        SELECT 1
        FROM public.payment_access_blocks AS block
        WHERE block.user_id = (SELECT auth.uid())
          AND block.active
      )
      AND EXISTS (
        SELECT 1
        FROM public.user_entitlements AS entitlement
        WHERE entitlement.user_id = (SELECT auth.uid())
          AND (
            entitlement.status IN ('active', 'trialing')
            OR (
              entitlement.status = 'canceled'
              AND entitlement.access_until IS NOT NULL
              AND entitlement.access_until > now()
            )
          )
          AND (
            entitlement.access_until IS NULL
            OR entitlement.access_until > now()
          )
      )
    );
$$;

REVOKE ALL ON FUNCTION private.has_active_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_active_content_access() TO authenticated;

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
