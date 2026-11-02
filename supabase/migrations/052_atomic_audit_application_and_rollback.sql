-- =============================================================================
-- Migration 052: Funções transacionais no servidor para aplicação atômica
-- e reversão estritamente condicionada da auditoria editorial (TJSP 2021)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;

-- Função auxiliar privada para cálculo de hash SHA-256 compatível com Supabase e PGlite
CREATE OR REPLACE FUNCTION private.audit_sha256(p_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- 1. Tentar extensions.digest (padrão Supabase pgcrypto)
  BEGIN
    RETURN encode(extensions.digest(convert_to(coalesce(p_text, ''), 'UTF8'), 'sha256'), 'hex');
  EXCEPTION WHEN OTHERS THEN
    -- 2. Tentar public.digest (PGlite / extensões em public)
    BEGIN
      RETURN encode(public.digest(convert_to(coalesce(p_text, ''), 'UTF8'), 'sha256'), 'hex');
    EXCEPTION WHEN OTHERS THEN
      -- 3. Tentar sha256 nativo do PG14+ se disponível
      BEGIN
        RETURN encode(sha256(convert_to(coalesce(p_text, ''), 'UTF8')), 'hex');
      EXCEPTION WHEN OTHERS THEN
        -- 4. Fallback simples usando md5 se nenhuma extensão de criptografia existir
        RETURN md5(coalesce(p_text, ''));
      END;
    END;
  END;
END;
$$;

REVOKE ALL ON FUNCTION private.audit_sha256(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.audit_sha256(text) TO service_role;

-- =============================================================================
-- 1. public.apply_atomic_audit_fixes
-- Executa a aplicação editorial de 100 questões em uma única transação plpgsql.
-- Se houver qualquer erro em qualquer item, TODO o lote sofre rollback imediato.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.apply_atomic_audit_fixes(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions', 'private'
AS $$
#variable_conflict use_variable
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_item_count INTEGER;
  v_idx INTEGER;
  v_question_id UUID;
  v_ext_id TEXT;
  v_disposition TEXT;
  v_statement TEXT;
  v_subject TEXT;
  v_exam_board TEXT;
  v_exam_year SMALLINT;
  v_content_hash TEXT;
  v_metadata JSONB;
  v_options JSONB;
  v_opt JSONB;
  v_opt_count INTEGER;
  v_opt_idx INTEGER;
  v_opt_label TEXT;
  v_opt_body TEXT;
  v_opt_id UUID;
  v_correct_label TEXT;
  v_correct_opt_id UUID;
  v_exp_body TEXT;
  v_exp_source TEXT;
  v_target_topic_id TEXT;
  v_target_disc_id UUID;
  
  v_q_rec RECORD;
  v_results JSONB := '[]'::jsonb;
  v_ready_count INTEGER := 0;
  v_archived_count INTEGER := 0;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload deve ser um objeto JSON' USING ERRCODE = '22023';
  END IF;

  v_items := p_payload->'items';
  IF jsonb_typeof(v_items) <> 'array' THEN
    RAISE EXCEPTION 'Campo items deve ser um array JSON' USING ERRCODE = '22023';
  END IF;

  v_item_count := jsonb_array_length(v_items);
  IF v_item_count <> 100 THEN
    RAISE EXCEPTION 'A unidade transacional deste certame exige exatamente 100 itens. Recebidos: %', v_item_count USING ERRCODE = '22023';
  END IF;

  FOR v_idx IN 0 .. (v_item_count - 1) LOOP
    v_item := v_items->v_idx;
    v_question_id := (v_item->>'id')::uuid;
    v_ext_id := v_item->>'external_id';
    v_disposition := v_item->>'disposition';

    -- 1. Lock FOR UPDATE e conferência de integridade
    SELECT id, statement_markdown, status, source_content_hash, subject, exam_board, exam_year, published_at
    INTO v_q_rec
    FROM public.questions
    WHERE id = v_question_id AND external_id = v_ext_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Questão % (%) não encontrada no banco de dados', v_ext_id, v_question_id USING ERRCODE = 'P0002';
    END IF;

    IF v_disposition = 'archived' THEN
      -- A. TRATAMENTO DE QUESTÃO ANULADA
      v_metadata := v_item->'source_metadata';
      v_exp_body := v_item->>'explanation_body';
      v_exp_source := coalesce(v_item->>'explanation_source', 'Fundação Vunesp - Gabarito Oficial Definitivo pós-recursos');

      -- 1. Atualiza status para archived
      UPDATE public.questions
      SET status = 'archived',
          source_metadata = v_metadata,
          updated_at = now()
      WHERE id = v_question_id;

      -- 2. Remove gabarito em question_answer_keys para bloquear tentativas
      DELETE FROM public.question_answer_keys
      WHERE question_id = v_question_id;

      -- 3. Persiste explicação da anulação
      INSERT INTO public.question_explanations (question_id, body_markdown, source_reference, status, reviewed_at, updated_at)
      VALUES (v_question_id, v_exp_body, v_exp_source, 'published', now(), now())
      ON CONFLICT (question_id) DO UPDATE
      SET body_markdown = EXCLUDED.body_markdown,
          source_reference = EXCLUDED.source_reference,
          status = 'published',
          reviewed_at = now(),
          updated_at = now();

      v_archived_count := v_archived_count + 1;
      v_results := v_results || jsonb_build_object(
        'id', v_question_id,
        'external_id', v_ext_id,
        'disposition', 'archived',
        'status', 'archived'
      );

    ELSE
      -- B. TRATAMENTO DE QUESTÃO PRONTA PARA PUBLICAÇÃO
      v_statement := v_item->>'statement_markdown';
      v_subject := v_item->>'subject';
      v_exam_board := v_item->>'exam_board';
      v_exam_year := (v_item->>'exam_year')::smallint;
      v_content_hash := v_item->>'source_content_hash';
      v_metadata := v_item->'source_metadata';
      v_correct_label := v_item->>'correct_option_label';
      v_target_topic_id := v_item->>'target_topic_id';
      v_target_disc_id := (v_item->>'target_discipline_id')::uuid;
      v_exp_body := v_item->>'explanation_body';
      v_exp_source := coalesce(v_item->>'explanation_source', 'Fundação Vunesp - Gabarito Oficial Definitivo');

      -- 1. Validação taxonômica canônica
      IF NOT EXISTS (
        SELECT 1 FROM public.topics WHERE topic_id = v_target_topic_id AND archived_at IS NULL
      ) THEN
        RAISE EXCEPTION 'Tópico % inexistente ou arquivado para a questão %', v_target_topic_id, v_ext_id USING ERRCODE = '22023';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.disciplines WHERE id = v_target_disc_id AND status = 'active'
      ) THEN
        RAISE EXCEPTION 'Disciplina % inexistente ou inativa para a questão %', v_target_disc_id, v_ext_id USING ERRCODE = '22023';
      END IF;

      -- 2. Atualizar questions (garantindo published_at preenchido conforme check constraint)
      UPDATE public.questions
      SET statement_markdown = v_statement,
          subject = v_subject,
          exam_board = v_exam_board,
          exam_year = v_exam_year,
          status = 'published',
          published_at = coalesce(v_q_rec.published_at, now()),
          source_content_hash = v_content_hash,
          source_metadata = v_metadata,
          updated_at = now()
      WHERE id = v_question_id;

      -- 3. Atualizar question_options
      v_options := v_item->'options';
      v_opt_count := jsonb_array_length(v_options);
      v_correct_opt_id := NULL;

      FOR v_opt_idx IN 0 .. (v_opt_count - 1) LOOP
        v_opt := v_options->v_opt_idx;
        v_opt_label := v_opt->>'label';
        v_opt_body := v_opt->>'body_markdown';

        UPDATE public.question_options
        SET body_markdown = v_opt_body
        WHERE question_id = v_question_id AND label = v_opt_label
        RETURNING id INTO v_opt_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Opção % da questão % não encontrada no banco', v_opt_label, v_ext_id USING ERRCODE = 'P0002';
        END IF;

        IF v_opt_label = v_correct_label THEN
          v_correct_opt_id := v_opt_id;
        END IF;
      END LOOP;

      IF v_correct_opt_id IS NULL THEN
        RAISE EXCEPTION 'Opção correta % não foi identificada para a questão %', v_correct_label, v_ext_id USING ERRCODE = '22023';
      END IF;

      -- 4. Atualizar gabarito em question_answer_keys
      INSERT INTO public.question_answer_keys (question_id, correct_option_id, updated_at)
      VALUES (v_question_id, v_correct_opt_id, now())
      ON CONFLICT (question_id) DO UPDATE
      SET correct_option_id = EXCLUDED.correct_option_id,
          updated_at = now();

      -- 5. Atualizar explicação didática
      INSERT INTO public.question_explanations (question_id, body_markdown, source_reference, status, reviewed_at, updated_at)
      VALUES (v_question_id, v_exp_body, v_exp_source, 'published', now(), now())
      ON CONFLICT (question_id) DO UPDATE
      SET body_markdown = EXCLUDED.body_markdown,
          source_reference = EXCLUDED.source_reference,
          status = 'published',
          reviewed_at = now(),
          updated_at = now();

      -- 6. Reconciliar question_topic_relations (preserva relações não primárias)
      DELETE FROM public.question_topic_relations
      WHERE question_id = v_question_id AND relation_type = 'primary';

      INSERT INTO public.question_topic_relations (question_id, topic_id, relation_type, relevance, sort_order)
      VALUES (v_question_id, v_target_topic_id, 'primary', 100, 0);

      -- 7. Reconciliar question_discipline_relations (preserva relações não primárias)
      DELETE FROM public.question_discipline_relations
      WHERE question_id = v_question_id AND is_primary = true;

      INSERT INTO public.question_discipline_relations (question_id, discipline_id, is_primary)
      VALUES (v_question_id, v_target_disc_id, true);

      -- 8. Limpar subtópicos incompatíveis se houver
      DELETE FROM public.question_subtopic_relations qsr
      USING public.subtopics st
      WHERE qsr.question_id = v_question_id
        AND qsr.subtopic_id = st.id
        AND st.topic_id <> v_target_topic_id;

      v_ready_count := v_ready_count + 1;
      v_results := v_results || jsonb_build_object(
        'id', v_question_id,
        'external_id', v_ext_id,
        'disposition', 'published',
        'status', 'published',
        'topic_id', v_target_topic_id,
        'discipline_id', v_target_disc_id
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'applied',
    'total_processed', v_item_count,
    'ready_published', v_ready_count,
    'held_archived', v_archived_count,
    'applied_at', now(),
    'items', v_results
  );
END;
$$;


-- =============================================================================
-- 2. public.rollback_atomic_audit_fixes
-- Reverte as alterações atômicas exigindo correspondência estrita do estado atual
-- com a versão pós-aplicada. Se houver qualquer edição posterior em qualquer parte
-- (enunciado, comentário, gabarito, alternativas, status ou tópicos), aborta imediatamente.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rollback_atomic_audit_fixes(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions', 'private'
AS $$
#variable_conflict use_variable
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_item_count INTEGER;
  v_idx INTEGER;
  v_question_id UUID;
  v_ext_id TEXT;
  
  -- Pré-condições pós-aplicação que DEVEM coincidir para permitir o rollback
  v_expected_applied_stmt_hash TEXT;
  v_expected_applied_exp_hash TEXT;
  v_expected_applied_status TEXT;
  v_expected_applied_topic TEXT;
  v_expected_applied_correct_label TEXT;
  v_expected_applied_opts_hash TEXT;
  
  -- Estado original de restauração
  v_orig_q JSONB;
  v_orig_opts JSONB;
  v_orig_opt JSONB;
  v_orig_exp JSONB;
  v_orig_key JSONB;
  v_orig_d_rels JSONB;
  v_orig_t_rels JSONB;
  
  v_curr_q RECORD;
  v_curr_exp RECORD;
  v_curr_stmt_hash TEXT;
  v_curr_exp_hash TEXT;
  v_curr_primary_topic TEXT;
  v_curr_correct_label TEXT;
  v_curr_opts_hash TEXT;
  
  v_opt_idx INTEGER;
  v_rel_idx INTEGER;
  v_restored_count INTEGER := 0;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload de rollback deve ser um objeto JSON' USING ERRCODE = '22023';
  END IF;

  v_items := p_payload->'items';
  IF jsonb_typeof(v_items) <> 'array' THEN
    RAISE EXCEPTION 'Campo items de rollback deve ser um array JSON' USING ERRCODE = '22023';
  END IF;

  v_item_count := jsonb_array_length(v_items);
  IF v_item_count <> 100 THEN
    RAISE EXCEPTION 'Rollback atômico exige os 100 itens da unidade do certame. Recebidos: %', v_item_count USING ERRCODE = '22023';
  END IF;

  -- FASE 1: VERIFICAÇÃO ESTRITA DE PRÉ-CONDIÇÃO CONTRA ALTERAÇÕES CONCORRENTES/POSTERIORES
  FOR v_idx IN 0 .. (v_item_count - 1) LOOP
    v_item := v_items->v_idx;
    v_question_id := (v_item->>'question_id')::uuid;
    v_ext_id := v_item->>'external_id';

    v_expected_applied_stmt_hash := v_item->>'expected_applied_statement_sha256';
    v_expected_applied_exp_hash := v_item->>'expected_applied_explanation_sha256';
    v_expected_applied_status := v_item->>'expected_applied_status';
    v_expected_applied_topic := v_item->>'expected_applied_topic_id';
    v_expected_applied_correct_label := v_item->>'expected_applied_correct_option_label';
    v_expected_applied_opts_hash := v_item->>'expected_applied_options_sha256';

    -- Lock FOR UPDATE na questão
    SELECT id, statement_markdown, status, source_content_hash
    INTO v_curr_q
    FROM public.questions
    WHERE id = v_question_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % (%): questão não encontrada para rollback', v_ext_id, v_question_id USING ERRCODE = 'P0002';
    END IF;

    -- Concorrência / alteração posterior em status
    IF v_curr_q.status <> v_expected_applied_status THEN
      RAISE EXCEPTION 'Item % (%): rollback abortado. Status atual (%) difere do aplicado (%). Alteração posterior detectada.',
        v_ext_id, v_question_id, v_curr_q.status, v_expected_applied_status USING ERRCODE = 'P0001';
    END IF;

    -- Concorrência no statement_markdown
    v_curr_stmt_hash := private.audit_sha256(v_curr_q.statement_markdown);
    IF v_curr_stmt_hash <> v_expected_applied_stmt_hash THEN
      RAISE EXCEPTION 'Item % (%): rollback abortado. Enunciado atual difere da versão auditada aplicada. Alteração concorrente/posterior detectada.',
        v_ext_id, v_question_id USING ERRCODE = 'P0001';
    END IF;

    -- Concorrência nas opções
    IF v_expected_applied_opts_hash IS NOT NULL THEN
      SELECT private.audit_sha256(string_agg(label || ':' || body_markdown, '|' ORDER BY label))
      INTO v_curr_opts_hash
      FROM public.question_options
      WHERE question_id = v_question_id;

      IF v_curr_opts_hash <> v_expected_applied_opts_hash THEN
        RAISE EXCEPTION 'Item % (%): rollback abortado. Alternativas atuais diferem da versão auditada aplicada. Alteração posterior detectada.',
          v_ext_id, v_question_id USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Concorrência na explicação didática
    SELECT body_markdown INTO v_curr_exp
    FROM public.question_explanations
    WHERE question_id = v_question_id
    FOR UPDATE;

    v_curr_exp_hash := private.audit_sha256(v_curr_exp.body_markdown);
    IF v_expected_applied_exp_hash IS NOT NULL AND v_curr_exp_hash <> v_expected_applied_exp_hash THEN
      RAISE EXCEPTION 'Item % (%): rollback abortado. Comentário atual difere da versão auditada aplicada. Alteração posterior detectada.',
        v_ext_id, v_question_id USING ERRCODE = 'P0001';
    END IF;

    -- Concorrência no gabarito
    IF v_expected_applied_correct_label IS NOT NULL THEN
      SELECT o.label INTO v_curr_correct_label
      FROM public.question_answer_keys ak
      JOIN public.question_options o ON o.id = ak.correct_option_id
      WHERE ak.question_id = v_question_id;

      IF v_curr_correct_label IS DISTINCT FROM v_expected_applied_correct_label THEN
        RAISE EXCEPTION 'Item % (%): rollback abortado. Gabarito atual (%) difere do aplicado (%). Alteração posterior detectada.',
          v_ext_id, v_question_id, v_curr_correct_label, v_expected_applied_correct_label USING ERRCODE = 'P0001';
      END IF;
    END IF;

    -- Concorrência no tópico primário
    IF v_expected_applied_topic IS NOT NULL THEN
      SELECT topic_id INTO v_curr_primary_topic
      FROM public.question_topic_relations
      WHERE question_id = v_question_id AND relation_type = 'primary';

      IF v_curr_primary_topic <> v_expected_applied_topic THEN
        RAISE EXCEPTION 'Item % (%): rollback abortado. Tópico primário atual (%) difere do aplicado (%). Alteração posterior detectada.',
          v_ext_id, v_question_id, v_curr_primary_topic, v_expected_applied_topic USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END LOOP;

  -- FASE 2: RESTAURAÇÃO INTEGRAL DE TODAS AS TABELAS
  FOR v_idx IN 0 .. (v_item_count - 1) LOOP
    v_item := v_items->v_idx;
    v_question_id := (v_item->>'question_id')::uuid;

    v_orig_q := v_item->'original_question';
    v_orig_opts := v_item->'original_options';
    v_orig_exp := v_item->'original_explanation';
    v_orig_key := v_item->'original_answer_key';
    v_orig_d_rels := v_item->'original_discipline_relations';
    v_orig_t_rels := v_item->'original_topic_relations';

    -- 1. Restaurar questions
    UPDATE public.questions
    SET statement_markdown = v_orig_q->>'statement_markdown',
        subject = v_orig_q->>'subject',
        exam_board = v_orig_q->>'exam_board',
        exam_year = (v_orig_q->>'exam_year')::smallint,
        status = v_orig_q->>'status',
        published_at = (v_orig_q->>'published_at')::timestamptz,
        source_content_hash = v_orig_q->>'source_content_hash',
        source_metadata = v_orig_q->'source_metadata',
        updated_at = now()
    WHERE id = v_question_id;

    -- 2. Restaurar opções
    FOR v_opt_idx IN 0 .. (jsonb_array_length(v_orig_opts) - 1) LOOP
      v_orig_opt := v_orig_opts->v_opt_idx;
      UPDATE public.question_options
      SET body_markdown = v_orig_opt->>'body_markdown'
      WHERE id = (v_orig_opt->>'id')::uuid;
    END LOOP;

    -- 3. Restaurar explicação
    IF v_orig_exp IS NOT NULL AND jsonb_typeof(v_orig_exp) = 'object' THEN
      INSERT INTO public.question_explanations (question_id, body_markdown, source_reference, status, reviewed_at, updated_at)
      VALUES (
        v_question_id,
        v_orig_exp->>'body_markdown',
        v_orig_exp->>'source_reference',
        v_orig_exp->>'status',
        (v_orig_exp->>'reviewed_at')::timestamptz,
        now()
      )
      ON CONFLICT (question_id) DO UPDATE
      SET body_markdown = EXCLUDED.body_markdown,
        source_reference = EXCLUDED.source_reference,
        status = EXCLUDED.status,
        reviewed_at = EXCLUDED.reviewed_at,
        updated_at = now();
    ELSE
      DELETE FROM public.question_explanations WHERE question_id = v_question_id;
    END IF;

    -- 4. Restaurar question_answer_keys
    IF v_orig_key IS NOT NULL AND v_orig_key->>'correct_option_id' IS NOT NULL THEN
      INSERT INTO public.question_answer_keys (question_id, correct_option_id, updated_at)
      VALUES (v_question_id, (v_orig_key->>'correct_option_id')::uuid, now())
      ON CONFLICT (question_id) DO UPDATE
      SET correct_option_id = EXCLUDED.correct_option_id,
          updated_at = now();
    ELSE
      DELETE FROM public.question_answer_keys WHERE question_id = v_question_id;
    END IF;

    -- 5. Restaurar relações de disciplina
    DELETE FROM public.question_discipline_relations WHERE question_id = v_question_id;
    FOR v_rel_idx IN 0 .. (jsonb_array_length(v_orig_d_rels) - 1) LOOP
      INSERT INTO public.question_discipline_relations (question_id, discipline_id, is_primary)
      VALUES (
        v_question_id,
        (v_orig_d_rels->v_rel_idx->>'discipline_id')::uuid,
        (v_orig_d_rels->v_rel_idx->>'is_primary')::boolean
      );
    END LOOP;

    -- 6. Restaurar relações de tópico
    DELETE FROM public.question_topic_relations WHERE question_id = v_question_id;
    FOR v_rel_idx IN 0 .. (jsonb_array_length(v_orig_t_rels) - 1) LOOP
      INSERT INTO public.question_topic_relations (question_id, topic_id, relation_type, relevance, sort_order)
      VALUES (
        v_question_id,
        v_orig_t_rels->v_rel_idx->>'topic_id',
        v_orig_t_rels->v_rel_idx->>'relation_type',
        (v_orig_t_rels->v_rel_idx->>'relevance')::smallint,
        (v_orig_t_rels->v_rel_idx->>'sort_order')::smallint
      );
    END LOOP;

    v_restored_count := v_restored_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'reverted',
    'items_restored', v_restored_count,
    'reverted_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_atomic_audit_fixes(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_atomic_audit_fixes(JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.rollback_atomic_audit_fixes(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_atomic_audit_fixes(JSONB) TO service_role;
