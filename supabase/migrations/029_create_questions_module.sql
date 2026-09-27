-- =============================================================================
-- Migration 029: fundacao do modulo de questoes
--
-- Escopo:
-- - catalogo canonico de disciplinas e vinculos com topicos;
-- - conteudo editorial de questoes, alternativas, gabarito e explicacao;
-- - tentativas, preferencias, comentarios pseudonimos e denuncias;
-- - RPCs estreitas para listagem, resposta, preferencias e estatisticas;
-- - RLS e privilegios minimos, sem exposicao direta do gabarito.
-- =============================================================================

CREATE OR REPLACE FUNCTION private.normalize_question_discipline_slug(p_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := trim(BOTH '-' FROM regexp_replace(
    translate(
      lower(btrim(p_value)),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  ));

  IF normalized = '' THEN
    RAISE EXCEPTION 'discipline name cannot produce an empty slug';
  END IF;

  RETURN normalized;
END;
$$;

REVOKE ALL ON FUNCTION private.normalize_question_discipline_slug(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.normalize_question_discipline_slug(TEXT)
  TO service_role;

CREATE TABLE public.disciplines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name       TEXT NOT NULL UNIQUE CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 120),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.disciplines IS
  'Catalogo canonico de disciplinas usado por questoes e topicos.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.topics AS topic
    GROUP BY private.normalize_question_discipline_slug(topic.discipline)
    HAVING count(DISTINCT topic.discipline) > 1
  ) THEN
    RAISE EXCEPTION 'discipline slug collision detected; audit topics.discipline before migration';
  END IF;
END;
$$;

INSERT INTO public.disciplines (slug, name)
SELECT DISTINCT
  private.normalize_question_discipline_slug(topic.discipline),
  topic.discipline
FROM public.topics AS topic
ORDER BY topic.discipline;

CREATE TABLE public.topic_discipline_relations (
  topic_id      TEXT NOT NULL REFERENCES public.topics(topic_id) ON DELETE RESTRICT,
  discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE RESTRICT,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, discipline_id)
);

CREATE UNIQUE INDEX idx_topic_discipline_one_primary
  ON public.topic_discipline_relations(topic_id)
  WHERE is_primary;
CREATE INDEX idx_topic_discipline_by_discipline
  ON public.topic_discipline_relations(discipline_id, topic_id);

INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
SELECT topic.topic_id, discipline.id, true
FROM public.topics AS topic
JOIN public.disciplines AS discipline
  ON discipline.name = topic.discipline;

CREATE TABLE public.questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id         TEXT NOT NULL UNIQUE CHECK (
    external_id = btrim(external_id) AND char_length(external_id) BETWEEN 1 AND 160
  ),
  question_type       TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
  statement_markdown  TEXT NOT NULL CHECK (
    statement_markdown = btrim(statement_markdown)
    AND char_length(statement_markdown) BETWEEN 1 AND 20000
  ),
  subject             TEXT NOT NULL CHECK (subject = btrim(subject) AND char_length(subject) BETWEEN 1 AND 200),
  exam_board          TEXT CHECK (exam_board IS NULL OR (exam_board = btrim(exam_board) AND char_length(exam_board) BETWEEN 1 AND 120)),
  institution         TEXT CHECK (institution IS NULL OR (institution = btrim(institution) AND char_length(institution) BETWEEN 1 AND 200)),
  position_name       TEXT CHECK (position_name IS NULL OR (position_name = btrim(position_name) AND char_length(position_name) BETWEEN 1 AND 200)),
  exam_year           SMALLINT CHECK (exam_year IS NULL OR exam_year BETWEEN 1900 AND 2200),
  difficulty          TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  source_reference    TEXT CHECK (source_reference IS NULL OR char_length(source_reference) BETWEEN 1 AND 1000),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_document     TSVECTOR GENERATED ALWAYS AS (
    to_tsvector(
      'portuguese'::regconfig,
      coalesce(statement_markdown, '') || ' ' ||
      coalesce(subject, '') || ' ' ||
      coalesce(exam_board, '') || ' ' ||
      coalesce(institution, '') || ' ' ||
      coalesce(position_name, '') || ' ' ||
      coalesce(source_reference, '')
    )
  ) STORED,
  CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR status <> 'published'
  )
);

