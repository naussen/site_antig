-- Arquiva o agrupador legado sem conteudo ativo e impede que o catalogo de
-- filtros exponha disciplinas sem ao menos um topico ativo.

DO $$
DECLARE
  affected_rows INTEGER;
  discipline_count INTEGER;
BEGIN
  SELECT count(*) INTO discipline_count FROM public.disciplines;

  UPDATE public.disciplines
  SET status = 'archived'
  WHERE slug = 'geral'
    AND name = 'Geral'
    AND status = 'active';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows <> 1 AND discipline_count <> 0 THEN
    RAISE EXCEPTION 'expected one active geral discipline, updated %', affected_rows;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_question_disciplines()
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'slug', discipline.slug,
        'name', discipline.name
      )
      ORDER BY discipline.name
    ),
    '[]'::jsonb
  )
  INTO result
  FROM public.disciplines AS discipline
  WHERE discipline.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.topic_discipline_relations AS topic_relation
      JOIN public.topics AS topic ON topic.topic_id = topic_relation.topic_id
      WHERE topic_relation.discipline_id = discipline.id
        AND topic.archived_at IS NULL
    )
    AND EXISTS (
      SELECT 1
      FROM public.question_discipline_relations AS relation
      JOIN public.questions AS question ON question.id = relation.question_id
      WHERE relation.discipline_id = discipline.id
        AND question.status = 'published'
    );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.list_question_disciplines()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_question_disciplines()
  TO authenticated;

COMMENT ON FUNCTION public.list_question_disciplines() IS
  'Lista disciplinas ativas com topicos ativos e questoes publicadas para filtros autenticados.';
