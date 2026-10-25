import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Ambiente Supabase administrativo indisponível.");
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Novas Disciplinas da Migration 037
const NEW_DISCIPLINES = [
  { slug: "contabilidade-publica", name: "Contabilidade Pública", status: "active" },
  { slug: "legislacao-de-transito", name: "Legislação de Trânsito", status: "active" },
  { slug: "atualidades", name: "Atualidades", status: "active" },
  { slug: "direitos-humanos", name: "Direitos Humanos", status: "active" },
  { slug: "direito-ambiental", name: "Direito Ambiental", status: "active" },
  { slug: "conhecimentos-bancarios", name: "Conhecimentos Bancários", status: "active" },
  { slug: "vendas-e-negociacao", name: "Vendas e Negociação", status: "active" },
  { slug: "legislacao-do-sus", name: "Legislação do SUS", status: "active" },
  { slug: "legislacao-aplicada-a-ebserh", name: "Legislação Aplicada à EBSERH", status: "active" },
  { slug: "lingua-inglesa", name: "Língua Inglesa", status: "active" },
  { slug: "fisica", name: "Física", status: "active" },
  { slug: "geografia", name: "Geografia", status: "active" },
  { slug: "controle-externo", name: "Controle Externo", status: "active" },
  { slug: "legislacao-municipal", name: "Legislação Municipal", status: "active" },
  { slug: "relacoes-humanas-e-atendimento", name: "Relações Humanas e Atendimento", status: "active" },
  { slug: "agencias-reguladoras-e-regulacao", name: "Agências Reguladoras e Regulação", status: "active" },
];

