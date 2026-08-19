-- =============================================================================
-- Migration 011: importação atômica de drafts e workflow editorial do piloto
-- =============================================================================

ALTER TABLE public.law_flashcards
  ADD COLUMN content_hash TEXT NOT NULL
  CHECK (content_hash ~ '^sha256:[0-9a-f]{64}$');

CREATE UNIQUE INDEX idx_law_flashcards_fragment_content_hash
  ON public.law_flashcards(legal_fragment_id, content_hash);

DROP TRIGGER enforce_law_flashcard_draft ON public.law_flashcards;

CREATE OR REPLACE FUNCTION private.enforce_law_flashcard_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_fragment_id UUID;
  version_status TEXT;
BEGIN
  target_fragment_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.legal_fragment_id ELSE NEW.legal_fragment_id END;

  SELECT version.status INTO version_status
  FROM public.legal_fragments AS fragment
  JOIN public.law_versions AS version ON version.id = fragment.law_version_id
  WHERE fragment.id = target_fragment_id;

  IF TG_OP = 'INSERT' THEN
    IF version_status <> 'draft' OR NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'flashcards_must_be_imported_as_draft' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF version_status <> 'draft' OR OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'only_draft_flashcards_can_be_deleted' USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  IF ROW(NEW.legal_fragment_id, NEW.card_type, NEW.statement_markdown,
         NEW.correct_answer, NEW.explanation_markdown, NEW.content_hash)
     IS DISTINCT FROM
     ROW(OLD.legal_fragment_id, OLD.card_type, OLD.statement_markdown,
         OLD.correct_answer, OLD.explanation_markdown, OLD.content_hash) THEN
    IF version_status <> 'draft' OR OLD.status <> 'draft' OR NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'reviewed_flashcard_content_is_immutable' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT (
    (version_status = 'draft' AND OLD.status = 'draft' AND NEW.status IN ('draft', 'reviewed'))
    OR (version_status = 'reviewed' AND OLD.status = 'reviewed' AND NEW.status = 'published')
  ) THEN
    RAISE EXCEPTION 'invalid_flashcard_transition' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_law_flashcard_workflow() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_law_flashcard_workflow
  BEFORE INSERT OR UPDATE OR DELETE ON public.law_flashcards
  FOR EACH ROW EXECUTE FUNCTION private.enforce_law_flashcard_workflow();

