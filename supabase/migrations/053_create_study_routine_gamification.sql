-- =============================================================================
-- Migration 053: Rotina semanal e sessões curtas de estudo (Gamificação MVP)
-- =============================================================================
-- Reconciliada como 053 porque origin/main já contém 026..052 (incluindo
-- 026_create_study_planner.sql e 052_create_launch_interests.sql).
-- Todas as tabelas pertencem ao Grupo A (dados pessoais por usuário com RLS).
-- Mutações de usuários autenticados passam exclusivamente por RPCs transacionais
-- com validação no servidor; o papel authenticated possui apenas SELECT direto.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;

CREATE TABLE IF NOT EXISTS public.user_study_routine_preferences (
  user_id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_days                  SMALLINT NOT NULL DEFAULT 3
    CHECK (target_days BETWEEN 1 AND 7),
  timezone_iana                TEXT NOT NULL DEFAULT 'America/Sao_Paulo'
    CHECK (timezone_iana ~ '^[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*$' AND char_length(timezone_iana) BETWEEN 1 AND 64),
  default_budget_minutes       SMALLINT NOT NULL DEFAULT 15
    CHECK (default_budget_minutes IN (5, 15, 30)),
  preferred_discipline         TEXT
    CHECK (preferred_discipline IS NULL OR char_length(btrim(preferred_discipline)) BETWEEN 1 AND 120),
  hide_gamification            BOOLEAN NOT NULL DEFAULT false,
  pending_target_days          SMALLINT
    CHECK (pending_target_days IS NULL OR pending_target_days BETWEEN 1 AND 7),
  pending_timezone_iana        TEXT
    CHECK (pending_timezone_iana IS NULL OR (pending_timezone_iana ~ '^[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*$' AND char_length(pending_timezone_iana) BETWEEN 1 AND 64)),
  pending_effective_week_start DATE
    CHECK (pending_effective_week_start IS NULL OR EXTRACT(ISODOW FROM pending_effective_week_start) = 1),
  onboarding_completed_at      TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (pending_target_days IS NULL AND pending_timezone_iana IS NULL AND pending_effective_week_start IS NULL)
    OR ((pending_target_days IS NOT NULL OR pending_timezone_iana IS NOT NULL) AND pending_effective_week_start IS NOT NULL)
  )
);

COMMENT ON TABLE public.user_study_routine_preferences IS
  'Preferências da rotina semanal de estudos (meta futura, fuso futuro e visibilidade)';

CREATE TABLE IF NOT EXISTS public.study_routine_weekly_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date       DATE NOT NULL
    CHECK (EXTRACT(ISODOW FROM week_start_date) = 1),
  week_end_date         DATE NOT NULL
    CHECK (week_end_date = week_start_date + 6),
  target_days           SMALLINT NOT NULL
    CHECK (target_days BETWEEN 1 AND 7),
  timezone_iana         TEXT NOT NULL
    CHECK (timezone_iana ~ '^[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*$' AND char_length(timezone_iana) BETWEEN 1 AND 64),
  is_partial_first_week BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date),
  UNIQUE (id, user_id)
);

COMMENT ON TABLE public.study_routine_weekly_plans IS
  'Alvo e fuso congelados por semana (segunda a domingo) preservando histórico';

CREATE INDEX IF NOT EXISTS idx_study_routine_weekly_plans_user_week
  ON public.study_routine_weekly_plans(user_id, week_start_date DESC);

CREATE TABLE IF NOT EXISTS public.study_routine_sessions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_plan_id             UUID NOT NULL,
  status                     TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('planned', 'in_progress', 'interrupted', 'completed', 'discarded')),
  budget_minutes             SMALLINT NOT NULL
    CHECK (budget_minutes IN (5, 15, 30)),
  estimated_minutes          SMALLINT NOT NULL
    CHECK (estimated_minutes BETWEEN 1 AND 180),
  selection_mode             TEXT NOT NULL DEFAULT 'recommended'
    CHECK (selection_mode IN ('recommended', 'manual', 'resumed')),
  idempotency_key            TEXT NOT NULL
    CHECK (char_length(btrim(idempotency_key)) BETWEEN 1 AND 128),
  completion_idempotency_key TEXT
    CHECK (completion_idempotency_key IS NULL OR char_length(btrim(completion_idempotency_key)) BETWEEN 1 AND 128),
  started_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at               TIMESTAMPTZ,
  completed_local_date       DATE,
  completed_week_start_date  DATE
    CHECK (completed_week_start_date IS NULL OR EXTRACT(ISODOW FROM completed_week_start_date) = 1),
  completed_timezone_iana    TEXT
    CHECK (completed_timezone_iana IS NULL OR (completed_timezone_iana ~ '^[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*$' AND char_length(completed_timezone_iana) BETWEEN 1 AND 64)),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (weekly_plan_id, user_id)
    REFERENCES public.study_routine_weekly_plans(id, user_id) ON DELETE CASCADE,
  UNIQUE (id, user_id),
  UNIQUE (user_id, idempotency_key),
  CHECK (
    (status <> 'completed') OR (
      completed_at IS NOT NULL
      AND completed_local_date IS NOT NULL
      AND completed_week_start_date IS NOT NULL
      AND completed_timezone_iana IS NOT NULL
      AND completion_idempotency_key IS NOT NULL
    )
  ),
  CHECK (
    (status = 'completed') OR (
      completed_at IS NULL
      AND completed_local_date IS NULL
      AND completed_week_start_date IS NULL
      AND completed_timezone_iana IS NULL
      AND completion_idempotency_key IS NULL
    )
  )
);

COMMENT ON TABLE public.study_routine_sessions IS
  'Sessões curtas de estudo com estados explícitos, idempotência e data local de conclusão';

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_routine_sessions_completion_key
  ON public.study_routine_sessions(user_id, completion_idempotency_key)
  WHERE completion_idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_routine_sessions_one_active
  ON public.study_routine_sessions(user_id)
  WHERE status IN ('planned', 'in_progress', 'interrupted');

