const EXPECTED_TOPICS = new Set([
  "conceitos-introdutorios-do-direito-administrativo",
  "disposicoes-gerais",
  "deveres",
  "conceitos",
  "desconcentracao-administracao-direta-orgaos",
  "criterio-de-servico-publico-doutrinario",
  "civil",
  "classificacoes-do-controle",
  "disposicoes-gerais-art-1",
]);

function replaceRequired(text, before, after, label) {
  if (!text.includes(before)) {
    throw new Error(`Trecho obrigatório não encontrado em ${label}: ${before.slice(0, 120)}`);
  }
  return text.replace(before, after);
}

function section(payload, sectionId) {
  const item = payload.sections.find((candidate) => candidate.section_id === sectionId);
  if (!item) throw new Error(`Seção ausente em ${payload.topic_id}: ${sectionId}`);
  return item;
}

function callout(item, title) {
  const result = (item.callouts ?? []).find((candidate) => candidate.title === title);
  if (!result) throw new Error(`Callout ausente em ${item.section_id}: ${title}`);
  return result;
}

function replaceInCallout(item, title, before, after) {
  const itemCallout = callout(item, title);
  itemCallout.text = replaceRequired(itemCallout.text, before, after, `${item.section_id}/${title}`);
}

function updateIntroductoryConcepts(payload) {
  const item = section(payload, "conceitos-introdutorios-do-direito-administrativo-sec-01");
  item.content_markdown = replaceRequired(
    item.content_markdown,
    `#### Exceções ao contencioso administrativo no Brasil

Mesmo no sistema de jurisdição una, existem situações que se assemelham ao contencioso administrativo, onde a decisão administrativa tem um peso significativo:

*   Justiça desportiva
*   Súmula vinculante (SV)
*   Habeas data (HD)
*   Mandado de segurança (MS)`,
    `#### Condicionamento constitucional específico

A jurisdição una não impede condicionamentos processuais expressos. A Constituição exige o esgotamento das instâncias da justiça desportiva apenas para ações relativas à disciplina e às competições desportivas. Súmula vinculante, habeas data e mandado de segurança não são exceções ao sistema de jurisdição una.`,
    `${item.section_id}/jurisdição una`,
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "**F**omento\n        *   **I**ntervenção\n        *   **S**erviço **P**úblico",
    "**F**omento\n        *   **I**ntervenção\n        *   **S**erviço público\n        *   **P**olícia administrativa",
    `${item.section_id}/FISP`,
  );
  replaceInCallout(
    item,
    "Atividades da função administrativa (FISP)",
    "Fomento, Intervenção, Serviço Público.",
    "Fomento, Intervenção, Serviço Público e Polícia Administrativa.",
  );
  const mnemonic = (item.mnemonics ?? []).find((candidate) => candidate.key === "FISP");
  if (!mnemonic) throw new Error(`Mnemônico FISP ausente em ${item.section_id}`);
  mnemonic.meaning = "Fomento, Intervenção, Serviço Público e Polícia Administrativa";
  mnemonic.description = "Mnemônico para atividades da função administrativa no critério material, objetivo e funcional.";
}

