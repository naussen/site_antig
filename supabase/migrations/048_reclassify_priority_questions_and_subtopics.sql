-- Migration 046: Saneamento taxonômico e vinculação hierárquica prioritária
-- Executa de forma atômica o saneamento de 61 questões das campanhas auditadas.

-- 1. Inserir subtópicos canônicos em public.subtopics
INSERT INTO public.subtopics (id, topic_id, title, slug, sort_order)
VALUES
  ('sfn-orgaos-e-atribuicoes', 'sistema-financeiro-nacional-sfn', 'SFN: órgãos normativos e fiscalizadores', 'sfn-orgaos-e-atribuicoes', 0),
  ('mercado-de-cambio-fluxo-de-capitais', 'mercado-de-cambio-e-capitais', 'Mercado de câmbio e fluxo de capitais', 'mercado-de-cambio-fluxo-de-capitais', 0),
  ('produtos-financeiros-renda-fixa', 'produtos-e-servicos-bancarios', 'Produtos bancários e renda fixa', 'produtos-financeiros-renda-fixa', 0),
  ('escalas-de-mensuracao-e-medidas-de-posicao', 'estatistica-descritiva', 'Escalas de mensuração e medidas de posição', 'escalas-de-mensuracao-e-medidas-de-posicao', 0),
  ('acontecimentos-e-fatos-relevantes', 'sociedade-seguranca-publica-e-cidadania', 'Fatos relevantes e sociedade', 'acontecimentos-e-fatos-relevantes', 0),
  ('matematica-razoes-proporcoes-e-graficos', 'porcentagem-e-proporcionalidade', 'Razões, proporções e porcentagem', 'matematica-razoes-proporcoes-e-graficos', 0),
  ('aritmetica-sistemas-de-equacoes', 'aritmetica-e-algebra', 'Sistemas de equações do 1º grau', 'aritmetica-sistemas-de-equacoes', 0),
  ('matematica-financeira-juros-simples-diarios', 'juros-simples-e-compostos', 'Juros simples e convenções de taxas', 'matematica-financeira-juros-simples-diarios', 0),
  ('geometria-plana-calculo-de-areas', 'geometria-plana-e-espacial', 'Geometria plana: cálculo de áreas', 'geometria-plana-calculo-de-areas', 0),
  ('area-de-transferencia-e-edicao', 'ferramentas-de-escritorio-office-e-libreoffice', 'Área de Transferência e edição de textos', 'area-de-transferencia-e-edicao', 0),
  ('windows-10-criacao-de-atalhos', 'sistemas-operacionais-windows-e-linux', 'Windows 10: criação de atalhos', 'windows-10-criacao-de-atalhos', 0),
  ('windows-10-gerenciamento-de-pastas-e-arquivos', 'sistemas-operacionais-windows-e-linux', 'Windows 10: pastas e arquivos', 'windows-10-gerenciamento-de-pastas-e-arquivos', 0),
  ('windows-10-atributos-de-pastas', 'sistemas-operacionais-windows-e-linux', 'Windows 10: atributos de pastas', 'windows-10-atributos-de-pastas', 0),
  ('ms-excel-formulas-e-funcoes', 'ferramentas-de-escritorio-office-e-libreoffice', 'MS-Excel: fórmulas e funções', 'ms-excel-formulas-e-funcoes', 0),
  ('distribuicao-binomial', 'probabilidade-e-distribuicoes', 'Distribuição Binomial', 'distribuicao-binomial', 0),
  ('amostragem-erro-padrao', 'amostragem-e-inferencia-estatistica', 'Erro padrão e distribuição amostral', 'amostragem-erro-padrao', 0),
  ('intervalos-de-confianca', 'amostragem-e-inferencia-estatistica', 'Intervalos de Confiança', 'intervalos-de-confianca', 0),
  ('estimacao-pontual-e-verossimilhanca', 'amostragem-e-inferencia-estatistica', 'Estimação pontual e máxima verossimilhança', 'estimacao-pontual-e-verossimilhanca', 0),
  ('correlacao-linear-e-regressao', 'amostragem-e-inferencia-estatistica', 'Correlação linear e regressão', 'correlacao-linear-e-regressao', 0),
  ('regressao-linear-e-analise-de-variancia', 'amostragem-e-inferencia-estatistica', 'Regressão linear e análise de variância (ANOVA)', 'regressao-linear-e-analise-de-variancia', 0),
  ('coeficientes-da-regressao-linear', 'amostragem-e-inferencia-estatistica', 'Coeficientes da regressão linear simples', 'coeficientes-da-regressao-linear', 0),
  ('distribuicao-normal-padrao-e-propriedades', 'probabilidade-e-distribuicoes', 'Distribuição Normal e propriedades', 'distribuicao-normal-padrao-e-propriedades', 0),
  ('distribuicao-normal-padronizacao-escore-z', 'probabilidade-e-distribuicoes', 'Distribuição Normal: padronização e escore Z', 'distribuicao-normal-padronizacao-escore-z', 0),
  ('fatos-contabeis-e-suas-variacoes', 'conceitos-basicos-da-contabilidade', 'Fatos contábeis e variações patrimoniais', 'fatos-contabeis-e-suas-variacoes', 0),
  ('ativo-circulante-e-disponibilidades', 'ativo-e-criterios-de-avaliacao-do-ativo', 'Ativo circulante e disponibilidades', 'ativo-circulante-e-disponibilidades', 0),
  ('formulas-de-lancamento-contabil', 'conceitos-basicos-da-contabilidade', 'Fórmulas de lançamento contábil', 'formulas-de-lancamento-contabil', 0),
  ('operacoes-com-mercadorias-lucro-bruto', 'operacoes-com-mercadorias', 'Operações com mercadorias e apuração do RCM', 'operacoes-com-mercadorias-lucro-bruto', 0),
  ('regime-de-competencia-e-caixa', 'conceitos-basicos-da-contabilidade', 'Regime de competência e confrontação de receitas/despesas', 'regime-de-competencia-e-caixa', 0),
  ('passivo-adiantamento-de-clientes', 'lei-6-404-76-passivo-e-criterios-de-avaliacao-do-passivo', 'Passivo: adiantamento de clientes e obrigações', 'passivo-adiantamento-de-clientes', 0),
  ('desconto-de-duplicatas-e-encargos', 'operacoes-com-duplicatas', 'Desconto de duplicatas e encargos financeiros', 'desconto-de-duplicatas-e-encargos', 0),
  ('imobilizado-depreciacao-e-mensuracao', 'cpc-27-imobilizado', 'CPC 27: Ativo imobilizado e depreciação', 'imobilizado-depreciacao-e-mensuracao', 0),
  ('balancete-contas-patrimoniais-e-resultado', 'balancete-de-verificacao', 'Balancete de verificação e encerramento', 'balancete-contas-patrimoniais-e-resultado', 0),
  ('dre-estrutura-e-apuracao-do-resultado', 'cpc-26-demonstracoes-contabeis', 'DRE: estrutura e apuração do resultado', 'dre-estrutura-e-apuracao-do-resultado', 0),
  ('nbc-tsp-caracteristicas-qualitativas', 'cpc-00-estrutura-conceitual', 'Características qualitativas da informação contábil', 'nbc-tsp-caracteristicas-qualitativas', 0),
  ('modalidades-de-lancamento-tributario', 'direito-tributario-credito-tributario-lancamento', 'Lançamento tributário e modalidades', 'modalidades-de-lancamento-tributario', 0),
  ('processo-administrativo-fiscal-principios', 'direito-tributario-credito-tributario-lancamento', 'Processo administrativo fiscal: princípios e rito', 'processo-administrativo-fiscal-principios', 0),
  ('pessoas-naturais-capacidade', 'pessoa', 'Capacidade civil e incapacidades', 'pessoas-naturais-capacidade', 0),
  ('pessoas-naturais-ausencia', 'pessoa', 'Ausência e sucessão provisória', 'pessoas-naturais-ausencia', 0),
  ('fundacoes-constituicao-e-patrimonio', 'comeco-da-personalidade-juridica', 'Classificação e constituição de pessoas jurídicas', 'fundacoes-constituicao-e-patrimonio', 0),
  ('pessoas-naturais-domicilio', 'pessoa', 'Domicílio da pessoa natural', 'pessoas-naturais-domicilio', 0),
  ('bens-classificacao-geral', 'classificacao-doutrinaria', 'Classificação geral dos bens', 'bens-classificacao-geral', 0),
  ('contratos-formacao-proposta-e-aceitacao', 'principios-contratuais', 'Formação dos contratos: proposta e aceitação', 'contratos-formacao-proposta-e-aceitacao', 0),
  ('contratos-vicios-redibitorios', 'principios-contratuais', 'Vícios redibitórios', 'contratos-vicios-redibitorios', 0),
  ('contratos-eviccao', 'principios-contratuais', 'Evicção', 'contratos-eviccao', 0),
  ('contratos-aleatorios', 'especies-de-contratos', 'Contratos aleatórios', 'contratos-aleatorios', 0)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, topic_id = EXCLUDED.topic_id;

