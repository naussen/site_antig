-- Identidade estavel, versionamento e ciclo de vida seguro do PRO Resumos.
-- Esta migration e aditiva: section_id permanece disponivel durante a transicao.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION private.normalize_content_stable_key(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT NULLIF(
    trim(BOTH '-' FROM regexp_replace(
      translate(
        lower(value),
        'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
        'aaaaaaeeeeiiiiooooouuuucnyy'
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )),
    ''
  );
$$;

REVOKE ALL ON FUNCTION private.normalize_content_stable_key(TEXT)
FROM PUBLIC, anon, authenticated;

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

ALTER TABLE public.sections
  ADD COLUMN IF NOT EXISTS content_unit_id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS stable_key TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT,
  ADD COLUMN IF NOT EXISTS current_revision_id UUID;

UPDATE public.sections
SET content_unit_id = gen_random_uuid()
WHERE content_unit_id IS NULL;

WITH stable_key_candidates AS (
  SELECT
    section_id,
    content_unit_id,
    COALESCE(
      private.normalize_content_stable_key(title),
      private.normalize_content_stable_key(section_id),
      'content-unit'
    ) AS base_key,
    count(*) OVER (
      PARTITION BY topic_id, COALESCE(
        private.normalize_content_stable_key(title),
        private.normalize_content_stable_key(section_id),
        'content-unit'
      )
    ) AS matching_key_count
  FROM public.sections
  WHERE stable_key IS NULL OR btrim(stable_key) = ''
)
UPDATE public.sections AS section
SET stable_key = CASE
  WHEN candidate.matching_key_count = 1 THEN candidate.base_key
  ELSE candidate.base_key || '-' || replace(candidate.content_unit_id::TEXT, '-', '')
END
FROM stable_key_candidates AS candidate
WHERE candidate.section_id = section.section_id;

ALTER TABLE public.sections
  ALTER COLUMN content_unit_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN content_unit_id SET NOT NULL,
  ALTER COLUMN stable_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_content_unit_id_key'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_content_unit_id_key UNIQUE (content_unit_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_topic_stable_key_key'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_topic_stable_key_key UNIQUE (topic_id, stable_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_stable_key_format_check'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_stable_key_format_check
      CHECK (stable_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'topics_archive_metadata_check'
      AND conrelid = 'public.topics'::regclass
  ) THEN
    ALTER TABLE public.topics
      ADD CONSTRAINT topics_archive_metadata_check CHECK (
        (archived_at IS NULL AND archived_by IS NULL AND archived_reason IS NULL)
        OR (
          archived_at IS NOT NULL
          AND archived_reason IS NOT NULL
          AND btrim(archived_reason) <> ''
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_archive_metadata_check'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_archive_metadata_check CHECK (
        (archived_at IS NULL AND archived_by IS NULL AND archived_reason IS NULL)
        OR (
          archived_at IS NOT NULL
          AND archived_reason IS NOT NULL
          AND btrim(archived_reason) <> ''
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'topics_archived_by_fkey'
      AND conrelid = 'public.topics'::regclass
  ) THEN
    ALTER TABLE public.topics
      ADD CONSTRAINT topics_archived_by_fkey
      FOREIGN KEY (archived_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_archived_by_fkey'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_archived_by_fkey
      FOREIGN KEY (archived_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_topics_active
  ON public.topics(topic_id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sections_active_topic_order
  ON public.sections(topic_id, sort_order) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS public.content_change_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL REFERENCES public.topics(topic_id) ON DELETE RESTRICT,
  import_run_id UUID,
  operation TEXT NOT NULL CHECK (
    operation IN ('replace', 'split', 'merge', 'archive', 'restore')
  ),
  manifest JSONB NOT NULL CHECK (jsonb_typeof(manifest) = 'object'),
  manifest_hash TEXT NOT NULL CHECK (manifest_hash ~ '^[0-9a-f]{64}$'),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, manifest_hash)
);

COMMENT ON TABLE public.content_change_manifests IS
  'Manifestos imutaveis que descrevem splits, merges, replaces e arquivamentos de conteudo';

CREATE OR REPLACE FUNCTION private.canonical_jsonb(value JSONB)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE jsonb_typeof(value)
    WHEN 'object' THEN '{' || COALESCE((
      SELECT string_agg(
        to_json(object_item.key)::TEXT || ':' || private.canonical_jsonb(object_item.value),
        ',' ORDER BY object_item.key
      )
      FROM jsonb_each(value) AS object_item
    ), '') || '}'
    WHEN 'array' THEN '[' || COALESCE((
      SELECT string_agg(
        private.canonical_jsonb(array_item.value),
        ',' ORDER BY array_item.ordinality
      )
      FROM jsonb_array_elements(value) WITH ORDINALITY AS array_item(value, ordinality)
    ), '') || ']'
    ELSE value::TEXT
  END;
$$;

REVOKE ALL ON FUNCTION private.canonical_jsonb(JSONB)
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.validate_content_change_manifest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated_hash TEXT;
BEGIN
  calculated_hash := encode(
    extensions.digest(
      convert_to(private.canonical_jsonb(NEW.manifest), 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  IF NEW.manifest_hash IS NULL OR NEW.manifest_hash = '' THEN
    NEW.manifest_hash := calculated_hash;
  ELSIF NEW.manifest_hash <> calculated_hash THEN
    RAISE EXCEPTION 'manifest_hash nao corresponde ao JSON canonico do manifesto'
      USING ERRCODE = '22000';
  END IF;

  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_content_change_manifest()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_validate_content_change_manifest
  ON public.content_change_manifests;
CREATE TRIGGER trigger_validate_content_change_manifest
  BEFORE INSERT ON public.content_change_manifests
  FOR EACH ROW EXECUTE FUNCTION private.validate_content_change_manifest();

CREATE TABLE IF NOT EXISTS public.content_unit_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_unit_id UUID NOT NULL REFERENCES public.sections(content_unit_id) ON DELETE RESTRICT,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  stable_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT,
  callouts JSONB NOT NULL,
  mnemonics JSONB NOT NULL,
  flashcards JSONB NOT NULL,
  mermaid_mindmap TEXT,
  sort_order INTEGER NOT NULL,
  content_hash TEXT NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  change_manifest_id UUID REFERENCES public.content_change_manifests(id) ON DELETE RESTRICT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_unit_id, revision_number)
);

COMMENT ON TABLE public.content_unit_revisions IS
  'Snapshots append-only e imutaveis de cada unidade de conteudo dos resumos';

CREATE INDEX IF NOT EXISTS idx_content_unit_revisions_latest
  ON public.content_unit_revisions(content_unit_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_content_unit_revisions_manifest
  ON public.content_unit_revisions(change_manifest_id)
  WHERE change_manifest_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sections_current_revision_id_fkey'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT sections_current_revision_id_fkey
      FOREIGN KEY (current_revision_id)
      REFERENCES public.content_unit_revisions(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.content_revision_hash(
  p_stable_key TEXT,
  p_title TEXT,
  p_content_markdown TEXT,
  p_callouts JSONB,
  p_mnemonics JSONB,
  p_flashcards JSONB,
  p_mermaid_mindmap TEXT,
  p_sort_order INTEGER
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'stable_key', p_stable_key,
        'title', p_title,
        'content_markdown', p_content_markdown,
        'callouts', p_callouts,
        'mnemonics', p_mnemonics,
        'flashcards', p_flashcards,
        'mermaid_mindmap', p_mermaid_mindmap,
        'sort_order', p_sort_order
      )::TEXT, 'UTF8'),
      'sha256'
    ),
    'hex'
  );
$$;

REVOKE ALL ON FUNCTION private.content_revision_hash(
  TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT, INTEGER
) FROM PUBLIC, anon, authenticated;

INSERT INTO public.content_unit_revisions (
  content_unit_id,
  revision_number,
  stable_key,
  title,
  content_markdown,
  callouts,
  mnemonics,
  flashcards,
  mermaid_mindmap,
  sort_order,
  content_hash
)
SELECT
  section.content_unit_id,
  1,
  section.stable_key,
  section.title,
  section.content_markdown,
  section.callouts,
  section.mnemonics,
  section.flashcards,
  section.mermaid_mindmap,
  section.sort_order,
  private.content_revision_hash(
    section.stable_key,
    section.title,
    section.content_markdown,
    section.callouts,
    section.mnemonics,
    section.flashcards,
    section.mermaid_mindmap,
    section.sort_order
  )
FROM public.sections AS section
ON CONFLICT (content_unit_id, revision_number) DO NOTHING;

UPDATE public.sections AS section
SET current_revision_id = revision.id
FROM public.content_unit_revisions AS revision
WHERE revision.content_unit_id = section.content_unit_id
  AND revision.revision_number = 1
  AND section.current_revision_id IS NULL;

CREATE OR REPLACE FUNCTION private.prepare_content_section_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_key TEXT;
  revision_content_unit_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.content_unit_id IS DISTINCT FROM OLD.content_unit_id THEN
      RAISE EXCEPTION 'content_unit_id e permanente e nao pode ser alterado'
        USING ERRCODE = '55000';
    END IF;

    IF NEW.stable_key IS DISTINCT FROM OLD.stable_key THEN
      RAISE EXCEPTION 'stable_key e permanente e nao pode ser alterada'
        USING ERRCODE = '55000';
    END IF;
  ELSE
    NEW.content_unit_id := COALESCE(NEW.content_unit_id, gen_random_uuid());

    IF NEW.stable_key IS NULL OR btrim(NEW.stable_key) = '' THEN
      base_key := COALESCE(
        private.normalize_content_stable_key(NEW.title),
        private.normalize_content_stable_key(NEW.section_id),
        'content-unit'
      );

      NEW.stable_key := base_key;
      IF EXISTS (
        SELECT 1 FROM public.sections
        WHERE topic_id = NEW.topic_id AND stable_key = NEW.stable_key
      ) THEN
        NEW.stable_key := base_key || '-' || replace(NEW.content_unit_id::TEXT, '-', '');
      END IF;
    END IF;
  END IF;

  IF NEW.archived_at IS NULL THEN
    NEW.archived_by := NULL;
    NEW.archived_reason := NULL;
  ELSE
    IF NEW.archived_reason IS NULL OR btrim(NEW.archived_reason) = '' THEN
      RAISE EXCEPTION 'archived_reason e obrigatorio ao arquivar uma secao'
        USING ERRCODE = '23514';
    END IF;
    NEW.archived_by := COALESCE(NEW.archived_by, auth.uid());
  END IF;

  IF NEW.current_revision_id IS NOT NULL THEN
    SELECT revision.content_unit_id
    INTO revision_content_unit_id
    FROM public.content_unit_revisions AS revision
    WHERE revision.id = NEW.current_revision_id;

    IF revision_content_unit_id IS DISTINCT FROM NEW.content_unit_id THEN
      RAISE EXCEPTION 'current_revision_id pertence a outra unidade de conteudo'
        USING ERRCODE = '23503';
    END IF;

    IF TG_OP = 'UPDATE'
      AND OLD.current_revision_id IS NOT NULL
      AND NEW.current_revision_id IS DISTINCT FROM OLD.current_revision_id
      AND (NEW.title, NEW.content_markdown, NEW.callouts, NEW.mnemonics,
           NEW.flashcards, NEW.mermaid_mindmap, NEW.sort_order)
          IS NOT DISTINCT FROM
          (OLD.title, OLD.content_markdown, OLD.callouts, OLD.mnemonics,
           OLD.flashcards, OLD.mermaid_mindmap, OLD.sort_order)
    THEN
      RAISE EXCEPTION 'current_revision_id so pode mudar com uma nova revisao'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prepare_content_section_identity()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_a_prepare_content_section_identity ON public.sections;
CREATE TRIGGER trigger_a_prepare_content_section_identity
  BEFORE INSERT OR UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.prepare_content_section_identity();

CREATE OR REPLACE FUNCTION private.capture_content_unit_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_revision_id UUID;
  next_revision_number INTEGER;
  active_manifest_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND
    (NEW.title, NEW.content_markdown, NEW.callouts, NEW.mnemonics,
     NEW.flashcards, NEW.mermaid_mindmap, NEW.sort_order)
    IS NOT DISTINCT FROM
    (OLD.title, OLD.content_markdown, OLD.callouts, OLD.mnemonics,
     OLD.flashcards, OLD.mermaid_mindmap, OLD.sort_order)
  THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.content_unit_id::TEXT, 0));

  SELECT COALESCE(max(revision_number), 0) + 1
  INTO next_revision_number
  FROM public.content_unit_revisions
  WHERE content_unit_id = NEW.content_unit_id;

  active_manifest_id := NULLIF(
    current_setting('app.content_change_manifest_id', true),
    ''
  )::UUID;

  INSERT INTO public.content_unit_revisions (
    content_unit_id,
    revision_number,
    stable_key,
    title,
    content_markdown,
    callouts,
    mnemonics,
    flashcards,
    mermaid_mindmap,
    sort_order,
    content_hash,
    change_manifest_id,
    created_by
  ) VALUES (
    NEW.content_unit_id,
    next_revision_number,
    NEW.stable_key,
    NEW.title,
    NEW.content_markdown,
    NEW.callouts,
    NEW.mnemonics,
    NEW.flashcards,
    NEW.mermaid_mindmap,
    NEW.sort_order,
    private.content_revision_hash(
      NEW.stable_key,
      NEW.title,
      NEW.content_markdown,
      NEW.callouts,
      NEW.mnemonics,
      NEW.flashcards,
      NEW.mermaid_mindmap,
      NEW.sort_order
    ),
    active_manifest_id,
    auth.uid()
  )
  RETURNING id INTO new_revision_id;

  IF TG_OP = 'UPDATE' THEN
    NEW.current_revision_id := new_revision_id;

    UPDATE public.user_text_highlights
    SET migration_status = 'needs_review'
    WHERE content_unit_id = NEW.content_unit_id
      AND migration_status = 'active'
      AND NEW.content_markdown IS DISTINCT FROM OLD.content_markdown
      AND content_revision_id IS DISTINCT FROM new_revision_id;

    RETURN NEW;
  END IF;

  UPDATE public.sections
  SET current_revision_id = new_revision_id
  WHERE section_id = NEW.section_id;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.capture_content_unit_revision()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_b_capture_content_unit_revision_update ON public.sections;
CREATE TRIGGER trigger_b_capture_content_unit_revision_update
  BEFORE UPDATE OF title, content_markdown, callouts, mnemonics,
    flashcards, mermaid_mindmap, sort_order
  ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.capture_content_unit_revision();

DROP TRIGGER IF EXISTS trigger_capture_content_unit_revision_insert ON public.sections;
CREATE TRIGGER trigger_capture_content_unit_revision_insert
  AFTER INSERT ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.capture_content_unit_revision();

CREATE OR REPLACE FUNCTION private.reject_immutable_content_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '% e append-only; operacao % nao permitida', TG_TABLE_NAME, TG_OP
    USING ERRCODE = '55000';
END;
$$;

REVOKE ALL ON FUNCTION private.reject_immutable_content_audit_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_content_unit_revisions_immutable
  ON public.content_unit_revisions;
CREATE TRIGGER trigger_content_unit_revisions_immutable
  BEFORE UPDATE OR DELETE ON public.content_unit_revisions
  FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_content_audit_change();

DROP TRIGGER IF EXISTS trigger_content_change_manifests_immutable
  ON public.content_change_manifests;
CREATE TRIGGER trigger_content_change_manifests_immutable
  BEFORE UPDATE OR DELETE ON public.content_change_manifests
  FOR EACH ROW EXECUTE FUNCTION private.reject_immutable_content_audit_change();

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS content_unit_id UUID;
ALTER TABLE public.user_notes
  ADD COLUMN IF NOT EXISTS content_unit_id UUID;
ALTER TABLE public.user_text_highlights
  ADD COLUMN IF NOT EXISTS content_unit_id UUID,
  ADD COLUMN IF NOT EXISTS content_revision_id UUID,
  ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS anchor_context JSONB DEFAULT '{}'::jsonb;

-- section_id permanece como alias textual retrocompativel, mas deixa de ser FK.
-- O trigger de consistencia abaixo valida o alias contra o UUID canonico.
DO $$
DECLARE
  legacy_fk RECORD;
BEGIN
  FOR legacy_fk IN
    SELECT
      constraint_row.conrelid::regclass AS table_name,
      constraint_row.conname
    FROM pg_constraint AS constraint_row
    JOIN pg_attribute AS attribute_row
      ON attribute_row.attrelid = constraint_row.conrelid
      AND attribute_row.attnum = ANY (constraint_row.conkey)
    WHERE constraint_row.contype = 'f'
      AND constraint_row.confrelid = 'public.sections'::regclass
      AND constraint_row.conrelid IN (
        'public.user_progress'::regclass,
        'public.user_notes'::regclass,
        'public.user_text_highlights'::regclass
      )
      AND attribute_row.attname = 'section_id'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      legacy_fk.table_name,
      legacy_fk.conname
    );
  END LOOP;
END;
$$;

UPDATE public.user_progress AS personal
SET content_unit_id = section.content_unit_id
FROM public.sections AS section
WHERE section.section_id = personal.section_id
  AND personal.content_unit_id IS NULL;

UPDATE public.user_notes AS personal
SET content_unit_id = section.content_unit_id
FROM public.sections AS section
WHERE section.section_id = personal.section_id
  AND personal.content_unit_id IS NULL;

UPDATE public.user_text_highlights AS personal
SET
  content_unit_id = section.content_unit_id,
  content_revision_id = COALESCE(personal.content_revision_id, section.current_revision_id),
  migration_status = COALESCE(personal.migration_status, 'active'),
  anchor_context = CASE
    WHEN personal.anchor_context IS NULL OR personal.anchor_context = '{}'::jsonb
    THEN jsonb_build_object(
      'selected_text', personal.selected_text,
      'prefix', personal.prefix,
      'suffix', personal.suffix,
      'start_offset', personal.start_offset,
      'end_offset', personal.end_offset,
      'anchor_version', 1
    )
    ELSE personal.anchor_context
  END
FROM public.sections AS section
WHERE section.section_id = personal.section_id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_progress WHERE content_unit_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.user_notes WHERE content_unit_id IS NULL)
    OR EXISTS (SELECT 1 FROM public.user_text_highlights WHERE content_unit_id IS NULL)
  THEN
    RAISE EXCEPTION 'Existem dados pessoais sem section_id valido; migration interrompida';
  END IF;
END;
$$;

ALTER TABLE public.user_progress
  ALTER COLUMN content_unit_id SET NOT NULL;
ALTER TABLE public.user_notes
  ALTER COLUMN content_unit_id SET NOT NULL;
ALTER TABLE public.user_text_highlights
  ALTER COLUMN content_unit_id SET NOT NULL,
  ALTER COLUMN migration_status SET DEFAULT 'active',
  ALTER COLUMN migration_status SET NOT NULL,
  ALTER COLUMN anchor_context SET DEFAULT '{}'::jsonb,
  ALTER COLUMN anchor_context SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_progress_content_unit_id_fkey'
      AND conrelid = 'public.user_progress'::regclass
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_content_unit_id_fkey
      FOREIGN KEY (content_unit_id) REFERENCES public.sections(content_unit_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_progress_user_content_unit_key'
      AND conrelid = 'public.user_progress'::regclass
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_user_content_unit_key
      UNIQUE (user_id, content_unit_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_notes_content_unit_id_fkey'
      AND conrelid = 'public.user_notes'::regclass
  ) THEN
    ALTER TABLE public.user_notes
      ADD CONSTRAINT user_notes_content_unit_id_fkey
      FOREIGN KEY (content_unit_id) REFERENCES public.sections(content_unit_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_text_highlights_content_unit_id_fkey'
      AND conrelid = 'public.user_text_highlights'::regclass
  ) THEN
    ALTER TABLE public.user_text_highlights
      ADD CONSTRAINT user_text_highlights_content_unit_id_fkey
      FOREIGN KEY (content_unit_id) REFERENCES public.sections(content_unit_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_text_highlights_content_revision_id_fkey'
      AND conrelid = 'public.user_text_highlights'::regclass
  ) THEN
    ALTER TABLE public.user_text_highlights
      ADD CONSTRAINT user_text_highlights_content_revision_id_fkey
      FOREIGN KEY (content_revision_id) REFERENCES public.content_unit_revisions(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_text_highlights_migration_status_check'
      AND conrelid = 'public.user_text_highlights'::regclass
  ) THEN
    ALTER TABLE public.user_text_highlights
      ADD CONSTRAINT user_text_highlights_migration_status_check
      CHECK (migration_status IN ('active', 'migrated', 'orphaned', 'needs_review'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_text_highlights_anchor_context_check'
      AND conrelid = 'public.user_text_highlights'::regclass
  ) THEN
    ALTER TABLE public.user_text_highlights
      ADD CONSTRAINT user_text_highlights_anchor_context_check
      CHECK (jsonb_typeof(anchor_context) = 'object');
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_user_progress_user_content_unit
  ON public.user_progress(user_id, content_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_content_unit
  ON public.user_notes(user_id, content_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_text_highlights_user_content_unit
  ON public.user_text_highlights(user_id, content_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_text_highlights_migration_status
  ON public.user_text_highlights(user_id, migration_status)
  WHERE migration_status <> 'active';

CREATE OR REPLACE FUNCTION private.resolve_personal_content_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  resolved_content_unit_id UUID;
  resolved_section_id TEXT;
BEGIN
  IF NEW.content_unit_id IS NOT NULL THEN
    SELECT section.section_id
    INTO resolved_section_id
    FROM public.sections AS section
    WHERE section.content_unit_id = NEW.content_unit_id;

    IF resolved_section_id IS NULL THEN
      RAISE EXCEPTION 'content_unit_id inexistente: %', NEW.content_unit_id
        USING ERRCODE = '23503';
    END IF;

    -- O UUID e canonico; section_id e somente um alias retrocompativel.
    NEW.section_id := resolved_section_id;
  ELSE
    SELECT section.content_unit_id
    INTO resolved_content_unit_id
    FROM public.sections AS section
    WHERE section.section_id = NEW.section_id;

    IF resolved_content_unit_id IS NULL THEN
      RAISE EXCEPTION 'section_id inexistente: %', NEW.section_id
        USING ERRCODE = '23503';
    END IF;

    NEW.content_unit_id := resolved_content_unit_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_personal_content_unit()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_user_progress_content_unit ON public.user_progress;
CREATE TRIGGER trigger_user_progress_content_unit
  BEFORE INSERT OR UPDATE OF section_id, content_unit_id ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION private.resolve_personal_content_unit();

DROP TRIGGER IF EXISTS trigger_user_notes_content_unit ON public.user_notes;
CREATE TRIGGER trigger_user_notes_content_unit
  BEFORE INSERT OR UPDATE OF section_id, content_unit_id ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION private.resolve_personal_content_unit();

DROP TRIGGER IF EXISTS trigger_user_text_highlights_content_unit
  ON public.user_text_highlights;
DROP TRIGGER IF EXISTS trigger_a_user_text_highlights_content_unit
  ON public.user_text_highlights;
CREATE TRIGGER trigger_a_user_text_highlights_content_unit
  BEFORE INSERT OR UPDATE OF section_id, content_unit_id
  ON public.user_text_highlights
  FOR EACH ROW EXECUTE FUNCTION private.resolve_personal_content_unit();

CREATE OR REPLACE FUNCTION private.prepare_text_highlight_anchor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  revision_content_unit_id UUID;
  current_revision_id UUID;
BEGIN
  IF NEW.content_revision_id IS NULL AND NEW.migration_status = 'active' THEN
    SELECT section.current_revision_id
    INTO current_revision_id
    FROM public.sections AS section
    WHERE section.content_unit_id = NEW.content_unit_id;
    NEW.content_revision_id := current_revision_id;
  END IF;

  IF NEW.content_revision_id IS NOT NULL THEN
    SELECT revision.content_unit_id
    INTO revision_content_unit_id
    FROM public.content_unit_revisions AS revision
    WHERE revision.id = NEW.content_revision_id;

    IF revision_content_unit_id IS DISTINCT FROM NEW.content_unit_id THEN
      RAISE EXCEPTION 'content_revision_id pertence a outra unidade de conteudo'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  IF NEW.anchor_context = '{}'::jsonb THEN
    NEW.anchor_context := jsonb_build_object(
      'selected_text', NEW.selected_text,
      'prefix', NEW.prefix,
      'suffix', NEW.suffix,
      'start_offset', NEW.start_offset,
      'end_offset', NEW.end_offset,
      'anchor_version', 1
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prepare_text_highlight_anchor()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_prepare_text_highlight_anchor
  ON public.user_text_highlights;
DROP TRIGGER IF EXISTS trigger_b_prepare_text_highlight_anchor
  ON public.user_text_highlights;
CREATE TRIGGER trigger_b_prepare_text_highlight_anchor
  BEFORE INSERT OR UPDATE OF content_unit_id, content_revision_id,
    migration_status, anchor_context
  ON public.user_text_highlights
  FOR EACH ROW EXECUTE FUNCTION private.prepare_text_highlight_anchor();

CREATE OR REPLACE FUNCTION private.prepare_topic_archive_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.archived_at IS NULL THEN
    NEW.archived_by := NULL;
    NEW.archived_reason := NULL;
  ELSE
    IF NEW.archived_reason IS NULL OR btrim(NEW.archived_reason) = '' THEN
      RAISE EXCEPTION 'archived_reason e obrigatorio ao arquivar um topico'
        USING ERRCODE = '23514';
    END IF;
    NEW.archived_by := COALESCE(NEW.archived_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prepare_topic_archive_metadata()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_prepare_topic_archive_metadata ON public.topics;
CREATE TRIGGER trigger_prepare_topic_archive_metadata
  BEFORE INSERT OR UPDATE OF archived_at, archived_by, archived_reason
  ON public.topics
  FOR EACH ROW EXECUTE FUNCTION private.prepare_topic_archive_metadata();

CREATE OR REPLACE FUNCTION private.reject_content_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '% nao pode ser excluida fisicamente; use o RPC de arquivamento',
    TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

REVOKE ALL ON FUNCTION private.reject_content_hard_delete()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_reject_section_hard_delete ON public.sections;
CREATE TRIGGER trigger_reject_section_hard_delete
  BEFORE DELETE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION private.reject_content_hard_delete();

DROP TRIGGER IF EXISTS trigger_reject_topic_hard_delete ON public.topics;
CREATE TRIGGER trigger_reject_topic_hard_delete
  BEFORE DELETE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION private.reject_content_hard_delete();

CREATE OR REPLACE FUNCTION public.apply_content_import(
  p_payload JSONB,
  p_manifest JSONB,
  p_manifest_hash TEXT,
  p_operation TEXT DEFAULT 'replace'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payload_topic_id TEXT;
  payload_topic_title TEXT;
  payload_discipline TEXT;
  manifest_id UUID;
  section_item JSONB;
  section_position BIGINT;
  section_content_unit_id UUID;
  existing_topic_id TEXT;
  incoming_content_unit_ids UUID[] := ARRAY[]::UUID[];
  archive_reason TEXT;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object'
    OR jsonb_typeof(p_payload -> 'sections') <> 'array'
    OR jsonb_array_length(p_payload -> 'sections') = 0
  THEN
    RAISE EXCEPTION 'p_payload deve conter um array sections nao vazio'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_manifest) <> 'object'
    OR jsonb_typeof(p_manifest -> 'operations') <> 'array'
    OR jsonb_array_length(p_manifest -> 'operations') = 0
  THEN
    RAISE EXCEPTION 'p_manifest deve conter operations nao vazio'
      USING ERRCODE = '22023';
  END IF;

  payload_topic_id := NULLIF(btrim(p_payload ->> 'topic_id'), '');
  payload_topic_title := NULLIF(btrim(p_payload ->> 'topic_title'), '');
  payload_discipline := COALESCE(
    NULLIF(btrim(p_payload ->> 'discipline'), ''),
    'Geral'
  );
  archive_reason := NULLIF(btrim(p_manifest ->> 'reason'), '');

  IF payload_topic_id IS NULL OR payload_topic_title IS NULL THEN
    RAISE EXCEPTION 'topic_id e topic_title sao obrigatorios'
      USING ERRCODE = '22023';
  END IF;

  IF p_manifest ->> 'topic_id' IS DISTINCT FROM payload_topic_id
    OR archive_reason IS NULL
  THEN
    RAISE EXCEPTION 'manifesto nao corresponde ao topico ou nao possui reason'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.topics (
    topic_id,
    discipline,
    title,
    archived_at,
    archived_by,
    archived_reason
  ) VALUES (
    payload_topic_id,
    payload_discipline,
    payload_topic_title,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (topic_id) DO UPDATE SET
    discipline = EXCLUDED.discipline,
    title = EXCLUDED.title,
    archived_at = NULL,
    archived_by = NULL,
    archived_reason = NULL;

  INSERT INTO public.content_change_manifests (
    topic_id,
    import_run_id,
    operation,
    manifest,
    manifest_hash,
    created_by
  ) VALUES (
    payload_topic_id,
    gen_random_uuid(),
    p_operation,
    p_manifest,
    p_manifest_hash,
    auth.uid()
  )
  ON CONFLICT (topic_id, manifest_hash) DO NOTHING
  RETURNING id INTO manifest_id;

  IF manifest_id IS NULL THEN
    SELECT existing_manifest.id
    INTO manifest_id
    FROM public.content_change_manifests AS existing_manifest
    WHERE existing_manifest.topic_id = payload_topic_id
      AND existing_manifest.manifest_hash = p_manifest_hash;
  END IF;

  IF manifest_id IS NULL THEN
    RAISE EXCEPTION 'nao foi possivel persistir o manifesto de mudanca';
  END IF;

  PERFORM set_config('app.content_change_manifest_id', manifest_id::TEXT, true);

  FOR section_item, section_position IN
    SELECT item.value, item.ordinality
    FROM jsonb_array_elements(p_payload -> 'sections')
      WITH ORDINALITY AS item(value, ordinality)
  LOOP
    IF NULLIF(btrim(section_item ->> 'section_id'), '') IS NULL
      OR NULLIF(btrim(section_item ->> 'title'), '') IS NULL
    THEN
      RAISE EXCEPTION 'section_id e title sao obrigatorios em todas as secoes'
        USING ERRCODE = '22023';
    END IF;

    section_content_unit_id := NULLIF(
      btrim(section_item ->> 'content_unit_id'),
      ''
    )::UUID;

    IF section_content_unit_id IS NOT NULL THEN
      IF NULLIF(btrim(section_item ->> 'stable_key'), '') IS NULL THEN
        RAISE EXCEPTION 'stable_key e obrigatoria com content_unit_id'
          USING ERRCODE = '22023';
      END IF;

      SELECT section.topic_id
      INTO existing_topic_id
      FROM public.sections AS section
      WHERE section.content_unit_id = section_content_unit_id;

      IF existing_topic_id IS NOT NULL
        AND existing_topic_id <> payload_topic_id
      THEN
        RAISE EXCEPTION 'content_unit_id pertence a outro topico'
          USING ERRCODE = '23514';
      END IF;

      INSERT INTO public.sections (
        section_id,
        content_unit_id,
        stable_key,
        topic_id,
        title,
        content_markdown,
        callouts,
        mnemonics,
        flashcards,
        mermaid_mindmap,
        sort_order,
        archived_at,
        archived_by,
        archived_reason
      ) VALUES (
        section_item ->> 'section_id',
        section_content_unit_id,
        section_item ->> 'stable_key',
        payload_topic_id,
        section_item ->> 'title',
        NULLIF(section_item ->> 'content_markdown', ''),
        COALESCE(section_item -> 'callouts', '[]'::jsonb),
        COALESCE(section_item -> 'mnemonics', '[]'::jsonb),
        COALESCE(section_item -> 'flashcards', '[]'::jsonb),
        NULLIF(section_item ->> 'mermaid_mindmap', ''),
        section_position - 1,
        NULL,
        NULL,
        NULL
      )
      ON CONFLICT (content_unit_id) DO UPDATE SET
        section_id = EXCLUDED.section_id,
        stable_key = EXCLUDED.stable_key,
        topic_id = EXCLUDED.topic_id,
        title = EXCLUDED.title,
        content_markdown = EXCLUDED.content_markdown,
        callouts = EXCLUDED.callouts,
        mnemonics = EXCLUDED.mnemonics,
        flashcards = EXCLUDED.flashcards,
        mermaid_mindmap = EXCLUDED.mermaid_mindmap,
        sort_order = EXCLUDED.sort_order,
        archived_at = NULL,
        archived_by = NULL,
        archived_reason = NULL
      RETURNING content_unit_id INTO section_content_unit_id;
    ELSE
      INSERT INTO public.sections (
        section_id,
        stable_key,
        topic_id,
        title,
        content_markdown,
        callouts,
        mnemonics,
        flashcards,
        mermaid_mindmap,
        sort_order,
        archived_at,
        archived_by,
        archived_reason
      ) VALUES (
        section_item ->> 'section_id',
        NULLIF(btrim(section_item ->> 'stable_key'), ''),
        payload_topic_id,
        section_item ->> 'title',
        NULLIF(section_item ->> 'content_markdown', ''),
        COALESCE(section_item -> 'callouts', '[]'::jsonb),
        COALESCE(section_item -> 'mnemonics', '[]'::jsonb),
        COALESCE(section_item -> 'flashcards', '[]'::jsonb),
        NULLIF(section_item ->> 'mermaid_mindmap', ''),
        section_position - 1,
        NULL,
        NULL,
        NULL
      )
      ON CONFLICT (section_id) DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        title = EXCLUDED.title,
        content_markdown = EXCLUDED.content_markdown,
        callouts = EXCLUDED.callouts,
        mnemonics = EXCLUDED.mnemonics,
        flashcards = EXCLUDED.flashcards,
        mermaid_mindmap = EXCLUDED.mermaid_mindmap,
        sort_order = EXCLUDED.sort_order,
        archived_at = NULL,
        archived_by = NULL,
        archived_reason = NULL
      RETURNING content_unit_id INTO section_content_unit_id;
    END IF;

    incoming_content_unit_ids := array_append(
      incoming_content_unit_ids,
      section_content_unit_id
    );
  END LOOP;

  WITH archived_units AS (
    UPDATE public.sections
    SET
      archived_at = now(),
      archived_by = auth.uid(),
      archived_reason = archive_reason
    WHERE topic_id = payload_topic_id
      AND archived_at IS NULL
      AND NOT (content_unit_id = ANY (incoming_content_unit_ids))
    RETURNING content_unit_id
  )
  UPDATE public.user_text_highlights AS highlight
  SET migration_status = 'orphaned'
  WHERE highlight.content_unit_id IN (
    SELECT archived.content_unit_id FROM archived_units AS archived
  )
    AND highlight.migration_status NOT IN ('migrated', 'orphaned');

  RETURN manifest_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_content_import(JSONB, JSONB, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_content_import(JSONB, JSONB, TEXT, TEXT)
TO service_role;

CREATE OR REPLACE FUNCTION public.archive_content_section(
  p_section_id TEXT,
  p_reason TEXT DEFAULT 'archived by content lifecycle'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows INTEGER;
  archived_content_unit_id UUID;
BEGIN
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'p_reason e obrigatorio' USING ERRCODE = '22023';
  END IF;

  UPDATE public.sections
  SET
    archived_at = COALESCE(archived_at, now()),
    archived_by = COALESCE(archived_by, auth.uid()),
    archived_reason = p_reason
  WHERE section_id = p_section_id
    AND archived_at IS NULL
  RETURNING content_unit_id INTO archived_content_unit_id;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF archived_content_unit_id IS NOT NULL THEN
    UPDATE public.user_text_highlights
    SET migration_status = 'orphaned'
    WHERE content_unit_id = archived_content_unit_id
      AND migration_status NOT IN ('migrated', 'orphaned');
  END IF;

  RETURN affected_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_content_topic(
  p_topic_id TEXT,
  p_reason TEXT DEFAULT 'archived by content lifecycle'
)
RETURNS TABLE(topic_archived BOOLEAN, sections_archived INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  topic_rows INTEGER;
  section_rows INTEGER;
  archived_content_unit_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'p_reason e obrigatorio' USING ERRCODE = '22023';
  END IF;

  UPDATE public.topics
  SET
    archived_at = COALESCE(archived_at, now()),
    archived_by = COALESCE(archived_by, auth.uid()),
    archived_reason = p_reason
  WHERE topic_id = p_topic_id
    AND archived_at IS NULL;
  GET DIAGNOSTICS topic_rows = ROW_COUNT;

  WITH archived_units AS (
    UPDATE public.sections
    SET
      archived_at = COALESCE(archived_at, now()),
      archived_by = COALESCE(archived_by, auth.uid()),
      archived_reason = p_reason
    WHERE topic_id = p_topic_id
      AND archived_at IS NULL
    RETURNING content_unit_id
  )
  SELECT
    COALESCE(array_agg(content_unit_id), ARRAY[]::UUID[]),
    count(*)::INTEGER
  INTO archived_content_unit_ids, section_rows
  FROM archived_units;

  UPDATE public.user_text_highlights
  SET migration_status = 'orphaned'
  WHERE content_unit_id = ANY (archived_content_unit_ids)
    AND migration_status NOT IN ('migrated', 'orphaned');

  IF topic_rows = 0 AND NOT EXISTS (
    SELECT 1 FROM public.topics WHERE topic_id = p_topic_id
  ) THEN
    RAISE EXCEPTION 'topic_id inexistente: %', p_topic_id USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY SELECT topic_rows = 1, section_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_content_section(TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.archive_content_topic(TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_content_section(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.archive_content_topic(TEXT, TEXT) TO service_role;

ALTER TABLE public.content_change_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_unit_revisions ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.content_change_manifests,
  public.content_unit_revisions
FROM anon, authenticated;

COMMENT ON COLUMN public.sections.content_unit_id IS
  'UUID permanente da unidade semantica; nunca deve ser reutilizado ou alterado';
COMMENT ON COLUMN public.sections.stable_key IS
  'Chave semantica permanente e unica dentro do topico, independente da ordem visual';
COMMENT ON COLUMN public.user_text_highlights.migration_status IS
  'Estado da ancora apos revisoes: active, migrated, orphaned ou needs_review';
