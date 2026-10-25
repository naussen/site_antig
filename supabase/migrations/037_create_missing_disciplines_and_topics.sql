-- ==============================================================================
-- Migration: 037_create_missing_disciplines_and_topics.sql
-- Descricao: Cria disciplinas e topicos lacunares identificados durante o
--            saneamento das 1.251 questoes extraidas de PDFs.
--            Garante idempotencia estrita, adere aos schemas de disciplinas
--            (029/034) e topicos (001/022), e expande o catalogo canonico.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NOVAS DISCIPLINAS
-- ------------------------------------------------------------------------------

INSERT INTO public.disciplines (slug, name, status)
VALUES
  ('contabilidade-publica', 'Contabilidade Pública', 'active'),
  ('legislacao-de-transito', 'Legislação de Trânsito', 'active'),
  ('atualidades', 'Atualidades', 'active'),
  ('direitos-humanos', 'Direitos Humanos', 'active'),
  ('direito-ambiental', 'Direito Ambiental', 'active'),
  ('conhecimentos-bancarios', 'Conhecimentos Bancários', 'active'),
  ('vendas-e-negociacao', 'Vendas e Negociação', 'active'),
  ('legislacao-do-sus', 'Legislação do SUS', 'active'),
  ('legislacao-aplicada-a-ebserh', 'Legislação Aplicada à EBSERH', 'active'),
  ('lingua-inglesa', 'Língua Inglesa', 'active'),
  ('fisica', 'Física', 'active'),
  ('geografia', 'Geografia', 'active'),
  ('controle-externo', 'Controle Externo', 'active'),
  ('legislacao-municipal', 'Legislação Municipal', 'active'),
  ('relacoes-humanas-e-atendimento', 'Relações Humanas e Atendimento', 'active'),
  ('agencias-reguladoras-e-regulacao', 'Agências Reguladoras e Regulação', 'active')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. NOVOS TÓPICOS (DISCIPLINAS NOVAS E DISCIPLINAS EXISTENTES COM LACUNAS)
-- ------------------------------------------------------------------------------

