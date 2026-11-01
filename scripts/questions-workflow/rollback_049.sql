-- Rollback da Migration 047
-- Remove as relacoes de subtopicos das 105 questoes do censo expandido
-- e restaura os topicos anteriores.

DO $$
BEGIN
  -- Remover os subtopicos primarios vinculados das 105 questoes
  DELETE FROM public.question_subtopic_relations
  WHERE question_id IN (
    SELECT q.id FROM public.questions q
    WHERE q.external_id IN (
      'pdf:escriturario_agente_comercial:029',
      'exam:pmsp-2024-soldado-pbm:item:027',
      'exam:bb-2021-escriturario-agente-comercial:item:030',
      'pdf:analista_administrativo:094',
      'exam:pmsp-2024-soldado-pbm:item:030',
      'pdf:analista_administrativo:119',
      'pdf:escriturario_agente_comercial:019',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:037',
      'exam:pmsp-2024-soldado-pbm:item:029',
      'exam:pmsp-2024-soldado-pbm:item:035',
      'pdf:analista_administrativo:081',
      'pdf:assistente_administrativo:015',
      'pdf:analista_administrativo:115',
      'pdf:tecnico_do_seguro_social:049',
      'pdf:tecnico_em_enfermagem:012',
      'exam:pmsp-2024-soldado-pbm:item:025',
      'pdf:tecnico_do_seguro_social:050',
      'exam:bb-2021-escriturario-agente-comercial:item:027',
      'pdf:tecnico_em_enfermagem:017',
      'pdf:escriturario_agente_comercial:016',
      'pdf:agente_administrativo:026',
      'pdf:analista_administrativo:112',
      'pdf:analista_administrativo:100',
      'pdf:analista_administrativo:095',
      'pdf:tecnico_em_enfermagem:019',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:063',
      'pdf:analista_administrativo:114',
      'pdf:policial_rodoviario_federal:030',
      'pdf:policial_rodoviario_federal:031',
      'pdf:tecnico_em_enfermagem:014',
      'exam:pmsp-2024-soldado-pbm:item:024',
      'pdf:agente_administrativo:030',
      'pdf:escriturario_agente_comercial:028',
      'pdf:escriturario_agente_comercial:030',
      'exam:bb-2021-escriturario-agente-comercial:item:020',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:031',
      'exam:pmsp-2024-soldado-pbm:item:028',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:075',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:070',
      'pdf:analista_administrativo:089',
      'pdf:tecnico_em_enfermagem:018',
      'pdf:escriturario_agente_comercial:027',
      'exam:pmsp-2024-soldado-pbm:item:026',
      'pdf:analista_administrativo:090',
      'pdf:assistente_administrativo:012',
      'pdf:analista_administrativo:097',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:032',
      'pdf:analista_administrativo:120',
      'pdf:analista_administrativo:099',
      'pdf:analista_administrativo:118',
      'pdf:policial_rodoviario_federal:027',
      'pdf:analista_administrativo:113',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:066',
      'pdf:escriturario_agente_comercial:018',
      'pdf:escriturario_agente_comercial:026',
      'pdf:analista_administrativo:082',
      'pdf:escriturario_agente_comercial:020',
      'pdf:agente_de_policia_federal:060',
      'exam:bb-2021-escriturario-agente-comercial:item:018',
      'exam:bb-2021-escriturario-agente-comercial:item:017',
      'pdf:agente_de_policia_federal:059',
      'pdf:agente_de_policia_federal:057',
      'pdf:analista_administrativo:091',
      'pdf:agente_administrativo:029',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:072',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:033',
      'pdf:escriturario_agente_comercial:017',
      'pdf:analista_administrativo:111',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:036',
      'exam:pmsp-2024-soldado-pbm:item:023',
      'exam:bb-2021-escriturario-agente-comercial:item:028',
      'exam:bb-2021-escriturario-agente-comercial:item:029',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:071',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:035',
      'exam:pmsp-2024-soldado-pbm:item:031',
      'pdf:analista_administrativo:087',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:064',
      'exam:pmsp-2024-soldado-pbm:item:022',
      'exam:conab-2014-assistente-adm:item:014',
      'pdf:agente_administrativo:027',
      'exam:bb-2021-escriturario-agente-comercial:item:019',
      'pdf:analista_administrativo:083',
      'pdf:policial_rodoviario_federal:028',
      'exam:bb-2021-escriturario-agente-comercial:item:016',
      'exam:pmsp-2024-soldado-pbm:item:034',
      'exam:pmsp-2024-soldado-pbm:item:021',
      'exam:pmsp-2024-soldado-pbm:item:033',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:034',
      'pdf:agente_de_policia_federal:058',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:074',
      'exam:pmsp-2024-soldado-pbm:item:032',
      'pdf:agente_administrativo:028',
      'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:065',
      'pdf:tecnico_do_ministerio_publico_area_administrativa:039',
      'pdf:analista_administrativo:084',
      'pdf:assistente_administrativo:014',
      'pdf:analista_administrativo:098',
      'pdf:analista_administrativo:116',
      'pdf:analista_administrativo:088',
      'pdf:dpf14_009_01:027',
      'exam:conab-2014-assistente-adm:item:015',
      'exam:bb-2021-escriturario-agente-comercial:item:026',
      'pdf:analista_administrativo:093',
      'pdf:analista_administrativo:092',
      'pdf:tecnico_em_enfermagem:015'
    )
  );
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:029');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:119');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:019');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:037');
  UPDATE public.question_topic_relations SET topic_id = 'geometria-plana-e-espacial' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:035');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:assistente_administrativo:015');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:115');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_seguro_social:049');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:012');
  UPDATE public.question_topic_relations SET topic_id = 'porcentagem-e-proporcionalidade' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:025');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_seguro_social:050');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:017');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:016');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_administrativo:026');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:112');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:019');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:114');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:policial_rodoviario_federal:030');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:policial_rodoviario_federal:031');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:014');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_administrativo:030');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:028');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:030');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:031');
  UPDATE public.question_topic_relations SET topic_id = 'porcentagem-e-proporcionalidade' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:028');
  UPDATE public.question_topic_relations SET topic_id = 'plano-de-contas-aplicado-ao-setor-publico-pcasp' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:075');
  UPDATE public.question_topic_relations SET topic_id = 'conceitos-campo-de-atuacao-e-regimes-contabeis' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:070');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:018');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:027');
  UPDATE public.question_topic_relations SET topic_id = 'porcentagem-e-proporcionalidade' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:026');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:assistente_administrativo:012');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:032');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:120');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:118');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:policial_rodoviario_federal:027');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:113');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:018');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:026');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:020');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_de_policia_federal:060');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_de_policia_federal:059');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_de_policia_federal:057');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_administrativo:029');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:033');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:escriturario_agente_comercial:017');
  UPDATE public.question_topic_relations SET topic_id = 'matematica-financeira' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:111');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:036');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:035');
  UPDATE public.question_topic_relations SET topic_id = 'geometria-plana-e-espacial' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:031');
  UPDATE public.question_topic_relations SET topic_id = 'aritmetica-e-algebra' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:022');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_administrativo:027');
  UPDATE public.question_topic_relations SET topic_id = 'porcentagem-e-proporcionalidade' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:bb-2021-escriturario-agente-comercial:item:019');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:policial_rodoviario_federal:028');
  UPDATE public.question_topic_relations SET topic_id = 'geometria-plana-e-espacial' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:034');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:034');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_de_policia_federal:058');
  UPDATE public.question_topic_relations SET topic_id = 'geometria-plana-e-espacial' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:pmsp-2024-soldado-pbm:item:032');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:agente_administrativo:028');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_do_ministerio_publico_area_administrativa:039');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:assistente_administrativo:014');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:analista_administrativo:116');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:dpf14_009_01:027');
  UPDATE public.question_topic_relations SET topic_id = 'aritmetica-e-algebra' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'exam:conab-2014-assistente-adm:item:015');
  UPDATE public.question_topic_relations SET topic_id = 'matematica' WHERE relation_type = 'primary' AND question_id = (SELECT id FROM public.questions WHERE external_id = 'pdf:tecnico_em_enfermagem:015');
END;
$$;