function updateGeneralProvisions(payload) {
  const principles = section(payload, "disposicoes-gerais-sec-01");
  const oldDismissal = "Contudo, essa obrigatoriedade não se aplica às demais Empresas Públicas e Sociedades de Economia Mista, mesmo que o ingresso tenha ocorrido por concurso público.";
  const newDismissal = "Empresas públicas e sociedades de economia mista, sejam prestadoras de serviço público ou exploradoras de atividade econômica, devem motivar formalmente a demissão de empregados concursados; não se exige processo administrativo nem enquadramento em justa causa trabalhista.";
  principles.content_markdown = replaceRequired(principles.content_markdown, oldDismissal, newDismissal, `${principles.section_id}/Tema 1022`);
  replaceInCallout(principles, "Exceção Correios", oldDismissal, newDismissal);
  const oldNepotism = "Para sua caracterização, exige-se a existência de **subordinação**.\n    *   **Não veda** nomeação para **cargos políticos** (ministros, secretários estaduais e municipais, etc.).";
  const newNepotism = "A subordinação é relevante em algumas configurações, mas não é requisito universal: também há nepotismo quando o nomeado é parente da autoridade nomeante ou em designações recíprocas.\n    *   Em regra, a Súmula Vinculante 13 não alcança cargos políticos de primeiro escalão; permanecem ressalvados fraude à lei, nepotismo cruzado e manifesta falta de razoabilidade, qualificação técnica ou idoneidade moral.";
  principles.content_markdown = replaceRequired(principles.content_markdown, oldNepotism, newNepotism, `${principles.section_id}/nepotismo`);
  callout(principles, "Nepotismo e subordinação").text = "A subordinação não é requisito universal. Cargos políticos de primeiro escalão ficam, em regra, fora da SV 13, ressalvados fraude, nepotismo cruzado e manifesta falta de razoabilidade, qualificação técnica ou idoneidade moral.";

  const limitation = section(payload, "disposicoes-gerais-sec-07");
  limitation.content_markdown = `A **lei** estabelecerá os prazos de prescrição para ilícitos praticados por qualquer agente, servidor ou não, que causem **prejuízos ao erário**.

A ressalva do art. 37, § 5º, da Constituição não torna toda pretensão de ressarcimento imprescritível. Segundo o STF:

* a reparação por ilícito civil é prescritível;
* a imprescritibilidade restringe-se ao ressarcimento fundado em ato **doloso** tipificado como improbidade administrativa.`;
  callout(limitation, "Atenção à Ressalva").text = "A ressalva constitucional não torna todo ressarcimento imprescritível: ilícitos civis são prescritíveis, e o Tema 897/STF restringe a imprescritibilidade ao ato doloso de improbidade.";
}

function updatePowers(payload) {
  const powers = section(payload, "deveres-sec-02");
  powers.content_markdown = replaceRequired(
    powers.content_markdown,
    "O **controle judicial** se limita aos aspectos **vinculados** do ato (competência, finalidade e forma), não abrangendo o mérito.",
    "O controle judicial não substitui a escolha legítima de conveniência e oportunidade, mas alcança toda a juridicidade do ato, inclusive motivos, objeto, proporcionalidade, razoabilidade e desvio de finalidade.",
    `${powers.section_id}/controle judicial`,
  );
  callout(powers, "Controle judicial do ato discricionário").text = "O Judiciário não substitui a escolha legítima de conveniência e oportunidade, mas controla a juridicidade do ato, inclusive motivos, objeto, proporcionalidade, razoabilidade e desvio de finalidade.";
  powers.content_markdown = replaceRequired(
    powers.content_markdown,
    "*   **Indelegável** (o poder de editar decretos autônomos é exclusivo do Chefe do Executivo).\n*   **Delegável** (a edição de decretos executivos pode ser delegada à AGU, PGR e Ministros).",
    "*   As atribuições constitucionais relativas ao decreto autônomo podem ser delegadas aos Ministros de Estado, ao Procurador-Geral da República ou ao Advogado-Geral da União.\n*   O poder regulamentar para a fiel execução das leis não integra essa autorização constitucional de delegação.",
    `${powers.section_id}/decreto autônomo`,
  );
  powers.content_markdown = replaceRequired(
    powers.content_markdown,
    "No âmbito disciplinar, **não se aplica o princípio da legalidade estrita** para a infração (inexistência de infração sem lei prévia).",
    "Sanções disciplinares submetem-se à legalidade, ao devido processo, ao contraditório e à ampla defesa. Os tipos podem conter conceitos jurídicos abertos, mas a sanção exige fundamento normativo prévio.",
    `${powers.section_id}/legalidade disciplinar`,
  );

  const police = section(payload, "deveres-sec-03");
  police.content_markdown = replaceRequired(
    police.content_markdown,
    "É exercida pela Polícia Federal (PF), Polícia Civil (PC) e Polícia Militar (PM), preparando a função jurisdicional.",
    "É exercida pela Polícia Federal e pelas Polícias Civis, observadas suas competências. Às Polícias Militares cabem a polícia ostensiva e a preservação da ordem pública.",
    `${police.section_id}/polícia judiciária`,
  );
  const oldDelegation = "**ATENÇÃO:** O poder de polícia é **indelegável** em suas fases de **legislação** e **sanção**. As fases de **consentimento** (caráter preventivo) e **fiscalização** podem ser delegadas.";
  const newDelegation = "**ATENÇÃO:** A função legislativa permanece indelegável. Fiscalização e aplicação de sanções podem ser exercidas pela entidade que satisfaça integralmente os requisitos do Tema 532/STF.";
  police.content_markdown = replaceRequired(police.content_markdown, oldDelegation, newDelegation, `${police.section_id}/Tema 532`);
  callout(police, "Delegação do poder de polícia").text = "A função legislativa é indelegável. O Tema 532/STF admite, sob requisitos cumulativos, delegação legal do poder de polícia a entidade privada da administração indireta, inclusive para fiscalizar e aplicar multas.";
  police.content_markdown = replaceRequired(
    police.content_markdown,
    "O prazo de prescrição é de **5 anos** a partir da prática do ato. Contudo, se o objeto da sanção também configurar crime, utiliza-se o prazo previsto no art. 109 do Código Penal (STJ, MS 20.857/2019).",
    "Na Administração Pública **federal**, a ação punitiva de polícia prescreve em **5 anos** da prática do ato; em infração permanente ou continuada, conta-se da cessação. Se o fato também constituir crime, aplica-se o prazo penal. Essa regra da Lei 9.873/1999 não é prazo universal de todos os entes.",
    `${police.section_id}/prescrição`,
  );
}

