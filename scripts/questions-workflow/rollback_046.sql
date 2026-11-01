-- Rollback da Migration 046
-- Reverte as 61 reclassificacoes prioritarias para seus topicos e disciplinas originais.

DO $$
BEGIN
  -- Reverter BB 31, 32, 35
  UPDATE public.question_discipline_relations qdr
  SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'matematica-financeira')
  FROM public.questions q
  WHERE q.id = qdr.question_id
    AND q.external_id IN (
      'exam:bb-2021-escriturario-agente-comercial:item:031',
      'exam:bb-2021-escriturario-agente-comercial:item:032',
      'exam:bb-2021-escriturario-agente-comercial:item:035'
    );

  UPDATE public.question_topic_relations qtr
  SET topic_id = 'sistemas-de-amortizacao'
  FROM public.questions q
  WHERE q.id = qtr.question_id AND qtr.relation_type = 'primary'
    AND q.external_id IN (
      'exam:bb-2021-escriturario-agente-comercial:item:031',
      'exam:bb-2021-escriturario-agente-comercial:item:032',
      'exam:bb-2021-escriturario-agente-comercial:item:035'
    );

  -- Reverter BB 46
  UPDATE public.question_discipline_relations qdr
  SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'informatica')
  FROM public.questions q
  WHERE q.id = qdr.question_id
    AND q.external_id = 'exam:bb-2021-escriturario-agente-comercial:item:046';

  UPDATE public.question_topic_relations qtr
  SET topic_id = 'ferramentas-de-escritorio-office-e-libreoffice'
  FROM public.questions q
  WHERE q.id = qtr.question_id AND qtr.relation_type = 'primary'
    AND q.external_id = 'exam:bb-2021-escriturario-agente-comercial:item:046';

  -- Reverter TJSP 77..80
  UPDATE public.question_discipline_relations qdr
  SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'matematica')
  FROM public.questions q
  WHERE q.id = qdr.question_id
    AND q.external_id IN (
      'exam:tjsp-2021-escrevente-tecnico:item:077',
      'exam:tjsp-2021-escrevente-tecnico:item:078',
      'exam:tjsp-2021-escrevente-tecnico:item:079',
      'exam:tjsp-2021-escrevente-tecnico:item:080'
    );

  UPDATE public.question_topic_relations qtr
  SET topic_id = 'geometria-plana-e-espacial'
  FROM public.questions q
  WHERE q.id = qtr.question_id AND qtr.relation_type = 'primary'
    AND q.external_id IN (
      'exam:tjsp-2021-escrevente-tecnico:item:077',
      'exam:tjsp-2021-escrevente-tecnico:item:078',
      'exam:tjsp-2021-escrevente-tecnico:item:079',
      'exam:tjsp-2021-escrevente-tecnico:item:080'
    );

  -- Reverter TJSP 65
  UPDATE public.question_discipline_relations qdr
  SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'direito-da-pessoa-com-deficiencia')
  FROM public.questions q
  WHERE q.id = qdr.question_id
    AND q.external_id = 'exam:tjsp-2021-escrevente-tecnico:item:065';

  UPDATE public.question_topic_relations qtr
  SET topic_id = 'estatuto-da-pessoa-com-deficiencia-lei-13-146-15'
  FROM public.questions q
  WHERE q.id = qtr.question_id AND qtr.relation_type = 'primary'
    AND q.external_id = 'exam:tjsp-2021-escrevente-tecnico:item:065';

  -- Reverter TJSP 85
  UPDATE public.question_discipline_relations qdr
  SET discipline_id = (SELECT id FROM public.disciplines WHERE slug = 'raciocinio-logico')
  FROM public.questions q
  WHERE q.id = qdr.question_id
    AND q.external_id = 'exam:tjsp-2021-escrevente-tecnico:item:085';

  UPDATE public.question_topic_relations qtr
  SET topic_id = 'estruturas-logicas-e-diagramas-logicos'
  FROM public.questions q
  WHERE q.id = qtr.question_id AND qtr.relation_type = 'primary'
    AND q.external_id = 'exam:tjsp-2021-escrevente-tecnico:item:085';

  -- Limpar subtopicos vinculados na 046
  DELETE FROM public.question_subtopic_relations;
END;
$$;
