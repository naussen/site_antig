-- =============================================================================
-- Migration 031: importacao atomica e rastreavel de questoes revisadas
--
-- O lote e validado pelo CLI antes de chegar ao banco. Esta funcao repete as
-- invariantes essenciais e grava todo o lote em uma unica transacao PostgreSQL.
-- =============================================================================

CREATE TABLE public.question_import_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_key        TEXT NOT NULL UNIQUE CHECK (
    batch_key = btrim(batch_key) AND batch_key ~ '^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$'
  ),
  schema_version   TEXT NOT NULL CHECK (schema_version = 'pro-questions/v1'),
  source_file      TEXT NOT NULL CHECK (
    source_file = btrim(source_file)
    AND source_file ~* '_ATUALIZADO\.json$'
    AND source_file !~ '[\\/]'
  ),
  source_sha256    TEXT NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  discipline_slug  TEXT NOT NULL REFERENCES public.disciplines(slug) ON DELETE RESTRICT,
  question_count   INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 1000),
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  imported_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.question_import_items (
  batch_id    UUID NOT NULL REFERENCES public.question_import_batches(id) ON DELETE RESTRICT,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  source_id   TEXT NOT NULL CHECK (source_id = btrim(source_id) AND char_length(source_id) BETWEEN 1 AND 160),
  action      TEXT NOT NULL CHECK (action IN ('inserted', 'reused')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, question_id),
  UNIQUE (batch_id, source_id)
);

ALTER TABLE public.questions
  ADD COLUMN source_content_hash TEXT CHECK (
    source_content_hash IS NULL OR source_content_hash ~ '^[a-f0-9]{64}$'
  ),
  ADD COLUMN source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(source_metadata) = 'object'
  );

CREATE INDEX idx_question_import_items_question
  ON public.question_import_items(question_id, batch_id);

ALTER TABLE public.question_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_import_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.question_import_batches,
  public.question_import_items
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT ON TABLE
  public.question_import_batches,
  public.question_import_items
TO service_role;