// 2. Novos Tópicos da Migration 037 (98 tópicos)
const NEW_TOPICS = [
  // Contabilidade Pública
  { topic_id: "conceitos-campo-de-atuacao-e-regimes-contabeis", title: "Conceitos, Campo de Atuação e Regimes Contábeis", discipline: "Contabilidade Pública" },
  { topic_id: "plano-de-contas-aplicado-ao-setor-publico-pcasp", title: "Plano de Contas Aplicado ao Setor Público (PCASP)", discipline: "Contabilidade Pública" },
  { topic_id: "demonstracoes-contabeis-aplicadas-ao-setor-publico-dcasp", title: "Demonstrações Contábeis Aplicadas ao Setor Público (DCASP)", discipline: "Contabilidade Pública" },
  { topic_id: "patrimonio-publico-e-variacoes-patrimoniais", title: "Patrimônio Público e Variações Patrimoniais", discipline: "Contabilidade Pública" },
  { topic_id: "siafi-e-execucao-orcamentaria-da-despesa-e-receita", title: "SIAFI e Execução Orçamentária da Despesa e Receita", discipline: "Contabilidade Pública" },

  // Legislação de Trânsito
  { topic_id: "codigo-de-transito-brasileiro-ctb", title: "Código de Trânsito Brasileiro (CTB)", discipline: "Legislação de Trânsito" },
  { topic_id: "sistema-nacional-de-transito-snt", title: "Sistema Nacional de Trânsito (SNT)", discipline: "Legislação de Trânsito" },
  { topic_id: "normas-gerais-de-circulacao-e-conduta", title: "Normas Gerais de Circulação e Conduta", discipline: "Legislação de Trânsito" },
  { topic_id: "infracoes-de-transito-e-penalidades", title: "Infrações de Trânsito e Penalidades", discipline: "Legislação de Trânsito" },
  { topic_id: "medidas-administrativas-e-processo-administrativo", title: "Medidas Administrativas e Processo Administrativo", discipline: "Legislação de Trânsito" },
  { topic_id: "crimes-de-transito", title: "Crimes de Trânsito", discipline: "Legislação de Trânsito" },
  { topic_id: "resolucoes-do-contran", title: "Resoluções do CONTRAN", discipline: "Legislação de Trânsito" },
  { topic_id: "veiculos-registro-licenciamento-e-conducao", title: "Veículos: Registro, Licenciamento e Condução", discipline: "Legislação de Trânsito" },
  { topic_id: "habilitacao-e-formacao-de-condutores", title: "Habilitação e Formação de Condutores", discipline: "Legislação de Trânsito" },

  // Atualidades
  { topic_id: "sociedade-seguranca-publica-e-cidadania", title: "Sociedade, Segurança Pública e Cidadania", discipline: "Atualidades" },
  { topic_id: "meio-ambiente-e-sustentabilidade-global", title: "Meio Ambiente e Sustentabilidade Global", discipline: "Atualidades" },
  { topic_id: "politica-e-economia-nacional-e-internacional", title: "Política e Economia Nacional e Internacional", discipline: "Atualidades" },
  { topic_id: "tecnologia-inovacao-e-sociedade-da-informacao", title: "Tecnologia, Inovação e Sociedade da Informação", discipline: "Atualidades" },
  { topic_id: "geopolitica-e-relacoes-internacionais", title: "Geopolítica e Relações Internacionais", discipline: "Atualidades" },

  // Direitos Humanos
  { topic_id: "teoria-geral-dos-direitos-humanos", title: "Teoria Geral dos Direitos Humanos", discipline: "Direitos Humanos" },
  { topic_id: "declaracao-universal-dos-direitos-humanos-dudh", title: "Declaração Universal dos Direitos Humanos (DUDH)", discipline: "Direitos Humanos" },
  { topic_id: "convencao-americana-sobre-direitos-humanos-pacto-de-san-jose", title: "Convenção Americana sobre Direitos Humanos (Pacto de San José)", discipline: "Direitos Humanos" },
  { topic_id: "sistema-interamericano-de-direitos-humanos", title: "Sistema Interamericano de Direitos Humanos", discipline: "Direitos Humanos" },
  { topic_id: "direitos-humanos-na-constituicao-federal", title: "Direitos Humanos na Constituição Federal", discipline: "Direitos Humanos" },
  { topic_id: "grupos-vulneraveis-e-minorias", title: "Proteção a Grupos Vulneráveis e Minorias", discipline: "Direitos Humanos" },

  // Direito Ambiental
  { topic_id: "politica-nacional-do-meio-ambiente-pnma-lei-6938", title: "Política Nacional do Meio Ambiente (Lei nº 6.938/1981)", discipline: "Direito Ambiental" },
  { topic_id: "artigo-225-da-constituicao-federal", title: "Artigo 225 da Constituição Federal", discipline: "Direito Ambiental" },
  { topic_id: "crimes-ambientais-lei-9605", title: "Lei de Crimes Ambientais (Lei nº 9.605/1998)", discipline: "Direito Ambiental" },
  { topic_id: "sistema-nacional-de-unidades-de-conservacao-snuc-lei-9985", title: "Sistema Nacional de Unidades de Conservação (Lei nº 9.985/2000)", discipline: "Direito Ambiental" },
  { topic_id: "codigo-florestal-lei-12651", title: "Código Florestal (Lei nº 12.651/2012)", discipline: "Direito Ambiental" },
  { topic_id: "competencias-ambientais-lc-140", title: "Competências Ambientais (Lei Complementar nº 140/2011)", discipline: "Direito Ambiental" },
  { topic_id: "licenciamento-e-avaliacao-de-impacto-ambiental-eia-rima", title: "Licenciamento e Avaliação de Impacto Ambiental (EIA/RIMA)", discipline: "Direito Ambiental" },

  // Conhecimentos Bancários
  { topic_id: "sistema-financeiro-nacional-sfn", title: "Sistema Financeiro Nacional (SFN)", discipline: "Conhecimentos Bancários" },
  { topic_id: "banco-central-do-brasil-e-cmn", title: "Banco Central do Brasil (Bacen) e Conselho Monetário Nacional (CMN)", discipline: "Conhecimentos Bancários" },
  { topic_id: "produtos-bancarios-credito-depositos-e-investimentos", title: "Produtos Bancários: Crédito, Depósitos e Investimentos", discipline: "Conhecimentos Bancários" },
  { topic_id: "mercado-de-cambio-e-operacoes-com-moeda-estrangeira", title: "Mercado de Câmbio e Operações com Moeda Estrangeira", discipline: "Conhecimentos Bancários" },
  { topic_id: "garantias-do-sistema-financeiro-aval-fianca-penhor-e-hipoteca", title: "Garantias do Sistema Financeiro (Aval, Fiança, Penhor, Hipoteca)", discipline: "Conhecimentos Bancários" },
  { topic_id: "prevencao-a-lavagem-de-dinheiro-lei-9613", title: "Prevenção à Lavagem de Dinheiro (Lei nº 9.613/1998)", discipline: "Conhecimentos Bancários" },
  { topic_id: "pix-open-finance-e-moedas-digitais", title: "Inovações Financeiras: Pix, Open Finance e Moedas Digitais", discipline: "Conhecimentos Bancários" },

  // Vendas e Negociação
  { topic_id: "tecnicas-de-vendas-e-atendimento-ao-cliente", title: "Técnicas de Vendas e Atendimento ao Cliente", discipline: "Vendas e Negociação" },
  { topic_id: "marketing-de-relacionamento-e-crm", title: "Marketing de Relacionamento e CRM", discipline: "Vendas e Negociação" },
  { topic_id: "resolucao-de-conflitos-e-negociacao", title: "Resolução de Conflitos e Negociação", discipline: "Vendas e Negociação" },
  { topic_id: "satisfacao-retencao-e-fidelizacao-de-clientes", title: "Satisfação, Retenção e Fidelização de Clientes", discipline: "Vendas e Negociação" },
  { topic_id: "etica-e-conduta-profissional-nas-vendas", title: "Ética e Conduta Profissional nas Vendas", discipline: "Vendas e Negociação" },

  // Legislação do SUS
  { topic_id: "evolucao-historica-e-principios-do-sus", title: "Evolução Histórica e Princípios do SUS", discipline: "Legislação do SUS" },
  { topic_id: "lei-organica-da-saude-lei-8080", title: "Lei Orgânica da Saúde (Lei nº 8.080/1990)", discipline: "Legislação do SUS" },
  { topic_id: "participacao-da-comunidade-e-transferencia-de-recursos-lei-8142", title: "Participação da Comunidade e Recursos do SUS (Lei nº 8.142/1990)", discipline: "Legislação do SUS" },
  { topic_id: "decreto-7508-organizacao-e-planejamento-do-sus", title: "Organização e Planejamento do SUS (Decreto nº 7.508/2011)", discipline: "Legislação do SUS" },
  { topic_id: "politica-nacional-de-atencao-basica-pnab", title: "Política Nacional de Atenção Básica (PNAB)", discipline: "Legislação do SUS" },
  { topic_id: "vigilancia-em-saude-sanitaria-epidemiologica-e-ambiental", title: "Vigilância em Saúde: Sanitária, Epidemiológica e Ambiental", discipline: "Legislação do SUS" },

  // Legislação Aplicada à EBSERH
  { topic_id: "criacao-da-ebserh-lei-12550", title: "Criação da EBSERH (Lei nº 12.550/2011)", discipline: "Legislação Aplicada à EBSERH" },
  { topic_id: "estatuto-social-da-ebserh", title: "Estatuto Social da EBSERH", discipline: "Legislação Aplicada à EBSERH" },
  { topic_id: "regimento-interno-e-regulamento-de-pessoal-ebserh", title: "Regimento Interno e Regulamento de Pessoal da EBSERH", discipline: "Legislação Aplicada à EBSERH" },
  { topic_id: "codigo-de-etica-e-conduta-da-ebserh", title: "Código de Ética e Conduta da EBSERH", discipline: "Legislação Aplicada à EBSERH" },
  { topic_id: "regulamento-de-licitacoes-e-contratos-da-ebserh", title: "Regulamento Próprio de Licitações e Contratos da EBSERH", discipline: "Legislação Aplicada à EBSERH" },

  // Língua Inglesa
  { topic_id: "compreensao-e-interpretacao-de-textos-em-ingles", title: "Compreensão e Interpretação de Textos em Língua Inglesa", discipline: "Língua Inglesa" },
  { topic_id: "vocabulario-sinonimos-e-antonimos-em-ingles", title: "Vocabulário, Sinônimos e Antônimos em Língua Inglesa", discipline: "Língua Inglesa" },
  { topic_id: "gramatica-tempos-verbais-e-conectores-em-ingles", title: "Estruturas Gramaticais, Tempos Verbais e Conectivos em Língua Inglesa", discipline: "Língua Inglesa" },

  // Física
  { topic_id: "cinematica-escalar-e-vetorial", title: "Cinemática Escalar e Vetorial", discipline: "Física" },
  { topic_id: "leis-de-newton-e-aplicacoes", title: "Leis de Newton e Aplicações", discipline: "Física" },
  { topic_id: "trabalho-energia-e-conservacao-da-energia-mecanica", title: "Trabalho, Energia e Conservação da Energia Mecânica", discipline: "Física" },
  { topic_id: "impulso-quantidade-de-movimento-e-colisoes", title: "Impulso, Quantidade de Movimento e Colisões", discipline: "Física" },
  { topic_id: "ondulatoria-optica-e-acustica", title: "Ondulatória, Óptica e Acústica", discipline: "Física" },

  // Geografia
  { topic_id: "geografia-do-brasil-relevo-clima-e-vegetacao", title: "Geografia do Brasil: Relevo, Clima e Vegetação", discipline: "Geografia" },
  { topic_id: "populacao-urbanizacao-e-demografia-brasileira", title: "População, Urbanização e Demografia Brasileira", discipline: "Geografia" },
  { topic_id: "infraestrutura-transportes-e-energia-no-brasil", title: "Infraestrutura, Transportes e Matriz Energética no Brasil", discipline: "Geografia" },
  { topic_id: "agropecuaria-industria-e-economia-regional", title: "Agropecuária, Indústria e Economia Regional", discipline: "Geografia" },

  // Controle Externo
  { topic_id: "tribunais-de-contas-funcoes-e-competencias-constitucionais", title: "Tribunais de Contas: Funções e Competências Constitucionais", discipline: "Controle Externo" },
  { topic_id: "lei-organica-e-regimento-interno-do-tcu", title: "Lei Orgânica e Regimento Interno do TCU", discipline: "Controle Externo" },
  { topic_id: "fiscalizacao-contabil-financeira-e-orcamentaria", title: "Fiscalização Contábil, Financeira e Orçamentária", discipline: "Controle Externo" },
  { topic_id: "julgamento-de-contas-e-processo-no-tcu", title: "Julgamento de Contas e Processos no TCU", discipline: "Controle Externo" },

  // Legislação Municipal
  { topic_id: "lei-organica-municipal", title: "Lei Orgânica Municipal", discipline: "Legislação Municipal" },
  { topic_id: "estatuto-dos-servidores-publicos-municipais", title: "Estatuto dos Servidores Públicos Municipais", discipline: "Legislação Municipal" },
  { topic_id: "estrutura-e-organizacao-da-administracao-municipal", title: "Estrutura e Organização da Administração Municipal", discipline: "Legislação Municipal" },

  // Relações Humanas e Atendimento
  { topic_id: "comunicacao-interpessoal-e-trabalho-em-equipe", title: "Comunicação Interpessoal e Trabalho em Equipe", discipline: "Relações Humanas e Atendimento" },
  { topic_id: "qualidade-no-atendimento-ao-cidadao-e-ao-usuario", title: "Qualidade no Atendimento ao Cidadão e ao Usuário", discipline: "Relações Humanas e Atendimento" },
  { topic_id: "gestao-de-conflitos-e-relacionamento-no-ambiente-de-trabalho", title: "Gestão de Conflitos e Relacionamento no Trabalho", discipline: "Relações Humanas e Atendimento" },

  // Agências Reguladoras e Regulação
  { topic_id: "lei-geral-das-agencias-reguladoras-lei-13848", title: "Lei Geral das Agências Reguladoras (Lei nº 13.848/2019)", discipline: "Agências Reguladoras e Regulação" },
  { topic_id: "legislacao-da-anvisa-e-ans", title: "Legislação da ANVISA e da ANS", discipline: "Agências Reguladoras e Regulação" },
  { topic_id: "processo-regulatorio-e-analise-de-impacto-regulatorio-air", title: "Processo Regulatório e Análise de Impacto Regulatório (AIR)", discipline: "Agências Reguladoras e Regulação" },

  // Tópicos Lacunares em Disciplinas Existentes: Direito Administrativo
  { topic_id: "nova-lei-de-licitacoes-e-contratos-lei-14133", title: "Nova Lei de Licitações e Contratos (Lei nº 14.133/2021)", discipline: "Direito Administrativo" },
  { topic_id: "lei-de-acesso-a-informacao-lai-lei-12527", title: "Lei de Acesso à Informação (Lei nº 12.527/2011)", discipline: "Direito Administrativo" },
  { topic_id: "regime-juridico-dos-servidores-lei-8112", title: "Regime Jurídico dos Servidores Públicos (Lei nº 8.112/1990)", discipline: "Direito Administrativo" },
  { topic_id: "processo-administrativo-federal-lei-9784", title: "Processo Administrativo Federal (Lei nº 9.784/1999)", discipline: "Direito Administrativo" },

  // Tópicos Lacunares em Disciplinas Existentes: Direito Constitucional
  { topic_id: "nacionalidade-e-direitos-politicos", title: "Nacionalidade e Direitos Políticos", discipline: "Direito Constitucional" },

  // Tópicos Lacunares em Disciplinas Existentes: Direito Penal
  { topic_id: "crimes-contra-a-administracao-publica", title: "Crimes contra a Administração Pública", discipline: "Direito Penal" },
  { topic_id: "crimes-contra-a-fe-publica", title: "Crimes contra a Fé Pública", discipline: "Direito Penal" },
  { topic_id: "crimes-contra-o-patrimonio", title: "Crimes contra o Patrimônio", discipline: "Direito Penal" },
  { topic_id: "crimes-contra-a-pessoa", title: "Crimes contra a Pessoa", discipline: "Direito Penal" },

  // Tópicos Lacunares em Disciplinas Existentes: Direito Processual Penal
  { topic_id: "prisao-e-liberdade-provisoria", title: "Prisão Cautelar e Liberdade Provisória", discipline: "Direito Processual Penal" },
  { topic_id: "inquerito-policial-e-investigacao-criminal", title: "Inquérito Policial e Investigação Criminal", discipline: "Direito Processual Penal" },
  { topic_id: "provas-no-processo-penal", title: "Provas no Processo Penal", discipline: "Direito Processual Penal" },

  // Tópicos Lacunares em Disciplinas Existentes: Legislação Penal Especial
  { topic_id: "estatuto-do-desarmamento-lei-10826", title: "Estatuto do Desarmamento (Lei nº 10.826/2003)", discipline: "Legislação Penal Especial" },
  { topic_id: "lei-de-drogas-lei-11343", title: "Lei de Drogas (Lei nº 11.343/2006)", discipline: "Legislação Penal Especial" },
  { topic_id: "crimes-hediondos-lei-8072", title: "Lei dos Crimes Hediondos (Lei nº 8.072/1990)", discipline: "Legislação Penal Especial" },
  { topic_id: "organizacoes-criminosas-lei-12850", title: "Organizações Criminosas (Lei nº 12.850/2013)", discipline: "Legislação Penal Especial" },
  { topic_id: "abuso-de-autoridade-lei-13869", title: "Lei de Abuso de Autoridade (Lei nº 13.869/2019)", discipline: "Legislação Penal Especial" },
  { topic_id: "tortura-lei-9455", title: "Lei de Tortura (Lei nº 9.455/1997)", discipline: "Legislação Penal Especial" },

  // Tópicos Lacunares em Disciplinas Existentes: Direito Previdenciário
  { topic_id: "beneficios-previdenciarios-regime-geral-rgps", title: "Benefícios do Regime Geral de Previdência Social (RGPS)", discipline: "Direito Previdenciário" },
  { topic_id: "segurados-do-regime-geral-de-previdencia-social", title: "Segurados e Dependentes do RGPS", discipline: "Direito Previdenciário" },
  { topic_id: "financiamento-da-seguridade-social-e-contribuicoes", title: "Financiamento da Seguridade Social e Contribuições Previdenciárias", discipline: "Direito Previdenciário" },
  { topic_id: "seguridade-social-principios-e-diretrizes-constitucionais", title: "Seguridade Social: Princípios e Diretrizes Constitucionais", discipline: "Direito Previdenciário" },

  // Tópicos Lacunares em Disciplinas Existentes: AFO
  { topic_id: "lei-de-responsabilidade-fiscal-lrf-lc-101", title: "Lei de Responsabilidade Fiscal (LRF - Lei Complementar nº 101/2000)", discipline: "Administração Financeira e Orçamentária" },
  { topic_id: "receita-publica-classificacoes-e-estagios", title: "Receita Pública: Classificações e Estágios da Execução", discipline: "Administração Financeira e Orçamentária" },
  { topic_id: "despesa-publica-etapas-e-estagios", title: "Despesa Pública: Etapas e Estágios da Execução", discipline: "Administração Financeira e Orçamentária" },

  // Tópicos Lacunares em Disciplinas Existentes: Arquivologia
  { topic_id: "gestao-de-documentos-e-ciclo-vital", title: "Gestão de Documentos e Ciclo Vital (Teoria das Três Idades)", discipline: "Arquivologia" },
  { topic_id: "classificacao-e-tabela-de-temporalidade", title: "Classificação, Tabela de Temporalidade e Destinação de Documentos", discipline: "Arquivologia" },
  { topic_id: "sistemas-informatizados-sigad", title: "Sistemas Informatizados de Gestão Arquivística (SIGAD)", discipline: "Arquivologia" },
];