CREATE INDEX IF NOT EXISTS idx_study_routine_sessions_user_week_completed
  ON public.study_routine_sessions(user_id, completed_week_start_date, completed_local_date)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_study_routine_sessions_user_recent
  ON public.study_routine_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.study_routine_session_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_index       SMALLINT NOT NULL CHECK (order_index >= 0),
  activity_type     TEXT NOT NULL
    CHECK (activity_type IN ('summary', 'law', 'question', 'flashcard')),
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'skipped', 'unavailable')),
  topic_id          TEXT,
  topic_title       TEXT NOT NULL CHECK (char_length(btrim(topic_title)) BETWEEN 1 AND 300),
  discipline        TEXT NOT NULL CHECK (char_length(btrim(discipline)) BETWEEN 1 AND 120),
  section_id        TEXT,
  content_unit_id   UUID,
  activity_title    TEXT NOT NULL CHECK (char_length(btrim(activity_title)) BETWEEN 1 AND 300),
  estimated_minutes SMALLINT NOT NULL CHECK (estimated_minutes BETWEEN 1 AND 180),
  evidence_kind     TEXT NOT NULL DEFAULT 'self_declared'
    CHECK (evidence_kind IN ('self_declared', 'server_verified')),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (session_id, user_id)
    REFERENCES public.study_routine_sessions(id, user_id) ON DELETE CASCADE,
  UNIQUE (session_id, order_index),
  CHECK ((status <> 'completed') OR completed_at IS NOT NULL),
  CHECK ((status = 'completed') OR completed_at IS NULL)
);

COMMENT ON TABLE public.study_routine_session_activities IS
  'Atividades vinculadas a cada sessão de estudo com referência estável';

CREATE INDEX IF NOT EXISTS idx_study_routine_activities_session
  ON public.study_routine_session_activities(session_id, order_index);

CREATE INDEX IF NOT EXISTS idx_study_routine_activities_user_unit
  ON public.study_routine_session_activities(user_id, content_unit_id)
  WHERE content_unit_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trigger_user_study_routine_preferences_updated_at
  BEFORE UPDATE ON public.user_study_routine_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_study_routine_weekly_plans_updated_at
  BEFORE UPDATE ON public.study_routine_weekly_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_study_routine_sessions_updated_at
  BEFORE UPDATE ON public.study_routine_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_study_routine_activities_updated_at
  BEFORE UPDATE ON public.study_routine_session_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Funções auxiliares privadas e triggers de defesa em profundidade
-- =============================================================================

CREATE OR REPLACE FUNCTION private.require_authenticated_routine_access()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL OR NOT (SELECT private.has_active_content_access()) THEN
    RAISE EXCEPTION 'active_content_access_required' USING ERRCODE = '42501';
  END IF;
  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION private.require_authenticated_routine_access()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.validate_routine_timezone(p_timezone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tz TEXT := btrim(COALESCE(p_timezone, ''));
BEGIN
  IF v_tz = '' OR char_length(v_tz) > 64 OR v_tz !~ '^[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*$' THEN
    RAISE EXCEPTION 'invalid_timezone_iana' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_tz) THEN
    RAISE EXCEPTION 'unknown_timezone_iana' USING ERRCODE = '22023';
  END IF;

  RETURN v_tz;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_routine_timezone(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.acquire_study_routine_user_lock(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 5301));
END;
$$;

REVOKE ALL ON FUNCTION private.acquire_study_routine_user_lock(UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_study_routine_session_json(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session public.study_routine_sessions%ROWTYPE;
  v_activities JSONB;
BEGIN
  SELECT *
  INTO v_session
  FROM public.study_routine_sessions
  WHERE id = p_session_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.order_index ASC), '[]'::jsonb)
  INTO v_activities
  FROM public.study_routine_session_activities AS a
  WHERE a.session_id = v_session.id
    AND a.user_id = p_user_id;

  RETURN to_jsonb(v_session) || jsonb_build_object('activities', v_activities);
END;
$$;

REVOKE ALL ON FUNCTION private.get_study_routine_session_json(UUID, UUID)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.enforce_study_routine_rpc_mutation_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'study_routine_direct_mutation_forbidden' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_rpc_mutation_guard()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_01_rpc_mutation_guard ON public.user_study_routine_preferences;
CREATE TRIGGER trigger_01_rpc_mutation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_study_routine_preferences
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_rpc_mutation_guard();

DROP TRIGGER IF EXISTS trigger_01_rpc_mutation_guard ON public.study_routine_weekly_plans;
CREATE TRIGGER trigger_01_rpc_mutation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.study_routine_weekly_plans
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_rpc_mutation_guard();

DROP TRIGGER IF EXISTS trigger_01_rpc_mutation_guard ON public.study_routine_sessions;
CREATE TRIGGER trigger_01_rpc_mutation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.study_routine_sessions
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_rpc_mutation_guard();

DROP TRIGGER IF EXISTS trigger_01_rpc_mutation_guard ON public.study_routine_session_activities;
CREATE TRIGGER trigger_01_rpc_mutation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.study_routine_session_activities
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_rpc_mutation_guard();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_weekly_plan_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
      RAISE EXCEPTION 'study_routine_weekly_plan_delete_forbidden' USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  IF ROW(OLD.user_id, OLD.week_start_date, OLD.week_end_date, OLD.target_days, OLD.timezone_iana, OLD.is_partial_first_week)
    IS DISTINCT FROM
    ROW(NEW.user_id, NEW.week_start_date, NEW.week_end_date, NEW.target_days, NEW.timezone_iana, NEW.is_partial_first_week)
  THEN
    RAISE EXCEPTION 'study_routine_weekly_plan_is_immutable' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_weekly_plan_immutability()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_enforce_study_routine_weekly_plan_immutability
  ON public.study_routine_weekly_plans;
