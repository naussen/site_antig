-- =============================================================================
-- Migration 052: Rotina semanal e sessões curtas de estudo (Gamificação MVP)
-- =============================================================================
-- Numerada como 052 para não colidir com as migrations 026..051 presentes no
-- banco compartilhado e na branch main (incluindo 026_create_study_planner.sql,
-- que define study_plans e study_plan_items).
-- Todas as tabelas pertencem ao Grupo A (dados pessoais por usuário com RLS).

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
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
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
    )
  ),
  CHECK (
    (status = 'completed') OR (
      completed_at IS NULL
      AND completed_local_date IS NULL
      AND completed_week_start_date IS NULL
      AND completed_timezone_iana IS NULL
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
  CHECK ((status <> 'completed') OR completed_at IS NOT NULL)
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
-- Triggers de integridade (imutabilidade de semanas antigas e transições)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION private.enforce_study_routine_weekly_plan_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ROW(OLD.user_id, OLD.week_start_date, OLD.week_end_date, OLD.target_days, OLD.timezone_iana)
    IS DISTINCT FROM
    ROW(NEW.user_id, NEW.week_start_date, NEW.week_end_date, NEW.target_days, NEW.timezone_iana)
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
  BEFORE UPDATE ON public.study_routine_weekly_plans
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_weekly_plan_immutability();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_session_transitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    THEN
      RAISE EXCEPTION 'study_routine_session_identity_immutable' USING ERRCODE = '55000';
    END IF;

    IF OLD.status = 'completed' THEN
      IF NEW.status <> 'completed'
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

  IF NEW.status = 'completed' AND NOT EXISTS (
    SELECT 1
    FROM public.study_routine_session_activities AS activity
    WHERE activity.session_id = NEW.id
      AND activity.user_id = NEW.user_id
      AND activity.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'completed_session_requires_completed_activity' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_study_routine_session_transitions()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_enforce_study_routine_session_transitions
  ON public.study_routine_sessions;
CREATE TRIGGER trigger_enforce_study_routine_session_transitions
  BEFORE INSERT OR UPDATE ON public.study_routine_sessions
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_session_transitions();

CREATE OR REPLACE FUNCTION private.enforce_study_routine_activity_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.activity_type = 'summary' THEN
    IF NEW.content_unit_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.sections AS section
      JOIN public.topics AS topic ON topic.topic_id = section.topic_id
      WHERE section.content_unit_id = NEW.content_unit_id
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
  BEFORE INSERT ON public.study_routine_session_activities
  FOR EACH ROW EXECUTE FUNCTION private.enforce_study_routine_activity_integrity();

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
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
  v_session public.study_routine_sessions%ROWTYPE;
  v_plan_id UUID;
  v_timezone TEXT;
  v_local_date DATE;
  v_week_start DATE;
  v_valid_count INTEGER;
BEGIN
  v_user_id := (SELECT auth.uid());
  IF v_user_id IS NULL OR NOT (SELECT private.has_active_content_access()) THEN
    RAISE EXCEPTION 'active_content_access_required' USING ERRCODE = '42501';
  END IF;

  IF p_completion_idempotency_key IS NULL OR btrim(p_completion_idempotency_key) = '' THEN
    RAISE EXCEPTION 'invalid_completion_idempotency_key' USING ERRCODE = '22023';
  END IF;

  IF p_completed_activity_ids IS NULL OR cardinality(p_completed_activity_ids) = 0 THEN
    RAISE EXCEPTION 'completed_activities_required' USING ERRCODE = '22023';
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

  v_plan_id := COALESCE(p_weekly_plan_id, v_session.weekly_plan_id);

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
      completion_idempotency_key = COALESCE(completion_idempotency_key, btrim(p_completion_idempotency_key)),
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
  TO authenticated;

-- =============================================================================
-- Row Level Security (RLS) e privilégios mínimos
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

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
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

CREATE POLICY user_study_routine_preferences_select_own
  ON public.user_study_routine_preferences FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY user_study_routine_preferences_insert_own
  ON public.user_study_routine_preferences FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY user_study_routine_preferences_update_own
  ON public.user_study_routine_preferences FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY user_study_routine_preferences_delete_own
  ON public.user_study_routine_preferences FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_weekly_plans_select_own
  ON public.study_routine_weekly_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_weekly_plans_insert_own
  ON public.study_routine_weekly_plans FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_weekly_plans_update_own
  ON public.study_routine_weekly_plans FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_weekly_plans_delete_own
  ON public.study_routine_weekly_plans FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_sessions_select_own
  ON public.study_routine_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_sessions_insert_own
  ON public.study_routine_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_sessions_update_own
  ON public.study_routine_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_sessions_delete_own
  ON public.study_routine_sessions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_activities_select_own
  ON public.study_routine_session_activities FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY study_routine_activities_insert_own
  ON public.study_routine_session_activities FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_activities_update_own
  ON public.study_routine_session_activities FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) = user_id
    AND (SELECT private.has_active_content_access())
  );

CREATE POLICY study_routine_activities_delete_own
  ON public.study_routine_session_activities FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