function updateAdministrativeActs(payload) {
  const annulment = section(payload, "conceitos-sec-03");
  annulment.content_markdown = replaceRequired(
    annulment.content_markdown,
    "Mesmo nos atos vinculados, pode haver Motivo (M) e Objeto (Ob) discricionários.",
    "Nos atos vinculados, motivo e objeto também estão predeterminados pela norma; se houver margem legítima de escolha nesses elementos, o ato é discricionário nesse aspecto.",
    `${annulment.section_id}/ato vinculado`,
  );
  annulment.content_markdown = replaceRequired(
    annulment.content_markdown,
    "Tácita: 5 anos, salvo má-fé (10 anos).",
    "No âmbito federal, a decadência é de 5 anos para anular atos favoráveis, salvo comprovada má-fé; a Lei 9.784/1999 não estabelece prazo de 10 anos para a má-fé.",
    `${annulment.section_id}/decadência`,
  );

  const kinds = section(payload, "conceitos-sec-05");
  kinds.content_markdown = replaceRequired(
    kinds.content_markdown,
    "Cabe ao Congresso Nacional (CN) sustar (anular) os atos do Executivo que exorbitam do poder regulamentar.",
    "Cabe ao Congresso Nacional sustar os atos normativos do Executivo que exorbitem do poder regulamentar ou dos limites da delegação legislativa; sustação não é anulação.",
    `${kinds.section_id}/sustação`,
  );
}

