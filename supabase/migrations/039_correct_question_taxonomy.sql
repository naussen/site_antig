-- Revisão editorial de 25/10/2026: decisões individuais em content/questions/taxonomy-review-20261025.json.
-- Só corrige relações inequívocas; retém itens sem tópico seguro sem apagar gabaritos/tentativas.
CREATE TEMP TABLE question_taxonomy_fixes (external_id text PRIMARY KEY, from_discipline text NOT NULL, from_topic text NOT NULL, to_discipline text NOT NULL, to_topic text NOT NULL) ON COMMIT DROP;
INSERT INTO question_taxonomy_fixes VALUES
  ('pdf:agente_administrativo:028', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:agente_administrativo:029', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:agente_administrativo:030', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:agente_de_policia_federal:055', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:agente_de_policia_federal:059', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:agente_de_policia_federal:060', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:analista_administrativo:116', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:analista_ambiental_conhec_especi:071', 'portugues', 'outros-topicos', 'direito-ambiental', 'codigo-florestal-lei-12651'),
  ('pdf:analista_ambiental_conhec_especi:072', 'portugues', 'outros-topicos', 'direito-ambiental', 'codigo-florestal-lei-12651'),
  ('pdf:analista_ambiental_conhec_especi:075', 'portugues', 'outros-topicos', 'direito-ambiental', 'codigo-florestal-lei-12651'),
  ('pdf:analista_ambiental_conhec_especi:087', 'portugues', 'outros-topicos', 'direito-ambiental', 'crimes-ambientais-lei-9605'),
  ('pdf:analista_ambiental_conhec_especi:090', 'portugues', 'outros-topicos', 'direito-ambiental', 'licenciamento-ambiental-e-responsabilidade-ambiental'),
  ('pdf:analista_ambiental_conhec_especi:093', 'portugues', 'outros-topicos', 'direito-ambiental', 'sistema-nacional-de-unidades-de-conservacao-snuc'),
  ('pdf:analista_ambiental_conhec_especi:094', 'portugues', 'outros-topicos', 'direito-ambiental', 'sistema-nacional-de-unidades-de-conservacao-snuc'),
  ('pdf:assistente_administrativo:011', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:assistente_administrativo:013', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:assistente_administrativo:032', 'portugues', 'outros-topicos', 'direito-administrativo', 'lei-de-acesso-a-informacao-lai-lei-12527'),
  ('pdf:assistente_administrativo:037', 'portugues', 'outros-topicos', 'administracao-geral', 'teorias-da-administracao-e-das-organizacoes'),
  ('pdf:assistente_administrativo:038', 'portugues', 'outros-topicos', 'administracao-geral', 'teorias-da-administracao-e-das-organizacoes'),
  ('pdf:assistente_administrativo:040', 'portugues', 'outros-topicos', 'administracao-geral', 'organizacao'),
  ('pdf:assistente_administrativo:041', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-de-pessoas-e-desenvolvimento-organizacional'),
  ('pdf:assistente_administrativo:042', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-do-desempenho'),
  ('pdf:assistente_administrativo:043', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-da-qualidade'),
  ('pdf:assistente_administrativo:044', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-da-qualidade'),
  ('pdf:assistente_administrativo:045', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-da-qualidade'),
  ('pdf:assistente_administrativo:046', 'portugues', 'outros-topicos', 'direito-administrativo', 'disposicoes-gerais'),
  ('pdf:assistente_administrativo:047', 'portugues', 'outros-topicos', 'direito-administrativo', 'disposicoes-gerais'),
  ('pdf:assistente_administrativo:048', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-por-processos'),
  ('pdf:assistente_administrativo:049', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-por-processos'),
  ('pdf:assistente_administrativo:050', 'portugues', 'outros-topicos', 'administracao-geral', 'gestao-por-processos'),
  ('pdf:cargo30:054', 'portugues', 'outros-topicos', 'portugues', 'redacao-oficial'),
  ('pdf:conheci_basicos_superior:044', 'portugues', 'outros-topicos', 'direito-administrativo', 'regime-juridico-dos-servidores-lei-8112'),
  ('pdf:conheci_basicos_superior:047', 'portugues', 'outros-topicos', 'direito-administrativo', 'lei-de-acesso-a-informacao-lai-lei-12527'),
  ('pdf:policial_rodoviario_federal:027', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:policial_rodoviario_federal:028', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:policial_rodoviario_federal:030', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:policial_rodoviario_federal:031', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:prova_conhec_basicos_tec_federal_control_exter_tec_adm:012', 'portugues', 'outros-topicos', 'portugues', 'compreensao-e-interpretacao-de-textos'),
  ('pdf:prova_conhec_basicos_tec_federal_control_exter_tec_adm:013', 'portugues', 'outros-topicos', 'portugues', 'compreensao-e-interpretacao-de-textos'),
  ('pdf:prova_conhec_basicos_tec_federal_control_exter_tec_adm:018', 'portugues', 'outros-topicos', 'portugues', 'semantica-e-significacao-das-palavras'),
  ('pdf:prova_conhec_basicos_tec_federal_control_exter_tec_adm:020', 'portugues', 'outros-topicos', 'portugues', 'semantica-e-significacao-das-palavras'),
  ('pdf:tecnico_do_ministerio_publico_area_administrativa:034', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:tecnico_do_ministerio_publico_area_administrativa:036', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'matematica'),
  ('pdf:tecnico_do_ministerio_publico_area_administrativa:038', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:tecnico_do_ministerio_publico_area_administrativa:040', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:tecnico_em_enfermagem:011', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico'),
  ('pdf:tecnico_em_enfermagem:013', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'estatistica', 'raciocinio-logico-matematica-estatistica-e-matematica-financeira', 'raciocinio-logico');
CREATE TEMP TABLE question_taxonomy_holds (external_id text PRIMARY KEY, from_discipline text NOT NULL, from_topic text NOT NULL) ON COMMIT DROP;
INSERT INTO question_taxonomy_holds VALUES
  ('pdf:analista_ambiental_conhec_especi:067', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:073', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:077', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:079', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:082', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:083', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:084', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:085', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:086', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:088', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:089', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:098', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:099', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:100', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:104', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:106', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:107', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:109', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:110', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:111', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:112', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:113', 'portugues', 'outros-topicos'),
  ('pdf:analista_ambiental_conhec_especi:115', 'portugues', 'outros-topicos'),
  ('pdf:assistente_administrativo:034', 'portugues', 'outros-topicos'),
  ('pdf:assistente_administrativo:035', 'portugues', 'outros-topicos'),
  ('pdf:assistente_administrativo:036', 'portugues', 'outros-topicos'),
  ('pdf:conheci_basicos_superior:042', 'portugues', 'outros-topicos'),
  ('pdf:conheci_basicos_superior:043', 'portugues', 'outros-topicos'),
  ('pdf:conheci_basicos_superior:050', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:041', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:042', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:043', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:044', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:045', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:046', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:047', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:048', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:049', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:050', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:051', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:053', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:054', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:055', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:056', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:057', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:058', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:059', 'portugues', 'outros-topicos'),
  ('pdf:tecnico_em_enfermagem:060', 'portugues', 'outros-topicos');
DO $$
DECLARE observed integer;
BEGIN
  SELECT count(*) INTO observed FROM question_taxonomy_fixes;
  IF observed <> 47 OR (SELECT count(*) FROM question_taxonomy_holds) <> 48 THEN RAISE EXCEPTION 'taxonomy review inventory mismatch'; END IF;
  IF EXISTS (SELECT 1 FROM question_taxonomy_fixes f JOIN question_taxonomy_holds h USING (external_id)) THEN RAISE EXCEPTION 'taxonomy review overlapping decisions'; END IF;
  SELECT count(*) INTO observed FROM (SELECT external_id,from_discipline,from_topic FROM question_taxonomy_fixes UNION ALL SELECT external_id,from_discipline,from_topic FROM question_taxonomy_holds) decisions
    JOIN public.questions q USING (external_id)
    JOIN public.question_discipline_relations qdr ON qdr.question_id=q.id AND qdr.is_primary
    JOIN public.disciplines d ON d.id=qdr.discipline_id AND d.slug=decisions.from_discipline
    JOIN public.question_topic_relations qtr ON qtr.question_id=q.id AND qtr.relation_type='primary' AND qtr.topic_id=decisions.from_topic
    WHERE q.status='published';
  IF observed <> 95 THEN RAISE EXCEPTION 'taxonomy review source state mismatch: %', observed; END IF;
  IF EXISTS (SELECT 1 FROM question_taxonomy_fixes f LEFT JOIN public.disciplines d ON d.slug=f.to_discipline AND d.status='active' LEFT JOIN public.topics t ON t.topic_id=f.to_topic AND t.archived_at IS NULL LEFT JOIN public.topic_discipline_relations tdr ON tdr.topic_id=t.topic_id AND tdr.discipline_id=d.id WHERE d.id IS NULL OR t.topic_id IS NULL OR tdr.topic_id IS NULL) THEN RAISE EXCEPTION 'taxonomy review target missing or inactive'; END IF;
  IF EXISTS (SELECT 1 FROM question_taxonomy_fixes f JOIN public.questions q USING (external_id) WHERE (SELECT count(*) FROM public.question_discipline_relations d WHERE d.question_id=q.id) <> 1 OR (SELECT count(*) FROM public.question_topic_relations t WHERE t.question_id=q.id) <> 1) THEN RAISE EXCEPTION 'taxonomy review has multiple relations'; END IF;
END;
$$;
UPDATE public.question_discipline_relations qdr SET discipline_id=d.id FROM question_taxonomy_fixes f JOIN public.questions q ON q.external_id=f.external_id JOIN public.disciplines d ON d.slug=f.to_discipline WHERE qdr.question_id=q.id AND qdr.is_primary AND f.from_discipline<>f.to_discipline;
UPDATE public.question_topic_relations qtr SET topic_id=f.to_topic FROM question_taxonomy_fixes f JOIN public.questions q ON q.external_id=f.external_id WHERE qtr.question_id=q.id AND qtr.relation_type='primary';
UPDATE public.questions q SET subject=t.title,updated_at=now() FROM question_taxonomy_fixes f JOIN public.topics t ON t.topic_id=f.to_topic WHERE q.external_id=f.external_id;
UPDATE public.questions q SET status='archived',updated_at=now() FROM question_taxonomy_holds h WHERE q.external_id=h.external_id;
DO $$
DECLARE fixed integer; held integer;
BEGIN
  SELECT count(*) INTO fixed FROM question_taxonomy_fixes f JOIN public.questions q USING (external_id) JOIN public.question_discipline_relations qdr ON qdr.question_id=q.id AND qdr.is_primary JOIN public.disciplines d ON d.id=qdr.discipline_id AND d.slug=f.to_discipline JOIN public.question_topic_relations qtr ON qtr.question_id=q.id AND qtr.relation_type='primary' AND qtr.topic_id=f.to_topic JOIN public.topics t ON t.topic_id=qtr.topic_id WHERE q.status='published' AND q.subject=t.title;
  SELECT count(*) INTO held FROM question_taxonomy_holds h JOIN public.questions q USING (external_id) WHERE q.status='archived';
  IF fixed<>47 OR held<>48 THEN RAISE EXCEPTION 'taxonomy review final state mismatch: % fixes, % holds',fixed,held; END IF;
END;
$$;