CREATE INDEX idx_questions_search_document
  ON public.questions USING gin(search_document);
CREATE INDEX idx_questions_published_cursor
  ON public.questions(subject, exam_year, id)
  WHERE status = 'published';

CREATE TABLE public.question_discipline_relations (
  question_id  UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE RESTRICT,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  sort_order   SMALLINT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, discipline_id)
);

CREATE UNIQUE INDEX idx_question_discipline_one_primary
  ON public.question_discipline_relations(question_id)
  WHERE is_primary;
CREATE INDEX idx_question_discipline_by_discipline
  ON public.question_discipline_relations(discipline_id, question_id);

CREATE TABLE public.question_topic_relations (
  question_id  UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  topic_id     TEXT NOT NULL REFERENCES public.topics(topic_id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('primary', 'related', 'reference')),
  relevance    SMALLINT NOT NULL DEFAULT 100 CHECK (relevance BETWEEN 1 AND 100),
  sort_order   SMALLINT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, topic_id)
);

CREATE UNIQUE INDEX idx_question_topic_one_primary
  ON public.question_topic_relations(question_id)
  WHERE relation_type = 'primary';
CREATE INDEX idx_question_topic_by_topic
  ON public.question_topic_relations(topic_id, question_id);

CREATE TABLE public.question_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label         TEXT NOT NULL CHECK (label ~ '^[A-Z0-9]{1,3}$'),
  body_markdown TEXT NOT NULL CHECK (
    body_markdown = btrim(body_markdown) AND char_length(body_markdown) BETWEEN 1 AND 5000
  ),
  sort_order    SMALLINT NOT NULL CHECK (sort_order BETWEEN 0 AND 20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, label),
  UNIQUE (question_id, sort_order),
  UNIQUE (question_id, id)
);

CREATE TABLE public.question_answer_keys (
  question_id      UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_option_id UUID NOT NULL,
  updated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (question_id, correct_option_id)
    REFERENCES public.question_options(question_id, id)
    ON DELETE RESTRICT
);

CREATE TABLE public.question_explanations (
  question_id      UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  body_markdown    TEXT NOT NULL CHECK (
    body_markdown = btrim(body_markdown) AND char_length(body_markdown) BETWEEN 1 AND 20000
  ),
  source_reference TEXT CHECK (source_reference IS NULL OR char_length(source_reference) BETWEEN 1 AND 1000),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published', 'rejected')),
  reviewed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status IN ('reviewed', 'published') AND reviewed_at IS NOT NULL)
    OR status IN ('draft', 'rejected')
  )
);

CREATE TABLE public.user_question_attempts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id      UUID NOT NULL,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_id UUID NOT NULL,
  is_correct         BOOLEAN NOT NULL,
  duration_ms        INTEGER CHECK (duration_ms IS NULL OR duration_ms BETWEEN 0 AND 86400000),
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, submission_id),
  FOREIGN KEY (question_id, selected_option_id)
    REFERENCES public.question_options(question_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX idx_question_attempts_user_answered
  ON public.user_question_attempts(user_id, answered_at DESC, id DESC);
CREATE INDEX idx_question_attempts_user_question
  ON public.user_question_attempts(user_id, question_id, answered_at DESC, id DESC);

CREATE TABLE public.user_question_preferences (
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id          UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  hidden_at            TIMESTAMPTZ,
  hidden_reason        TEXT CHECK (
    hidden_reason IS NULL OR hidden_reason IN ('not_relevant', 'outdated', 'repeated', 'other')
  ),
  marked_for_review_at TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id),
  CHECK (hidden_at IS NOT NULL OR hidden_reason IS NULL)
);

CREATE INDEX idx_question_preferences_user_hidden
  ON public.user_question_preferences(user_id, hidden_at, question_id);

