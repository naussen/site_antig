-- Migration 047: Censo Expandido — Reclassificacao e Vinculacao de Subtopicos (105 questoes)
-- Cobre: Contabilidade Publica (26), Matematica Financeira (18), Matematica (61)
-- Total de questoes atendidas: 105
-- Total de novos subtopicos cadastrados: 38

-- 1. Inserir subtopicos no catalogo
INSERT INTO public.subtopics (id, topic_id, title, slug, sort_order)
VALUES
  ('equivalencia-de-capitais-e-fluxo-de-pagamento', 'juros-simples-e-compostos', 'Equivalência de capitais e fluxo de pagamento', 'equivalencia-de-capitais-e-fluxo-de-pagamento', 1),
  ('razoes-proporcoes-e-regra-de-tres', 'porcentagem-e-proporcionalidade', 'Razões, proporções e regra de três simples e composta', 'razoes-proporcoes-e-regra-de-tres', 2),
  ('regime-de-juros-compostos', 'juros-simples-e-compostos', 'Regime de juros compostos e montante acumulado', 'regime-de-juros-compostos', 3),
  ('ativo-imobilizado-e-intangivel-no-setor-publico', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'Ativo imobilizado e intangível no setor público', 'ativo-imobilizado-e-intangivel-no-setor-publico', 4),
  ('fracoes-e-numeros-decimais', 'aritmetica-e-algebra', 'Frações, números decimais e operações básicas', 'fracoes-e-numeros-decimais', 5),
  ('avaliacao-de-investimentos-vpl-e-payback', 'juros-simples-e-compostos', 'Avaliação econômica de projetos: VPL, TIR e Payback', 'avaliacao-de-investimentos-vpl-e-payback', 6),
  ('teoria-dos-conjuntos-e-diagramas-de-venn', 'aritmetica-e-algebra', 'Teoria dos conjuntos e diagramas de Venn', 'teoria-dos-conjuntos-e-diagramas-de-venn', 7),
  ('problemas-aritmeticos-e-algebraicos', 'aritmetica-e-algebra', 'Problemas aritméticos e relações algébricas', 'problemas-aritmeticos-e-algebraicos', 8),
  ('divisibilidade-mdc-e-mmc', 'aritmetica-e-algebra', 'Divisibilidade, restos de divisão, MDC e MMC', 'divisibilidade-mdc-e-mmc', 9),
  ('balanco-financeiro-no-setor-publico', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'Balanço Financeiro no setor público', 'balanco-financeiro-no-setor-publico', 10),
  ('porcentagem-aumentos-e-descontos-sucessivos', 'porcentagem-e-proporcionalidade', 'Porcentagem: cálculo percentual, aumentos e descontos', 'porcentagem-aumentos-e-descontos-sucessivos', 11),
  ('taxas-equivalentes-e-proporcionais', 'taxas-de-juros-e-inflacao', 'Taxas de juros equivalentes e proporcionais', 'taxas-equivalentes-e-proporcionais', 12),
  ('principios-de-contagem-e-probabilidade-basica', 'aritmetica-e-algebra', 'Princípios de contagem e probabilidade básica', 'principios-de-contagem-e-probabilidade-basica', 13),
  ('medias-aritmetica-e-ponderada', 'aritmetica-e-algebra', 'Médias aritmética simples e ponderada', 'medias-aritmetica-e-ponderada', 14),
  ('sistema-frances-tabela-price', 'sistemas-de-amortizacao', 'Sistema Francês de Amortização (Tabela Price)', 'sistema-frances-tabela-price', 15),
  ('fontes-ou-destinacoes-de-recursos', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'Fontes ou destinações de recursos na execução orçamentária', 'fontes-ou-destinacoes-de-recursos', 16),
  ('natureza-da-informacao-contabil-e-classes-do-pcasp', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'Natureza da informação contábil e classes do PCASP', 'natureza-da-informacao-contabil-e-classes-do-pcasp', 17),
  ('lancamentos-contabeis-tipicos-do-setor-publico', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'Lançamentos contábeis típicos do setor público (MCASP)', 'lancamentos-contabeis-tipicos-do-setor-publico', 18),
  ('taxa-nominal-e-taxa-efetiva', 'taxas-de-juros-e-inflacao', 'Taxa nominal e taxa efetiva de juros', 'taxa-nominal-e-taxa-efetiva', 19),
  ('funcoes-e-modelagem-matematica', 'aritmetica-e-algebra', 'Funções de primeiro e segundo grau e modelagem', 'funcoes-e-modelagem-matematica', 20),
  ('potenciacao-e-notacao-cientifica', 'aritmetica-e-algebra', 'Potenciação, ordens de grandeza e notação científica', 'potenciacao-e-notacao-cientifica', 21),
  ('trigonometria-e-triangulos-retangulos', 'geometria-plana-e-espacial', 'Trigonometria e relações métricas no triângulo retângulo', 'trigonometria-e-triangulos-retangulos', 22),
  ('regime-de-juros-simples', 'juros-simples-e-compostos', 'Regime de juros simples e aplicações de curto prazo', 'regime-de-juros-simples', 23),
  ('siafi-subsistemas-e-documentos-habeis', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'SIAFI: subsistemas, CPR e documentos hábeis', 'siafi-subsistemas-e-documentos-habeis', 24),
  ('estagios-da-despesa-empenho-liquidacao-e-pagamento', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'Estágios da despesa orçamentária: empenho, liquidação e pagamento', 'estagios-da-despesa-empenho-liquidacao-e-pagamento', 25),
  ('planejamento-e-responsabilidade-fiscal-no-setor-publico', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'Planejamento e responsabilidade fiscal no setor público', 'planejamento-e-responsabilidade-fiscal-no-setor-publico', 26),
  ('consolidacao-das-demonstracoes-contabeis', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'Consolidação das demonstrações contábeis aplicadas ao setor público', 'consolidacao-das-demonstracoes-contabeis', 27),
  ('sistema-de-amortizacao-constante-sac', 'sistemas-de-amortizacao', 'Sistema de Amortização Constante (SAC)', 'sistema-de-amortizacao-constante-sac', 28),
  ('taxas-equivalentes-e-nominais', 'juros-simples-e-compostos', 'Taxas equivalentes e taxas nominais em juros compostos', 'taxas-equivalentes-e-nominais', 29),
  ('variacoes-patrimoniais-aumentativas-e-diminutivas-vpa-vpd', 'patrimonio-publico-e-variacoes-patrimoniais', 'Variações patrimoniais aumentativas (VPA) e diminutivas (VPD)', 'variacoes-patrimoniais-aumentativas-e-diminutivas-vpa-vpd', 30),
  ('geometria-plana-perimetros-e-areas', 'geometria-plana-e-espacial', 'Geometria plana: perímetros e áreas de figuras planas', 'geometria-plana-perimetros-e-areas', 31),
  ('arrecadacao-e-conta-unica-gru', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'Arrecadação e Conta Única: Guia de Recolhimento da União (GRU)', 'arrecadacao-e-conta-unica-gru', 32),
  ('equacoes-e-sistemas-do-primeiro-grau', 'aritmetica-e-algebra', 'Equações e sistemas lineares do primeiro grau', 'equacoes-e-sistemas-do-primeiro-grau', 33),
  ('registro-de-direitos-e-obrigacoes-no-pcasp', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'Registro de direitos, obrigações e dívida ativa no PCASP', 'registro-de-direitos-e-obrigacoes-no-pcasp', 34),
  ('geometria-espacial-volumes-e-capacidade', 'geometria-plana-e-espacial', 'Geometria espacial: paralelepípedo, volume e capacidade em litros', 'geometria-espacial-volumes-e-capacidade', 35),
  ('restos-a-pagar-e-execucao-da-despesa', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'Restos a pagar e execução da despesa pública', 'restos-a-pagar-e-execucao-da-despesa', 36),
  ('receitas-publicas-e-regimes-contabeis-lei-4320', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'Receitas públicas e regimes contábeis (Lei 4.320/64)', 'receitas-publicas-e-regimes-contabeis-lei-4320', 37),
  ('geometria-plana-areas-de-poligonos', 'geometria-plana-e-espacial', 'Geometria plana: áreas de quadrados e retângulos', 'geometria-plana-areas-de-poligonos', 38)
