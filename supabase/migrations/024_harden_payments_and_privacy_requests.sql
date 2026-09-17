-- Harden payment ordering/cancellation and add an actionable LGPD request channel.

CREATE TABLE public.payment_provider_transactions (
  provider             TEXT NOT NULL CHECK (provider IN ('mercado_pago', 'paypal')),
  transaction_id       TEXT NOT NULL CHECK (btrim(transaction_id) <> ''),
  provider_subscription_id TEXT NOT NULL CHECK (btrim(provider_subscription_id) <> ''),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               TEXT NOT NULL CHECK (btrim(status) <> ''),
  amount               NUMERIC(12, 2),
  currency             TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  provider_updated_at  TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, transaction_id)
);

CREATE INDEX idx_payment_provider_transactions_subscription
  ON public.payment_provider_transactions(provider, provider_subscription_id);

ALTER TABLE public.payment_provider_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.payment_provider_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.payment_provider_transactions TO service_role;

CREATE OR REPLACE TRIGGER trigger_payment_provider_transactions_updated_at
  BEFORE UPDATE ON public.payment_provider_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.privacy_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email  TEXT NOT NULL CHECK (
    char_length(contact_email) BETWEEN 3 AND 254
    AND contact_email = lower(btrim(contact_email))
  ),
  request_type   TEXT NOT NULL CHECK (
    request_type IN ('access', 'correction', 'deletion', 'portability', 'information', 'other')
  ),
  message        TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  status         TEXT NOT NULL DEFAULT 'received' CHECK (
    status IN ('received', 'in_review', 'completed', 'rejected')
  ),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_privacy_requests_user_created
  ON public.privacy_requests(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_privacy_requests_email_created
  ON public.privacy_requests(contact_email, created_at DESC);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.privacy_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.privacy_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.privacy_requests TO service_role;

CREATE POLICY privacy_requests_select_own
  ON public.privacy_requests
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE OR REPLACE TRIGGER trigger_privacy_requests_updated_at
  BEFORE UPDATE ON public.privacy_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- A cancellation stops renewal but preserves access already paid through its
-- finite access_until. Refunds/chargebacks use past_due/expired and revoke it.
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
    );
$$;

REVOKE ALL ON FUNCTION private.has_active_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_active_content_access() TO authenticated;

-- Only strictly newer provider state can replace current state. The previous
-- exception for any incoming active event allowed a stale activation replay.
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