CREATE OR REPLACE FUNCTION public.import_questions_batch(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  batch_id UUID;
  existing_batch RECORD;
  discipline_id UUID;
  question JSONB;
  option JSONB;
  topic JSONB;
  question_id UUID;
  option_id UUID;
  existing_hash TEXT;
  question_action TEXT;
  inserted_count INTEGER := 0;
  reused_count INTEGER := 0;
  payload_count INTEGER;
  correct_label TEXT;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object'
     OR p_payload->>'schema_version' <> 'pro-questions/v1'
     OR jsonb_typeof(p_payload->'source') <> 'object'
     OR jsonb_typeof(p_payload->'discipline') <> 'object'
     OR jsonb_typeof(p_payload->'questions') <> 'array' THEN
    RAISE EXCEPTION 'invalid question batch envelope' USING ERRCODE = '22023';
  END IF;

  payload_count := jsonb_array_length(p_payload->'questions');
  IF payload_count NOT BETWEEN 1 AND 1000
     OR coalesce(p_payload->>'batch_key', '') !~ '^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$'
     OR coalesce(p_payload->'source'->>'file_name', '') !~* '_ATUALIZADO\.json$'
     OR (p_payload->'source'->>'file_name') ~ '[\\/]'
     OR coalesce(p_payload->'source'->>'sha256', '') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid question batch identity or source' USING ERRCODE = '22023';
  END IF;

  SELECT import_batch.* INTO existing_batch
  FROM public.question_import_batches AS import_batch
  WHERE import_batch.batch_key = p_payload->>'batch_key';

  IF FOUND THEN
    IF existing_batch.source_sha256 <> p_payload->'source'->>'sha256'
       OR existing_batch.question_count <> payload_count THEN
      RAISE EXCEPTION 'batch key already exists with different content' USING ERRCODE = '23505';
    END IF;

    RETURN jsonb_build_object(
      'batch_id', existing_batch.id,
      'inserted', 0,
      'reused', existing_batch.question_count,
      'idempotent_replay', true
    );
  END IF;

  INSERT INTO public.disciplines (slug, name, status)
  VALUES (
    p_payload->'discipline'->>'slug',
    p_payload->'discipline'->>'name',
    'active'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    status = 'active',
    updated_at = now()
  RETURNING id INTO discipline_id;

  INSERT INTO public.question_import_batches (
    batch_key,
    schema_version,
    source_file,
    source_sha256,
    discipline_slug,
    question_count,
    metadata
  ) VALUES (
    p_payload->>'batch_key',
    p_payload->>'schema_version',
    p_payload->'source'->>'file_name',
    p_payload->'source'->>'sha256',
    p_payload->'discipline'->>'slug',
    payload_count,
    coalesce(p_payload->'source'->'metadata', '{}'::jsonb)
  )
  RETURNING id INTO batch_id;

  FOR question IN SELECT value FROM jsonb_array_elements(p_payload->'questions')
  LOOP
    IF jsonb_typeof(question) <> 'object'
       OR coalesce(question->>'external_id', '') = ''
       OR coalesce(question->>'source_id', '') = ''
       OR coalesce(question->>'source_content_hash', '') !~ '^[a-f0-9]{64}$'
       OR question->>'question_type' NOT IN ('multiple_choice', 'true_false')
       OR coalesce(btrim(question->>'statement_markdown'), '') = ''
       OR coalesce(btrim(question->>'subject'), '') = ''
       OR jsonb_typeof(question->'options') <> 'array'
       OR jsonb_typeof(question->'topics') <> 'array'
       OR jsonb_array_length(question->'topics') < 1
       OR jsonb_typeof(question->'explanation') <> 'object' THEN
      RAISE EXCEPTION 'invalid question item in batch' USING ERRCODE = '22023';
    END IF;

    SELECT stored.id, stored.source_content_hash
    INTO question_id, existing_hash
    FROM public.questions AS stored
    WHERE stored.external_id = question->>'external_id';

    IF FOUND THEN
      IF existing_hash IS DISTINCT FROM question->>'source_content_hash' THEN
        RAISE EXCEPTION 'question % already exists with different content', question->>'external_id'
          USING ERRCODE = '23505';
      END IF;
      question_action := 'reused';
      reused_count := reused_count + 1;
    ELSE
      INSERT INTO public.questions (
        external_id,
        question_type,
        statement_markdown,
        subject,
        exam_board,
        institution,
        position_name,
        exam_year,
        difficulty,
        source_reference,
        source_content_hash,
        source_metadata,
        status
      ) VALUES (
        question->>'external_id',
        question->>'question_type',
        btrim(question->>'statement_markdown'),
        btrim(question->>'subject'),
        NULLIF(btrim(question->>'exam_board'), ''),
        NULLIF(btrim(question->>'institution'), ''),
        NULLIF(btrim(question->>'position_name'), ''),
        CASE WHEN question->>'exam_year' IS NULL THEN NULL ELSE (question->>'exam_year')::SMALLINT END,
        NULLIF(question->>'difficulty', ''),
        NULLIF(btrim(question->>'source_reference'), ''),
        question->>'source_content_hash',
        coalesce(question->'source_metadata', '{}'::jsonb),
        'draft'
      )
      RETURNING id INTO question_id;

      INSERT INTO public.question_discipline_relations (
        question_id, discipline_id, is_primary, sort_order
      ) VALUES (question_id, discipline_id, true, 0);

      FOR topic IN SELECT value FROM jsonb_array_elements(question->'topics')
      LOOP
        INSERT INTO public.question_topic_relations (
          question_id, topic_id, relation_type, relevance, sort_order
        ) VALUES (
          question_id,
          topic->>'topic_id',
          coalesce(topic->>'relation_type', 'primary'),
          coalesce((topic->>'relevance')::SMALLINT, 100),
          coalesce((topic->>'sort_order')::SMALLINT, 0)
        );
      END LOOP;

      FOR option IN SELECT value FROM jsonb_array_elements(question->'options')
      LOOP
        INSERT INTO public.question_options (
          question_id, label, body_markdown, sort_order
        ) VALUES (
          question_id,
          option->>'label',
          btrim(option->>'body_markdown'),
          (option->>'sort_order')::SMALLINT
        );
      END LOOP;

      correct_label := question->>'correct_option_label';
      SELECT stored_option.id INTO option_id
      FROM public.question_options AS stored_option
      WHERE stored_option.question_id = question_id
        AND stored_option.label = correct_label;

      IF option_id IS NULL THEN
        RAISE EXCEPTION 'correct option % was not found for %', correct_label, question->>'external_id'
          USING ERRCODE = '22023';
      END IF;

      INSERT INTO public.question_answer_keys (question_id, correct_option_id)
      VALUES (question_id, option_id);

      INSERT INTO public.question_explanations (
        question_id,
        body_markdown,
        source_reference,
        status,
        reviewed_at
      ) VALUES (
        question_id,
        btrim(question->'explanation'->>'body_markdown'),
        NULLIF(btrim(question->'explanation'->>'source_reference'), ''),
        'published',
        now()
      );

      UPDATE public.questions
      SET status = 'published', published_at = now(), updated_at = now()
      WHERE id = question_id;

      question_action := 'inserted';
      inserted_count := inserted_count + 1;
    END IF;

    INSERT INTO public.question_import_items (batch_id, question_id, source_id, action)
    VALUES (batch_id, question_id, question->>'source_id', question_action);
  END LOOP;

  RETURN jsonb_build_object(
    'batch_id', batch_id,
    'inserted', inserted_count,
    'reused', reused_count,
    'idempotent_replay', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_questions_batch(JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_questions_batch(JSONB)
  TO service_role;

COMMENT ON FUNCTION public.import_questions_batch(JSONB) IS
  'Importa lote pro-questions/v1 de forma atomica; uso exclusivo do service_role.';
