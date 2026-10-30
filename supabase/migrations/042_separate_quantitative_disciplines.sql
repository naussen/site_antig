-- Migration 042: Separação das disciplinas quantitativas do PROQuestões
-- Escopo restrito: Matemática, Raciocínio Lógico, Estatística e Matemática Financeira.

DO $$
DECLARE
  v_old_disc_id UUID;
  v_mat_id UUID;
  v_rl_id UUID;
  v_est_id UUID;
  v_mf_id UUID;
  v_remaining_questions INT;
BEGIN
  -- 1. Pré-condição: Identificar disciplina composta legada
  SELECT id INTO v_old_disc_id
  FROM public.disciplines
  WHERE slug = 'raciocinio-logico-matematica-estatistica-e-matematica-financeira';

  IF v_old_disc_id IS NULL THEN
    RAISE NOTICE 'Disciplina composta legada não encontrada ou já arquivada.';
  END IF;

  -- 2. Garantir a existência e status ativo das 4 disciplinas canônicas
  INSERT INTO public.disciplines (id, slug, name, status)
  VALUES
    (gen_random_uuid(), 'matematica', 'Matemática', 'active'),
    (gen_random_uuid(), 'raciocinio-logico', 'Raciocínio Lógico', 'active'),
    (gen_random_uuid(), 'estatistica', 'Estatística', 'active'),
    (gen_random_uuid(), 'matematica-financeira', 'Matemática Financeira', 'active')
  ON CONFLICT (slug) DO UPDATE
  SET status = 'active', name = EXCLUDED.name;

  SELECT id INTO v_mat_id FROM public.disciplines WHERE slug = 'matematica';
  SELECT id INTO v_rl_id FROM public.disciplines WHERE slug = 'raciocinio-logico';
  SELECT id INTO v_est_id FROM public.disciplines WHERE slug = 'estatistica';
  SELECT id INTO v_mf_id FROM public.disciplines WHERE slug = 'matematica-financeira';

  IF v_mat_id IS NULL OR v_rl_id IS NULL OR v_est_id IS NULL OR v_mf_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao resolver UUIDs das disciplinas quantitativas de destino';
  END IF;

  -- 3. Atualizar metadados legados dos tópicos na tabela topics
  UPDATE public.topics
  SET discipline = 'Matemática'
  WHERE topic_id = 'matematica' AND (discipline IS DISTINCT FROM 'Matemática' OR archived_at IS NOT NULL);

  UPDATE public.topics
  SET discipline = 'Raciocínio Lógico'
  WHERE topic_id = 'raciocinio-logico' AND (discipline IS DISTINCT FROM 'Raciocínio Lógico' OR archived_at IS NOT NULL);

  UPDATE public.topics
  SET discipline = 'Estatística'
  WHERE topic_id = 'estatistica' AND (discipline IS DISTINCT FROM 'Estatística' OR archived_at IS NOT NULL);

  UPDATE public.topics
  SET discipline = 'Matemática Financeira'
  WHERE topic_id = 'matematica-financeira' AND (discipline IS DISTINCT FROM 'Matemática Financeira' OR archived_at IS NOT NULL);

  -- 4. Atualizar relações tópicos-disciplinas (topic_discipline_relations)
  -- Remove o vínculo antigo com a disciplina composta para evitar conflito no índice idx_topic_discipline_one_primary
  IF v_old_disc_id IS NOT NULL THEN
    DELETE FROM public.topic_discipline_relations
    WHERE discipline_id = v_old_disc_id
      AND topic_id IN ('matematica', 'raciocinio-logico', 'estatistica', 'matematica-financeira');
  END IF;

  -- Vincula os 4 tópicos às suas disciplinas canônicas como primários
  INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
  VALUES
    ('matematica', v_mat_id, true),
    ('raciocinio-logico', v_rl_id, true),
    ('estatistica', v_est_id, true),
    ('matematica-financeira', v_mf_id, true)
  ON CONFLICT (topic_id, discipline_id) DO UPDATE
  SET is_primary = true;

  -- 5. Reclassificar as questões afetadas em question_discipline_relations
  IF v_old_disc_id IS NOT NULL THEN
    -- Matemática
    UPDATE public.question_discipline_relations qdr
    SET discipline_id = v_mat_id
    FROM public.question_topic_relations qtr
    WHERE qdr.discipline_id = v_old_disc_id
      AND qdr.question_id = qtr.question_id
      AND qtr.relation_type = 'primary'
      AND qtr.topic_id = 'matematica';

    -- Raciocínio Lógico
    UPDATE public.question_discipline_relations qdr
    SET discipline_id = v_rl_id
    FROM public.question_topic_relations qtr
    WHERE qdr.discipline_id = v_old_disc_id
      AND qdr.question_id = qtr.question_id
      AND qtr.relation_type = 'primary'
      AND qtr.topic_id = 'raciocinio-logico';

    -- Estatística
    UPDATE public.question_discipline_relations qdr
    SET discipline_id = v_est_id
    FROM public.question_topic_relations qtr
    WHERE qdr.discipline_id = v_old_disc_id
      AND qdr.question_id = qtr.question_id
      AND qtr.relation_type = 'primary'
      AND qtr.topic_id = 'estatistica';

    -- Matemática Financeira
    UPDATE public.question_discipline_relations qdr
    SET discipline_id = v_mf_id
    FROM public.question_topic_relations qtr
    WHERE qdr.discipline_id = v_old_disc_id
      AND qdr.question_id = qtr.question_id
      AND qtr.relation_type = 'primary'
      AND qtr.topic_id = 'matematica-financeira';

    -- 6. Validação de integridade pós-reclassificação
    SELECT COUNT(*) INTO v_remaining_questions
    FROM public.question_discipline_relations
    WHERE discipline_id = v_old_disc_id;

    IF v_remaining_questions > 0 THEN
      RAISE EXCEPTION 'Ainda restam % questões vinculadas à disciplina composta legada!', v_remaining_questions;
    END IF;

    -- 7. Arquivar a disciplina composta legada
    UPDATE public.disciplines
    SET status = 'archived'
    WHERE id = v_old_disc_id;
  END IF;

  RAISE NOTICE 'Separação quantitativa concluída com sucesso.';
END $$;
