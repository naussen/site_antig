-- Catálogo mínimo de filtros do PROQuestões.
-- Mantém as tabelas editoriais fora da Data API para authenticated.

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
  'Lista somente slug e nome de disciplinas com questões publicadas para filtros autenticados.';
