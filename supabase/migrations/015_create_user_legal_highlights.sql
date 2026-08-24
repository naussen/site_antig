-- Migration 015: realces pessoais e leitura granular do artigo

CREATE TABLE IF NOT EXISTS public.user_legal_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN (
    'yellow', 'green', 'blue', 'pink', 'orange',
    'red', 'teal', 'cyan', 'lime', 'amber'
  )),
  start_offset INTEGER NOT NULL CHECK (start_offset >= 0),
  end_offset INTEGER NOT NULL CHECK (end_offset > start_offset),
  selected_text TEXT NOT NULL CHECK (char_length(btrim(selected_text)) BETWEEN 1 AND 10000),
  prefix TEXT NOT NULL DEFAULT '' CHECK (char_length(prefix) <= 128),
  suffix TEXT NOT NULL DEFAULT '' CHECK (char_length(suffix) <= 128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_legal_highlights_user_fragment_range
  ON public.user_legal_highlights(user_id, legal_fragment_id, start_offset, end_offset);

DROP TRIGGER IF EXISTS trigger_user_legal_highlights_updated_at
  ON public.user_legal_highlights;

CREATE TRIGGER trigger_user_legal_highlights_updated_at
  BEFORE UPDATE ON public.user_legal_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_legal_highlights ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_legal_highlights FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_legal_highlights TO authenticated;

DROP POLICY IF EXISTS user_legal_highlights_select_own ON public.user_legal_highlights;
CREATE POLICY user_legal_highlights_select_own
  ON public.user_legal_highlights FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_legal_highlights_insert_own ON public.user_legal_highlights;
CREATE POLICY user_legal_highlights_insert_own
  ON public.user_legal_highlights FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_legal_highlights_update_own ON public.user_legal_highlights;
CREATE POLICY user_legal_highlights_update_own
  ON public.user_legal_highlights FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_legal_highlights_delete_own ON public.user_legal_highlights;
CREATE POLICY user_legal_highlights_delete_own
  ON public.user_legal_highlights FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

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

COMMENT ON TABLE public.user_legal_highlights IS 'Realces pessoais do aluno ancorados por offsets no texto oficial';
COMMENT ON FUNCTION public.get_legal_article_personal_data(UUID[]) IS 'Retorna notas e realces da sessão para um artigo, sob RLS';
