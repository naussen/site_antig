-- Migration 047: Modelo Hierárquico de Subtópicos e Caminho Taxonômico
-- Criação das tabelas public.subtopics e public.question_subtopic_relations
-- Atualização das RPCs list_questions_filtered, list_questions_filtered_v2 e list_question_filters

-- 1. Tabela de subtópicos
CREATE TABLE IF NOT EXISTS public.subtopics (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES public.topics(topic_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON public.subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_slug ON public.subtopics(slug);

-- 2. Tabela de relacionamento entre questões e subtópicos
CREATE TABLE IF NOT EXISTS public.question_subtopic_relations (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  subtopic_id TEXT NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (question_id, subtopic_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_subtopic_one_primary
  ON public.question_subtopic_relations(question_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_question_subtopic_relations_subtopic
  ON public.question_subtopic_relations(subtopic_id);

-- 3. RLS e permissões de segurança
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_subtopic_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subtopics_read_active_content ON public.subtopics;
CREATE POLICY subtopics_read_active_content
  ON public.subtopics
  FOR SELECT
  TO authenticated
  USING (private.has_active_content_access());

DROP POLICY IF EXISTS question_subtopic_relations_read_active_content ON public.question_subtopic_relations;
CREATE POLICY question_subtopic_relations_read_active_content
  ON public.question_subtopic_relations
  FOR SELECT
  TO authenticated
  USING (private.has_active_content_access());

REVOKE ALL ON public.subtopics FROM PUBLIC, anon;
GRANT SELECT ON public.subtopics TO authenticated;
GRANT ALL ON public.subtopics TO service_role;

REVOKE ALL ON public.question_subtopic_relations FROM PUBLIC, anon;
GRANT SELECT ON public.question_subtopic_relations TO authenticated;
GRANT ALL ON public.question_subtopic_relations TO service_role;

-- 4. Atualização de list_questions_filtered_v2 com suporte a p_subtopic_id e retorno de subtopics
CREATE OR REPLACE FUNCTION public.list_questions_filtered_v2(
  p_limit INTEGER DEFAULT 1,
  p_after_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_discipline_slug TEXT DEFAULT NULL,
  p_topic_id TEXT DEFAULT NULL,
  p_exam_board TEXT DEFAULT NULL,
  p_exam_year INTEGER DEFAULT NULL,
  p_include_hidden BOOLEAN DEFAULT false,
  p_question_identifier TEXT DEFAULT NULL,
  p_subtopic_id TEXT DEFAULT NULL
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
  identifier TEXT := nullif(btrim(p_question_identifier), '');
  identifier_uuid UUID;
BEGIN
  IF current_user_id IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 20
     OR (identifier IS NOT NULL AND char_length(identifier) > 160)
     OR (p_search IS NOT NULL AND char_length(p_search) > 200)
     OR (p_discipline_slug IS NOT NULL AND char_length(p_discipline_slug) > 120)
     OR (p_topic_id IS NOT NULL AND char_length(p_topic_id) > 200)
     OR (p_subtopic_id IS NOT NULL AND char_length(p_subtopic_id) > 200)
     OR (p_exam_board IS NOT NULL AND char_length(p_exam_board) > 120)
     OR (p_exam_year IS NOT NULL AND p_exam_year NOT BETWEEN 1900 AND 2200) THEN
    RAISE EXCEPTION 'invalid question search parameters' USING ERRCODE = '22023';
  END IF;

  IF identifier IS NOT NULL THEN
    BEGIN
      identifier_uuid := identifier::uuid;
    EXCEPTION
      WHEN invalid_text_representation THEN
        identifier_uuid := NULL;
    END;
  END IF;

  WITH filtered AS MATERIALIZED (
    SELECT question.*
    FROM public.questions AS question
    WHERE question.status = 'published'
      AND (
        identifier IS NULL
        OR question.external_id = identifier
        OR (identifier_uuid IS NOT NULL AND question.id = identifier_uuid)
      )
      AND (
        p_search IS NULL OR btrim(p_search) = ''
        OR question.search_document @@ websearch_to_tsquery('portuguese'::regconfig, btrim(p_search))
        OR position(lower(btrim(p_search)) IN lower(
          question.statement_markdown || ' ' || question.subject || ' ' ||
          coalesce(question.exam_board, '') || ' ' || coalesce(question.institution, '') || ' ' ||
          coalesce(question.position_name, '') || ' ' || coalesce(question.source_reference, '')
        )) > 0
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
          JOIN public.topics AS topic ON topic.topic_id = relation.topic_id
          WHERE relation.question_id = question.id
            AND relation.topic_id = p_topic_id
            AND topic.archived_at IS NULL
        )
      )
      AND (
        p_subtopic_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.question_subtopic_relations AS relation
          JOIN public.subtopics AS subtopic ON subtopic.id = relation.subtopic_id
          WHERE relation.question_id = question.id
            AND relation.subtopic_id = p_subtopic_id
            AND subtopic.archived_at IS NULL
        )
      )
      AND (p_exam_board IS NULL OR question.exam_board = p_exam_board)
      AND (p_exam_year IS NULL OR question.exam_year = p_exam_year)
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
  ), page AS (
    SELECT question.*
    FROM filtered AS question
    WHERE p_after_id IS NULL OR (question.created_at, question.id) < (
      SELECT anchor.created_at, anchor.id
      FROM public.questions AS anchor
      WHERE anchor.id = p_after_id
    )
    ORDER BY question.created_at DESC, question.id DESC
    LIMIT p_limit + 1
  ), selected AS (
    SELECT *
    FROM page
    ORDER BY created_at DESC, id DESC
    LIMIT p_limit
  ), items AS (
    SELECT
      question.id,
      question.created_at,
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
        'options', coalesce((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', option.id,
              'label', option.label,
              'body_markdown', option.body_markdown
            )
            ORDER BY option.sort_order
          )
          FROM public.question_options AS option
          WHERE option.question_id = question.id
        ), '[]'::jsonb),
        'disciplines', coalesce((
          SELECT jsonb_agg(
            jsonb_build_object(
              'slug', discipline.slug,
              'name', discipline.name,
              'is_primary', relation.is_primary
            )
            ORDER BY relation.sort_order, discipline.name
          )
          FROM public.question_discipline_relations AS relation
          JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'topics', coalesce((
          SELECT jsonb_agg(
            jsonb_build_object(
              'topic_id', topic.topic_id,
              'title', topic.title,
              'relation_type', relation.relation_type,
              'is_navigable', topic.archived_at IS NULL
            )
            ORDER BY relation.sort_order, topic.title
          )
          FROM public.question_topic_relations AS relation
          JOIN public.topics AS topic ON topic.topic_id = relation.topic_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'subtopics', coalesce((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', subtopic.id,
              'topic_id', subtopic.topic_id,
              'title', subtopic.title,
              'slug', subtopic.slug,
              'is_primary', relation.is_primary
            )
            ORDER BY relation.sort_order, subtopic.title
          )
          FROM public.question_subtopic_relations AS relation
          JOIN public.subtopics AS subtopic ON subtopic.id = relation.subtopic_id
          WHERE relation.question_id = question.id AND subtopic.archived_at IS NULL
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
    FROM selected AS question
  )
  SELECT jsonb_build_object(
    'items', coalesce((
      SELECT jsonb_agg(item ORDER BY created_at DESC, id DESC)
      FROM items
    ), '[]'::jsonb),
    'next_cursor', CASE
      WHEN (SELECT count(*) FROM page) > p_limit THEN (
        SELECT id::text
        FROM selected
        ORDER BY created_at, id
        LIMIT 1
      )
      ELSE NULL
    END,
    'total_count', (SELECT count(*) FROM filtered)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_questions_filtered_v2(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_questions_filtered_v2(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT, TEXT)
  TO authenticated;

-- Wrapper de 9 parâmetros para compatibilidade com chamadas anteriores de list_questions_filtered_v2
CREATE OR REPLACE FUNCTION public.list_questions_filtered_v2(
  p_limit INTEGER,
  p_after_id UUID,
  p_search TEXT,
  p_discipline_slug TEXT,
  p_topic_id TEXT,
  p_exam_board TEXT,
  p_exam_year INTEGER,
  p_include_hidden BOOLEAN,
  p_question_identifier TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.list_questions_filtered_v2(
    p_limit, p_after_id, p_search, p_discipline_slug, p_topic_id,
    p_exam_board, p_exam_year, p_include_hidden, p_question_identifier, NULL
  );
$$;

REVOKE ALL ON FUNCTION public.list_questions_filtered_v2(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_questions_filtered_v2(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT)
  TO authenticated;

-- 5. Atualização de list_question_filters agregando subtopics de questões publicadas
CREATE OR REPLACE FUNCTION public.list_question_filters()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active content access required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'disciplines', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'slug', item.slug,
          'name', item.name
        )
        ORDER BY item.name
      )
      FROM (
        SELECT DISTINCT discipline.slug, discipline.name
        FROM public.questions AS question
        JOIN public.question_discipline_relations AS relation ON relation.question_id = question.id
        JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
        WHERE question.status = 'published'
          AND discipline.status = 'active'
      ) AS item
    ), '[]'::jsonb),
    'topics', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'topic_id', item.topic_id,
          'title', item.title,
          'discipline_slug', item.discipline_slug
        )
        ORDER BY item.discipline_slug, item.title
      )
      FROM (
        SELECT DISTINCT
          topic.topic_id,
          topic.title,
          discipline.slug AS discipline_slug
        FROM public.questions AS question
        JOIN public.question_topic_relations AS topic_relation ON topic_relation.question_id = question.id
        JOIN public.topics AS topic ON topic.topic_id = topic_relation.topic_id
        JOIN public.question_discipline_relations AS discipline_relation ON discipline_relation.question_id = question.id
        JOIN public.disciplines AS discipline ON discipline.id = discipline_relation.discipline_id
        JOIN public.topic_discipline_relations AS topic_discipline
          ON topic_discipline.topic_id = topic.topic_id
         AND topic_discipline.discipline_id = discipline.id
        WHERE question.status = 'published'
          AND topic.archived_at IS NULL
          AND discipline.status = 'active'
      ) AS item
    ), '[]'::jsonb),
    'subtopics', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', item.id,
          'topic_id', item.topic_id,
          'title', item.title,
          'slug', item.slug,
          'discipline_slug', item.discipline_slug
        )
        ORDER BY item.discipline_slug, item.topic_id, item.title
      )
      FROM (
        SELECT DISTINCT
          subtopic.id,
          subtopic.topic_id,
          subtopic.title,
          subtopic.slug,
          discipline.slug AS discipline_slug
        FROM public.questions AS question
        JOIN public.question_subtopic_relations AS subtopic_relation ON subtopic_relation.question_id = question.id
        JOIN public.subtopics AS subtopic ON subtopic.id = subtopic_relation.subtopic_id
        JOIN public.question_discipline_relations AS discipline_relation ON discipline_relation.question_id = question.id
        JOIN public.disciplines AS discipline ON discipline.id = discipline_relation.discipline_id
        WHERE question.status = 'published'
          AND subtopic.archived_at IS NULL
          AND discipline.status = 'active'
      ) AS item
    ), '[]'::jsonb),
    'boards', coalesce((
      SELECT jsonb_agg(item.exam_board ORDER BY item.exam_board)
      FROM (
        SELECT DISTINCT exam_board
        FROM public.questions
        WHERE status = 'published'
          AND exam_board IS NOT NULL
          AND exam_board <> ''
      ) AS item
    ), '[]'::jsonb),
    'years', coalesce((
      SELECT jsonb_agg(item.exam_year ORDER BY item.exam_year DESC)
      FROM (
        SELECT DISTINCT exam_year
        FROM public.questions
        WHERE status = 'published'
          AND exam_year IS NOT NULL
      ) AS item
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_question_filters() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_question_filters() TO authenticated;