function updateOrganization(payload) {
  const agencies = section(payload, "desconcentracao-administracao-direta-orgaos-sec-01");
  agencies.content_markdown = replaceRequired(
    agencies.content_markdown,
    "No âmbito do Direito Privado, a relação de trabalho pode ser regida pelo Regime Jurídico Único (RJU) ou pela Consolidação das Leis do Trabalho (CLT).",
    "Entidades administrativas de direito privado mantêm empregados regidos pela Consolidação das Leis do Trabalho (CLT). O regime estatutário é próprio de vínculos de direito público.",
    `${agencies.section_id}/regime de pessoal`,
  );
  agencies.content_markdown = replaceRequired(
    agencies.content_markdown,
    "Devem ser **Pessoas Jurídicas de Direito Público**, mas nem sempre são autarquias.",
    "As agências reguladoras federais abrangidas pela Lei 13.848/2019 são **autarquias sob regime especial**.",
    `${agencies.section_id}/natureza`,
  );
  agencies.content_markdown = replaceRequired(
    agencies.content_markdown,
    "Via de regra, as decisões das agências reguladoras estão **sujeitas à revisão ministerial**, seja de ofício ou a pedido, inclusive por meio de **recursos hierárquicos impróprios** (desde que previstos em lei).",
    "As agências reguladoras não estão submetidas a tutela ou subordinação hierárquica; suas decisões finalísticas não se submetem a revisão ministerial ordinária.",
    `${agencies.section_id}/autonomia`,
  );

  const executives = section(payload, "desconcentracao-administracao-direta-orgaos-sec-02");
  executives.content_markdown = replaceRequired(
    executives.content_markdown,
    "Ter um limite ampliado para **dispensa de licitação** (20% do valor máximo para a modalidade convite).",
    "Os limites de dispensa por valor dos incisos I e II do art. 75 da Lei 14.133/2021 são duplicados para agências executivas; a modalidade convite foi extinta.",
    `${executives.section_id}/licitação`,
  );

  const consortia = section(payload, "desconcentracao-administracao-direta-orgaos-sec-03");
  consortia.content_markdown = replaceRequired(
    consortia.content_markdown,
    "formadas por pessoas jurídicas políticas, criadas mediante **autorização legislativa**",
    "formadas por entes federativos, mediante contrato cuja celebração depende de protocolo de intenções e de sua ratificação por lei",
    `${consortia.section_id}/constituição`,
  );
  consortia.content_markdown = replaceRequired(
    consortia.content_markdown,
    "Essas entidades derivam da extinção de órgãos e entidades da Administração Pública, em um processo conhecido como **publicização**.",
    "A extinção de órgão ou entidade pública não é requisito geral para qualificação como OS ou OSCIP. Publicização é uma política associada ao modelo federal de OS, não a origem necessária de toda entidade qualificada.",
    `${consortia.section_id}/publicização`,
  );
  consortia.content_markdown = replaceRequired(
    consortia.content_markdown,
    "*   **Contrato de Gestão**: Este instrumento **limita** a atuação da entidade, estabelecendo metas e indicadores de desempenho.\n*   **Termo de Parceria**: Pode ser celebrado com mais de uma entidade, permitindo maior flexibilidade na colaboração.",
    "*   **Organização Social:** celebra contrato de gestão.\n*   **OSCIP:** celebra termo de parceria.",
    `${consortia.section_id}/instrumentos`,
  );
  consortia.content_markdown = replaceRequired(
    consortia.content_markdown,
    "*   **Conselho Fiscal**: **Sempre** obrigatório.",
    "A Lei 9.637/1998 exige conselho de administração e diretoria; não estabelece conselho fiscal como órgão obrigatório geral.",
    `${consortia.section_id}/conselho fiscal`,
  );
  consortia.content_markdown = replaceRequired(
    consortia.content_markdown,
    "*   Promoção de educação, saúde, cultura, assistência social (AS), assistência jurídica complementar, entre outras.",
    "No regime federal de OS, o rol limita-se a ensino, pesquisa científica, desenvolvimento tecnológico, proteção e preservação do meio ambiente, cultura e saúde.",
    `${consortia.section_id}/áreas`,
  );
}

