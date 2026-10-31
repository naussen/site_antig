-- =============================================================================
-- Migration 045: Funcoes atomicas transacionais para aplicacao e rollback
-- de patches de explicacoes (com pre-condicao estrita de hash e protecao contra concorrência)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_atomic_explanation_patches(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_variable
DECLARE
  v_atomic_unit TEXT;
  v_patches JSONB;
  v_patch JSONB;
  v_patch_count INTEGER;
  v_idx INTEGER;
  v_question_id UUID;
  v_expected_exp_hash TEXT;
  v_expected_stmt_hash TEXT;
  v_new_body TEXT;
  v_reason TEXT;
  
  v_q_rec RECORD;
  v_exp_rec RECORD;
  v_curr_exp_hash TEXT;
  v_curr_stmt_hash TEXT;
  v_new_exp_hash TEXT;
  
  v_results JSONB := '[]'::jsonb;
  v_item_result JSONB;
  v_has_failure BOOLEAN := false;
  v_failure_message TEXT;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'O payload deve ser um objeto JSON' USING ERRCODE = '22023';
  END IF;

  v_atomic_unit := coalesce(p_payload->>'atomic_unit', 'batch');
  IF v_atomic_unit NOT IN ('batch', 'individual') THEN
    RAISE EXCEPTION 'atomic_unit deve ser "batch" ou "individual"' USING ERRCODE = '22023';
  END IF;

  v_patches := p_payload->'patches';
  IF jsonb_typeof(v_patches) <> 'array' THEN
    RAISE EXCEPTION 'O campo "patches" deve ser um array JSON' USING ERRCODE = '22023';
  END IF;

  v_patch_count := jsonb_array_length(v_patches);
  IF v_patch_count < 1 OR v_patch_count > 1000 THEN
    RAISE EXCEPTION 'A quantidade de patches deve estar entre 1 e 1000' USING ERRCODE = '22023';
  END IF;

  FOR v_idx IN 0 .. (v_patch_count - 1) LOOP
    v_patch := v_patches->v_idx;
    
    BEGIN
      v_question_id := (v_patch->>'question_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_has_failure := true;
      v_failure_message := format('Item %s: question_id invalido', v_idx);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'index', v_idx,
          'status', 'failed',
          'error_code', 'invalid_uuid',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END;

    v_expected_exp_hash := v_patch->>'expected_explanation_sha256';
    IF v_expected_exp_hash IS NULL OR v_expected_exp_hash !~ '^[a-f0-9]{64}$' THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): expected_explanation_sha256 ausente ou invalido', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'invalid_expected_hash',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_new_body := v_patch->>'new_body_markdown';
    IF v_new_body IS NULL OR btrim(v_new_body) = '' THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): new_body_markdown nao pode ser vazio', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'empty_body',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_expected_stmt_hash := v_patch->>'expected_statement_sha256';
    v_reason := coalesce(v_patch->>'reason', '');

    -- 1. Bloqueio e conferencia da questao
    SELECT id, statement_markdown, status, source_content_hash
    INTO v_q_rec
    FROM public.questions
    WHERE id = v_question_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_failure := true;
      v_failure_message := format('Item %s: questao %s nao encontrada', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0002';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'question_not_found',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    -- Conferencia opcional do enunciado
    IF v_expected_stmt_hash IS NOT NULL AND v_expected_stmt_hash ~ '^[a-f0-9]{64}$' THEN
      v_curr_stmt_hash := encode(extensions.digest(convert_to(coalesce(v_q_rec.statement_markdown, ''), 'UTF8'), 'sha256'), 'hex');
      IF v_curr_stmt_hash <> v_expected_stmt_hash THEN
        v_has_failure := true;
        v_failure_message := format('Item %s (%s): enunciado sofreu alteracao concorrente. Esperado: %s, Atual: %s',
                                    v_idx, v_question_id, v_expected_stmt_hash, v_curr_stmt_hash);
        IF v_atomic_unit = 'batch' THEN
          RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0001';
        ELSE
          v_results := v_results || jsonb_build_object(
            'question_id', v_question_id,
            'status', 'failed',
            'error_code', 'statement_hash_mismatch',
            'error_message', v_failure_message
          );
          CONTINUE;
        END IF;
      END IF;
    END IF;

    -- 2. Bloqueio e conferencia da explicacao atual
    SELECT question_id, body_markdown, status, source_reference
    INTO v_exp_rec
    FROM public.question_explanations
    WHERE question_id = v_question_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_failure := true;
      v_failure_message := format('Item %s: explicacao para questao %s nao encontrada', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0002';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'explanation_not_found',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_curr_exp_hash := encode(extensions.digest(convert_to(coalesce(v_exp_rec.body_markdown, ''), 'UTF8'), 'sha256'), 'hex');
    IF v_curr_exp_hash <> v_expected_exp_hash THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): explicacao sofreu alteracao concorrente. Esperado: %s, Atual: %s',
                                  v_idx, v_question_id, v_expected_exp_hash, v_curr_exp_hash);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0001';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'explanation_hash_mismatch',
          'error_message', v_failure_message,
          'current_sha256', v_curr_exp_hash,
          'expected_sha256', v_expected_exp_hash
        );
        CONTINUE;
      END IF;
    END IF;

    -- 3. Gravacao atomica
    UPDATE public.question_explanations
    SET body_markdown = v_new_body,
        updated_at = now()
    WHERE question_id = v_question_id;

    IF NOT FOUND THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): zero linhas afetadas no UPDATE', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0001';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'zero_rows_updated',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_new_exp_hash := encode(extensions.digest(convert_to(v_new_body, 'UTF8'), 'sha256'), 'hex');

    v_results := v_results || jsonb_build_object(
      'question_id', v_question_id,
      'status', 'applied',
      'previous_sha256', v_curr_exp_hash,
      'new_sha256', v_new_exp_hash,
      'reason', v_reason,
      'applied_at', now()
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', NOT v_has_failure OR v_atomic_unit = 'individual',
    'atomic_unit', v_atomic_unit,
    'total_patches', v_patch_count,
    'applied_count', jsonb_array_length(v_results),
    'results', v_results
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_atomic_explanation_patches(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_variable
DECLARE
  v_atomic_unit TEXT;
  v_items JSONB;
  v_item JSONB;
  v_item_count INTEGER;
  v_idx INTEGER;
  v_question_id UUID;
  v_applied_hash TEXT;
  v_restore_body TEXT;
  v_reason TEXT;
  
  v_exp_rec RECORD;
  v_curr_exp_hash TEXT;
  v_restored_exp_hash TEXT;
  
  v_results JSONB := '[]'::jsonb;
  v_has_failure BOOLEAN := false;
  v_failure_message TEXT;
BEGIN
  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'O payload deve ser um objeto JSON' USING ERRCODE = '22023';
  END IF;

  v_atomic_unit := coalesce(p_payload->>'atomic_unit', 'batch');
  IF v_atomic_unit NOT IN ('batch', 'individual') THEN
    RAISE EXCEPTION 'atomic_unit deve ser "batch" ou "individual"' USING ERRCODE = '22023';
  END IF;

  v_items := p_payload->'items';
  IF jsonb_typeof(v_items) <> 'array' THEN
    RAISE EXCEPTION 'O campo "items" deve ser um array JSON' USING ERRCODE = '22023';
  END IF;

  v_item_count := jsonb_array_length(v_items);
  IF v_item_count < 1 OR v_item_count > 1000 THEN
    RAISE EXCEPTION 'A quantidade de itens deve estar entre 1 e 1000' USING ERRCODE = '22023';
  END IF;

  FOR v_idx IN 0 .. (v_item_count - 1) LOOP
    v_item := v_items->v_idx;

    BEGIN
      v_question_id := (v_item->>'question_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_has_failure := true;
      v_failure_message := format('Item %s: question_id invalido', v_idx);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'index', v_idx,
          'status', 'failed',
          'error_code', 'invalid_uuid',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END;

    v_applied_hash := v_item->>'applied_sha256';
    IF v_applied_hash IS NULL OR v_applied_hash !~ '^[a-f0-9]{64}$' THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): applied_sha256 ausente ou invalido', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'invalid_applied_hash',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_restore_body := v_item->>'restore_body_markdown';
    IF v_restore_body IS NULL OR btrim(v_restore_body) = '' THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): restore_body_markdown nao pode ser vazio', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = '22023';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'empty_restore_body',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_reason := coalesce(v_item->>'reason', '');

    -- Bloqueio da explicacao
    SELECT question_id, body_markdown, status, source_reference
    INTO v_exp_rec
    FROM public.question_explanations
    WHERE question_id = v_question_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_has_failure := true;
      v_failure_message := format('Item %s: explicacao para questao %s nao encontrada', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0002';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'explanation_not_found',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    -- Conferencia estrita: o estado atual no banco DEVE ser exatamente a versao que se pretende reverter!
    v_curr_exp_hash := encode(extensions.digest(convert_to(coalesce(v_exp_rec.body_markdown, ''), 'UTF8'), 'sha256'), 'hex');
    IF v_curr_exp_hash <> v_applied_hash THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): rollback abortado pois o estado atual (%s) nao coincide com a versao aplicada (%s). O registro pode ter sofrido edicao posterior legitima.',
                                  v_idx, v_question_id, v_curr_exp_hash, v_applied_hash);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0001';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'subsequent_edit_detected',
          'error_message', v_failure_message,
          'current_sha256', v_curr_exp_hash,
          'applied_sha256', v_applied_hash
        );
        CONTINUE;
      END IF;
    END IF;

    -- Restauracao atomica apenas do campo body_markdown e updated_at
    UPDATE public.question_explanations
    SET body_markdown = v_restore_body,
        updated_at = now()
    WHERE question_id = v_question_id;

    IF NOT FOUND THEN
      v_has_failure := true;
      v_failure_message := format('Item %s (%s): zero linhas afetadas no UPDATE de rollback', v_idx, v_question_id);
      IF v_atomic_unit = 'batch' THEN
        RAISE EXCEPTION '%', v_failure_message USING ERRCODE = 'P0001';
      ELSE
        v_results := v_results || jsonb_build_object(
          'question_id', v_question_id,
          'status', 'failed',
          'error_code', 'zero_rows_updated',
          'error_message', v_failure_message
        );
        CONTINUE;
      END IF;
    END IF;

    v_restored_exp_hash := encode(extensions.digest(convert_to(v_restore_body, 'UTF8'), 'sha256'), 'hex');

    v_results := v_results || jsonb_build_object(
      'question_id', v_question_id,
      'status', 'reverted',
      'previous_sha256', v_curr_exp_hash,
      'restored_sha256', v_restored_exp_hash,
      'reason', v_reason,
      'reverted_at', now()
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', NOT v_has_failure OR v_atomic_unit = 'individual',
    'atomic_unit', v_atomic_unit,
    'total_items', v_item_count,
    'reverted_count', jsonb_array_length(v_results),
    'results', v_results
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_atomic_explanation_patches(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_atomic_explanation_patches(JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.rollback_atomic_explanation_patches(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_atomic_explanation_patches(JSONB) TO service_role;