async function applyMigration() {
  console.log("Aplicando Migration 037 de forma estritamente aditiva...");

  // 1. Inserir Disciplinas (ON CONFLICT DO NOTHING)
  console.log(`\nInserindo ${NEW_DISCIPLINES.length} disciplinas...`);
  const { data: dData, error: dError } = await supabase
    .from("disciplines")
    .upsert(NEW_DISCIPLINES, { onConflict: "slug", ignoreDuplicates: true })
    .select();
  if (dError) throw new Error(`Falha ao inserir disciplinas: ${dError.message}`);
  console.log("Disciplinas sincronizadas com sucesso.");

  // Obter mapa completo de disciplinas ativas (slug -> id, name -> id)
  const { data: allDisc, error: discErr } = await supabase
    .from("disciplines")
    .select("id, slug, name, status");
  if (discErr) throw new Error(`Falha ao carregar disciplinas: ${discErr.message}`);
  const discByName = new Map(allDisc.map(d => [d.name, d.id]));
  const discBySlug = new Map(allDisc.map(d => [d.slug, d.id]));

  // 2. Inserir Tópicos (ON CONFLICT DO NOTHING)
  console.log(`\nInserindo ${NEW_TOPICS.length} tópicos...`);
  const topicsToInsert = NEW_TOPICS.map(t => ({
    topic_id: t.topic_id,
    title: t.title,
    discipline: t.discipline,
    archived_at: null
  }));

  const { data: tData, error: tError } = await supabase
    .from("topics")
    .upsert(topicsToInsert, { onConflict: "topic_id", ignoreDuplicates: true })
    .select();
  if (tError) throw new Error(`Falha ao inserir tópicos: ${tError.message}`);
  console.log("Tópicos sincronizados com sucesso.");

  // 3. Inserir Relações Tópico-Disciplina (ON CONFLICT DO NOTHING)
  console.log(`\nInserindo relações de tópicos primários...`);
  const relationsToInsert = [];
  for (const t of NEW_TOPICS) {
    const discId = discByName.get(t.discipline);
    if (!discId) {
      console.warn(`Aviso: Disciplina '${t.discipline}' não encontrada para tópico '${t.topic_id}'`);
      continue;
    }
    relationsToInsert.push({
      topic_id: t.topic_id,
      discipline_id: discId,
      is_primary: true
    });
  }

  const { data: rData, error: rError } = await supabase
    .from("topic_discipline_relations")
    .upsert(relationsToInsert, { onConflict: "topic_id,discipline_id", ignoreDuplicates: true })
    .select();
  if (rError) throw new Error(`Falha ao inserir relações: ${rError.message}`);
  console.log(`Relações primárias sincronizadas com sucesso (${relationsToInsert.length} relações).`);

  console.log("\n========================================================");
  console.log("MIGRATION 037 APLICADA COM SUCESSO DE FORMA PURAMENTE ADITIVA!");
  console.log("========================================================");
}

applyMigration().catch(err => {
  console.error("ERRO:", err.message);
  process.exitCode = 1;
});