function updatePublicServices(payload) {
  const constitution = section(payload, "criterio-de-servico-publico-doutrinario-sec-02");
  constitution.content_markdown = replaceRequired(
    constitution.content_markdown,
    "*   A exigência de licitação **NÃO** se aplica aos casos de **DISPENSA**, mas **APLICA-SE** aos casos de **INEXIGIBILIDADE**.",
    "*   O art. 175 da Constituição exige licitação para a concessão ou permissão de serviço público.",
    `${constitution.section_id}/licitação`,
  );
  callout(constitution, "Licitação: Dispensa vs. Inexigibilidade").text = "O art. 175 da Constituição exige licitação para concessão ou permissão de serviço público; não estabelece a oposição descrita anteriormente entre dispensa e inexigibilidade.";

  const classification = section(payload, "criterio-de-servico-publico-doutrinario-sec-03");
  const oldTax = "**TAXAS:** Possuem natureza tributária e são **contraprestações COMPULSÓRIAS**, mesmo que o serviço não seja utilizado, visando garantir a continuidade da prestação.";
  const newTax = "**TAXAS:** Possuem natureza tributária e pressupõem serviço público específico e divisível, utilizado efetiva ou potencialmente; a utilização potencial basta quando o serviço é de utilização compulsória e está posto à disposição.";
  classification.content_markdown = replaceRequired(classification.content_markdown, oldTax, newTax, `${classification.section_id}/taxa`);
  replaceInCallout(classification, "Taxas vs. Tarifas", "**Taxas** são tributárias e compulsórias, mesmo sem uso.", "**Taxas** são tributárias e podem decorrer do uso efetivo ou potencial de serviço específico e divisível, conforme o CTN.");

  section(payload, "criterio-de-servico-publico-doutrinario-sec-07").content_markdown = `A Lei 14.133/2021 prevê as modalidades concorrência, pregão, concurso, leilão e diálogo competitivo, além de diversas hipóteses de dispensa e inexigibilidade. Contratos administrativos em geral não se limitam às modalidades aplicáveis à concessão de serviços públicos.`;
  section(payload, "criterio-de-servico-publico-doutrinario-sec-08").content_markdown = "O contratado pode ser **pessoa física**, **pessoa jurídica** ou **consórcio de pessoas jurídicas**, conforme o art. 6º, VIII, da Lei 14.133/2021.";

  const permission = section(payload, "criterio-de-servico-publico-doutrinario-sec-09");
  permission.content_markdown = replaceRequired(
    permission.content_markdown,
    "*   **Ato administrativo**: Embora seja um contrato de adesão (Lei 8.987), a permissão é essencialmente um ato administrativo.",
    "*   **Contrato de adesão:** A permissão de serviço público é delegação precária mediante licitação e formalizada por contrato de adesão.",
    `${permission.section_id}/natureza`,
  );
  callout(permission, "Permissão: Ato Administrativo e Contrato").text = "A permissão de serviço público é delegação precária mediante licitação e formalizada por contrato de adesão, conforme a Lei 8.987/1995.";

  const common = section(payload, "criterio-de-servico-publico-doutrinario-sec-10");
  common.content_markdown = replaceRequired(
    common.content_markdown,
    "*   **Comuns (Lei 8.987)**: Referem-se apenas a serviços públicos.\n*   **Especiais - PPP (Lei 11.079)**:\n    *   **Concessão patrocinada**: Envolve serviços públicos precedidos de obras.\n    *   **Concessão administrativa**: Envolve apenas serviços públicos.",
    "*   **Comuns (Lei 8.987):** abrangem concessão de serviço e concessão de serviço precedida de obra pública.\n*   **Especiais - PPP (Lei 11.079):**\n    *   **Concessão patrocinada:** concessão de serviço ou de obra pública com tarifa e contraprestação do parceiro público.\n    *   **Concessão administrativa:** contrato de serviços em que a Administração é usuária direta ou indireta, ainda que envolva obra ou fornecimento e instalação de bens.",
    `${common.section_id}/espécies`,
  );

  const continuity = section(payload, "criterio-de-servico-publico-doutrinario-sec-12");
  continuity.content_markdown = replaceRequired(
    continuity.content_markdown,
    "*   **Cuidado**: Não confundir com a possibilidade de interrupção do contrato após 90 dias de inadimplência do Poder Público, prevista na Lei 8.666.\n",
    "",
    `${continuity.section_id}/Lei 8.666`,
  );

  const currency = section(payload, "criterio-de-servico-publico-doutrinario-sec-16");
  currency.content_markdown = replaceRequired(
    currency.content_markdown,
    "Promover (decretar) **desapropriações**, inclusive ajuizar ações e pagar indenizações.",
    "Promover a execução de **desapropriações** cuja utilidade pública tenha sido declarada pelo poder concedente, inclusive ajuizar ações e pagar indenizações, quando autorizada no edital e no contrato.",
    `${currency.section_id}/desapropriação`,
  );

  const reversal = section(payload, "criterio-de-servico-publico-doutrinario-sec-19");
  reversal.content_markdown = `A forma de extinção é o **advento do termo contratual**. A reversão é o retorno dos bens reversíveis ao poder concedente como efeito da extinção, com indenização dos investimentos ainda não amortizados ou depreciados nas condições do art. 36 da Lei 8.987/1995.`;
  callout(reversal, "Reversão").text = "A extinção ocorre pelo advento do termo contratual; a reversão é o retorno dos bens reversíveis, com a indenização legal dos investimentos não amortizados ou depreciados.";
}

