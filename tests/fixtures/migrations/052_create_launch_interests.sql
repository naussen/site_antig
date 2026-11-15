CREATE TABLE public.launch_interests (
  email TEXT PRIMARY KEY CHECK (
    char_length(email) <= 254 AND email = lower(email)
    AND email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  consent_version TEXT NOT NULL CHECK (consent_version ~ '^lancamento-v[1-9][0-9]*$'),
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_interests ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.launch_interests FROM PUBLIC, anon, authenticated, service_role;
GRANT INSERT ON TABLE public.launch_interests TO service_role;
GRANT SELECT (email) ON TABLE public.launch_interests TO service_role;