CREATE TABLE public.question_comment_aliases (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias      TEXT NOT NULL UNIQUE CHECK (alias ~ '^Aluno-[A-Z0-9]{8}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.question_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.question_comments(id) ON DELETE SET NULL,
  body        TEXT NOT NULL CHECK (body = btrim(body) AND char_length(body) BETWEEN 1 AND 2000),
  status      TEXT NOT NULL DEFAULT 'published' CHECK (
    status IN ('published', 'hidden_by_author', 'hidden_by_moderator', 'deleted')
  ),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at   TIMESTAMPTZ
);

CREATE INDEX idx_question_comments_published
  ON public.question_comments(question_id, created_at DESC, id DESC)
  WHERE status = 'published';

CREATE TABLE public.question_comment_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id       UUID NOT NULL REFERENCES public.question_comments(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           TEXT NOT NULL CHECK (reason IN ('spam', 'abuse', 'personal_data', 'incorrect_content', 'other')),
  details          TEXT CHECK (details IS NULL OR (details = btrim(details) AND char_length(details) BETWEEN 1 AND 500)),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (comment_id, reporter_user_id)
);

CREATE INDEX idx_question_comment_reports_open
  ON public.question_comment_reports(status, created_at)
  WHERE status = 'open';

CREATE OR REPLACE FUNCTION private.validate_question_comment_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  parent_question_id UUID;
  parent_parent_id UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT comment.question_id, comment.parent_id
  INTO parent_question_id, parent_parent_id
  FROM public.question_comments AS comment
  WHERE comment.id = NEW.parent_id;

  IF NOT FOUND OR parent_question_id <> NEW.question_id OR parent_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'comment reply must target a root comment from the same question';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_question_comment_parent()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trigger_validate_question_comment_parent
  BEFORE INSERT OR UPDATE OF question_id, parent_id ON public.question_comments
  FOR EACH ROW EXECUTE FUNCTION private.validate_question_comment_parent();

CREATE OR REPLACE FUNCTION private.validate_published_question(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_type TEXT;
  current_status TEXT;
  option_count INTEGER;
  primary_discipline_count INTEGER;
BEGIN
  SELECT question.question_type, question.status
  INTO current_type, current_status
  FROM public.questions AS question
  WHERE question.id = p_question_id;

  IF NOT FOUND OR current_status <> 'published' THEN
    RETURN;
  END IF;

  SELECT count(*) FILTER (WHERE relation.is_primary), count(*)
  INTO primary_discipline_count, option_count
  FROM public.question_discipline_relations AS relation
  WHERE relation.question_id = p_question_id;

  IF primary_discipline_count <> 1 OR option_count < 1 THEN
    RAISE EXCEPTION 'published question must have exactly one primary discipline';
  END IF;

  SELECT count(*) INTO option_count
  FROM public.question_options AS option
  WHERE option.question_id = p_question_id;

  IF (current_type = 'true_false' AND option_count <> 2)
     OR (current_type = 'multiple_choice' AND option_count NOT BETWEEN 2 AND 10) THEN
    RAISE EXCEPTION 'published question has an invalid option count';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.question_answer_keys AS answer_key
    WHERE answer_key.question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'published question must have an answer key';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.question_explanations AS explanation
    WHERE explanation.question_id = p_question_id
      AND explanation.status = 'published'
  ) THEN
    RAISE EXCEPTION 'published question must have a published explanation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.question_topic_relations AS question_topic
    WHERE question_topic.question_id = p_question_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.topic_discipline_relations AS topic_discipline
        JOIN public.question_discipline_relations AS question_discipline
          ON question_discipline.discipline_id = topic_discipline.discipline_id
         AND question_discipline.question_id = p_question_id
        WHERE topic_discipline.topic_id = question_topic.topic_id
      )
  ) THEN
    RAISE EXCEPTION 'related topic must share a discipline with the question';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_published_question(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.validate_published_question(UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION private.validate_published_question_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  affected_question_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'questions' THEN
    affected_question_id := COALESCE(NEW.id, OLD.id);
  ELSE
    affected_question_id := COALESCE(NEW.question_id, OLD.question_id);
  END IF;

  PERFORM private.validate_published_question(affected_question_id);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_published_question_trigger()
  FROM PUBLIC, anon, authenticated;

CREATE CONSTRAINT TRIGGER validate_question_on_question_change
  AFTER INSERT OR UPDATE OF question_type, status ON public.questions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();
CREATE CONSTRAINT TRIGGER validate_question_on_discipline_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_discipline_relations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();
CREATE CONSTRAINT TRIGGER validate_question_on_topic_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_topic_relations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();
CREATE CONSTRAINT TRIGGER validate_question_on_option_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_options
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();
CREATE CONSTRAINT TRIGGER validate_question_on_key_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_answer_keys
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();
CREATE CONSTRAINT TRIGGER validate_question_on_explanation_change
  AFTER INSERT OR UPDATE OR DELETE ON public.question_explanations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_published_question_trigger();

CREATE OR REPLACE FUNCTION private.validate_questions_for_topic_discipline()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  affected_topic_id TEXT;
  related_question RECORD;
BEGIN
  affected_topic_id := COALESCE(NEW.topic_id, OLD.topic_id);

  FOR related_question IN
    SELECT relation.question_id
    FROM public.question_topic_relations AS relation
    WHERE relation.topic_id = affected_topic_id
  LOOP
    PERFORM private.validate_published_question(related_question.question_id);
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_questions_for_topic_discipline()
  FROM PUBLIC, anon, authenticated;

CREATE CONSTRAINT TRIGGER validate_questions_on_topic_discipline_change
  AFTER INSERT OR UPDATE OR DELETE ON public.topic_discipline_relations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION private.validate_questions_for_topic_discipline();

CREATE OR REPLACE FUNCTION public.list_questions(
  p_limit INTEGER DEFAULT 20,
  p_after_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_discipline_slug TEXT DEFAULT NULL,
  p_topic_id TEXT DEFAULT NULL,
  p_include_hidden BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  result JSONB;
BEGIN
  IF current_user_id IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  IF p_limit NOT BETWEEN 1 AND 20
     OR (p_search IS NOT NULL AND char_length(p_search) > 200)
     OR (p_discipline_slug IS NOT NULL AND char_length(p_discipline_slug) > 120)
     OR (p_topic_id IS NOT NULL AND char_length(p_topic_id) > 200) THEN
    RAISE EXCEPTION 'invalid question list parameters' USING ERRCODE = '22023';
  END IF;

  WITH paged AS (
    SELECT question.*
    FROM public.questions AS question
    WHERE question.status = 'published'
      AND (p_after_id IS NULL OR question.id > p_after_id)
      AND (
        p_search IS NULL OR btrim(p_search) = ''
        OR question.search_document @@ websearch_to_tsquery('portuguese'::regconfig, btrim(p_search))
      )
      AND (
        p_discipline_slug IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.question_discipline_relations AS relation
          JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
          WHERE relation.question_id = question.id
            AND discipline.slug = p_discipline_slug
            AND discipline.status = 'active'
        )
      )
      AND (
        p_topic_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.question_topic_relations AS relation
          WHERE relation.question_id = question.id
            AND relation.topic_id = p_topic_id
        )
      )
      AND (
        p_include_hidden
        OR NOT EXISTS (
          SELECT 1
          FROM public.user_question_preferences AS preference
          WHERE preference.user_id = current_user_id
            AND preference.question_id = question.id
            AND preference.hidden_at IS NOT NULL
        )
      )
    ORDER BY question.id
    LIMIT p_limit
  ), items AS (
    SELECT
      question.id,
      jsonb_build_object(
        'id', question.id,
        'external_id', question.external_id,
        'question_type', question.question_type,
        'statement_markdown', question.statement_markdown,
        'subject', question.subject,
        'exam_board', question.exam_board,
        'institution', question.institution,
        'position_name', question.position_name,
        'exam_year', question.exam_year,
        'difficulty', question.difficulty,
        'source_reference', question.source_reference,
        'options', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', option.id,
            'label', option.label,
            'body_markdown', option.body_markdown,
            'sort_order', option.sort_order
          ) ORDER BY option.sort_order)
          FROM public.question_options AS option
          WHERE option.question_id = question.id
        ), '[]'::jsonb),
        'disciplines', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'slug', discipline.slug,
            'name', discipline.name,
            'is_primary', relation.is_primary
          ) ORDER BY relation.sort_order, discipline.name)
          FROM public.question_discipline_relations AS relation
          JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'topics', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'topic_id', topic.topic_id,
            'title', topic.title,
            'relation_type', relation.relation_type,
            'is_navigable', topic.archived_at IS NULL
          ) ORDER BY relation.sort_order, topic.title)
          FROM public.question_topic_relations AS relation
          JOIN public.topics AS topic ON topic.topic_id = relation.topic_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'latest_attempt', (
          SELECT jsonb_build_object(
            'is_correct', attempt.is_correct,
            'answered_at', attempt.answered_at
          )
          FROM public.user_question_attempts AS attempt
          WHERE attempt.user_id = current_user_id
            AND attempt.question_id = question.id
          ORDER BY attempt.answered_at DESC, attempt.id DESC
          LIMIT 1
        ),
        'preference', (
          SELECT jsonb_build_object(
            'hidden', preference.hidden_at IS NOT NULL,
            'marked_for_review', preference.marked_for_review_at IS NOT NULL
          )
          FROM public.user_question_preferences AS preference
          WHERE preference.user_id = current_user_id
            AND preference.question_id = question.id
        )
      ) AS item
    FROM paged AS question
  )
  SELECT jsonb_build_object(
    'items', COALESCE(jsonb_agg(items.item ORDER BY items.id), '[]'::jsonb),
    'next_cursor', CASE WHEN count(*) = p_limit THEN max(items.id)::text ELSE NULL END
  )
  INTO result
  FROM items;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_questions(INTEGER, UUID, TEXT, TEXT, TEXT, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_questions(INTEGER, UUID, TEXT, TEXT, TEXT, BOOLEAN)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_question_answer(
  p_submission_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  correct_option_id UUID;
  attempt_record public.user_question_attempts%ROWTYPE;
  inserted_attempt BOOLEAN := false;
  explanation_markdown TEXT;
BEGIN
  IF current_user_id IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  IF p_duration_ms IS NOT NULL AND p_duration_ms NOT BETWEEN 0 AND 86400000 THEN
    RAISE EXCEPTION 'invalid answer duration' USING ERRCODE = '22023';
  END IF;

  SELECT answer_key.correct_option_id
  INTO correct_option_id
  FROM public.questions AS question
  JOIN public.question_answer_keys AS answer_key ON answer_key.question_id = question.id
  WHERE question.id = p_question_id
    AND question.status = 'published';

  IF correct_option_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.question_options AS option
    WHERE option.question_id = p_question_id
      AND option.id = p_selected_option_id
  ) THEN
    RAISE EXCEPTION 'question or option not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_question_attempts (
    submission_id, user_id, question_id, selected_option_id, is_correct, duration_ms
  ) VALUES (
    p_submission_id,
    current_user_id,
    p_question_id,
    p_selected_option_id,
    p_selected_option_id = correct_option_id,
    p_duration_ms
  )
  ON CONFLICT (user_id, submission_id) DO NOTHING
  RETURNING * INTO attempt_record;

  inserted_attempt := FOUND;

  IF NOT inserted_attempt THEN
    SELECT * INTO attempt_record
    FROM public.user_question_attempts AS attempt
    WHERE attempt.user_id = current_user_id
      AND attempt.submission_id = p_submission_id;

    IF attempt_record.question_id <> p_question_id
       OR attempt_record.selected_option_id <> p_selected_option_id THEN
      RAISE EXCEPTION 'submission id was already used for another answer' USING ERRCODE = '23505';
    END IF;
  END IF;

  SELECT explanation.body_markdown
  INTO explanation_markdown
  FROM public.question_explanations AS explanation
  WHERE explanation.question_id = p_question_id
    AND explanation.status = 'published';

  RETURN jsonb_build_object(
    'attempt_id', attempt_record.id,
    'is_correct', attempt_record.is_correct,
    'correct_option_id', correct_option_id,
    'explanation_markdown', explanation_markdown,
    'answered_at', attempt_record.answered_at,
    'replayed', NOT inserted_attempt
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_question_answer(UUID, UUID, UUID, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_question_answer(UUID, UUID, UUID, INTEGER)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.set_question_preference(
  p_question_id UUID,
  p_hidden BOOLEAN DEFAULT NULL,
  p_marked_for_review BOOLEAN DEFAULT NULL,
  p_hidden_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  preference_record public.user_question_preferences%ROWTYPE;
BEGIN
  IF current_user_id IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  IF p_hidden_reason IS NOT NULL
     AND p_hidden_reason NOT IN ('not_relevant', 'outdated', 'repeated', 'other') THEN
    RAISE EXCEPTION 'invalid hidden reason' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.questions AS question WHERE question.id = p_question_id
  ) THEN
    RAISE EXCEPTION 'question not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_question_preferences (
    user_id,
    question_id,
    hidden_at,
    hidden_reason,
    marked_for_review_at
  ) VALUES (
    current_user_id,
    p_question_id,
    CASE WHEN p_hidden IS TRUE THEN now() ELSE NULL END,
    CASE WHEN p_hidden IS TRUE THEN p_hidden_reason ELSE NULL END,
    CASE WHEN p_marked_for_review IS TRUE THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    hidden_at = CASE
      WHEN p_hidden IS TRUE THEN COALESCE(public.user_question_preferences.hidden_at, now())
      WHEN p_hidden IS FALSE THEN NULL
      ELSE public.user_question_preferences.hidden_at
    END,
    hidden_reason = CASE
      WHEN p_hidden IS TRUE THEN p_hidden_reason
      WHEN p_hidden IS FALSE THEN NULL
      ELSE public.user_question_preferences.hidden_reason
    END,
    marked_for_review_at = CASE
      WHEN p_marked_for_review IS TRUE THEN COALESCE(public.user_question_preferences.marked_for_review_at, now())
      WHEN p_marked_for_review IS FALSE THEN NULL
      ELSE public.user_question_preferences.marked_for_review_at
    END,
    updated_at = now()
  RETURNING * INTO preference_record;

  RETURN jsonb_build_object(
    'question_id', preference_record.question_id,
    'hidden', preference_record.hidden_at IS NOT NULL,
    'hidden_reason', preference_record.hidden_reason,
    'marked_for_review', preference_record.marked_for_review_at IS NOT NULL,
    'updated_at', preference_record.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_question_preference(UUID, BOOLEAN, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_question_preference(UUID, BOOLEAN, BOOLEAN, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_question_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  result JSONB;
BEGIN
  IF current_user_id IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  WITH ranked AS (
    SELECT
      attempt.*,
      row_number() OVER (
        PARTITION BY attempt.question_id
        ORDER BY attempt.answered_at, attempt.id
      ) AS first_rank,
      row_number() OVER (
        PARTITION BY attempt.question_id
        ORDER BY attempt.answered_at DESC, attempt.id DESC
      ) AS latest_rank
    FROM public.user_question_attempts AS attempt
    WHERE attempt.user_id = current_user_id
  ), totals AS (
    SELECT
      count(*) AS total_attempts,
      count(DISTINCT question_id) AS answered_questions,
      count(*) FILTER (WHERE first_rank = 1 AND is_correct) AS first_correct,
      count(*) FILTER (WHERE latest_rank = 1 AND is_correct) AS latest_correct,
      count(*) FILTER (WHERE latest_rank = 1 AND NOT is_correct) AS error_notebook_count,
      count(*) FILTER (WHERE answered_at >= now() - interval '7 days') AS attempts_7d,
      count(*) FILTER (WHERE answered_at >= now() - interval '7 days' AND is_correct) AS correct_7d,
      count(*) FILTER (WHERE answered_at >= now() - interval '30 days') AS attempts_30d,
      count(*) FILTER (WHERE answered_at >= now() - interval '30 days' AND is_correct) AS correct_30d
    FROM ranked
  ), by_discipline AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'slug', grouped.slug,
      'name', grouped.name,
      'answered_questions', grouped.answered_questions,
      'latest_correct', grouped.latest_correct
    ) ORDER BY grouped.name), '[]'::jsonb) AS data
    FROM (
      SELECT
        discipline.slug,
        discipline.name,
        count(*) AS answered_questions,
        count(*) FILTER (WHERE ranked.is_correct) AS latest_correct
      FROM ranked
      JOIN public.question_discipline_relations AS relation
        ON relation.question_id = ranked.question_id
       AND relation.is_primary
      JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
      WHERE ranked.latest_rank = 1
      GROUP BY discipline.slug, discipline.name
    ) AS grouped
  )
  SELECT jsonb_build_object(
    'total_attempts', totals.total_attempts,
    'answered_questions', totals.answered_questions,
    'first_correct', totals.first_correct,
    'latest_correct', totals.latest_correct,
    'error_notebook_count', totals.error_notebook_count,
    'attempts_7d', totals.attempts_7d,
    'correct_7d', totals.correct_7d,
    'attempts_30d', totals.attempts_30d,
    'correct_30d', totals.correct_30d,
    'hidden_questions', (
      SELECT count(*)
      FROM public.user_question_preferences AS preference
      WHERE preference.user_id = current_user_id
        AND preference.hidden_at IS NOT NULL
    ),
    'by_discipline', by_discipline.data
  )
  INTO result
  FROM totals CROSS JOIN by_discipline;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_question_stats()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_question_stats()
  TO authenticated;

CREATE OR REPLACE TRIGGER trigger_disciplines_updated_at
  BEFORE UPDATE ON public.disciplines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_question_explanations_updated_at
  BEFORE UPDATE ON public.question_explanations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_user_question_preferences_updated_at
  BEFORE UPDATE ON public.user_question_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_question_comments_updated_at
  BEFORE UPDATE ON public.question_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_discipline_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_discipline_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_topic_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comment_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_question_attempts_select_own
  ON public.user_question_attempts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY user_question_preferences_select_own
  ON public.user_question_preferences FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY question_comment_aliases_select_own
  ON public.question_comment_aliases FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY question_comments_select_own
  ON public.question_comments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);