CREATE TRIGGER trigger_enforce_study_routine_weekly_plan_immutability
  BEFORE UPDATE OR DELETE ON public.study_routine_weekly_plans
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_weekly_plan_immutability();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_session_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan_tz TEXT;
  v_expected_local_date DATE;
  v_expected_week_start DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' AND EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id) THEN
      RAISE EXCEPTION 'completed_study_routine_session_immutable' USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    RAISE EXCEPTION 'cannot_insert_completed_study_routine_session' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
      OR NEW.started_at IS DISTINCT FROM OLD.started_at
      OR NEW.budget_minutes IS DISTINCT FROM OLD.budget_minutes
      OR NEW.selection_mode IS DISTINCT FROM OLD.selection_mode
    THEN
      RAISE EXCEPTION 'study_routine_session_identity_immutable' USING ERRCODE = '55000';
    END IF;

    IF OLD.status = 'completed' THEN
      IF NEW.status <> 'completed'
        OR NEW.weekly_plan_id IS DISTINCT FROM OLD.weekly_plan_id
        OR NEW.completion_idempotency_key IS DISTINCT FROM OLD.completion_idempotency_key
        OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
        OR NEW.completed_local_date IS DISTINCT FROM OLD.completed_local_date
        OR NEW.completed_week_start_date IS DISTINCT FROM OLD.completed_week_start_date
        OR NEW.completed_timezone_iana IS DISTINCT FROM OLD.completed_timezone_iana
      THEN
        RAISE EXCEPTION 'completed_study_routine_session_immutable' USING ERRCODE = '55000';
      END IF;
    ELSIF OLD.status = 'discarded' AND NEW.status <> 'discarded' THEN
      RAISE EXCEPTION 'discarded_study_routine_session_immutable' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.status = 'completed' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.study_routine_session_activities AS activity
      WHERE activity.session_id = NEW.id
        AND activity.user_id = NEW.user_id
        AND activity.status = 'completed'
    ) THEN
      RAISE EXCEPTION 'completed_session_requires_completed_activity' USING ERRCODE = '23514';
    END IF;

    SELECT plan.timezone_iana
    INTO v_plan_tz
    FROM public.study_routine_weekly_plans AS plan
    WHERE plan.id = NEW.weekly_plan_id
      AND plan.user_id = NEW.user_id;

    IF v_plan_tz IS NULL OR NEW.completed_timezone_iana IS DISTINCT FROM v_plan_tz THEN
      RAISE EXCEPTION 'study_routine_completion_timezone_mismatch' USING ERRCODE = '23514';
    END IF;

    v_expected_local_date := (NEW.completed_at AT TIME ZONE NEW.completed_timezone_iana)::DATE;
    v_expected_week_start := date_trunc('week', v_expected_local_date::TIMESTAMP)::DATE;

    IF NEW.completed_local_date IS DISTINCT FROM v_expected_local_date
      OR NEW.completed_week_start_date IS DISTINCT FROM v_expected_week_start
    THEN
      RAISE EXCEPTION 'study_routine_completion_date_mismatch' USING ERRCODE = '23514';
    END IF;

    IF NEW.completed_at < NEW.started_at - interval '1 minute'
      OR NEW.completed_at > now() + interval '5 minutes'
    THEN
      RAISE EXCEPTION 'study_routine_completion_timestamp_out_of_bounds' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_session_transitions()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_enforce_study_routine_session_transitions
  ON public.study_routine_sessions;
CREATE TRIGGER trigger_enforce_study_routine_session_transitions
  BEFORE INSERT OR UPDATE OR DELETE ON public.study_routine_sessions
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_session_transitions();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_activity_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_session_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT s.status
    INTO v_session_status
    FROM public.study_routine_sessions AS s
    WHERE s.id = OLD.session_id
      AND s.user_id = OLD.user_id;

    IF v_session_status IN ('completed', 'discarded')
      AND EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.user_id)
    THEN
      RAISE EXCEPTION 'closed_session_activity_immutable' USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  SELECT s.status
  INTO v_session_status
  FROM public.study_routine_sessions AS s
  WHERE s.id = NEW.session_id
    AND s.user_id = NEW.user_id;

  IF v_session_status IS NULL THEN
    RAISE EXCEPTION 'study_routine_session_not_found' USING ERRCODE = '23503';
  END IF;

  IF TG_OP = 'INSERT' AND v_session_status IN ('completed', 'discarded') THEN
    RAISE EXCEPTION 'cannot_add_activity_to_closed_session' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.session_id IS DISTINCT FROM OLD.session_id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.order_index IS DISTINCT FROM OLD.order_index
    THEN
      RAISE EXCEPTION 'study_routine_activity_identity_immutable' USING ERRCODE = '55000';
    END IF;

    IF v_session_status IN ('completed', 'discarded') THEN
      RAISE EXCEPTION 'closed_session_activity_immutable' USING ERRCODE = '55000';
    END IF;

    IF OLD.status = 'completed' AND (
      NEW.status IS DISTINCT FROM OLD.status
      OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
      OR NEW.content_unit_id IS DISTINCT FROM OLD.content_unit_id
    ) THEN
      RAISE EXCEPTION 'completed_session_activity_immutable' USING ERRCODE = '55000';
    END IF;
  END IF;

  IF NEW.activity_type = 'summary' AND (
    TG_OP = 'INSERT'
    OR NEW.content_unit_id IS DISTINCT FROM OLD.content_unit_id
    OR NEW.status = 'completed'
  ) THEN
    IF NEW.content_unit_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.sections AS section
      JOIN public.topics AS topic ON topic.topic_id = section.topic_id
      WHERE section.content_unit_id = NEW.content_unit_id
        AND (NEW.topic_id IS NULL OR section.topic_id = NEW.topic_id)
        AND section.archived_at IS NULL
        AND topic.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION 'study_routine_summary_content_unavailable' USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_activity_integrity()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_enforce_study_routine_activity_integrity
  ON public.study_routine_session_activities;
CREATE TRIGGER trigger_enforce_study_routine_activity_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON public.study_routine_session_activities
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_activity_integrity();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_session_row_has_activities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.study_routine_sessions WHERE id = NEW.id
  ) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.study_routine_session_activities WHERE session_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'study_routine_session_requires_activities' USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_session_row_has_activities()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.enforce_study_routine_activity_delete_keeps_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.study_routine_sessions WHERE id = OLD.session_id
  ) THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.study_routine_session_activities WHERE session_id = OLD.session_id
  ) THEN
    RAISE EXCEPTION 'study_routine_session_requires_activities' USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_activity_delete_keeps_session()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_enforce_session_has_activities
  ON public.study_routine_sessions;
CREATE CONSTRAINT TRIGGER trigger_enforce_session_has_activities
  AFTER INSERT OR UPDATE ON public.study_routine_sessions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_session_row_has_activities();

DROP TRIGGER IF EXISTS trigger_enforce_activity_delete_keeps_session_nonempty
  ON public.study_routine_session_activities;
CREATE CONSTRAINT TRIGGER trigger_enforce_activity_delete_keeps_session_nonempty
  AFTER DELETE ON public.study_routine_session_activities
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_activity_delete_keeps_session();

DROP FUNCTION IF EXISTS private.enforce_study_routine_session_has_activities();

-- =============================================================================
-- Sincronização semanal e promoção de mudanças agendadas
-- =============================================================================

