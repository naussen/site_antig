-- Rollback da Migration 042: Separação das disciplinas quantitativas

DO $$
DECLARE
  v_old_disc_id UUID;
  v_mat_id UUID;
  v_rl_id UUID;
  v_est_id UUID;
  v_mf_id UUID;
BEGIN
  -- 1. Resolver disciplinas
  SELECT id INTO v_old_disc_id FROM public.disciplines WHERE slug = 'raciocinio-logico-matematica-estatistica-e-matematica-financeira';
  SELECT id INTO v_mat_id FROM public.disciplines WHERE slug = 'matematica';
  SELECT id INTO v_rl_id FROM public.disciplines WHERE slug = 'raciocinio-logico';
  SELECT id INTO v_est_id FROM public.disciplines WHERE slug = 'estatistica';
  SELECT id INTO v_mf_id FROM public.disciplines WHERE slug = 'matematica-financeira';

  IF v_old_disc_id IS NULL THEN
    RAISE EXCEPTION 'Disciplina composta não encontrada para rollback.';
  END IF;

  -- 2. Reativar disciplina composta legada
  UPDATE public.disciplines
  SET status = 'active'
  WHERE id = v_old_disc_id;

  -- 3. Reverter question_discipline_relations
  UPDATE public.question_discipline_relations
  SET discipline_id = v_old_disc_id
  WHERE discipline_id IN (v_mat_id, v_rl_id, v_est_id, v_mf_id);

  -- 4. Reverter topic_discipline_relations
  DELETE FROM public.topic_discipline_relations
  WHERE discipline_id IN (v_mat_id, v_rl_id, v_est_id, v_mf_id)
    AND topic_id IN ('matematica', 'raciocinio-logico', 'estatistica', 'matematica-financeira');

  INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
  VALUES
    ('matematica', v_old_disc_id, true),
    ('raciocinio-logico', v_old_disc_id, true),
    ('estatistica', v_old_disc_id, true),
    ('matematica-financeira', v_old_disc_id, true)
  ON CONFLICT (topic_id, discipline_id) DO UPDATE
  SET is_primary = true;

  -- 5. Reverter metadados legados em topics
  UPDATE public.topics
  SET discipline = 'Raciocínio Lógico, Matemática, Estatística e Matemática Financeira'
  WHERE topic_id IN ('matematica', 'raciocinio-logico', 'estatistica', 'matematica-financeira');

  RAISE NOTICE 'Rollback da separação quantitativa concluído com sucesso.';
END $$;
