-- =============================================================================
-- Migration 010: fundacao versionada, workflow e RLS do PRO Legis
-- =============================================================================

CREATE TABLE public.laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug = lower(slug) AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  acronym TEXT,
  name TEXT NOT NULL CHECK (btrim(name) <> ''),
  law_type TEXT NOT NULL CHECK (btrim(law_type) <> ''),
  jurisdiction TEXT NOT NULL CHECK (btrim(jurisdiction) <> ''),
  official_source_url TEXT NOT NULL CHECK (official_source_url ~ '^https://'),
  current_version_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.law_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id UUID NOT NULL REFERENCES public.laws(id) ON DELETE RESTRICT,
  version_label TEXT NOT NULL CHECK (btrim(version_label) <> ''),
  effective_from DATE,
  effective_until DATE,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https://'),
  raw_source_hash TEXT NOT NULL CHECK (raw_source_hash ~ '^sha256:[0-9a-f]{64}$'),
  canonicalization TEXT NOT NULL CHECK (btrim(canonicalization) <> ''),
  canonical_content_hash TEXT NOT NULL CHECK (canonical_content_hash ~ '^sha256:[0-9a-f]{64}$'),
  checked_at TIMESTAMPTZ NOT NULL,
  coverage JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(coverage) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published', 'rejected')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (law_id, canonical_content_hash),
  UNIQUE (id, law_id),
  CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from),
  CHECK ((status <> 'reviewed') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK ((status <> 'published') OR (
    reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL
    AND published_by IS NOT NULL AND published_at IS NOT NULL
    AND published_by <> reviewed_by
  )),
  CHECK ((status <> 'rejected') OR (rejection_reason IS NOT NULL AND btrim(rejection_reason) <> '')),
  CHECK ((status <> 'draft') OR (
    reviewed_by IS NULL AND reviewed_at IS NULL
    AND published_by IS NULL AND published_at IS NULL
    AND rejection_reason IS NULL
  )),
  CHECK ((status <> 'reviewed') OR (
    published_by IS NULL AND published_at IS NULL AND rejection_reason IS NULL
  )),
  CHECK ((status <> 'published') OR rejection_reason IS NULL)
);

ALTER TABLE public.laws
  ADD CONSTRAINT laws_current_version_fk
  FOREIGN KEY (current_version_id, id) REFERENCES public.law_versions(id, law_id) ON DELETE RESTRICT;

CREATE TABLE public.legal_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  law_version_id UUID NOT NULL REFERENCES public.law_versions(id) ON DELETE CASCADE,
  stable_key TEXT NOT NULL CHECK (stable_key ~ '^[a-z0-9]+(?:[.-][a-z0-9]+)*$'),
  parent_id UUID,
  fragment_type TEXT NOT NULL CHECK (fragment_type IN (
    'book', 'title', 'chapter', 'section', 'subsection',
    'article', 'caput', 'paragraph', 'inciso', 'alinea', 'item'
  )),
  reference TEXT NOT NULL CHECK (btrim(reference) <> ''),
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  official_text TEXT,
  normalized_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (law_version_id, stable_key),
  UNIQUE (id, law_version_id),
  FOREIGN KEY (parent_id, law_version_id)
    REFERENCES public.legal_fragments(id, law_version_id) ON DELETE CASCADE,
  CHECK (official_text IS NULL OR btrim(official_text) <> ''),
  CHECK (normalized_text IS NULL OR btrim(normalized_text) <> '')
);

ALTER TABLE public.sections
  ADD CONSTRAINT sections_topic_section_unique UNIQUE (topic_id, section_id);

CREATE TABLE public.topic_legal_fragment_relations (
  topic_id TEXT NOT NULL,
  section_id TEXT,
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'primary' CHECK (relation_type IN ('primary', 'related', 'reference')),
  relevance SMALLINT CHECK (relevance BETWEEN 1 AND 100),
  editorial_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, legal_fragment_id, relation_type),
  FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id, section_id) REFERENCES public.sections(topic_id, section_id) ON DELETE CASCADE
);

