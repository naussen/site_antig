-- Trilha financeira mínima e imutável. Não armazena payloads, tokens, e-mail ou dados de cartão.
CREATE TABLE public.payment_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN (
    'checkout_created',
    'checkout_failed',
    'cancellation_confirmed',
    'cancellation_failed'
  )),
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure')),
  provider text CHECK (provider IN ('mercado_pago', 'paypal')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_subscription_id text,
  reason_code text CHECK (reason_code IS NULL OR reason_code ~ '^[a-z0-9_.-]{1,100}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_audit_events_created_at
  ON public.payment_audit_events(created_at DESC);

CREATE INDEX idx_payment_audit_events_user
  ON public.payment_audit_events(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.payment_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.payment_audit_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.payment_audit_events TO service_role;

COMMENT ON TABLE public.payment_audit_events IS
  'Auditoria financeira mínima; payloads, credenciais e dados de cartão são proibidos.';