ON CONFLICT (id) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  title = EXCLUDED.title,
  slug = EXCLUDED.slug;

-- 2. Atualizacao atomica dos topicos e vinculacao dos subtopicos primarios
DO $$
DECLARE
  v_fixed INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Tabela temporaria com o lote de reclassificacao do censo expandido
  CREATE TEMP TABLE temp_census_105 (
    external_id TEXT PRIMARY KEY,
    target_topic TEXT NOT NULL,
    subtopic_id TEXT NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO temp_census_105 (external_id, target_topic, subtopic_id) VALUES
    ('pdf:escriturario_agente_comercial:029', 'juros-simples-e-compostos', 'equivalencia-de-capitais-e-fluxo-de-pagamento'),
    ('exam:pmsp-2024-soldado-pbm:item:027', 'porcentagem-e-proporcionalidade', 'razoes-proporcoes-e-regra-de-tres'),
    ('exam:bb-2021-escriturario-agente-comercial:item:030', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('pdf:analista_administrativo:094', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'ativo-imobilizado-e-intangivel-no-setor-publico'),
    ('exam:pmsp-2024-soldado-pbm:item:030', 'aritmetica-e-algebra', 'fracoes-e-numeros-decimais'),
    ('pdf:analista_administrativo:119', 'juros-simples-e-compostos', 'avaliacao-de-investimentos-vpl-e-payback'),
    ('pdf:escriturario_agente_comercial:019', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:037', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:pmsp-2024-soldado-pbm:item:029', 'aritmetica-e-algebra', 'fracoes-e-numeros-decimais'),
    ('exam:pmsp-2024-soldado-pbm:item:035', 'aritmetica-e-algebra', 'divisibilidade-mdc-e-mmc'),
    ('pdf:analista_administrativo:081', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'balanco-financeiro-no-setor-publico'),
    ('pdf:assistente_administrativo:015', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('pdf:analista_administrativo:115', 'taxas-de-juros-e-inflacao', 'taxas-equivalentes-e-proporcionais'),
    ('pdf:tecnico_do_seguro_social:049', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('pdf:tecnico_em_enfermagem:012', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('exam:pmsp-2024-soldado-pbm:item:025', 'aritmetica-e-algebra', 'medias-aritmetica-e-ponderada'),
    ('pdf:tecnico_do_seguro_social:050', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:027', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('pdf:tecnico_em_enfermagem:017', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:escriturario_agente_comercial:016', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:agente_administrativo:026', 'porcentagem-e-proporcionalidade', 'razoes-proporcoes-e-regra-de-tres'),
    ('pdf:analista_administrativo:112', 'sistemas-de-amortizacao', 'sistema-frances-tabela-price'),
    ('pdf:analista_administrativo:100', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'fontes-ou-destinacoes-de-recursos'),
    ('pdf:analista_administrativo:095', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'natureza-da-informacao-contabil-e-classes-do-pcasp'),
    ('pdf:tecnico_em_enfermagem:019', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:063', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'lancamentos-contabeis-tipicos-do-setor-publico'),
    ('pdf:analista_administrativo:114', 'taxas-de-juros-e-inflacao', 'taxa-nominal-e-taxa-efetiva'),
    ('pdf:policial_rodoviario_federal:030', 'aritmetica-e-algebra', 'funcoes-e-modelagem-matematica'),
    ('pdf:policial_rodoviario_federal:031', 'aritmetica-e-algebra', 'funcoes-e-modelagem-matematica'),
    ('pdf:tecnico_em_enfermagem:014', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('exam:pmsp-2024-soldado-pbm:item:024', 'aritmetica-e-algebra', 'potenciacao-e-notacao-cientifica'),
    ('pdf:agente_administrativo:030', 'geometria-plana-e-espacial', 'trigonometria-e-triangulos-retangulos'),
    ('pdf:escriturario_agente_comercial:028', 'juros-simples-e-compostos', 'regime-de-juros-simples'),
    ('pdf:escriturario_agente_comercial:030', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:020', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:031', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('exam:pmsp-2024-soldado-pbm:item:028', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:075', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'siafi-subsistemas-e-documentos-habeis'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:070', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'estagios-da-despesa-empenho-liquidacao-e-pagamento'),
    ('pdf:analista_administrativo:089', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'planejamento-e-responsabilidade-fiscal-no-setor-publico'),
    ('pdf:tecnico_em_enfermagem:018', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:escriturario_agente_comercial:027', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('exam:pmsp-2024-soldado-pbm:item:026', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:analista_administrativo:090', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'planejamento-e-responsabilidade-fiscal-no-setor-publico'),
    ('pdf:assistente_administrativo:012', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:analista_administrativo:097', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'consolidacao-das-demonstracoes-contabeis'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:032', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:analista_administrativo:120', 'juros-simples-e-compostos', 'avaliacao-de-investimentos-vpl-e-payback'),
    ('pdf:analista_administrativo:099', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'fontes-ou-destinacoes-de-recursos'),
    ('pdf:analista_administrativo:118', 'juros-simples-e-compostos', 'avaliacao-de-investimentos-vpl-e-payback'),
    ('pdf:policial_rodoviario_federal:027', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:analista_administrativo:113', 'sistemas-de-amortizacao', 'sistema-de-amortizacao-constante-sac'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:066', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'lancamentos-contabeis-tipicos-do-setor-publico'),
    ('pdf:escriturario_agente_comercial:018', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:escriturario_agente_comercial:026', 'juros-simples-e-compostos', 'taxas-equivalentes-e-nominais'),
    ('pdf:analista_administrativo:082', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'balanco-financeiro-no-setor-publico'),
    ('pdf:escriturario_agente_comercial:020', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:agente_de_policia_federal:060', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:018', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:017', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:agente_de_policia_federal:059', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:agente_de_policia_federal:057', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:analista_administrativo:091', 'patrimonio-publico-e-variacoes-patrimoniais', 'variacoes-patrimoniais-aumentativas-e-diminutivas-vpa-vpd'),
    ('pdf:agente_administrativo:029', 'geometria-plana-e-espacial', 'geometria-plana-perimetros-e-areas'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:072', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'arrecadacao-e-conta-unica-gru'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:033', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:escriturario_agente_comercial:017', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:analista_administrativo:111', 'sistemas-de-amortizacao', 'sistema-frances-tabela-price'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:036', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:pmsp-2024-soldado-pbm:item:023', 'aritmetica-e-algebra', 'equacoes-e-sistemas-do-primeiro-grau'),
    ('exam:bb-2021-escriturario-agente-comercial:item:028', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:029', 'juros-simples-e-compostos', 'regime-de-juros-compostos'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:071', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'estagios-da-despesa-empenho-liquidacao-e-pagamento'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:035', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:pmsp-2024-soldado-pbm:item:031', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('pdf:analista_administrativo:087', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'registro-de-direitos-e-obrigacoes-no-pcasp'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:064', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'lancamentos-contabeis-tipicos-do-setor-publico'),
    ('exam:pmsp-2024-soldado-pbm:item:022', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos'),
    ('exam:conab-2014-assistente-adm:item:014', 'porcentagem-e-proporcionalidade', 'razoes-proporcoes-e-regra-de-tres'),
    ('pdf:agente_administrativo:027', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('exam:bb-2021-escriturario-agente-comercial:item:019', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:analista_administrativo:083', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'registro-de-direitos-e-obrigacoes-no-pcasp'),
    ('pdf:policial_rodoviario_federal:028', 'aritmetica-e-algebra', 'funcoes-e-modelagem-matematica'),
    ('exam:bb-2021-escriturario-agente-comercial:item:016', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:pmsp-2024-soldado-pbm:item:034', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('exam:pmsp-2024-soldado-pbm:item:021', 'aritmetica-e-algebra', 'equacoes-e-sistemas-do-primeiro-grau'),
    ('exam:pmsp-2024-soldado-pbm:item:033', 'geometria-plana-e-espacial', 'geometria-espacial-volumes-e-capacidade'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:034', 'aritmetica-e-algebra', 'problemas-aritmeticos-e-algebraicos'),
    ('pdf:agente_de_policia_federal:058', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:074', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'restos-a-pagar-e-execucao-da-despesa'),
    ('exam:pmsp-2024-soldado-pbm:item:032', 'porcentagem-e-proporcionalidade', 'razoes-proporcoes-e-regra-de-tres'),
    ('pdf:agente_administrativo:028', 'geometria-plana-e-espacial', 'geometria-plana-perimetros-e-areas'),
    ('pdf:prova_conhec_espec_tec_federal_control_exter_tec_adm:065', 'plano-de-contas-aplicado-ao-setor-publico-pcasp', 'lancamentos-contabeis-tipicos-do-setor-publico'),
    ('pdf:tecnico_do_ministerio_publico_area_administrativa:039', 'aritmetica-e-algebra', 'principios-de-contagem-e-probabilidade-basica'),
    ('pdf:analista_administrativo:084', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'receitas-publicas-e-regimes-contabeis-lei-4320'),
    ('pdf:assistente_administrativo:014', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('pdf:analista_administrativo:098', 'demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'consolidacao-das-demonstracoes-contabeis'),
    ('pdf:analista_administrativo:116', 'porcentagem-e-proporcionalidade', 'razoes-proporcoes-e-regra-de-tres'),
    ('pdf:analista_administrativo:088', 'siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'restos-a-pagar-e-execucao-da-despesa'),
    ('pdf:dpf14_009_01:027', 'aritmetica-e-algebra', 'teoria-dos-conjuntos-e-diagramas-de-venn'),
    ('exam:conab-2014-assistente-adm:item:015', 'geometria-plana-e-espacial', 'geometria-plana-areas-de-poligonos'),
    ('exam:bb-2021-escriturario-agente-comercial:item:026', 'juros-simples-e-compostos', 'taxas-equivalentes-e-nominais'),
    ('pdf:analista_administrativo:093', 'conceitos-campo-de-atuacao-e-regimes-contabeis', 'ativo-imobilizado-e-intangivel-no-setor-publico'),
    ('pdf:analista_administrativo:092', 'patrimonio-publico-e-variacoes-patrimoniais', 'variacoes-patrimoniais-aumentativas-e-diminutivas-vpa-vpd'),
    ('pdf:tecnico_em_enfermagem:015', 'porcentagem-e-proporcionalidade', 'porcentagem-aumentos-e-descontos-sucessivos');

  -- Iterar sobre os 105 itens e aplicar as atualizacoes
  FOR v_rec IN (
    SELECT t.external_id, t.target_topic, t.subtopic_id, q.id AS question_id
    FROM temp_census_105 t
    JOIN public.questions q ON q.external_id = t.external_id
  ) LOOP
    -- 2.1 Atualizar topico primario na relacao existente
    UPDATE public.question_topic_relations
    SET topic_id = v_rec.target_topic
    WHERE question_id = v_rec.question_id AND relation_type = 'primary';

    -- 2.2 Inserir ou atualizar a relacao com o subtopico primario
    INSERT INTO public.question_subtopic_relations (question_id, subtopic_id, is_primary, sort_order)
    VALUES (v_rec.question_id, v_rec.subtopic_id, true, 1)
    ON CONFLICT (question_id, subtopic_id) DO UPDATE SET
      is_primary = true,
      sort_order = 1;

    v_fixed := v_fixed + 1;
  END LOOP;

  IF v_fixed <> 105 THEN
    RAISE EXCEPTION 'Falha de reconciliacao no Censo Expandido: esperado 105 itens, processado %', v_fixed;
  END IF;

  RAISE NOTICE 'Censo Expandido concluido com sucesso: % questoes vinculadas a subtopicos canônicos!', v_fixed;
END;
$$;