CREATE TABLE public.law_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL DEFAULT 'true_false' CHECK (card_type = 'true_false'),
  statement_markdown TEXT NOT NULL CHECK (btrim(statement_markdown) <> ''),
  correct_answer BOOLEAN NOT NULL,
  explanation_markdown TEXT NOT NULL CHECK (btrim(explanation_markdown) <> ''),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_law_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_fragment_id UUID NOT NULL REFERENCES public.legal_fragments(id) ON DELETE CASCADE,
  reading_status TEXT NOT NULL DEFAULT 'not_started' CHECK (reading_status IN ('not_started', 'reading', 'read')),
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, legal_fragment_id),
  CHECK ((reading_status <> 'read') OR read_at IS NOT NULL)
);

CREATE TABLE public.user_law_flashcard_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  law_flashcard_id UUID NOT NULL REFERENCES public.law_flashcards(id) ON DELETE CASCADE,
  selected_answer BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.legis_editorial_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('human', 'automation', 'system')),
  integration_id TEXT,
  action TEXT NOT NULL CHECK (btrim(action) <> ''),
  object_type TEXT NOT NULL CHECK (btrim(object_type) <> ''),
  object_id UUID NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  approved_hash TEXT CHECK (approved_hash IS NULL OR approved_hash ~ '^sha256:[0-9a-f]{64}$'),
  result TEXT NOT NULL CHECK (result IN ('success', 'denied', 'error')),
  reason TEXT,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (actor_kind = 'human' AND actor_user_id IS NOT NULL AND integration_id IS NULL)
    OR (actor_kind <> 'human' AND actor_user_id IS NULL AND integration_id IS NOT NULL)
  )
);

CREATE INDEX idx_law_versions_law_status ON public.law_versions(law_id, status);
CREATE INDEX idx_legal_fragments_version_order ON public.legal_fragments(law_version_id, order_index);
CREATE INDEX idx_legal_fragments_parent ON public.legal_fragments(parent_id);
CREATE INDEX idx_topic_legal_relations_fragment ON public.topic_legal_fragment_relations(legal_fragment_id);
CREATE INDEX idx_topic_legal_relations_section ON public.topic_legal_fragment_relations(section_id) WHERE section_id IS NOT NULL;
CREATE INDEX idx_law_flashcards_fragment_status ON public.law_flashcards(legal_fragment_id, status);
CREATE INDEX idx_user_law_progress_fragment ON public.user_law_progress(legal_fragment_id, user_id);
CREATE INDEX idx_user_law_answers_user_card ON public.user_law_flashcard_answers(user_id, law_flashcard_id);
CREATE INDEX idx_legis_audit_object ON public.legis_editorial_audit(object_type, object_id, created_at DESC);

CREATE TRIGGER trigger_laws_updated_at
  BEFORE UPDATE ON public.laws
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_law_versions_updated_at
  BEFORE UPDATE ON public.law_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_law_flashcards_updated_at
  BEFORE UPDATE ON public.law_flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_user_law_progress_updated_at
  BEFORE UPDATE ON public.user_law_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION private.enforce_law_version_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'only_draft_law_versions_can_be_deleted' USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'published' OR OLD.status = 'rejected' THEN
    RAISE EXCEPTION 'final_law_versions_are_immutable' USING ERRCODE = '55000';
  END IF;

  IF NOT (
    (OLD.status = 'draft' AND NEW.status IN ('draft', 'reviewed', 'rejected'))
    OR (OLD.status = 'reviewed' AND NEW.status IN ('published', 'rejected'))
  ) THEN
    RAISE EXCEPTION 'invalid_law_version_transition' USING ERRCODE = '23514';
  END IF;

  IF OLD.status <> 'draft' AND ROW(
    NEW.law_id, NEW.version_label, NEW.effective_from, NEW.effective_until,
    NEW.source_url, NEW.raw_source_hash, NEW.canonicalization,
    NEW.canonical_content_hash, NEW.checked_at, NEW.coverage
  ) IS DISTINCT FROM ROW(
    OLD.law_id, OLD.version_label, OLD.effective_from, OLD.effective_until,
    OLD.source_url, OLD.raw_source_hash, OLD.canonicalization,
    OLD.canonical_content_hash, OLD.checked_at, OLD.coverage
  ) THEN
    RAISE EXCEPTION 'reviewed_law_version_content_is_immutable' USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_law_version_workflow() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_law_version_workflow
  BEFORE UPDATE OR DELETE ON public.law_versions
  FOR EACH ROW EXECUTE FUNCTION private.enforce_law_version_workflow();