function updateCivilLiability(payload) {
  const exclusions = section(payload, "civil-sec-02");
  exclusions.content_markdown = `Na teoria do risco administrativo, podem romper o nexo causal:

* **culpa exclusiva da vítima**;
* **fato exclusivo de terceiro**;
* **caso fortuito ou força maior externos**.

A culpa concorrente não exclui a responsabilidade, mas pode reduzir proporcionalmente a indenização. A incidência de cada causa depende da demonstração do nexo no caso concreto.`;

  const constitution = section(payload, "civil-sec-04");
  constitution.content_markdown = replaceRequired(
    constitution.content_markdown,
    "*   **Regra geral (STF)**: **Inaplicável**.\n*   **STJ**: Aplicável quando o próprio particular (denunciante) chama o agente público ao processo.",
    "*   Pelo Tema 940/STF, a vítima deve ajuizar a ação contra o Estado ou a prestadora de serviço público; o agente não possui legitimidade passiva nessa ação, preservado o regresso por dolo ou culpa.",
    `${constitution.section_id}/Tema 940`,
  );

  const limitation = section(payload, "civil-sec-05");
  limitation.content_markdown = `* **Ação indenizatória contra a Fazenda Pública:** o STJ aplica o prazo de **5 anos** do Decreto 20.910/1932. O Tema 666/STF afirmou a prescritibilidade do ressarcimento decorrente de ilícito civil, mas não fixou prazo geral de 3 anos.
* **Ação para aplicação das sanções da Lei de Improbidade:** prescreve em **8 anos**, observadas as regras do art. 23 da Lei 8.429/1992.
* **Ressarcimento fundado em decisão de Tribunal de Contas:** é prescritível, conforme o Tema 899/STF.
* **Ressarcimento por improbidade:** somente é imprescritível quando fundado em ato **doloso** tipificado na Lei de Improbidade, conforme o Tema 897/STF.`;
  callout(limitation, "Atenção").text = "A ação de improbidade prescreve em 8 anos. Apenas o ressarcimento fundado em ato doloso tipificado como improbidade é imprescritível.";

  const custody = section(payload, "civil-sec-06");
  custody.content_markdown = replaceRequired(
    custody.content_markdown,
    "O Estado responde objetivamente nos casos de custódia, mesmo que o dano seja causado por alguém que não seja agente público.",
    "Em situações de custódia, a responsabilidade estatal exige a demonstração do nexo com o dever específico de proteção. Para morte de detento, o Tema 592/STF exige inobservância desse dever.",
    `${custody.section_id}/Tema 592`,
  );
}

