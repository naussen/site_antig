-- Revela o gabarito sob demanda sem criar tentativa ou alterar estatísticas.
CREATE OR REPLACE FUNCTION public.get_question_answer(p_question_id UUID)
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
    'correct_option_id', answer_key.correct_option_id,
    'explanation_markdown', explanation.body_markdown
  )
  INTO result
  FROM public.questions AS question
  JOIN public.question_answer_keys AS answer_key ON answer_key.question_id = question.id
  JOIN public.question_explanations AS explanation
    ON explanation.question_id = question.id AND explanation.status = 'published'
  WHERE question.id = p_question_id
    AND question.status = 'published';

  IF result IS NULL THEN
    RAISE EXCEPTION 'question not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_question_answer(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_answer(UUID) TO authenticated;