CREATE OR REPLACE FUNCTION private.sync_user_study_routine_week(
  p_user_id UUID,
  p_auto_activate BOOLEAN DEFAULT false,
  p_now TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_prefs public.user_study_routine_preferences%ROWTYPE;
  v_has_prefs BOOLEAN := false;
  v_plan public.study_routine_weekly_plans%ROWTYPE;
  v_has_plan BOOLEAN := false;
  v_has_prior_plans BOOLEAN := false;
  v_base_tz TEXT := 'America/Sao_Paulo';
  v_local_date DATE;
  v_week_start DATE;
  v_due_in_current BOOLEAN;
  v_due_in_pending BOOLEAN;
  v_should_promote BOOLEAN;
  v_eff_target SMALLINT;
  v_eff_tz TEXT;
  v_eff_local_date DATE;
  v_eff_week_start DATE;
  v_eff_week_end DATE;
  v_is_partial BOOLEAN;
BEGIN
  PERFORM set_config('study_routine.rpc_context', 'true', true);

  SELECT *
  INTO v_prefs
  FROM public.user_study_routine_preferences
  WHERE user_id = p_user_id
  FOR UPDATE;
  v_has_prefs := FOUND;

  IF p_auto_activate THEN
    IF NOT v_has_prefs THEN
      INSERT INTO public.user_study_routine_preferences (
        user_id, target_days, timezone_iana, default_budget_minutes,
        preferred_discipline, hide_gamification, onboarding_completed_at
      )
      VALUES (p_user_id, 3, 'America/Sao_Paulo', 15, NULL, false, p_now)
      RETURNING * INTO v_prefs;
      v_has_prefs := true;
    ELSIF v_prefs.onboarding_completed_at IS NULL THEN
      UPDATE public.user_study_routine_preferences
      SET onboarding_completed_at = p_now
      WHERE user_id = p_user_id
      RETURNING * INTO v_prefs;
    END IF;
  END IF;

  IF v_has_prefs THEN
    v_base_tz := v_prefs.timezone_iana;
  END IF;

  v_local_date := (p_now AT TIME ZONE v_base_tz)::DATE;
  v_week_start := date_trunc('week', v_local_date::TIMESTAMP)::DATE;

  SELECT EXISTS (
    SELECT 1 FROM public.study_routine_weekly_plans WHERE user_id = p_user_id
  ) INTO v_has_prior_plans;

  SELECT *
  INTO v_plan
  FROM public.study_routine_weekly_plans
  WHERE user_id = p_user_id
    AND week_start_date = v_week_start
  LIMIT 1;
  v_has_plan := FOUND;

  IF NOT v_has_plan AND v_has_prior_plans THEN
    SELECT plan.*
    INTO v_plan
    FROM public.study_routine_weekly_plans AS plan
    WHERE plan.user_id = p_user_id
      AND (p_now AT TIME ZONE plan.timezone_iana)::DATE BETWEEN plan.week_start_date AND plan.week_end_date
    ORDER BY plan.week_start_date DESC
    LIMIT 1;
    v_has_plan := FOUND;
  END IF;

  IF NOT v_has_plan AND v_has_prefs AND v_prefs.onboarding_completed_at IS NOT NULL THEN
    v_due_in_current := v_prefs.pending_effective_week_start IS NOT NULL
      AND v_local_date >= v_prefs.pending_effective_week_start;
    v_due_in_pending := CASE
      WHEN v_prefs.pending_timezone_iana IS NOT NULL AND v_prefs.pending_effective_week_start IS NOT NULL
        THEN ((p_now AT TIME ZONE v_prefs.pending_timezone_iana)::DATE >= v_prefs.pending_effective_week_start)
      ELSE v_due_in_current
    END;

    v_should_promote := v_has_prior_plans
      AND v_prefs.pending_effective_week_start IS NOT NULL
      AND (v_prefs.pending_target_days IS NOT NULL OR v_prefs.pending_timezone_iana IS NOT NULL)
      AND v_due_in_current
      AND v_due_in_pending;

    IF v_should_promote THEN
      v_eff_target := COALESCE(v_prefs.pending_target_days, v_prefs.target_days);
      v_eff_tz := COALESCE(v_prefs.pending_timezone_iana, v_prefs.timezone_iana);
      v_eff_local_date := (p_now AT TIME ZONE v_eff_tz)::DATE;
      v_eff_week_start := date_trunc('week', v_eff_local_date::TIMESTAMP)::DATE;
      v_eff_week_end := v_eff_week_start + 6;
      v_is_partial := false;
    ELSE
      v_eff_target := v_prefs.target_days;
      v_eff_tz := v_prefs.timezone_iana;
      v_eff_local_date := v_local_date;
      v_eff_week_start := v_week_start;
      v_eff_week_end := v_week_start + 6;
      v_is_partial := (NOT v_has_prior_plans) AND (EXTRACT(ISODOW FROM v_eff_local_date) > 1);
    END IF;

    INSERT INTO public.study_routine_weekly_plans (
      user_id, week_start_date, week_end_date, target_days, timezone_iana, is_partial_first_week
    )
    VALUES (
      p_user_id, v_eff_week_start, v_eff_week_end, v_eff_target, v_eff_tz, v_is_partial
    )
    ON CONFLICT (user_id, week_start_date) DO NOTHING;

    SELECT *
    INTO v_plan
    FROM public.study_routine_weekly_plans
    WHERE user_id = p_user_id
      AND week_start_date = v_eff_week_start
    LIMIT 1;
    v_has_plan := FOUND;

    IF v_should_promote THEN
      UPDATE public.user_study_routine_preferences
      SET target_days = v_eff_target,
          timezone_iana = v_eff_tz,
          pending_target_days = NULL,
          pending_timezone_iana = NULL,
          pending_effective_week_start = NULL
      WHERE user_id = p_user_id
      RETURNING * INTO v_prefs;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'preferences', CASE WHEN v_has_prefs THEN to_jsonb(v_prefs) ELSE NULL END,
    'current_plan', CASE WHEN v_has_plan THEN to_jsonb(v_plan) ELSE NULL END
  );
END;
$$;