function updateExternalControl(payload) {
  const senate = section(payload, "classificacoes-do-controle-sec-01");
  senate.content_markdown = replaceRequired(
    senate.content_markdown,
    "Magistrados, nos casos previstos na Constituição Federal de 1988 (ex: Ministro do STF e desembargadores dos Tribunais Regionais Federais - TRFs).",
    "Magistrados, nos casos expressamente previstos na Constituição, como os Ministros do STF e dos Tribunais Superiores; desembargadores de TRF, em geral, não passam por aprovação do Senado.",
    `${senate.section_id}/sabatina`,
  );
  senate.content_markdown = replaceRequired(
    senate.content_markdown,
    "PGR (a exoneração antes do término do mandato exige maioria absoluta e voto secreto).",
    "PGR (a exoneração de ofício antes do término do mandato depende de autorização da maioria absoluta do Senado; a Constituição vigente não exige voto secreto para essa exoneração).",
    `${senate.section_id}/PGR`,
  );

  const cpi = section(payload, "classificacoes-do-controle-sec-03");
  cpi.content_markdown = replaceRequired(
    cpi.content_markdown,
    "Exige requerimento de **1/3 dos membros da Casa ou do Congresso Nacional**.",
    "CPI de uma Casa exige requerimento de **1/3 de seus membros**; CPI conjunta exige **1/3 dos membros da Câmara e 1/3 dos membros do Senado**.",
    `${cpi.section_id}/criação`,
  );

  const tcu = section(payload, "classificacoes-do-controle-sec-05");
  tcu.content_markdown = replaceRequired(
    tcu.content_markdown,
    "Isso significa que não é necessário recorrer ao judiciário, e a cobrança é feita pela Advocacia-Geral da União (AGU).",
    "A execução coercitiva ocorre judicialmente pelo ente legitimado; o TCU não executa diretamente o título.",
    `${tcu.section_id}/título executivo`,
  );
  replaceInCallout(
    tcu,
    "Súmula Vinculante 3 e TCU",
    "**excetuada** a apreciação da legalidade do ato de concessão **inicial** de aposentadoria, reforma e pensão.",
    "**excetuada**, em regra, a apreciação inicial. Pelo Tema 445/STF, os Tribunais de Contas têm 5 anos, contados da chegada do processo, para julgar a legalidade da concessão inicial.",
  );
}

