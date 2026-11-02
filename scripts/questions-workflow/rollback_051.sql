-- Rollback da Migration 051
-- Restaura a assinatura e comportamento de list_questions_filtered_v2 (050)
-- e list_question_filters (047).
BEGIN;

DROP FUNCTION IF EXISTS public.list_questions_filtered_v2(INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT, TEXT, TEXT);

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
        'answer_status', CASE
          WHEN question.source_metadata->>'answer_status' IN (
            'definitivo', 'definitivo_alterado', 'preliminar', 'sem_status', 'anulada', 'conflitante'
          ) THEN question.source_metadata->>'answer_status'
          ELSE NULL END,
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
              'body_markdown', option.body_markdown,
              'sort_order', option.sort_order
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
              'is_navigable', topic.archived_at IS NULL AND EXISTS (
                SELECT 1 FROM public.sections AS section
                WHERE section.topic_id = topic.topic_id AND section.archived_at IS NULL
              )
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

NOTIFY pgrst, 'reload schema';
COMMIT;