CREATE OR REPLACE FUNCTION private.enforce_legal_fragment_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_version_id UUID;
BEGIN
  target_version_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.law_version_id ELSE NEW.law_version_id END;

  IF NOT EXISTS (
    SELECT 1
    FROM public.law_versions
    WHERE id = target_version_id
      AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'legal_fragments_are_editable_only_in_draft' USING ERRCODE = '55000';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_legal_fragment_draft() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_legal_fragment_draft
  BEFORE INSERT OR UPDATE OR DELETE ON public.legal_fragments
  FOR EACH ROW EXECUTE FUNCTION private.enforce_legal_fragment_draft();

CREATE OR REPLACE FUNCTION private.enforce_fragment_child_draft()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_fragment_id UUID;
BEGIN
  target_fragment_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.legal_fragment_id ELSE NEW.legal_fragment_id END;

  IF NOT EXISTS (
    SELECT 1
    FROM public.legal_fragments AS fragment
    JOIN public.law_versions AS version ON version.id = fragment.law_version_id
    WHERE fragment.id = target_fragment_id
      AND version.status = 'draft'
  ) THEN
    RAISE EXCEPTION 'fragment_children_are_editable_only_in_draft' USING ERRCODE = '55000';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_fragment_child_draft() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_topic_legal_relation_draft
  BEFORE INSERT OR UPDATE OR DELETE ON public.topic_legal_fragment_relations
  FOR EACH ROW EXECUTE FUNCTION private.enforce_fragment_child_draft();

CREATE TRIGGER enforce_law_flashcard_draft
  BEFORE INSERT OR UPDATE OR DELETE ON public.law_flashcards
  FOR EACH ROW EXECUTE FUNCTION private.enforce_fragment_child_draft();

CREATE OR REPLACE FUNCTION private.has_legis_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    AND COALESCE((SELECT auth.jwt() ->> 'aal'), '') = 'aal2'
    AND COALESCE(
      (SELECT auth.jwt() -> 'app_metadata' -> 'legis_permissions'),
      '[]'::jsonb
    ) ? required_permission;
$$;

REVOKE ALL ON FUNCTION private.has_legis_permission(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_legis_permission(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION private.can_read_legis_drafts()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.has_legis_permission('legis.review')
    OR private.has_legis_permission('legis.publish');
$$;

REVOKE ALL ON FUNCTION private.can_read_legis_drafts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_read_legis_drafts() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_law_version(target_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_hash TEXT;
BEGIN
  IF NOT private.has_legis_permission('legis.review') THEN
    RAISE EXCEPTION 'legis_review_forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.law_versions
  SET status = 'reviewed',
      reviewed_by = (SELECT auth.uid()),
      reviewed_at = now(),
      rejection_reason = NULL
  WHERE id = target_version_id
    AND status = 'draft'
  RETURNING canonical_content_hash INTO target_hash;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'law_version_not_draft' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.legis_editorial_audit (
    actor_user_id, actor_kind, action, object_type, object_id,
    previous_status, new_status, approved_hash, result
  ) VALUES (
    (SELECT auth.uid()), 'human', 'review', 'law_version', target_version_id,
    'draft', 'reviewed', target_hash, 'success'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_law_version(target_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_law_id UUID;
  target_reviewer UUID;
  target_hash TEXT;
BEGIN
  IF NOT private.has_legis_permission('legis.publish') THEN
    RAISE EXCEPTION 'legis_publish_forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT law_id, reviewed_by, canonical_content_hash
  INTO target_law_id, target_reviewer, target_hash
  FROM public.law_versions
  WHERE id = target_version_id
    AND status = 'reviewed'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'law_version_not_reviewed' USING ERRCODE = 'P0001';
  END IF;

  IF target_reviewer = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'reviewer_cannot_publish' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.legal_fragments WHERE law_version_id = target_version_id
  ) THEN
    RAISE EXCEPTION 'law_version_has_no_fragments' USING ERRCODE = '23514';
  END IF;

  UPDATE public.law_versions
  SET status = 'published',
      published_by = (SELECT auth.uid()),
      published_at = now()
  WHERE id = target_version_id;

  UPDATE public.laws
  SET current_version_id = target_version_id,
      status = 'published'
  WHERE id = target_law_id;

  INSERT INTO public.legis_editorial_audit (
    actor_user_id, actor_kind, action, object_type, object_id,
    previous_status, new_status, approved_hash, result
  ) VALUES (
    (SELECT auth.uid()), 'human', 'publish', 'law_version', target_version_id,
    'reviewed', 'published', target_hash, 'success'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.answer_law_flashcard(
  target_flashcard_id UUID,
  selected_answer BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expected_answer BOOLEAN;
  answer_is_correct BOOLEAN;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.has_active_content_access() THEN
    RAISE EXCEPTION 'active_content_access_required' USING ERRCODE = '42501';
  END IF;

  SELECT card.correct_answer
  INTO expected_answer
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

  RETURN answer_is_correct;
END;
$$;

REVOKE ALL ON FUNCTION public.review_law_version(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_law_version(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.answer_law_flashcard(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_law_version(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_law_version(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.answer_law_flashcard(UUID, BOOLEAN) TO authenticated;

ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_legal_fragment_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_law_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_law_flashcard_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legis_editorial_audit ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.laws,
  public.law_versions,
  public.legal_fragments,
  public.topic_legal_fragment_relations,
  public.law_flashcards,
  public.user_law_progress,
  public.user_law_flashcard_answers,
  public.legis_editorial_audit
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.laws,
  public.law_versions,
  public.legal_fragments,
  public.topic_legal_fragment_relations,
  public.law_flashcards
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_law_progress
TO authenticated;

GRANT SELECT ON TABLE public.user_law_flashcard_answers TO authenticated;

CREATE POLICY laws_select_allowed ON public.laws
  FOR SELECT TO authenticated
  USING (
    (status = 'published' AND (SELECT private.has_active_content_access()))
    OR (SELECT private.can_read_legis_drafts())
  );

CREATE POLICY law_versions_select_allowed ON public.law_versions
  FOR SELECT TO authenticated
  USING (
    (status = 'published' AND (SELECT private.has_active_content_access()))
    OR (SELECT private.can_read_legis_drafts())
  );

CREATE POLICY legal_fragments_select_allowed ON public.legal_fragments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.law_versions AS version
      WHERE version.id = legal_fragments.law_version_id
        AND (
          (version.status = 'published' AND (SELECT private.has_active_content_access()))
          OR (SELECT private.can_read_legis_drafts())
        )
    )
  );

CREATE POLICY topic_legal_relations_select_allowed ON public.topic_legal_fragment_relations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.legal_fragments AS fragment
      JOIN public.law_versions AS version ON version.id = fragment.law_version_id
      WHERE fragment.id = topic_legal_fragment_relations.legal_fragment_id
        AND (
          (version.status = 'published' AND (SELECT private.has_active_content_access()))
          OR (SELECT private.can_read_legis_drafts())
        )
    )
  );

CREATE POLICY law_flashcards_select_allowed ON public.law_flashcards
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.legal_fragments AS fragment
      JOIN public.law_versions AS version ON version.id = fragment.law_version_id
      WHERE fragment.id = law_flashcards.legal_fragment_id
        AND (
          (
            law_flashcards.status = 'published'
            AND version.status = 'published'
            AND (SELECT private.has_active_content_access())
          )
          OR (SELECT private.can_read_legis_drafts())
        )
    )
  );

CREATE POLICY user_law_progress_select_own ON public.user_law_progress
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY user_law_progress_insert_own ON public.user_law_progress
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_law_progress_update_own ON public.user_law_progress
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_law_progress_delete_own ON public.user_law_progress
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY user_law_answers_select_own ON public.user_law_flashcard_answers
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.laws IS 'Metadados canônicos das normas no PRO Legis';
COMMENT ON TABLE public.law_versions IS 'Versões imutáveis e revisáveis de cada norma';
COMMENT ON TABLE public.legal_fragments IS 'Árvore de dispositivos com texto oficial sem marcação editorial';
COMMENT ON TABLE public.legis_editorial_audit IS 'Trilha editorial sem segredos ou payload jurídico integral';
