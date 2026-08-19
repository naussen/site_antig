-- Migration 013: anotações pessoais vinculadas a dispositivos legais

CREATE TABLE public.user_legal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_legal_notes_user_fragment_key UNIQUE (user_id, legal_fragment_id)
);

CREATE INDEX idx_user_legal_notes_user_fragment
  ON public.user_legal_notes(user_id, legal_fragment_id);

CREATE TRIGGER trigger_user_legal_notes_updated_at
  BEFORE UPDATE ON public.user_legal_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_legal_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_legal_notes FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_legal_notes TO authenticated;

CREATE POLICY user_legal_notes_select_own
  ON public.user_legal_notes FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY user_legal_notes_insert_own
  ON public.user_legal_notes FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_legal_notes_update_own
  ON public.user_legal_notes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_legal_notes_delete_own
  ON public.user_legal_notes FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.user_legal_notes IS 'Anotações pessoais do aluno vinculadas a dispositivos do PRO Legis';