REVOKE ALL ON FUNCTION private.sync_user_study_routine_week(UUID, BOOLEAN, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- RPCs públicas transacionais para usuários autenticados com acesso ativo
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ensure_study_routine_weekly_plan(
  p_auto_activate BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM private.acquire_study_routine_user_lock(v_user_id);
  RETURN private.sync_user_study_routine_week(v_user_id, COALESCE(p_auto_activate, false), now());
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_study_routine_weekly_plan(BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_study_routine_weekly_plan(BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.save_study_routine_preferences(
  p_target_days SMALLINT DEFAULT NULL,
  p_timezone_iana TEXT DEFAULT NULL,
  p_default_budget_minutes SMALLINT DEFAULT NULL,
  p_preferred_discipline TEXT DEFAULT NULL,
  p_clear_preferred_discipline BOOLEAN DEFAULT false,
  p_hide_gamification BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_sync JSONB;
  v_prefs public.user_study_routine_preferences%ROWTYPE;
  v_has_prefs BOOLEAN := false;
  v_plan public.study_routine_weekly_plans%ROWTYPE;
  v_has_plan BOOLEAN := false;
  v_safe_tz TEXT := NULL;
  v_next_budget SMALLINT;
  v_next_hide BOOLEAN;
  v_next_discipline TEXT;
  v_was_onboarded BOOLEAN := false;
  v_activate_onboarding BOOLEAN := false;
  v_active_target SMALLINT;
  v_active_tz TEXT;
  v_local_date DATE;
  v_week_start DATE;
  v_week_end DATE;
  v_next_week_start DATE;
  v_is_partial BOOLEAN := false;
  v_pending_target SMALLINT;
  v_pending_tz TEXT;
  v_pending_effective DATE;
  v_target_modified BOOLEAN := false;
  v_tz_modified BOOLEAN := false;
  v_effective_immediately BOOLEAN := true;
  v_effective_week_start DATE := NULL;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM set_config('study_routine.rpc_context', 'true', true);
  PERFORM private.acquire_study_routine_user_lock(v_user_id);

  IF p_target_days IS NOT NULL AND (p_target_days < 1 OR p_target_days > 7) THEN
    RAISE EXCEPTION 'invalid_target_days' USING ERRCODE = '22023';
  END IF;

  IF p_timezone_iana IS NOT NULL THEN
    v_safe_tz := private.validate_routine_timezone(p_timezone_iana);
  END IF;

  IF p_default_budget_minutes IS NOT NULL AND p_default_budget_minutes NOT IN (5, 15, 30) THEN
    RAISE EXCEPTION 'invalid_budget_minutes' USING ERRCODE = '22023';
  END IF;

  IF p_preferred_discipline IS NOT NULL AND char_length(btrim(p_preferred_discipline)) > 120 THEN
    RAISE EXCEPTION 'invalid_preferred_discipline' USING ERRCODE = '22023';
  END IF;

  v_sync := private.sync_user_study_routine_week(v_user_id, false, v_now);

  SELECT *
  INTO v_prefs
  FROM public.user_study_routine_preferences
  WHERE user_id = v_user_id;
  v_has_prefs := FOUND;

  IF (v_sync->'current_plan') IS NOT NULL AND (v_sync->'current_plan') <> 'null'::jsonb THEN
    SELECT *
    INTO v_plan
    FROM public.study_routine_weekly_plans
    WHERE id = ((v_sync->'current_plan'->>'id')::UUID)
      AND user_id = v_user_id;
    v_has_plan := FOUND;
  END IF;

  v_next_budget := COALESCE(
    p_default_budget_minutes,
    CASE WHEN v_has_prefs THEN v_prefs.default_budget_minutes ELSE 15 END
  );
  v_next_hide := COALESCE(
    p_hide_gamification,
    CASE WHEN v_has_prefs THEN v_prefs.hide_gamification ELSE false END
  );

  IF COALESCE(p_clear_preferred_discipline, false) THEN
    v_next_discipline := NULL;
  ELSIF p_preferred_discipline IS NOT NULL THEN
    v_next_discipline := NULLIF(btrim(p_preferred_discipline), '');
  ELSIF v_has_prefs THEN
    v_next_discipline := v_prefs.preferred_discipline;
  ELSE
    v_next_discipline := NULL;
  END IF;

  v_was_onboarded := (v_has_prefs AND v_prefs.onboarding_completed_at IS NOT NULL) OR v_has_plan;
  v_activate_onboarding := (
    p_target_days IS NOT NULL
    OR v_safe_tz IS NOT NULL
    OR p_default_budget_minutes IS NOT NULL
    OR COALESCE(p_clear_preferred_discipline, false)
    OR p_preferred_discipline IS NOT NULL
  );

  IF NOT v_was_onboarded THEN
    IF NOT v_activate_onboarding THEN
      INSERT INTO public.user_study_routine_preferences (
        user_id, target_days, timezone_iana, default_budget_minutes,
        preferred_discipline, hide_gamification, pending_target_days,
        pending_timezone_iana, pending_effective_week_start, onboarding_completed_at
      )
      VALUES (
        v_user_id,
        COALESCE(v_prefs.target_days, 3),
        COALESCE(v_prefs.timezone_iana, 'America/Sao_Paulo'),
        v_next_budget,
        v_next_discipline,
        v_next_hide,
        NULL,
        NULL,
        NULL,
        NULL
      )
      ON CONFLICT (user_id) DO UPDATE SET
        default_budget_minutes = EXCLUDED.default_budget_minutes,
        preferred_discipline = EXCLUDED.preferred_discipline,
        hide_gamification = EXCLUDED.hide_gamification
      RETURNING * INTO v_prefs;

      RETURN jsonb_build_object(
        'preferences', to_jsonb(v_prefs),
        'current_plan', NULL,
        'effective_immediately', false,
        'effective_week_start_date', NULL
      );
    END IF;

    v_active_target := COALESCE(p_target_days, CASE WHEN v_has_prefs THEN v_prefs.target_days ELSE 3 END);
    v_active_tz := COALESCE(v_safe_tz, CASE WHEN v_has_prefs THEN v_prefs.timezone_iana ELSE 'America/Sao_Paulo' END);
    v_local_date := (v_now AT TIME ZONE v_active_tz)::DATE;
    v_week_start := date_trunc('week', v_local_date::TIMESTAMP)::DATE;
    v_week_end := v_week_start + 6;
    v_is_partial := EXTRACT(ISODOW FROM v_local_date) > 1;

    INSERT INTO public.user_study_routine_preferences (
      user_id, target_days, timezone_iana, default_budget_minutes,
      preferred_discipline, hide_gamification, pending_target_days,
      pending_timezone_iana, pending_effective_week_start, onboarding_completed_at
    )
    VALUES (
      v_user_id, v_active_target, v_active_tz, v_next_budget,
      v_next_discipline, v_next_hide, NULL, NULL, NULL, v_now
    )
    ON CONFLICT (user_id) DO UPDATE SET
      target_days = EXCLUDED.target_days,
      timezone_iana = EXCLUDED.timezone_iana,
      default_budget_minutes = EXCLUDED.default_budget_minutes,
      preferred_discipline = EXCLUDED.preferred_discipline,
      hide_gamification = EXCLUDED.hide_gamification,
      pending_target_days = NULL,
      pending_timezone_iana = NULL,
      pending_effective_week_start = NULL,
      onboarding_completed_at = COALESCE(public.user_study_routine_preferences.onboarding_completed_at, EXCLUDED.onboarding_completed_at)
    RETURNING * INTO v_prefs;

    INSERT INTO public.study_routine_weekly_plans (
      user_id, week_start_date, week_end_date, target_days, timezone_iana, is_partial_first_week
    )
    VALUES (
      v_user_id, v_week_start, v_week_end, v_active_target, v_active_tz, v_is_partial
    )
    ON CONFLICT (user_id, week_start_date) DO NOTHING;

    SELECT *
    INTO v_plan
    FROM public.study_routine_weekly_plans
    WHERE user_id = v_user_id
      AND week_start_date = v_week_start
    LIMIT 1;

    RETURN jsonb_build_object(
      'preferences', to_jsonb(v_prefs),
      'current_plan', to_jsonb(v_plan),
      'effective_immediately', true,
      'effective_week_start_date', v_week_start
    );
  END IF;

  v_active_target := CASE WHEN v_has_plan THEN v_plan.target_days ELSE v_prefs.target_days END;
  v_active_tz := CASE WHEN v_has_plan THEN v_plan.timezone_iana ELSE v_prefs.timezone_iana END;
  v_local_date := (v_now AT TIME ZONE v_active_tz)::DATE;
  v_week_start := date_trunc('week', v_local_date::TIMESTAMP)::DATE;
  v_next_week_start := v_week_start + 7;

  IF p_target_days IS NULL THEN
    v_pending_target := v_prefs.pending_target_days;
  ELSIF p_target_days <> v_active_target THEN
    v_pending_target := p_target_days;
    v_target_modified := true;
  ELSE
    v_pending_target := NULL;
  END IF;

  IF v_safe_tz IS NULL THEN
    v_pending_tz := v_prefs.pending_timezone_iana;
  ELSIF v_safe_tz <> v_active_tz THEN
    v_pending_tz := v_safe_tz;
    v_tz_modified := true;
  ELSE
    v_pending_tz := NULL;
  END IF;

  IF v_pending_target IS NULL AND v_pending_tz IS NULL THEN
    v_pending_effective := NULL;
  ELSIF v_target_modified OR v_tz_modified THEN
    v_pending_effective := v_next_week_start;
  ELSE
    v_pending_effective := COALESCE(v_prefs.pending_effective_week_start, v_next_week_start);
  END IF;

  v_effective_immediately := NOT (v_target_modified OR v_tz_modified);
  v_effective_week_start := CASE
    WHEN v_target_modified OR v_tz_modified THEN v_pending_effective
    WHEN v_has_plan THEN v_plan.week_start_date
    ELSE v_week_start
  END;

  UPDATE public.user_study_routine_preferences
  SET target_days = v_active_target,
      timezone_iana = v_active_tz,
      default_budget_minutes = v_next_budget,
      preferred_discipline = v_next_discipline,
      hide_gamification = v_next_hide,
      pending_target_days = v_pending_target,
      pending_timezone_iana = v_pending_tz,
      pending_effective_week_start = v_pending_effective,
      onboarding_completed_at = COALESCE(onboarding_completed_at, v_now)
  WHERE user_id = v_user_id
  RETURNING * INTO v_prefs;

  RETURN jsonb_build_object(
    'preferences', to_jsonb(v_prefs),
    'current_plan', CASE WHEN v_has_plan THEN to_jsonb(v_plan) ELSE NULL END,
    'effective_immediately', v_effective_immediately,
    'effective_week_start_date', v_effective_week_start
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_study_routine_preferences(SMALLINT, TEXT, SMALLINT, TEXT, BOOLEAN, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_study_routine_preferences(SMALLINT, TEXT, SMALLINT, TEXT, BOOLEAN, BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_study_routine_session(
  p_budget_minutes SMALLINT,
  p_selection_mode TEXT,
  p_idempotency_key TEXT,
  p_activities JSONB,
  p_replace_active BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_safe_key TEXT := btrim(COALESCE(p_idempotency_key, ''));
  v_existing_id UUID;
  v_active_session public.study_routine_sessions%ROWTYPE;
  v_sync JSONB;
  v_plan_id UUID;
  v_estimated_minutes INTEGER;
  v_new_session_id UUID;
  v_elem RECORD;
  v_activity_minutes SMALLINT;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM set_config('study_routine.rpc_context', 'true', true);
  PERFORM private.acquire_study_routine_user_lock(v_user_id);

  IF p_budget_minutes IS NULL OR p_budget_minutes NOT IN (5, 15, 30) THEN
    RAISE EXCEPTION 'invalid_budget_minutes' USING ERRCODE = '22023';
  END IF;

  IF p_selection_mode IS NULL OR p_selection_mode NOT IN ('recommended', 'manual', 'resumed') THEN
    RAISE EXCEPTION 'invalid_selection_mode' USING ERRCODE = '22023';
  END IF;

  IF v_safe_key = '' OR char_length(v_safe_key) > 128 THEN
    RAISE EXCEPTION 'invalid_idempotency_key' USING ERRCODE = '22023';
  END IF;

  IF p_activities IS NULL
    OR jsonb_typeof(p_activities) <> 'array'
    OR jsonb_array_length(p_activities) < 1
    OR jsonb_array_length(p_activities) > 20
  THEN
    RAISE EXCEPTION 'session_activities_required' USING ERRCODE = '22023';
  END IF;

  SELECT id
  INTO v_existing_id
  FROM public.study_routine_sessions
  WHERE user_id = v_user_id
    AND idempotency_key = v_safe_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'session', private.get_study_routine_session_json(v_user_id, v_existing_id),
      'resumed', true,
      'idempotent', true
    );
  END IF;

  SELECT *
  INTO v_active_session
  FROM public.study_routine_sessions
  WHERE user_id = v_user_id
    AND status IN ('planned', 'in_progress', 'interrupted')
  ORDER BY last_activity_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF NOT COALESCE(p_replace_active, false) THEN
      IF v_active_session.status <> 'in_progress' THEN
        UPDATE public.study_routine_sessions
        SET status = 'in_progress',
            last_activity_at = v_now
        WHERE id = v_active_session.id
          AND user_id = v_user_id;
      END IF;

      RETURN jsonb_build_object(
        'session', private.get_study_routine_session_json(v_user_id, v_active_session.id),
        'resumed', true,
        'idempotent', false
      );
    END IF;

    UPDATE public.study_routine_sessions
    SET status = 'discarded',
        last_activity_at = v_now
    WHERE id = v_active_session.id
      AND user_id = v_user_id;
  END IF;

  v_sync := private.sync_user_study_routine_week(v_user_id, true, v_now);
  v_plan_id := NULLIF(v_sync->'current_plan'->>'id', '')::UUID;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'study_routine_weekly_plan_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT LEAST(180, GREATEST(1, COALESCE(SUM(
    GREATEST(1, LEAST(180, COALESCE(NULLIF(elem->>'estimated_minutes', '')::INTEGER, 1)))
  ), 1)))
  INTO v_estimated_minutes
  FROM jsonb_array_elements(p_activities) AS elem;

  INSERT INTO public.study_routine_sessions (
    user_id, weekly_plan_id, status, budget_minutes, estimated_minutes,
    selection_mode, idempotency_key, started_at, last_activity_at
  )
  VALUES (
    v_user_id, v_plan_id, 'in_progress', p_budget_minutes, v_estimated_minutes::SMALLINT,
    p_selection_mode, v_safe_key, v_now, v_now
  )
  RETURNING id INTO v_new_session_id;

  FOR v_elem IN
    SELECT elem, (ordinality - 1)::SMALLINT AS order_idx
    FROM jsonb_array_elements(p_activities) WITH ORDINALITY AS t(elem, ordinality)
  LOOP
    v_activity_minutes := GREATEST(
      1,
      LEAST(180, COALESCE(NULLIF(v_elem.elem->>'estimated_minutes', '')::INTEGER, 1))
    )::SMALLINT;

    INSERT INTO public.study_routine_session_activities (
      session_id, user_id, order_index, activity_type, status,
      topic_id, topic_title, discipline, section_id, content_unit_id,
      activity_title, estimated_minutes, evidence_kind
    )
    VALUES (
      v_new_session_id,
      v_user_id,
      v_elem.order_idx,
      COALESCE(NULLIF(btrim(v_elem.elem->>'activity_type'), ''), 'summary'),
      'pending',
      NULLIF(btrim(v_elem.elem->>'topic_id'), ''),
      btrim(COALESCE(v_elem.elem->>'topic_title', '')),
      btrim(COALESCE(v_elem.elem->>'discipline', '')),
      NULLIF(btrim(v_elem.elem->>'section_id'), ''),
      NULLIF(btrim(v_elem.elem->>'content_unit_id'), '')::UUID,
      btrim(COALESCE(v_elem.elem->>'activity_title', '')),
      v_activity_minutes,
      COALESCE(NULLIF(btrim(v_elem.elem->>'evidence_kind'), ''), 'self_declared')
    );
  END LOOP;

  RETURN jsonb_build_object(
    'session', private.get_study_routine_session_json(v_user_id, v_new_session_id),
    'resumed', false,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_study_routine_session(SMALLINT, TEXT, TEXT, JSONB, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_study_routine_session(SMALLINT, TEXT, TEXT, JSONB, BOOLEAN)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_study_routine_session_status(
  p_session_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_session public.study_routine_sessions%ROWTYPE;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM set_config('study_routine.rpc_context', 'true', true);
  PERFORM private.acquire_study_routine_user_lock(v_user_id);

  IF p_status IS NULL OR p_status NOT IN ('in_progress', 'interrupted', 'discarded') THEN
    RAISE EXCEPTION 'invalid_session_status_transition' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_session
  FROM public.study_routine_sessions
  WHERE id = p_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'study_routine_session_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.status IN ('completed', 'discarded') THEN
    RAISE EXCEPTION 'closed_study_routine_session' USING ERRCODE = '23514';
  END IF;

  UPDATE public.study_routine_sessions
  SET status = p_status,
      last_activity_at = v_now
  WHERE id = p_session_id
    AND user_id = v_user_id;

  RETURN private.get_study_routine_session_json(v_user_id, p_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.update_study_routine_session_status(UUID, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_study_routine_session_status(UUID, TEXT)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.replace_study_routine_session_activity(
  p_session_id UUID,
  p_activity_id UUID,
  p_content_unit_id UUID,
  p_topic_id TEXT,
  p_topic_title TEXT,
  p_discipline TEXT,
  p_section_id TEXT,
  p_activity_title TEXT,
  p_estimated_minutes SMALLINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_session public.study_routine_sessions%ROWTYPE;
  v_total_minutes INTEGER;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM set_config('study_routine.rpc_context', 'true', true);
  PERFORM private.acquire_study_routine_user_lock(v_user_id);

  IF p_estimated_minutes IS NULL OR p_estimated_minutes < 1 OR p_estimated_minutes > 180 THEN
    RAISE EXCEPTION 'invalid_estimated_minutes' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_session
  FROM public.study_routine_sessions
  WHERE id = p_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'study_routine_session_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.status IN ('completed', 'discarded') THEN
    RAISE EXCEPTION 'closed_study_routine_session' USING ERRCODE = '23514';
  END IF;

  UPDATE public.study_routine_session_activities
  SET topic_id = NULLIF(btrim(COALESCE(p_topic_id, '')), ''),
      topic_title = btrim(COALESCE(p_topic_title, '')),
      discipline = btrim(COALESCE(p_discipline, '')),
      section_id = NULLIF(btrim(COALESCE(p_section_id, '')), ''),
      content_unit_id = p_content_unit_id,
      activity_title = btrim(COALESCE(p_activity_title, '')),
      estimated_minutes = p_estimated_minutes,
      status = 'pending',
      completed_at = NULL
  WHERE id = p_activity_id
    AND session_id = p_session_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'study_routine_activity_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT LEAST(180, GREATEST(1, COALESCE(SUM(estimated_minutes), 1)))
  INTO v_total_minutes
  FROM public.study_routine_session_activities
  WHERE session_id = p_session_id
    AND user_id = v_user_id;

  UPDATE public.study_routine_sessions
  SET estimated_minutes = v_total_minutes::SMALLINT,
      last_activity_at = v_now
  WHERE id = p_session_id
    AND user_id = v_user_id;

  RETURN private.get_study_routine_session_json(v_user_id, p_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_study_routine_session_activity(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, SMALLINT)
  TO authenticated, service_role;

-- =============================================================================
-- RPC transacional e idempotente para concluir sessão
-- =============================================================================

CREATE OR REPLACE FUNCTION public.complete_study_routine_session(
  p_session_id UUID,
  p_completed_activity_ids UUID[],
  p_completion_idempotency_key TEXT,
  p_weekly_plan_id UUID DEFAULT NULL
)
RETURNS public.study_routine_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_safe_key TEXT := btrim(COALESCE(p_completion_idempotency_key, ''));
  v_session public.study_routine_sessions%ROWTYPE;
  v_plan_id UUID;
  v_timezone TEXT;
  v_local_date DATE;
  v_week_start DATE;
  v_valid_count INTEGER;
  v_sync JSONB;
BEGIN
  v_user_id := private.require_authenticated_routine_access();
  PERFORM set_config('study_routine.rpc_context', 'true', true);
  PERFORM private.acquire_study_routine_user_lock(v_user_id);

  IF v_safe_key = '' OR char_length(v_safe_key) > 128 THEN
    RAISE EXCEPTION 'invalid_completion_idempotency_key' USING ERRCODE = '22023';
  END IF;

  IF p_completed_activity_ids IS NULL OR cardinality(p_completed_activity_ids) = 0 THEN
    RAISE EXCEPTION 'completed_activities_required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_session
  FROM public.study_routine_sessions
  WHERE user_id = v_user_id
    AND completion_idempotency_key = v_safe_key
  LIMIT 1;

  IF FOUND AND v_session.id = p_session_id THEN
    RETURN v_session;
  END IF;

  SELECT *
  INTO v_session
  FROM public.study_routine_sessions
  WHERE id = p_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'study_routine_session_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.status = 'completed' THEN
    RETURN v_session;
  END IF;

  IF v_session.status = 'discarded' THEN
    RAISE EXCEPTION 'discarded_session_cannot_be_completed' USING ERRCODE = '23514';
  END IF;

  SELECT COUNT(*)
  INTO v_valid_count
  FROM public.study_routine_session_activities AS activity
  JOIN public.sections AS section ON section.content_unit_id = activity.content_unit_id
  JOIN public.topics AS topic ON topic.topic_id = section.topic_id
  WHERE activity.session_id = p_session_id
    AND activity.user_id = v_user_id
    AND activity.id = ANY (p_completed_activity_ids)
    AND activity.activity_type = 'summary'
    AND section.archived_at IS NULL
    AND topic.archived_at IS NULL;

  IF v_valid_count = 0 THEN
    RAISE EXCEPTION 'no_eligible_completed_activity' USING ERRCODE = '23514';
  END IF;

  IF p_weekly_plan_id IS NOT NULL THEN
    v_plan_id := p_weekly_plan_id;
  ELSE
    v_sync := private.sync_user_study_routine_week(v_user_id, true, v_now);
    v_plan_id := COALESCE(
      NULLIF(v_sync->'current_plan'->>'id', '')::UUID,
      v_session.weekly_plan_id
    );
  END IF;

  SELECT timezone_iana
  INTO v_timezone
  FROM public.study_routine_weekly_plans
  WHERE id = v_plan_id
    AND user_id = v_user_id;

  IF v_timezone IS NULL THEN
    RAISE EXCEPTION 'study_routine_weekly_plan_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_local_date := (v_now AT TIME ZONE v_timezone)::DATE;
  v_week_start := date_trunc('week', v_local_date::TIMESTAMP)::DATE;

  UPDATE public.study_routine_session_activities
  SET status = 'completed',
      completed_at = v_now
  WHERE session_id = p_session_id
    AND user_id = v_user_id
    AND id = ANY (p_completed_activity_ids);

  UPDATE public.study_routine_sessions
  SET status = 'completed',
      weekly_plan_id = v_plan_id,
      completion_idempotency_key = COALESCE(completion_idempotency_key, v_safe_key),
      last_activity_at = v_now,
      completed_at = v_now,
      completed_local_date = v_local_date,
      completed_week_start_date = v_week_start,
      completed_timezone_iana = v_timezone
  WHERE id = p_session_id
    AND user_id = v_user_id
  RETURNING * INTO v_session;

  INSERT INTO public.user_progress (user_id, section_id, content_unit_id, completed, updated_at)
  SELECT
    v_user_id,
    section.section_id,
    section.content_unit_id,
    true,
    v_now
  FROM public.study_routine_session_activities AS activity
  JOIN public.sections AS section ON section.content_unit_id = activity.content_unit_id
  WHERE activity.session_id = p_session_id
    AND activity.user_id = v_user_id
    AND activity.id = ANY (p_completed_activity_ids)
    AND activity.activity_type = 'summary'
  ON CONFLICT (user_id, content_unit_id) DO UPDATE SET
    completed = true,
    updated_at = EXCLUDED.updated_at;

  RETURN v_session;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_study_routine_session(UUID, UUID[], TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_study_routine_session(UUID, UUID[], TEXT, UUID)
  TO authenticated, service_role;

-- =============================================================================
-- Row Level Security (RLS) e privilégios mínimos (SELECT direto apenas)
-- =============================================================================

ALTER TABLE public.user_study_routine_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_routine_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_routine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_routine_session_activities ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.user_study_routine_preferences,
  public.study_routine_weekly_plans,
  public.study_routine_sessions,
  public.study_routine_session_activities
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.user_study_routine_preferences,
  public.study_routine_weekly_plans,
  public.study_routine_sessions,
  public.study_routine_session_activities
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_study_routine_preferences,
  public.study_routine_weekly_plans,
  public.study_routine_sessions,
  public.study_routine_session_activities
TO service_role;

DROP POLICY IF EXISTS user_study_routine_preferences_select_own ON public.user_study_routine_preferences;
DROP POLICY IF EXISTS user_study_routine_preferences_insert_own ON public.user_study_routine_preferences;
DROP POLICY IF EXISTS user_study_routine_preferences_update_own ON public.user_study_routine_preferences;
DROP POLICY IF EXISTS user_study_routine_preferences_delete_own ON public.user_study_routine_preferences;
CREATE POLICY user_study_routine_preferences_select_own
  ON public.user_study_routine_preferences FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS study_routine_weekly_plans_select_own ON public.study_routine_weekly_plans;
DROP POLICY IF EXISTS study_routine_weekly_plans_insert_own ON public.study_routine_weekly_plans;
DROP POLICY IF EXISTS study_routine_weekly_plans_update_own ON public.study_routine_weekly_plans;
DROP POLICY IF EXISTS study_routine_weekly_plans_delete_own ON public.study_routine_weekly_plans;
CREATE POLICY study_routine_weekly_plans_select_own
  ON public.study_routine_weekly_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS study_routine_sessions_select_own ON public.study_routine_sessions;
DROP POLICY IF EXISTS study_routine_sessions_insert_own ON public.study_routine_sessions;
DROP POLICY IF EXISTS study_routine_sessions_update_own ON public.study_routine_sessions;
DROP POLICY IF EXISTS study_routine_sessions_delete_own ON public.study_routine_sessions;
CREATE POLICY study_routine_sessions_select_own
  ON public.study_routine_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS study_routine_activities_select_own ON public.study_routine_session_activities;
DROP POLICY IF EXISTS study_routine_activities_insert_own ON public.study_routine_session_activities;
DROP POLICY IF EXISTS study_routine_activities_update_own ON public.study_routine_session_activities;
DROP POLICY IF EXISTS study_routine_activities_delete_own ON public.study_routine_session_activities;
CREATE POLICY study_routine_activities_select_own
  ON public.study_routine_session_activities FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