CREATE POLICY question_comment_reports_select_own
  ON public.question_comment_reports FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = reporter_user_id);

REVOKE ALL PRIVILEGES ON TABLE
  public.disciplines,
  public.topic_discipline_relations,
  public.questions,
  public.question_discipline_relations,
  public.question_topic_relations,
  public.question_options,
  public.question_answer_keys,
  public.question_explanations,
  public.user_question_attempts,
  public.user_question_preferences,
  public.question_comment_aliases,
  public.question_comments,
  public.question_comment_reports
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.disciplines,
  public.topic_discipline_relations,
  public.questions,
  public.question_discipline_relations,
  public.question_topic_relations,
  public.question_options,
  public.question_answer_keys,
  public.question_explanations,
  public.user_question_attempts,
  public.user_question_preferences,
  public.question_comment_aliases,
  public.question_comments,
  public.question_comment_reports
TO service_role;

COMMENT ON TABLE public.question_answer_keys IS
  'Gabarito sem leitura direta pelo papel authenticated; correcao exclusiva por RPC.';
COMMENT ON TABLE public.user_question_attempts IS
  'Historico imutavel de tentativas; submission_id torna o envio idempotente por usuario.';
COMMENT ON TABLE public.question_comments IS
  'Comentarios textuais pseudonimos; leitura e escrita publicas somente por funcoes controladas.';