function updateFederalAdministrativeProcedure(payload) {
  for (const item of payload.sections) {
    item.content_markdown = item.content_markdown
      .replaceAll("Processo Administrativo Disciplinar (PADM)", "Processo Administrativo Federal")
      .replaceAll("Processo Administrativo (PADM)", "processo administrativo")
      .replaceAll("do PADM", "do processo administrativo")
      .replaceAll("no PADM", "no processo administrativo")
      .replaceAll("O PADM", "O processo administrativo")
      .replaceAll("ao PADM", "ao processo administrativo");
    for (const itemCallout of item.callouts ?? []) {
      itemCallout.text = itemCallout.text
        .replaceAll("Processo Administrativo (PADM)", "processo administrativo")
        .replaceAll("Processo Administrativo Disciplinar", "Processo Administrativo Federal")
        .replaceAll("PADM", "processo administrativo");
    }
  }

  const form = section(payload, "disposicoes-gerais-art-1-sec-05");
  form.content_markdown = replaceRequired(
    form.content_markdown,
    "no prazo de **5 + 5 dias**, salvo em casos de força maior (conforme o Código de Processo Civil - NCPC).",
    "no prazo de **5 dias**, que pode ser dilatado até o dobro mediante comprovada justificação.",
    `${form.section_id}/prazo`,
  );

  const phases = section(payload, "disposicoes-gerais-art-1-sec-07");
  phases.content_markdown = `O processo administrativo geralmente compreende instauração, instrução e decisão. Das decisões cabe recurso por razões de legalidade e de mérito.

* **Recurso:** prazo de 10 dias para interposição, contado da ciência ou divulgação oficial.
* **Reconsideração:** o recurso é dirigido à autoridade que decidiu; se ela não reconsiderar em 5 dias, deve encaminhá-lo à autoridade superior. Não há um prazo autônomo de 5 dias para o interessado formular pedido de reconsideração.
* **Manifestação dos demais interessados:** o órgão os intima para apresentar alegações em 5 dias úteis.
* **Revisão:** processos que resultem em sanções podem ser revistos a qualquer tempo diante de fatos novos ou circunstâncias relevantes; dela não pode resultar agravamento da sanção.`;
  phases.callouts = [{
    type: "info",
    title: "Recurso, reconsideração e revisão",
    text: "O recurso é interposto em 10 dias; a autoridade dispõe de 5 dias para reconsiderar. A revisão de processo sancionador pode ocorrer a qualquer tempo e não admite agravamento da sanção.",
  }];
  phases.mermaid_mindmap = `flowchart TD
    A["Instauração"] --> B["Instrução"]
    B --> C["Decisão"]
    C --> D["Recurso em 10 dias"]
    D --> E{"Reconsideração em 5 dias?"}
    E -- "Não" --> F["Autoridade superior"]
    C --> G["Revisão sancionadora<br/>a qualquer tempo"]`;

  const priority = section(payload, "disposicoes-gerais-art-1-sec-13");
  priority.content_markdown = replaceRequired(
    priority.content_markdown,
    "Pessoas com idade **superior a 60 anos**.",
    "Pessoas com idade **igual ou superior a 60 anos**.",
    `${priority.section_id}/idade`,
  );
}

const UPDATERS = {
  "conceitos-introdutorios-do-direito-administrativo": updateIntroductoryConcepts,
  "disposicoes-gerais": updateGeneralProvisions,
  deveres: updatePowers,
  conceitos: updateAdministrativeActs,
  "desconcentracao-administracao-direta-orgaos": updateOrganization,
  "criterio-de-servico-publico-doutrinario": updatePublicServices,
  civil: updateCivilLiability,
  "classificacoes-do-controle": updateExternalControl,
  "disposicoes-gerais-art-1": updateFederalAdministrativeProcedure,
};

function normalizeContentBreaks(payload) {
  for (const item of payload.sections) {
    item.content_markdown = item.content_markdown.replace(/<br\s*\/?\s*>/gi, "\n");
  }
}

export function applyCoreCorrections(payload) {
  if (!payload || typeof payload !== "object") throw new TypeError("Payload inválido");
  if (!EXPECTED_TOPICS.has(payload.topic_id)) {
    throw new Error(`Tópico fora do escopo da revisão: ${payload.topic_id ?? "(ausente)"}`);
  }
  if (!Array.isArray(payload.sections)) throw new TypeError(`Seções inválidas em ${payload.topic_id}`);

  const identities = payload.sections.map(({ section_id, content_unit_id, stable_key, title }) => ({
    section_id,
    content_unit_id,
    stable_key,
    title,
  }));
  const flashcards = payload.sections.map((item) => JSON.stringify(item.flashcards ?? []));

  UPDATERS[payload.topic_id](payload);
  normalizeContentBreaks(payload);

  const resultingIdentities = payload.sections.map(({ section_id, content_unit_id, stable_key, title }) => ({
    section_id,
    content_unit_id,
    stable_key,
    title,
  }));
  if (JSON.stringify(identities) !== JSON.stringify(resultingIdentities)) {
    throw new Error(`Identidades, ordem ou títulos foram alterados em ${payload.topic_id}`);
  }
  payload.sections.forEach((item, index) => {
    if (JSON.stringify(item.flashcards ?? []) !== flashcards[index]) {
      throw new Error(`Flashcards foram alterados em ${item.section_id}`);
    }
  });

  return payload;
}