-- 2. Tabela temporária com as reclassificações
CREATE TEMP TABLE priority_taxonomy_fixes (
  external_id TEXT PRIMARY KEY,
  to_discipline TEXT NOT NULL,
  to_topic TEXT NOT NULL,
  to_subtopic TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO priority_taxonomy_fixes (external_id, to_discipline, to_topic, to_subtopic) VALUES
  ('exam:bb-2021-escriturario-agente-comercial:item:031', 'conhecimentos-bancarios', 'sistema-financeiro-nacional-sfn', 'sfn-orgaos-e-atribuicoes'),
  ('exam:bb-2021-escriturario-agente-comercial:item:032', 'conhecimentos-bancarios', 'mercado-de-cambio-e-capitais', 'mercado-de-cambio-fluxo-de-capitais'),
  ('exam:bb-2021-escriturario-agente-comercial:item:035', 'conhecimentos-bancarios', 'produtos-e-servicos-bancarios', 'produtos-financeiros-renda-fixa'),
  ('exam:bb-2021-escriturario-agente-comercial:item:046', 'estatistica', 'estatistica-descritiva', 'escalas-de-mensuracao-e-medidas-de-posicao'),
  ('exam:tjsp-2021-escrevente-tecnico:item:065', 'atualidades', 'sociedade-seguranca-publica-e-cidadania', 'acontecimentos-e-fatos-relevantes'),
  ('exam:tjsp-2021-escrevente-tecnico:item:071', 'matematica', 'porcentagem-e-proporcionalidade', 'matematica-razoes-proporcoes-e-graficos'),
  ('exam:tjsp-2021-escrevente-tecnico:item:072', 'matematica', 'aritmetica-e-algebra', 'aritmetica-sistemas-de-equacoes'),
  ('exam:tjsp-2021-escrevente-tecnico:item:073', 'matematica-financeira', 'juros-simples-e-compostos', 'matematica-financeira-juros-simples-diarios'),
  ('exam:tjsp-2021-escrevente-tecnico:item:074', 'matematica', 'porcentagem-e-proporcionalidade', 'matematica-razoes-proporcoes-e-graficos'),
  ('exam:tjsp-2021-escrevente-tecnico:item:075', 'matematica', 'geometria-plana-e-espacial', 'geometria-plana-calculo-de-areas'),
  ('exam:tjsp-2021-escrevente-tecnico:item:076', 'matematica', 'porcentagem-e-proporcionalidade', 'matematica-razoes-proporcoes-e-graficos'),
  ('exam:tjsp-2021-escrevente-tecnico:item:077', 'informatica', 'ferramentas-de-escritorio-office-e-libreoffice', 'area-de-transferencia-e-edicao'),
  ('exam:tjsp-2021-escrevente-tecnico:item:078', 'informatica', 'sistemas-operacionais-windows-e-linux', 'windows-10-criacao-de-atalhos'),
  ('exam:tjsp-2021-escrevente-tecnico:item:079', 'informatica', 'sistemas-operacionais-windows-e-linux', 'windows-10-gerenciamento-de-pastas-e-arquivos'),
  ('exam:tjsp-2021-escrevente-tecnico:item:080', 'informatica', 'sistemas-operacionais-windows-e-linux', 'windows-10-atributos-de-pastas'),
  ('exam:tjsp-2021-escrevente-tecnico:item:085', 'informatica', 'ferramentas-de-escritorio-office-e-libreoffice', 'ms-excel-formulas-e-funcoes'),
  ('pdf:agente_de_policia_federal:041', 'estatistica', 'probabilidade-e-distribuicoes', 'distribuicao-binomial'),
  ('pdf:agente_de_policia_federal:042', 'estatistica', 'amostragem-e-inferencia-estatistica', 'amostragem-erro-padrao'),
  ('pdf:agente_de_policia_federal:043', 'estatistica', 'amostragem-e-inferencia-estatistica', 'intervalos-de-confianca'),
  ('pdf:agente_de_policia_federal:044', 'estatistica', 'amostragem-e-inferencia-estatistica', 'estimacao-pontual-e-verossimilhanca'),
  ('pdf:agente_de_policia_federal:045', 'estatistica', 'amostragem-e-inferencia-estatistica', 'correlacao-linear-e-regressao'),
  ('pdf:agente_de_policia_federal:046', 'estatistica', 'amostragem-e-inferencia-estatistica', 'regressao-linear-e-analise-de-variancia'),
  ('pdf:agente_de_policia_federal:047', 'estatistica', 'amostragem-e-inferencia-estatistica', 'coeficientes-da-regressao-linear'),
  ('pdf:agente_de_policia_federal:048', 'estatistica', 'probabilidade-e-distribuicoes', 'distribuicao-normal-padrao-e-propriedades'),
  ('pdf:agente_de_policia_federal:049', 'estatistica', 'probabilidade-e-distribuicoes', 'distribuicao-normal-padrao-e-propriedades'),
  ('pdf:agente_de_policia_federal:050', 'estatistica', 'probabilidade-e-distribuicoes', 'distribuicao-normal-padronizacao-escore-z'),
  ('pdf:agente_de_policia_federal:097', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'fatos-contabeis-e-suas-variacoes'),
  ('pdf:agente_de_policia_federal:098', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'fatos-contabeis-e-suas-variacoes'),
  ('pdf:agente_de_policia_federal:099', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'fatos-contabeis-e-suas-variacoes'),
  ('pdf:agente_de_policia_federal:100', 'contabilidade-geral-e-avancada', 'ativo-e-criterios-de-avaliacao-do-ativo', 'ativo-circulante-e-disponibilidades'),
  ('pdf:agente_de_policia_federal:101', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'fatos-contabeis-e-suas-variacoes'),
  ('pdf:agente_de_policia_federal:102', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'formulas-de-lancamento-contabil'),
  ('pdf:agente_de_policia_federal:103', 'contabilidade-geral-e-avancada', 'ativo-e-criterios-de-avaliacao-do-ativo', 'ativo-circulante-e-disponibilidades'),
  ('pdf:agente_de_policia_federal:104', 'contabilidade-geral-e-avancada', 'ativo-e-criterios-de-avaliacao-do-ativo', 'ativo-circulante-e-disponibilidades'),
  ('pdf:agente_de_policia_federal:105', 'contabilidade-geral-e-avancada', 'operacoes-com-mercadorias', 'operacoes-com-mercadorias-lucro-bruto'),
  ('pdf:agente_de_policia_federal:106', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'formulas-de-lancamento-contabil'),
  ('pdf:agente_de_policia_federal:107', 'contabilidade-geral-e-avancada', 'conceitos-basicos-da-contabilidade', 'regime-de-competencia-e-caixa'),
  ('pdf:agente_de_policia_federal:108', 'contabilidade-geral-e-avancada', 'lei-6-404-76-passivo-e-criterios-de-avaliacao-do-passivo', 'passivo-adiantamento-de-clientes'),
  ('pdf:agente_de_policia_federal:109', 'contabilidade-geral-e-avancada', 'operacoes-com-mercadorias', 'operacoes-com-mercadorias-lucro-bruto'),
  ('pdf:agente_de_policia_federal:110', 'contabilidade-geral-e-avancada', 'operacoes-com-duplicatas', 'desconto-de-duplicatas-e-encargos'),
  ('pdf:agente_de_policia_federal:111', 'contabilidade-geral-e-avancada', 'cpc-27-imobilizado', 'imobilizado-depreciacao-e-mensuracao'),
  ('pdf:agente_de_policia_federal:112', 'contabilidade-geral-e-avancada', 'balancete-de-verificacao', 'balancete-contas-patrimoniais-e-resultado'),
  ('pdf:agente_de_policia_federal:113', 'contabilidade-geral-e-avancada', 'balancete-de-verificacao', 'balancete-contas-patrimoniais-e-resultado'),
  ('pdf:agente_de_policia_federal:114', 'contabilidade-geral-e-avancada', 'balancete-de-verificacao', 'balancete-contas-patrimoniais-e-resultado'),
  ('pdf:agente_de_policia_federal:115', 'contabilidade-geral-e-avancada', 'ativo-e-criterios-de-avaliacao-do-ativo', 'ativo-circulante-e-disponibilidades'),
  ('pdf:agente_de_policia_federal:116', 'contabilidade-geral-e-avancada', 'cpc-26-demonstracoes-contabeis', 'dre-estrutura-e-apuracao-do-resultado'),
  ('pdf:agente_de_policia_federal:118', 'contabilidade-geral-e-avancada', 'cpc-26-demonstracoes-contabeis', 'dre-estrutura-e-apuracao-do-resultado'),
  ('pdf:agente_de_policia_federal:119', 'contabilidade-geral-e-avancada', 'cpc-00-estrutura-conceitual', 'nbc-tsp-caracteristicas-qualitativas'),
  ('pdf:agente_de_policia_federal:120', 'contabilidade-geral-e-avancada', 'cpc-00-estrutura-conceitual', 'nbc-tsp-caracteristicas-qualitativas'),
  ('pdf:analista_administrativo:085', 'direito-tributario', 'direito-tributario-credito-tributario-lancamento', 'modalidades-de-lancamento-tributario'),
  ('pdf:analista_administrativo:086', 'direito-tributario', 'direito-tributario-credito-tributario-lancamento', 'processo-administrativo-fiscal-principios'),
  ('pdf:prova_i09_tipo_001:041', 'direito-civil', 'pessoa', 'pessoas-naturais-capacidade'),
  ('pdf:prova_i09_tipo_001:042', 'direito-civil', 'pessoa', 'pessoas-naturais-ausencia'),
  ('pdf:prova_i09_tipo_001:043', 'direito-civil', 'comeco-da-personalidade-juridica', 'fundacoes-constituicao-e-patrimonio'),
  ('pdf:prova_i09_tipo_001:044', 'direito-civil', 'comeco-da-personalidade-juridica', 'fundacoes-constituicao-e-patrimonio'),
  ('pdf:prova_i09_tipo_001:045', 'direito-civil', 'pessoa', 'pessoas-naturais-domicilio'),
  ('pdf:prova_i09_tipo_001:046', 'direito-civil', 'classificacao-doutrinaria', 'bens-classificacao-geral'),
  ('pdf:prova_i09_tipo_001:047', 'direito-civil', 'principios-contratuais', 'contratos-formacao-proposta-e-aceitacao'),
  ('pdf:prova_i09_tipo_001:048', 'direito-civil', 'principios-contratuais', 'contratos-vicios-redibitorios'),
  ('pdf:prova_i09_tipo_001:049', 'direito-civil', 'principios-contratuais', 'contratos-eviccao'),
  ('pdf:prova_i09_tipo_001:050', 'direito-civil', 'especies-de-contratos', 'contratos-aleatorios');

-- 3. Validação pré-execução
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM priority_taxonomy_fixes f
  JOIN public.questions q ON q.external_id = f.external_id
  WHERE q.status = 'published';

  IF v_count <> 61 THEN
    RAISE EXCEPTION 'Quantidade de questões encontradas (%) diverge do esperado (61)', v_count;
  END IF;
END;
$$;

-- 4. Atualização atômica das relações de disciplina e tópico
-- 4.1 Atualiza disciplina primária
UPDATE public.question_discipline_relations qdr
SET discipline_id = d.id
FROM priority_taxonomy_fixes f
JOIN public.questions q ON q.external_id = f.external_id
JOIN public.disciplines d ON d.slug = f.to_discipline
WHERE qdr.question_id = q.id AND qdr.is_primary = true;

-- 4.2 Atualiza tópico primário
UPDATE public.question_topic_relations qtr
SET topic_id = f.to_topic
FROM priority_taxonomy_fixes f
JOIN public.questions q ON q.external_id = f.external_id
WHERE qtr.question_id = q.id AND qtr.relation_type = 'primary';

-- 4.3 Insere relação de subtópico primário
INSERT INTO public.question_subtopic_relations (question_id, subtopic_id, is_primary, sort_order)
SELECT q.id, f.to_subtopic, true, 0
FROM priority_taxonomy_fixes f
JOIN public.questions q ON q.external_id = f.external_id
ON CONFLICT (question_id, subtopic_id) DO UPDATE SET is_primary = true;

-- 4.4 Atualiza subject da questão para o título canônico do tópico
UPDATE public.questions q
SET subject = t.title, updated_at = now()
FROM priority_taxonomy_fixes f
JOIN public.topics t ON t.topic_id = f.to_topic
WHERE q.external_id = f.external_id;

-- 5. Validação pós-execução
DO $$
DECLARE
  v_fixed INTEGER;
BEGIN
  SELECT count(*) INTO v_fixed
  FROM priority_taxonomy_fixes f
  JOIN public.questions q ON q.external_id = f.external_id
  JOIN public.question_discipline_relations qdr ON qdr.question_id = q.id AND qdr.is_primary = true
  JOIN public.disciplines d ON d.id = qdr.discipline_id AND d.slug = f.to_discipline
  JOIN public.question_topic_relations qtr ON qtr.question_id = q.id AND qtr.relation_type = 'primary' AND qtr.topic_id = f.to_topic
  JOIN public.question_subtopic_relations qsr ON qsr.question_id = q.id AND qsr.is_primary = true AND qsr.subtopic_id = f.to_subtopic
  WHERE q.status = 'published';

  IF v_fixed <> 61 THEN
    RAISE EXCEPTION 'Validação pós-gravação falhou: % de 61 questões verificadas', v_fixed;
  END IF;
END;
$$;
