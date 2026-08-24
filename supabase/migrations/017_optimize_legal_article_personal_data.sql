-- Migration 017: leitura consolidada de notas e realces do PRO Legis

CREATE INDEX IF NOT EXISTS idx_user_legal_highlights_user_fragment_range
  ON public.user_legal_highlights(user_id, legal_fragment_id, start_offset, end_offset);

CREATE OR REPLACE FUNCTION public.get_legal_article_personal_data(target_fragment_ids UUID[])
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'notes', COALESCE((
      SELECT jsonb_agg(to_jsonb(note_row) ORDER BY note_row.created_at)
      FROM public.user_legal_notes AS note_row
      WHERE note_row.user_id = (SELECT auth.uid())
        AND note_row.legal_fragment_id = ANY(target_fragment_ids)
    ), '[]'::jsonb),
    'highlights', COALESCE((
      SELECT jsonb_agg(to_jsonb(highlight_row) ORDER BY highlight_row.created_at)
      FROM public.user_legal_highlights AS highlight_row
      WHERE highlight_row.user_id = (SELECT auth.uid())
        AND highlight_row.legal_fragment_id = ANY(target_fragment_ids)
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_legal_article_personal_data(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_legal_article_personal_data(UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_legal_article_personal_data(UUID[]) IS
  'Retorna notas e realces da sessão para um artigo, sob RLS';
