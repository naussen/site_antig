-- Planner pessoal de estudos: planos de 1 a 4 semanas e blocos por horário.

CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Meu plano de estudos'
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 80),
  start_date DATE NOT NULL
    CHECK (EXTRACT(ISODOW FROM start_date) = 1),
  weeks_count SMALLINT NOT NULL DEFAULT 1
    CHECK (weeks_count BETWEEN 1 AND 4),
  day_start_minute SMALLINT NOT NULL DEFAULT 360
    CHECK (day_start_minute BETWEEN 0 AND 1439),
  day_end_minute SMALLINT NOT NULL DEFAULT 1380
    CHECK (day_end_minute BETWEEN 1 AND 1440),
  slot_minutes SMALLINT NOT NULL DEFAULT 30
    CHECK (slot_minutes IN (15, 30, 60)),
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo'
    CHECK (timezone = 'America/Sao_Paulo'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT study_plans_day_range_check
    CHECK (day_end_minute > day_start_minute),
  CONSTRAINT study_plans_grid_alignment_check
    CHECK ((day_end_minute - day_start_minute) % slot_minutes = 0)
);

CREATE UNIQUE INDEX study_plans_one_active_per_user
  ON public.study_plans(user_id)
  WHERE is_active;

CREATE INDEX study_plans_user_created_idx
  ON public.study_plans(user_id, created_at DESC);

CREATE TABLE public.study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL
    CHECK (char_length(btrim(discipline)) BETWEEN 1 AND 120),
  study_date DATE NOT NULL,
  start_minute SMALLINT NOT NULL
    CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute SMALLINT NOT NULL
    CHECK (end_minute BETWEEN 1 AND 1440),
  note TEXT
    CHECK (note IS NULL OR char_length(note) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT study_plan_items_time_range_check
    CHECK (end_minute > start_minute)
);

CREATE INDEX study_plan_items_user_date_start_idx
  ON public.study_plan_items(user_id, study_date, start_minute);

CREATE INDEX study_plan_items_plan_date_idx
  ON public.study_plan_items(plan_id, study_date);

CREATE OR REPLACE FUNCTION public.validate_study_plan_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_plan public.study_plans%ROWTYPE;
BEGIN
  SELECT * INTO target_plan
  FROM public.study_plans
  WHERE id = NEW.plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plano de estudos não encontrado.' USING ERRCODE = '23503';
  END IF;

  IF NEW.user_id <> target_plan.user_id THEN
    RAISE EXCEPTION 'O bloco deve pertencer ao mesmo usuário do plano.' USING ERRCODE = '42501';
  END IF;

  IF NEW.study_date < target_plan.start_date
    OR NEW.study_date >= target_plan.start_date + (target_plan.weeks_count * 7)
  THEN
    RAISE EXCEPTION 'A data está fora do período do plano.' USING ERRCODE = '23514';
  END IF;

  IF NEW.start_minute < target_plan.day_start_minute
    OR NEW.end_minute > target_plan.day_end_minute
  THEN
    RAISE EXCEPTION 'O horário está fora da faixa diária do plano.' USING ERRCODE = '23514';
  END IF;

  IF (NEW.start_minute - target_plan.day_start_minute) % target_plan.slot_minutes <> 0
    OR (NEW.end_minute - target_plan.day_start_minute) % target_plan.slot_minutes <> 0
  THEN
    RAISE EXCEPTION 'O horário deve respeitar os intervalos do plano.' USING ERRCODE = '23514';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(NEW.user_id::text || ':' || NEW.study_date::text, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.study_plan_items existing
    WHERE existing.plan_id = NEW.plan_id
      AND existing.study_date = NEW.study_date
      AND existing.id <> NEW.id
      AND int4range(existing.start_minute, existing.end_minute, '[)')
        && int4range(NEW.start_minute, NEW.end_minute, '[)')
  ) THEN
    RAISE EXCEPTION 'Já existe um estudo nesse horário.' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_study_plan_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.study_plan_items item
    WHERE item.plan_id = NEW.id
      AND (
        item.study_date < NEW.start_date
        OR item.study_date >= NEW.start_date + (NEW.weeks_count * 7)
        OR item.start_minute < NEW.day_start_minute
        OR item.end_minute > NEW.day_end_minute
        OR (item.start_minute - NEW.day_start_minute) % NEW.slot_minutes <> 0
        OR (item.end_minute - NEW.day_start_minute) % NEW.slot_minutes <> 0
      )
  ) THEN
    RAISE EXCEPTION 'A nova configuração deixaria estudos fora do período ou horário.' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_validate_study_plan_item
  BEFORE INSERT OR UPDATE ON public.study_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_study_plan_item();

CREATE TRIGGER trigger_validate_study_plan_update
  BEFORE UPDATE OF start_date, weeks_count, day_start_minute, day_end_minute, slot_minutes
  ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.validate_study_plan_update();

CREATE TRIGGER trigger_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_study_plan_items_updated_at
  BEFORE UPDATE ON public.study_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.study_plans FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.study_plan_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.study_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.study_plan_items TO authenticated;

CREATE POLICY study_plans_select_own
  ON public.study_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plans_insert_own
  ON public.study_plans FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plans_update_own
  ON public.study_plans FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plans_delete_own
  ON public.study_plans FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plan_items_select_own
  ON public.study_plan_items FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plan_items_insert_own
  ON public.study_plan_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plan_items_update_own
  ON public.study_plan_items FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY study_plan_items_delete_own
  ON public.study_plan_items FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.study_plans IS
  'Planos pessoais de estudo com horizonte máximo de quatro semanas';
COMMENT ON TABLE public.study_plan_items IS
  'Blocos de disciplinas agendados pelo aluno em seu planner';
