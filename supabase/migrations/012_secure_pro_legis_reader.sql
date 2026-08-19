-- =============================================================================
-- Migration 012: contrato seguro de leitura, progresso e flashcards
-- =============================================================================

REVOKE SELECT ON TABLE public.law_flashcards FROM authenticated;
GRANT SELECT (
  id, legal_fragment_id, card_type, statement_markdown,
  status, content_hash, created_at, updated_at
) ON TABLE public.law_flashcards TO authenticated;

REVOKE EXECUTE ON FUNCTION public.answer_law_flashcard(UUID, BOOLEAN) FROM authenticated;

CREATE OR REPLACE FUNCTION public.answer_law_flashcard_v2(
  target_flashcard_id UUID,
  selected_answer BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expected_answer BOOLEAN;
  answer_explanation TEXT;
  target_fragment_id UUID;
  answer_is_correct BOOLEAN;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active_content_access_required' USING ERRCODE = '42501';
  END IF;

  SELECT card.correct_answer, card.explanation_markdown, card.legal_fragment_id
  INTO expected_answer, answer_explanation, target_fragment_id
  FROM public.law_flashcards AS card
  JOIN public.legal_fragments AS fragment ON fragment.id = card.legal_fragment_id
  JOIN public.law_versions AS version ON version.id = fragment.law_version_id
  WHERE card.id = target_flashcard_id
    AND card.status = 'published'
    AND version.status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'published_flashcard_not_found' USING ERRCODE = 'P0002';
  END IF;

  answer_is_correct := selected_answer = expected_answer;

  INSERT INTO public.user_law_flashcard_answers (
    user_id, law_flashcard_id, selected_answer, is_correct
  ) VALUES (
    (SELECT auth.uid()), target_flashcard_id, selected_answer, answer_is_correct
  );

  RETURN jsonb_build_object(
    'is_correct', answer_is_correct,
    'correct_answer', expected_answer,
    'explanation', answer_explanation,
    'legal_fragment_id', target_fragment_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.answer_law_flashcard_v2(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.answer_law_flashcard_v2(UUID, BOOLEAN) TO authenticated;