CREATE OR REPLACE FUNCTION public.import_law_version_draft(
  import_payload JSONB,
  import_integration_id TEXT,
  import_correlation_id UUID
)
RETURNS TABLE(imported_law_id UUID, imported_version_id UUID, was_created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_law_id UUID;
  target_version_id UUID;
  fragment JSONB;
  target_parent_id UUID;
BEGIN
  IF import_payload ->> 'schema_version' <> 'pro-legis.official-law-version.v1'
     OR import_payload ->> 'import_kind' <> 'official_law_version'
     OR btrim(COALESCE(import_integration_id, '')) = '' THEN
    RAISE EXCEPTION 'invalid_official_import_contract' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.laws (
    slug, acronym, name, law_type, jurisdiction, official_source_url
  ) VALUES (
    import_payload #>> '{law,slug}',
    import_payload #>> '{law,acronym}',
    import_payload #>> '{law,name}',
    import_payload #>> '{law,law_type}',
    import_payload #>> '{law,jurisdiction}',
    import_payload #>> '{law,official_source_url}'
  ) ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO target_law_id;

  IF target_law_id IS NULL THEN
    SELECT id INTO target_law_id
    FROM public.laws
    WHERE slug = import_payload #>> '{law,slug}';
  END IF;

  SELECT id INTO target_version_id
  FROM public.law_versions
  WHERE law_id = target_law_id
    AND canonical_content_hash = import_payload #>> '{version,canonical_content_hash}';

  IF target_version_id IS NOT NULL THEN
    INSERT INTO public.legis_editorial_audit (
      actor_kind, integration_id, action, object_type, object_id,
      previous_status, new_status, approved_hash, result, correlation_id
    ) VALUES (
      'automation', import_integration_id, 'import_noop', 'law_version', target_version_id,
      'draft', 'draft', import_payload #>> '{version,canonical_content_hash}',
      'success', import_correlation_id
    );
    RETURN QUERY SELECT target_law_id, target_version_id, false;
    RETURN;
  END IF;

  INSERT INTO public.law_versions (
    law_id, version_label, effective_from, effective_until, source_url,
    raw_source_hash, canonicalization, canonical_content_hash,
    checked_at, coverage, status
  ) VALUES (
    target_law_id,
    import_payload #>> '{version,version_label}',
    NULLIF(import_payload #>> '{version,effective_from}', '')::date,
    NULLIF(import_payload #>> '{version,effective_until}', '')::date,
    import_payload #>> '{version,source_url}',
    import_payload #>> '{version,raw_source_hash}',
    import_payload #>> '{version,canonicalization}',
    import_payload #>> '{version,canonical_content_hash}',
    (import_payload #>> '{version,checked_at}')::timestamptz,
    import_payload #> '{version,coverage}',
    'draft'
  ) RETURNING id INTO target_version_id;

  FOR fragment IN SELECT value FROM jsonb_array_elements(import_payload -> 'fragments')
  LOOP
    target_parent_id := NULL;
    IF fragment ->> 'parent_stable_key' IS NOT NULL THEN
      SELECT id INTO target_parent_id
      FROM public.legal_fragments
      WHERE law_version_id = target_version_id
        AND stable_key = fragment ->> 'parent_stable_key';
      IF target_parent_id IS NULL THEN
        RAISE EXCEPTION 'parent_fragment_must_precede_child' USING ERRCODE = '23503';
      END IF;
    END IF;

    INSERT INTO public.legal_fragments (
      law_version_id, stable_key, parent_id, fragment_type,
      reference, order_index, official_text
    ) VALUES (
      target_version_id,
      fragment ->> 'stable_key',
      target_parent_id,
      fragment ->> 'fragment_type',
      fragment ->> 'reference',
      (fragment ->> 'order_index')::integer,
      fragment ->> 'official_text'
    );
  END LOOP;

  INSERT INTO public.legis_editorial_audit (
    actor_kind, integration_id, action, object_type, object_id,
    new_status, approved_hash, result, correlation_id
  ) VALUES (
    'automation', import_integration_id, 'import', 'law_version', target_version_id,
    'draft', import_payload #>> '{version,canonical_content_hash}',
    'success', import_correlation_id
  );

  RETURN QUERY SELECT target_law_id, target_version_id, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_law_flashcards_draft(
  import_payload JSONB,
  import_integration_id TEXT,
  import_correlation_id UUID
)
RETURNS TABLE(imported_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_version_id UUID;
  target_fragment_id UUID;
  card JSONB;
  inserted_total INTEGER := 0;
BEGIN
  IF import_payload ->> 'schema_version' <> 'pro-legis.editorial-enrichment.v1'
     OR import_payload ->> 'import_kind' <> 'editorial_enrichment'
     OR jsonb_array_length(import_payload -> 'signals') <> 0
     OR btrim(COALESCE(import_integration_id, '')) = '' THEN
    RAISE EXCEPTION 'invalid_flashcard_import_contract' USING ERRCODE = '22023';
  END IF;

  SELECT version.id INTO target_version_id
  FROM public.law_versions AS version
  JOIN public.laws AS law ON law.id = version.law_id
  WHERE law.slug = import_payload ->> 'law_slug'
    AND version.canonical_content_hash = import_payload ->> 'canonical_content_hash'
    AND version.status = 'draft';

  IF target_version_id IS NULL THEN
    RAISE EXCEPTION 'draft_law_version_not_found' USING ERRCODE = 'P0002';
  END IF;

  FOR card IN SELECT value FROM jsonb_array_elements(import_payload -> 'flashcards')
  LOOP
    SELECT id INTO target_fragment_id
    FROM public.legal_fragments
    WHERE law_version_id = target_version_id
      AND stable_key = card ->> 'legal_fragment_stable_key';
    IF target_fragment_id IS NULL THEN
      RAISE EXCEPTION 'flashcard_fragment_not_found' USING ERRCODE = '23503';
    END IF;

    INSERT INTO public.law_flashcards (
      legal_fragment_id, card_type, statement_markdown, correct_answer,
      explanation_markdown, content_hash, status
    ) VALUES (
      target_fragment_id, 'true_false', card ->> 'statement_markdown',
      (card ->> 'correct_answer')::boolean,
      card ->> 'explanation_markdown', card ->> 'content_hash', 'draft'
    ) ON CONFLICT (legal_fragment_id, content_hash) DO NOTHING;
    inserted_total := inserted_total + CASE WHEN FOUND THEN 1 ELSE 0 END;
  END LOOP;

  INSERT INTO public.legis_editorial_audit (
    actor_kind, integration_id, action, object_type, object_id,
    new_status, approved_hash, result, correlation_id
  ) VALUES (
    'automation', import_integration_id, 'import_flashcards', 'law_version', target_version_id,
    'draft', import_payload ->> 'canonical_content_hash', 'success', import_correlation_id
  );

  RETURN QUERY SELECT inserted_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_law_version(target_version_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_hash TEXT;
BEGIN
  IF NOT private.has_legis_permission('legis.review') THEN
    RAISE EXCEPTION 'legis_review_forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT canonical_content_hash INTO target_hash FROM public.law_versions
  WHERE id = target_version_id AND status = 'draft' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'law_version_not_draft' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.law_flashcards SET status = 'reviewed'
  WHERE legal_fragment_id IN (SELECT id FROM public.legal_fragments WHERE law_version_id = target_version_id)
    AND status = 'draft';
  UPDATE public.law_versions SET status = 'reviewed', reviewed_by = (SELECT auth.uid()),
    reviewed_at = now(), rejection_reason = NULL WHERE id = target_version_id;
  INSERT INTO public.legis_editorial_audit (actor_user_id, actor_kind, action, object_type,
    object_id, previous_status, new_status, approved_hash, result)
  VALUES ((SELECT auth.uid()), 'human', 'review', 'law_version', target_version_id,
    'draft', 'reviewed', target_hash, 'success');
END; $$;

CREATE OR REPLACE FUNCTION public.publish_law_version(target_version_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_law_id UUID; target_reviewer UUID; target_hash TEXT;
BEGIN
  IF NOT private.has_legis_permission('legis.publish') THEN
    RAISE EXCEPTION 'legis_publish_forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT law_id, reviewed_by, canonical_content_hash INTO target_law_id, target_reviewer, target_hash
  FROM public.law_versions WHERE id = target_version_id AND status = 'reviewed' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'law_version_not_reviewed' USING ERRCODE = 'P0001'; END IF;
  IF target_reviewer = (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'reviewer_cannot_publish' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.legal_fragments WHERE law_version_id = target_version_id) THEN
    RAISE EXCEPTION 'law_version_has_no_fragments' USING ERRCODE = '23514';
  END IF;
  UPDATE public.law_flashcards SET status = 'published'
  WHERE legal_fragment_id IN (SELECT id FROM public.legal_fragments WHERE law_version_id = target_version_id)
    AND status = 'reviewed';
  UPDATE public.law_versions SET status = 'published', published_by = (SELECT auth.uid()),
    published_at = now() WHERE id = target_version_id;
  UPDATE public.laws SET current_version_id = target_version_id, status = 'published'
  WHERE id = target_law_id;
  INSERT INTO public.legis_editorial_audit (actor_user_id, actor_kind, action, object_type,
    object_id, previous_status, new_status, approved_hash, result)
  VALUES ((SELECT auth.uid()), 'human', 'publish', 'law_version', target_version_id,
    'reviewed', 'published', target_hash, 'success');
END; $$;

REVOKE ALL ON FUNCTION public.import_law_version_draft(JSONB, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.import_law_flashcards_draft(JSONB, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_law_version_draft(JSONB, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_law_flashcards_draft(JSONB, TEXT, UUID) TO service_role;
