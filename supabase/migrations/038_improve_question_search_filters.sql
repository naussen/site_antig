-- Mantém as RPCs anteriores para clientes já implantados.
-- A nova busca retorna contagem e usa a publicação mais recente como ordem estável.
CREATE INDEX IF NOT EXISTS idx_questions_published_newest
  ON public.questions (created_at DESC, id DESC)
  WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.list_questions_filtered(
  p_limit INTEGER DEFAULT 1,
  p_after_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_discipline_slug TEXT DEFAULT NULL,
  p_topic_id TEXT DEFAULT NULL,
  p_exam_board TEXT DEFAULT NULL,
  p_exam_year INTEGER DEFAULT NULL,
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
     OR (p_topic_id IS NOT NULL AND char_length(p_topic_id) > 200)
     OR (p_exam_board IS NOT NULL AND char_length(p_exam_board) > 120)
     OR (p_exam_year IS NOT NULL AND p_exam_year NOT BETWEEN 1900 AND 2200) THEN
    RAISE EXCEPTION 'invalid question search parameters' USING ERRCODE = '22023';
  END IF;

  WITH filtered AS MATERIALIZED (
    SELECT question.*
    FROM public.questions AS question
    WHERE question.status = 'published'
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
      AND (p_exam_board IS NULL OR question.exam_board = p_exam_board)
      AND (p_exam_year IS NULL OR question.exam_year = p_exam_year)
      AND (
        p_include_hidden
        OR NOT EXISTS (
          SELECT 1 FROM public.user_question_preferences AS preference
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
    SELECT * FROM page
    ORDER BY created_at DESC, id DESC
    LIMIT p_limit
  ), items AS (
    SELECT question.id, question.created_at,
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
          SELECT jsonb_agg(jsonb_build_object(
            'id', option.id, 'label', option.label,
            'body_markdown', option.body_markdown, 'sort_order', option.sort_order
          ) ORDER BY option.sort_order)
          FROM public.question_options AS option WHERE option.question_id = question.id
        ), '[]'::jsonb),
        'disciplines', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'slug', discipline.slug, 'name', discipline.name, 'is_primary', relation.is_primary
          ) ORDER BY relation.sort_order, discipline.name)
          FROM public.question_discipline_relations AS relation
          JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'topics', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'topic_id', topic.topic_id, 'title', topic.title,
            'relation_type', relation.relation_type,
            'is_navigable', topic.archived_at IS NULL
          ) ORDER BY relation.sort_order, topic.title)
          FROM public.question_topic_relations AS relation
          JOIN public.topics AS topic ON topic.topic_id = relation.topic_id
          WHERE relation.question_id = question.id
        ), '[]'::jsonb),
        'latest_attempt', (
          SELECT jsonb_build_object('is_correct', attempt.is_correct, 'answered_at', attempt.answered_at)
          FROM public.user_question_attempts AS attempt
          WHERE attempt.user_id = current_user_id AND attempt.question_id = question.id
          ORDER BY attempt.answered_at DESC, attempt.id DESC LIMIT 1
        ),
        'preference', (
          SELECT jsonb_build_object(
            'hidden', preference.hidden_at IS NOT NULL,
            'marked_for_review', preference.marked_for_review_at IS NOT NULL
          )
          FROM public.user_question_preferences AS preference
          WHERE preference.user_id = current_user_id AND preference.question_id = question.id
        )
      ) AS item
    FROM selected AS question
  )
  SELECT jsonb_build_object(
    'items', coalesce((
      SELECT jsonb_agg(item ORDER BY created_at DESC, id DESC) FROM items
    ), '[]'::jsonb),
    'next_cursor', CASE WHEN (SELECT count(*) FROM page) > p_limit
      THEN (SELECT id::text FROM selected ORDER BY created_at, id LIMIT 1)
      ELSE NULL END,
    'total_count', (SELECT count(*) FROM filtered)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_questions_filtered(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_questions_filtered(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN)
  TO authenticated;

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
      SELECT jsonb_agg(jsonb_build_object('slug', item.slug, 'name', item.name) ORDER BY item.name)
      FROM (
        SELECT DISTINCT discipline.slug, discipline.name
        FROM public.questions AS question
        JOIN public.question_discipline_relations AS relation ON relation.question_id = question.id
        JOIN public.disciplines AS discipline ON discipline.id = relation.discipline_id
        WHERE question.status = 'published' AND discipline.status = 'active'
      ) AS item
    ), '[]'::jsonb),
    'topics', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'topic_id', item.topic_id, 'title', item.title, 'discipline_slug', item.discipline_slug
      ) ORDER BY item.discipline_slug, item.title)
      FROM (
        SELECT DISTINCT topic.topic_id, topic.title, discipline.slug AS discipline_slug
        FROM public.questions AS question
        JOIN public.question_topic_relations AS topic_relation ON topic_relation.question_id = question.id
        JOIN public.topics AS topic ON topic.topic_id = topic_relation.topic_id
        JOIN public.question_discipline_relations AS discipline_relation ON discipline_relation.question_id = question.id
        JOIN public.disciplines AS discipline ON discipline.id = discipline_relation.discipline_id
        JOIN public.topic_discipline_relations AS topic_discipline
          ON topic_discipline.topic_id = topic.topic_id AND topic_discipline.discipline_id = discipline.id
        WHERE question.status = 'published' AND topic.archived_at IS NULL AND discipline.status = 'active'
      ) AS item
    ), '[]'::jsonb),
    'boards', coalesce((
      SELECT jsonb_agg(item.exam_board ORDER BY item.exam_board)
      FROM (SELECT DISTINCT exam_board FROM public.questions
            WHERE status = 'published' AND exam_board IS NOT NULL AND exam_board <> '') AS item
    ), '[]'::jsonb),
    'years', coalesce((
      SELECT jsonb_agg(item.exam_year ORDER BY item.exam_year DESC)
      FROM (SELECT DISTINCT exam_year FROM public.questions
            WHERE status = 'published' AND exam_year IS NOT NULL) AS item
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_question_filters() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_question_filters() TO authenticated;
