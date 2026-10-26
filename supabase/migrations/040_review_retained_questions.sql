-- Conferência editorial individual de 25/10/2026, documentada em
-- docs/REVISAO_48_QUESTOES_RETIDAS_2026-10-25.md.
-- Publica somente 13 itens técnicos de resposta e comentário conferidos.
CREATE TEMP TABLE reviewed_questions_040 (
  external_id text PRIMARY KEY,
  discipline_slug text NOT NULL,
  topic_id text NOT NULL
) ON COMMIT DROP;

INSERT INTO reviewed_questions_040 VALUES
  ('pdf:analista_ambiental_conhec_especi:079', 'engenharia-florestal', 'dendrometria-e-inventario-florestal'),
  ('pdf:analista_ambiental_conhec_especi:083', 'engenharia-florestal', 'incendios-florestais'),
  ('pdf:analista_ambiental_conhec_especi:084', 'geografia', 'cartografia-sig-e-sensoriamento-remoto'),
  ('pdf:analista_ambiental_conhec_especi:085', 'geografia', 'cartografia-sig-e-sensoriamento-remoto'),
  ('pdf:analista_ambiental_conhec_especi:086', 'geografia', 'cartografia-sig-e-sensoriamento-remoto'),
  ('pdf:analista_ambiental_conhec_especi:099', 'geografia', 'pedologia-e-quimica-do-solo'),
  ('pdf:analista_ambiental_conhec_especi:100', 'geografia', 'pedologia-e-quimica-do-solo'),
  ('pdf:tecnico_em_enfermagem:047', 'enfermagem', 'reanimacao-cardiopulmonar'),
  ('pdf:tecnico_em_enfermagem:048', 'enfermagem', 'reanimacao-cardiopulmonar'),
  ('pdf:tecnico_em_enfermagem:054', 'enfermagem', 'balanco-hidrico'),
  ('pdf:tecnico_em_enfermagem:055', 'enfermagem', 'identificacao-do-paciente'),
  ('pdf:tecnico_em_enfermagem:056', 'enfermagem', 'avaliacao-pupilar'),
  ('pdf:tecnico_em_enfermagem:057', 'enfermagem', 'hemotorax');

DO $$
DECLARE observed integer;
BEGIN
  SELECT count(*) INTO observed
  FROM reviewed_questions_040 r
  JOIN public.questions q USING (external_id)
  JOIN public.question_discipline_relations qdr ON qdr.question_id=q.id AND qdr.is_primary
  JOIN public.disciplines d ON d.id=qdr.discipline_id AND d.slug='portugues'
  JOIN public.question_topic_relations qtr ON qtr.question_id=q.id AND qtr.relation_type='primary' AND qtr.topic_id='outros-topicos'
  JOIN public.question_answer_keys answer ON answer.question_id=q.id
  JOIN public.question_explanations explanation ON explanation.question_id=q.id
  WHERE q.status='archived' AND q.source_metadata->>'answer_status'='definitivo'
    AND length(btrim(explanation.body_markdown))>0;
  IF observed <> 13 THEN RAISE EXCEPTION 'reviewed questions source mismatch: %', observed; END IF;
  IF EXISTS (
    SELECT 1 FROM reviewed_questions_040 r JOIN public.questions q USING (external_id)
    WHERE (SELECT count(*) FROM public.question_discipline_relations WHERE question_id=q.id)<>1
       OR (SELECT count(*) FROM public.question_topic_relations WHERE question_id=q.id)<>1
  ) THEN RAISE EXCEPTION 'reviewed questions have multiple relations'; END IF;
END;
$$;