INSERT INTO public.topics (topic_id, title, discipline, archived_at)
VALUES
  -- Contabilidade Pública
  ('conceitos-campo-de-atuacao-e-regimes-contabeis', 'Conceitos, Campo de Atuação e Regimes Contábeis', 'Contabilidade Pública', NULL),
  ('plano-de-contas-aplicado-ao-setor-publico-pcasp', 'Plano de Contas Aplicado ao Setor Público (PCASP)', 'Contabilidade Pública', NULL),
  ('demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp', 'Demonstrações Contábeis Aplicadas ao Setor Público (DCASP)', 'Contabilidade Pública', NULL),
  ('patrimonio-publico-e-variacoes-patrimoniais', 'Patrimônio Público e Variações Patrimoniais', 'Contabilidade Pública', NULL),
  ('siafi-e-execucao-orcamentaria-da-despesa-e-receita', 'SIAFI e Execução Orçamentária da Despesa e Receita', 'Contabilidade Pública', NULL),

  -- Legislação de Trânsito
  ('codigo-de-transito-brasileiro-ctb', 'Código de Trânsito Brasileiro (CTB)', 'Legislação de Trânsito', NULL),
  ('sistema-nacional-de-transito-snt', 'Sistema Nacional de Trânsito (SNT)', 'Legislação de Trânsito', NULL),
  ('normas-gerais-de-circulacao-e-conduta', 'Normas Gerais de Circulação e Conduta', 'Legislação de Trânsito', NULL),
  ('habilitacao-e-veiculos', 'Habilitação, Registro e Licenciamento de Veículos', 'Legislação de Trânsito', NULL),
  ('infracoes-e-penalidades-de-transito', 'Infrações, Penalidades e Medidas Administrativas', 'Legislação de Trânsito', NULL),
  ('resolucoes-do-contran', 'Resoluções do CONTRAN', 'Legislação de Trânsito', NULL),

  -- Atualidades
  ('geopolitica-e-relacoes-internacionais', 'Geopolítica e Relações Internacionais', 'Atualidades', NULL),
  ('sociedade-educacao-seguranca-e-cidadania', 'Sociedade, Educação, Segurança e Cidadania', 'Atualidades', NULL),
  ('economia-desenvolvimento-sustentavel-e-meio-ambiente', 'Economia, Desenvolvimento Sustentável e Meio Ambiente', 'Atualidades', NULL),
  ('mercado-financeiro-e-inovacao-tecnologica', 'Mercado Financeiro, Tecnologia e Inovação', 'Atualidades', NULL),

  -- Direitos Humanos
  ('declaracao-universal-dos-direitos-humanos-dudh', 'Declaração Universal dos Direitos Humanos (DUDH)', 'Direitos Humanos', NULL),
  ('pacto-de-sao-jose-da-costa-rica', 'Convenção Americana sobre Direitos Humanos (Pacto de São José)', 'Direitos Humanos', NULL),
  ('teoria-geral-e-evolucao-historica-dos-direitos-humanos', 'Teoria Geral, Gerações e Evolução Histórica dos Direitos Humanos', 'Direitos Humanos', NULL),
  ('afirmacao-historica-dos-direitos-humanos-no-brasil', 'Afirmação dos Direitos Humanos e Sistema Protetivo no Brasil', 'Direitos Humanos', NULL),

  -- Direito Ambiental
  ('politica-nacional-do-meio-ambiente-lei-6938', 'Política Nacional do Meio Ambiente (Lei nº 6.938/1981)', 'Direito Ambiental', NULL),
  ('crimes-ambientais-lei-9605', 'Crimes Ambientais e Sanções Penais (Lei nº 9.605/1998)', 'Direito Ambiental', NULL),
  ('sistema-nacional-de-unidades-de-conservacao-snuc', 'Sistema Nacional de Unidades de Conservação (SNUC - Lei nº 9.985/2000)', 'Direito Ambiental', NULL),
  ('licenciamento-ambiental-e-responsabilidade-ambiental', 'Licenciamento Ambiental e Responsabilidade Civil por Danos Ambientais', 'Direito Ambiental', NULL),

  -- Conhecimentos Bancários
  ('sistema-financeiro-nacional-sfn', 'Estrutura do Sistema Financeiro Nacional (SFN)', 'Conhecimentos Bancários', NULL),
  ('banco-central-do-brasil-e-cmn', 'Banco Central do Brasil (BACEN) e Conselho Monetário Nacional (CMN)', 'Conhecimentos Bancários', NULL),
  ('produtos-e-servicos-bancarios', 'Produtos e Serviços Bancários (Depósitos, Créditos e Cartões)', 'Conhecimentos Bancários', NULL),
  ('mercado-de-cambio-e-capitais', 'Mercado de Câmbio, Capitais e Títulos Públicos', 'Conhecimentos Bancários', NULL),
  ('garantias-do-sistema-financeiro-nacional', 'Garantias do Sistema Financeiro Nacional', 'Conhecimentos Bancários', NULL),

  -- Vendas e Negociação
  ('tecnicas-de-vendas-e-atendimento-ao-cliente', 'Técnicas de Vendas e Atendimento ao Cliente', 'Vendas e Negociação', NULL),
  ('comportamento-do-consumidor-e-satisfacao', 'Comportamento do Consumidor e Satisfação', 'Vendas e Negociação', NULL),
  ('negociacao-e-gestao-de-conflitos', 'Técnicas de Negociação e Gestão de Conflitos', 'Vendas e Negociação', NULL),
  ('etica-e-conduta-profissional-em-vendas', 'Ética, Ouvidoria e Conduta Profissional', 'Vendas e Negociação', NULL),

  -- Legislação do SUS
  ('principios-e-diretrizes-do-sus-cf-88', 'Princípios e Diretrizes do SUS na Constituição Federal de 1988', 'Legislação do SUS', NULL),
  ('lei-organica-da-saude-lei-8080-e-8142', 'Lei Orgânica da Saúde (Lei nº 8.080/1990 e Lei nº 8.142/1990)', 'Legislação do SUS', NULL),
  ('organizacao-e-financiamento-do-sus', 'Organização, Gestão e Financiamento do SUS', 'Legislação do SUS', NULL),
  ('decreto-7508-2011-e-redes-de-atencao-a-saude', 'Decreto nº 7.508/2011 e Redes de Atenção à Saúde', 'Legislação do SUS', NULL),

  -- Legislação Aplicada à EBSERH
  ('lei-de-criacao-da-ebserh-lei-12550', 'Lei de Criação da EBSERH (Lei nº 12.550/2011)', 'Legislação Aplicada à EBSERH', NULL),
  ('regimento-interno-e-estatuto-social-da-ebserh', 'Regimento Interno e Estatuto Social da EBSERH', 'Legislação Aplicada à EBSERH', NULL),
  ('codigo-de-etica-e-conduta-da-ebserh', 'Código de Ética e Conduta da EBSERH', 'Legislação Aplicada à EBSERH', NULL),

  -- Língua Inglesa
  ('reading-comprehension', 'Reading Comprehension and Text Interpretation', 'Língua Inglesa', NULL),
  ('vocabulary-and-semantics', 'Vocabulary and Semantics', 'Língua Inglesa', NULL),
  ('grammatical-structures', 'Grammar and Sentence Structures', 'Língua Inglesa', NULL),

  -- Física
  ('cinematica-e-dinamica', 'Cinemática Vetorial e Leis de Newton', 'Física', NULL),
  ('trabalho-energia-e-colisoes', 'Trabalho, Energia e Choques Mecânicos', 'Física', NULL),
  ('gravitacao-estatica-e-hidrostatica', 'Gravitação, Estática e Hidrostática', 'Física', NULL),
  ('ondas-optica-e-termodinamica', 'Ondas, Óptica e Termodinâmica', 'Física', NULL),

  -- Geografia
  ('geografia-urbana-e-rede-de-cidades', 'Geografia Urbana, Hierarquia e Rede de Cidades no Brasil', 'Geografia', NULL),
  ('geografia-economica-e-transportes-no-brasil', 'Geografia Econômica e Matriz de Transportes no Brasil', 'Geografia', NULL),
  ('populacao-e-demografia-brasileira', 'População, Demografia e Dinâmica Migratória', 'Geografia', NULL),
  ('dominios-morfoclimaticos-e-recursos-naturais', 'Domínios Morfoclimáticos e Recursos Naturais', 'Geografia', NULL),

  -- Controle Externo
  ('controle-da-administracao-publica-e-tribunais-de-contas', 'Controle da Administração Pública e Tribunais de Contas', 'Controle Externo', NULL),
  ('lei-organica-do-tcu-lei-8443', 'Lei Orgânica do TCU (Lei nº 8.443/1992)', 'Controle Externo', NULL),
  ('fiscalizacao-contabil-financeira-e-orcamentaria-na-cf-88', 'Fiscalização Contábil, Financeira e Orçamentária na CF/88', 'Controle Externo', NULL),
  ('tomada-e-prestacao-de-contas', 'Tomada e Prestação de Contas', 'Controle Externo', NULL),

  -- Legislação Municipal
  ('lei-organica-municipal', 'Lei Orgânica Municipal', 'Legislação Municipal', NULL),
  ('estatuto-dos-servidores-publicos-municipais', 'Estatuto dos Servidores Públicos Municipais', 'Legislação Municipal', NULL),
  ('regime-juridico-e-normas-locais', 'Regime Jurídico e Normas Locais do Município', 'Legislação Municipal', NULL),

  -- Relações Humanas e Atendimento
  ('relacionamento-interpessoal-e-comunicacao-assertiva', 'Relacionamento Interpessoal e Comunicação Assertiva', 'Relações Humanas e Atendimento', NULL),
  ('atendimento-ao-cidadao-e-qualidade-no-servico-publico', 'Atendimento ao Cidadão e Qualidade no Serviço Público', 'Relações Humanas e Atendimento', NULL),
  ('trabalho-em-equipe-e-gestao-de-conflitos', 'Trabalho em Equipe e Gestão de Conflitos', 'Relações Humanas e Atendimento', NULL),

  -- Agências Reguladoras e Regulação
  ('agencias-reguladoras-marcos-legais-e-atribuicoes', 'Agências Reguladoras, Marcos Legais e Atribuições', 'Agências Reguladoras e Regulação', NULL),
  ('processo-regulatorio-e-participacao-social', 'Processo Regulatório, Audiências Públicas e Participação Social', 'Agências Reguladoras e Regulação', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Português
  ('compreensao-e-interpretacao-de-textos', 'Compreensão e Interpretação de Textos', 'Português', NULL),
  ('semantica-e-significacao-das-palavras', 'Semântica e Significação das Palavras', 'Português', NULL),
  ('tipologia-textual-e-generos-discursivos', 'Tipologia Textual e Gêneros Discursivos', 'Português', NULL),
  ('ortografia-e-acentuacao-grafica', 'Ortografia Oficial e Acentuação Gráfica', 'Português', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Informática
  ('sistemas-operacionais-windows-e-linux', 'Sistemas Operacionais (Windows e Linux)', 'Informática', NULL),
  ('ferramentas-de-escritorio-office-e-libreoffice', 'Ferramentas de Escritório (Microsoft Office e LibreOffice)', 'Informática', NULL),
  ('redes-de-computadores-e-conectividade', 'Redes de Computadores e Conectividade', 'Informática', NULL),
  ('conceitos-de-internet-navegadores-e-pesquisa', 'Conceitos de Internet, Navegadores e Pesquisa Avançada', 'Informática', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Direito Administrativo
  ('poderes-administrativos', 'Poderes Administrativos', 'Direito Administrativo', NULL),
  ('servicos-publicos', 'Serviços Públicos e Concessões', 'Direito Administrativo', NULL),
  ('regime-juridico-dos-servidores-lei-8112', 'Regime Jurídico dos Servidores Públicos (Lei nº 8.112/1990)', 'Direito Administrativo', NULL),
  ('processo-administrativo-federal-lei-9784', 'Processo Administrativo Federal (Lei nº 9.784/1999)', 'Direito Administrativo', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Direito Constitucional
  ('nacionalidade-e-direitos-politicos', 'Nacionalidade e Direitos Políticos', 'Direito Constitucional', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Direito Penal
  ('crimes-contra-a-administracao-publica', 'Crimes contra a Administração Pública', 'Direito Penal', NULL),
  ('crimes-contra-a-fe-publica', 'Crimes contra a Fé Pública', 'Direito Penal', NULL),
  ('crimes-contra-o-patrimonio', 'Crimes contra o Patrimônio', 'Direito Penal', NULL),
  ('crimes-contra-a-pessoa', 'Crimes contra a Pessoa', 'Direito Penal', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Direito Processual Penal
  ('prisao-e-liberdade-provisoria', 'Prisão Cautelar e Liberdade Provisória', 'Direito Processual Penal', NULL),
  ('inquerito-policial', 'Inquérito Policial', 'Direito Processual Penal', NULL),
  ('provas-no-processo-penal', 'Provas no Processo Penal', 'Direito Processual Penal', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Direito Previdenciário
  ('evolucao-historica-e-principios-da-seguridade-social', 'Evolução Histórica e Princípios da Seguridade Social', 'Direito Previdenciário', NULL),
  ('beneficios-do-regime-geral-de-previdencia-social', 'Benefícios do Regime Geral de Previdência Social (RGPS)', 'Direito Previdenciário', NULL),
  ('segurados-e-dependentes-do-rgps', 'Segurados e Dependentes do RGPS', 'Direito Previdenciário', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Ética no Serviço Público
  ('decreto-1171-1994', 'Código de Ética Profissional (Decreto nº 1.171/1994)', 'Ética no Serviço Público', NULL),
  ('etica-cidadania-e-democracia', 'Ética, Moral, Cidadania e Democracia', 'Ética no Serviço Público', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Administração Geral
  ('gestao-por-competencias', 'Gestão por Competências', 'Administração Geral', NULL),
  ('gestao-de-pessoas-e-desenvolvimento-organizacional', 'Gestão de Pessoas e Desenvolvimento Organizacional', 'Administração Geral', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Administração de Recursos Materiais
  ('gestao-de-estoques-e-reposicao', 'Gestão de Estoques, Ressuprimento e Reposição', 'Administração de Recursos Materiais', NULL),
  ('movimentacao-e-transporte-de-materiais', 'Movimentação, Transporte e Armazenamento de Materiais', 'Administração de Recursos Materiais', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Administração Financeira e Orçamentária
  ('principios-orcamentarios', 'Princípios Orçamentários', 'Administração Financeira e Orçamentária', NULL),
  ('planejamento-e-leis-orcamentarias-ppa-ldo-loa', 'Planejamento e Leis Orçamentárias (PPA, LDO e LOA)', 'Administração Financeira e Orçamentária', NULL),
  ('creditos-adicionais', 'Créditos Adicionais', 'Administração Financeira e Orçamentária', NULL),
  ('despesa-publica-etapas-e-estagios', 'Despesa Pública: Etapas e Estágios da Execução', 'Administração Financeira e Orçamentária', NULL),

  -- Topicos Lacunares em Disciplinas Existentes: Arquivologia
  ('gestao-de-documentos-e-ciclo-vital', 'Gestão de Documentos e Ciclo Vital (Teoria das Três Idades)', 'Arquivologia', NULL),
  ('classificacao-e-tabela-de-temporalidade', 'Classificação, Tabela de Temporalidade e Destinação de Documentos', 'Arquivologia', NULL),
  ('sistemas-informatizados-sigad', 'Sistemas Informatizados de Gestão Arquivística (SIGAD)', 'Arquivologia', NULL)
ON CONFLICT (topic_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. VINCULAÇÃO DE TÓPICOS ÀS DISCIPLINAS (topic_discipline_relations)
-- ------------------------------------------------------------------------------

INSERT INTO public.topic_discipline_relations (topic_id, discipline_id, is_primary)
SELECT
  topic.topic_id,
  discipline.id,
  true
FROM public.topics AS topic
JOIN public.disciplines AS discipline
  ON discipline.name = topic.discipline
ON CONFLICT (topic_id, discipline_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. COMENTÁRIOS EXPLICATIVOS NO DICIONÁRIO DE DADOS
-- ------------------------------------------------------------------------------

COMMENT ON TABLE public.disciplines IS
  'Catálogo normalizado de disciplinas para questões e simulados (atualizado com novas áreas de concurso).';
COMMENT ON TABLE public.topic_discipline_relations IS
  'Mapeamento N:N entre tópicos canônicos e disciplinas com indicação de pertinência primária.';
