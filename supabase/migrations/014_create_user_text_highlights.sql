-- Migration 014: realces pessoais de texto nos resumos

CREATE TABLE public.user_text_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES public.sections(section_id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN (
    'yellow', 'orange', 'red', 'pink', 'purple',
    'blue', 'cyan', 'green', 'lime', 'gray'
  )),
  start_offset INTEGER NOT NULL CHECK (start_offset >= 0),
  end_offset INTEGER NOT NULL CHECK (end_offset > start_offset),
  selected_text TEXT NOT NULL CHECK (char_length(selected_text) BETWEEN 1 AND 10000),
  prefix TEXT NOT NULL DEFAULT '' CHECK (char_length(prefix) <= 128),
  suffix TEXT NOT NULL DEFAULT '' CHECK (char_length(suffix) <= 128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_text_highlights_user_section
  ON public.user_text_highlights(user_id, section_id);

CREATE TRIGGER trigger_user_text_highlights_updated_at
  BEFORE UPDATE ON public.user_text_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_text_highlights ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_text_highlights FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_text_highlights TO authenticated;

CREATE POLICY user_text_highlights_select_own
  ON public.user_text_highlights FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY user_text_highlights_insert_own
  ON public.user_text_highlights FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_text_highlights_update_own
  ON public.user_text_highlights FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_text_highlights_delete_own
  ON public.user_text_highlights FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.user_text_highlights IS
  'Realces pessoais ancorados ao texto Markdown renderizado de cada seção';