INSERT INTO public.disciplines (slug,name,status) VALUES
  ('engenharia-florestal','Engenharia Florestal','active'),
  ('enfermagem','Enfermagem','active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.topics (topic_id,title,discipline,archived_at) VALUES
  ('dendrometria-e-inventario-florestal','Dendrometria e Inventário Florestal','Engenharia Florestal',NULL),
  ('incendios-florestais','Incêndios Florestais','Engenharia Florestal',NULL),
  ('cartografia-sig-e-sensoriamento-remoto','Cartografia, SIG e Sensoriamento Remoto','Geografia',NULL),
  ('pedologia-e-quimica-do-solo','Pedologia e Química do Solo','Geografia',NULL),
  ('reanimacao-cardiopulmonar','Reanimação Cardiopulmonar','Enfermagem',NULL),
  ('balanco-hidrico','Balanço Hídrico','Enfermagem',NULL),
  ('identificacao-do-paciente','Identificação do Paciente','Enfermagem',NULL),
  ('avaliacao-pupilar','Avaliação Pupilar','Enfermagem',NULL),
  ('hemotorax','Hemotórax','Enfermagem',NULL)
ON CONFLICT (topic_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('engenharia-florestal','Engenharia Florestal'),('enfermagem','Enfermagem'),('geografia','Geografia')
    ) AS wanted(slug,name)
    LEFT JOIN public.disciplines d ON d.slug=wanted.slug AND d.name=wanted.name AND d.status='active'
    WHERE d.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM reviewed_questions_040 r
    JOIN public.disciplines d ON d.slug=r.discipline_slug
    JOIN public.topics t ON t.topic_id=r.topic_id
    WHERE t.discipline<>d.name OR t.archived_at IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM reviewed_questions_040 r
    LEFT JOIN public.topics t ON t.topic_id=r.topic_id
    WHERE t.topic_id IS NULL
  ) THEN RAISE EXCEPTION 'reviewed taxonomy target mismatch'; END IF;
END;
$$;

INSERT INTO public.topic_discipline_relations (topic_id,discipline_id,is_primary)
SELECT DISTINCT r.topic_id,d.id,true FROM reviewed_questions_040 r
JOIN public.disciplines d ON d.slug=r.discipline_slug
ON CONFLICT (topic_id,discipline_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reviewed_questions_040 r
    JOIN public.disciplines d ON d.slug=r.discipline_slug
    LEFT JOIN public.topic_discipline_relations tdr
      ON tdr.topic_id=r.topic_id AND tdr.discipline_id=d.id AND tdr.is_primary
    WHERE tdr.topic_id IS NULL
  ) THEN RAISE EXCEPTION 'reviewed topic relation mismatch'; END IF;
END;
$$;

UPDATE public.question_discipline_relations qdr SET discipline_id=d.id
FROM reviewed_questions_040 r
JOIN public.questions q ON q.external_id=r.external_id
JOIN public.disciplines d ON d.slug=r.discipline_slug
WHERE qdr.question_id=q.id AND qdr.is_primary;

UPDATE public.question_topic_relations qtr SET topic_id=r.topic_id
FROM reviewed_questions_040 r JOIN public.questions q ON q.external_id=r.external_id
WHERE qtr.question_id=q.id AND qtr.relation_type='primary';

UPDATE public.questions q SET subject=t.title,status='published',updated_at=now()
FROM reviewed_questions_040 r JOIN public.topics t ON t.topic_id=r.topic_id
WHERE q.external_id=r.external_id;

DO $$
DECLARE approved integer; held integer;
BEGIN
  SELECT count(*) INTO approved FROM reviewed_questions_040 r
  JOIN public.questions q USING (external_id)
  JOIN public.question_discipline_relations qdr ON qdr.question_id=q.id AND qdr.is_primary
  JOIN public.disciplines d ON d.id=qdr.discipline_id AND d.slug=r.discipline_slug
  JOIN public.question_topic_relations qtr ON qtr.question_id=q.id AND qtr.relation_type='primary' AND qtr.topic_id=r.topic_id
  JOIN public.topics t ON t.topic_id=r.topic_id AND t.title=q.subject
  WHERE q.status='published';
  SELECT count(*) INTO held FROM public.questions q
  WHERE q.external_id IN (SELECT external_id FROM reviewed_questions_040) AND q.status='archived';
  IF approved<>13 OR held<>0 THEN RAISE EXCEPTION 'reviewed question final mismatch: approved %, held %', approved, held; END IF;
END;
$$;

-- Tópico exclusivo de questões aparece no filtro, sem link para resumo vazio.
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
            'is_navigable', topic.archived_at IS NULL AND EXISTS (
              SELECT 1 FROM public.sections AS section
              WHERE section.topic_id=topic.topic_id AND section.archived_at IS NULL
            )
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

