-- Migration 015: realces pessoais ancorados ao texto oficial do PRO Legis

CREATE TABLE public.user_legal_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN (
    'yellow', 'amber', 'orange', 'red', 'rose',
    'blue', 'cyan', 'teal', 'green', 'gray'
  )),
  start_offset INTEGER NOT NULL CHECK (start_offset >= 0),
  end_offset INTEGER NOT NULL CHECK (end_offset > start_offset),
  selected_text TEXT NOT NULL CHECK (char_length(selected_text) BETWEEN 1 AND 10000),
  prefix TEXT NOT NULL DEFAULT '' CHECK (char_length(prefix) <= 128),
  suffix TEXT NOT NULL DEFAULT '' CHECK (char_length(suffix) <= 128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_legal_highlights_exact_range_key
    UNIQUE (user_id, legal_fragment_id, start_offset, end_offset)
);
CREATE INDEX idx_user_legal_highlights_user_fragment
  ON public.user_legal_highlights(user_id, legal_fragment_id);
CREATE OR REPLACE FUNCTION private.validate_user_legal_highlight()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  source_text TEXT;
BEGIN
  IF NEW.user_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Usuário do realce não corresponde à sessão';
  END IF;

  SELECT fragment.official_text
    INTO source_text
    FROM public.legal_fragments AS fragment
   WHERE fragment.id = NEW.legal_fragment_id;

  IF source_text IS NULL
     OR NEW.end_offset > char_length(source_text)
     OR substring(source_text FROM NEW.start_offset + 1 FOR NEW.end_offset - NEW.start_offset) <> NEW.selected_text THEN
    RAISE EXCEPTION 'Trecho do realce não corresponde ao texto oficial';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.user_legal_highlights AS existing
     WHERE existing.user_id = NEW.user_id
       AND existing.legal_fragment_id = NEW.legal_fragment_id
       AND existing.id <> NEW.id
       AND NEW.start_offset < existing.end_offset
       AND NEW.end_offset > existing.start_offset
  ) THEN
    RAISE EXCEPTION 'Realces sobrepostos não são permitidos';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.validate_user_legal_highlight() FROM PUBLIC;
CREATE TRIGGER trigger_validate_user_legal_highlight
  BEFORE INSERT OR UPDATE ON public.user_legal_highlights
  FOR EACH ROW EXECUTE FUNCTION private.validate_user_legal_highlight();
CREATE TRIGGER trigger_user_legal_highlights_updated_at
  BEFORE UPDATE ON public.user_legal_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.user_legal_highlights ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.user_legal_highlights FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_legal_highlights TO authenticated;
CREATE POLICY user_legal_highlights_select_own
  ON public.user_legal_highlights FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY user_legal_highlights_insert_own
  ON public.user_legal_highlights FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_legal_highlights_update_own
  ON public.user_legal_highlights FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_legal_highlights_delete_own
  ON public.user_legal_highlights FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
COMMENT ON TABLE public.user_legal_highlights IS
  'Realces pessoais ancorados por offsets ao official_text imutável do PRO Legis';
