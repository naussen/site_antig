function replaceRequired(text, before, after, label) {
  if (typeof text !== "string") {
    throw new Error(`Conteúdo textual ausente em ${label}`);
  }
  if (!text.includes(before)) {
    throw new Error(`Trecho não encontrado em ${label}: ${before.slice(0, 160)}`);
  }
  return text.replace(before, after);
}

function replaceAllRequired(text, pattern, after, label) {
  if (typeof text !== "string" || !pattern.test(text)) {
    throw new Error(`Padrão não encontrado em ${label}: ${pattern}`);
  }
  pattern.lastIndex = 0;
  return text.replace(pattern, after);
}

function section(payload, number) {
  const item = payload.sections?.[number - 1];
  if (!item) {
    throw new Error(`Seção ${number} ausente em ${payload.topic_id ?? "payload sem topic_id"}`);
  }
  return item;
}

function callout(item, title, label) {
  const matches = (item.callouts ?? []).filter((candidate) => candidate.title === title);
  if (matches.length !== 1) {
    throw new Error(`Callout "${title}" não encontrado de forma única em ${label}`);
  }
  return matches[0];
}

function prependHistoricalContext(item, context, label) {
  if (item.content_markdown.startsWith(context)) {
    throw new Error(`Contexto histórico já aplicado em ${label}`);
  }
  item.content_markdown = `${context}\n\n${item.content_markdown}`;
}

function normalizeContentBreaks(payload) {
  for (const item of payload.sections ?? []) {
    if (typeof item.content_markdown !== "string") {
      throw new Error(`content_markdown ausente em ${item.section_id ?? payload.topic_id}`);
    }
    item.content_markdown = item.content_markdown.replace(/<br\s*\/?\s*>/gi, "\n");
  }
}

function updatePublicProperty(payload) {
  const item = section(payload, 1);
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   **Empresas Públicas (EP) e Sociedades de Economia Mista (SEM) prestadoras de serviço público**: Seus bens são **públicos**.",
    "*   **Empresas Públicas (EP) e Sociedades de Economia Mista (SEM) prestadoras de serviço público**: Seus bens continuam sendo **privados**. Quando afetados à prestação do serviço público, podem submeter-se a regras protetivas de direito público, como impenhorabilidade e restrições à alienação, sem se converterem em bens públicos.",
    "classificacao-dos-bens-publicos/sec-01 natureza dos bens das estatais",
  );
  const note = callout(item, "Enunciado 287", "classificacao-dos-bens-publicos/sec-01");
  note.text = "Os bens de pessoas jurídicas de direito privado permanecem privados. A afetação de bens de estatais prestadoras de serviço público pode atrair regras protetivas de direito público, mas não altera sua natureza jurídica.";
}

function updateStateIntervention(payload) {
  const general = section(payload, 3);
  general.content_markdown = replaceRequired(
    general.content_markdown,
    "A **Lei Complementar (LC)** estabelece um procedimento contraditório especial, de rito sumário, para o processo judicial de desapropriação.",
    "O **Decreto-Lei nº 3.365/1941** disciplina a desapropriação por utilidade pública. Na desapropriação de imóvel rural para fins de reforma agrária, a **Lei Complementar nº 76/1993** estabelece o procedimento contraditório especial, de rito sumário, previsto no art. 184, § 3º, da Constituição.",
    "intervencao-restritiva/sec-03 regime da desapropriação",
  );

  const adversePossession = section(payload, 6);
  adversePossession.content_markdown = replaceRequired(
    adversePossession.content_markdown,
    "uma **área rural inferior a 50 hectares**",
    "uma **área rural não superior a 50 hectares**",
    "intervencao-restritiva/sec-06 limite da usucapião especial rural",
  );
}

function updateAccessToInformation(payload) {
  const item = section(payload, 4);
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "| O acesso à informação é gratuito. | A reprodução de documentos pode ser cobrada, desde que o custo não exceda o valor de mercado. |",
    "| O serviço de busca e fornecimento da informação é gratuito. | Na reprodução de documentos, pode ser cobrado exclusivamente o valor necessário ao ressarcimento do custo dos serviços e materiais utilizados. |",
    "abrangencia-arts-1-e-2/sec-04 gratuidade e reprodução",
  );
}

function updatePublicAgents(payload) {
  const item = section(payload, 8);
  item.content_markdown = `O texto original do art. 39 da Constituição previa **regime jurídico único (RJU)** e planos de carreira para os servidores da Administração direta, autárquica e fundacional de cada ente federativo.

No julgamento definitivo da **ADI 2.135**, em 6 de novembro de 2024, o STF reconheceu a constitucionalidade da alteração promovida pela EC nº 19/1998 que suprimiu essa obrigatoriedade. Portanto, a Constituição não impõe atualmente um único regime para todos esses agentes: cada ente deve disciplinar por lei os regimes aplicáveis, observando o concurso público e as demais garantias constitucionais.

A União mantém o regime estatutário da Lei nº 8.112/1990 para seus servidores civis abrangidos por ela. O julgamento da ADI 2.135 não converte automaticamente vínculos existentes nem revoga os estatutos editados pelos entes federativos.`;
  const note = callout(item, "Regime Jurídico Único", "conceito-e-especies/sec-08");
  note.text = "Após o julgamento definitivo da ADI 2.135 pelo STF, a Constituição não obriga os entes federativos a adotar um único regime jurídico para todos os servidores da Administração direta, autárquica e fundacional; os regimes dependem de lei do ente competente.";
}

function updateFederalCivilServants(payload) {
  const advantages = section(payload, 9);
  advantages.content_markdown = replaceRequired(
    advantages.content_markdown,
    "Nenhum desconto incidirá sobre a remuneração ou pensão alimentícia resultante de decisão judicial.",
    "Nenhum desconto incidirá sobre a remuneração ou o provento, salvo por imposição legal ou mandado judicial.",
    "abrangencia/sec-09 descontos",
  );

  const prohibitions = section(payload, 13);
  prohibitions.content_markdown = replaceRequired(
    prohibitions.content_markdown,
    "A improbidade administrativa implica na indisponibilidade de bens (Art. 132, IV).",
    "A improbidade administrativa é hipótese de demissão (art. 132, IV). Nessa hipótese, a demissão ou destituição de cargo em comissão também implica indisponibilidade dos bens e ressarcimento ao erário, sem prejuízo da ação penal cabível (art. 136).",
    "abrangencia/sec-13 improbidade",
  );
  prohibitions.content_markdown = replaceRequired(
    prohibitions.content_markdown,
    "A corrupção, conforme o Art. 132, XI, implica no ressarcimento ao erário.",
    "A corrupção é hipótese de demissão (art. 132, XI) e, nos termos do art. 136, implica indisponibilidade dos bens e ressarcimento ao erário, sem prejuízo da ação penal cabível.",
    "abrangencia/sec-13 corrupção",
  );
  prohibitions.content_markdown = replaceRequired(
    prohibitions.content_markdown,
    "> **Importante:** O Art. 132, XI, que previa a pena de caráter perpétuo, foi declarado inconstitucional pelo STF na ADI 2975/21, por violar o Art. 5º da Constituição Federal.",
    "> **Importante:** Na ADI 2.975, o STF declarou inconstitucional a proibição, por prazo indeterminado, de retorno ao serviço público federal prevista no parágrafo único do art. 137. A decisão não declarou inconstitucional o art. 132, XI, que tipifica a corrupção como causa de demissão.",
    "abrangencia/sec-13 ADI 2975",
  );
  prohibitions.content_markdown = replaceRequired(
    prohibitions.content_markdown,
    "desempenho de atribuição de sua responsabilidade ou de seu terceirizar",
    "desempenho de atribuição de sua responsabilidade ou de seu subordinado",
    "abrangencia/sec-13 art. 117 VI",
  );
  const adiNote = callout(
    prohibitions,
    "Inconstitucionalidade do Art. 132, XI (pena perpétua)",
    "abrangencia/sec-13",
  );
  adiNote.title = "ADI 2.975 e vedação de sanção perpétua";
  adiNote.text = "O STF invalidou a proibição por prazo indeterminado do parágrafo único do art. 137 da Lei nº 8.112/1990. O art. 132, XI, continua prevendo a corrupção como causa de demissão.";

  const sanctions = section(payload, 14);
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "    *   Aplicável em casos de reincidência em advertência.",
    "    *   A reincidência em falta punida com advertência sujeita o servidor à **suspensão**, nos termos do art. 130.",
    "abrangencia/sec-14 reincidência",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "*   **Principal consequência:** Impede, por 5 anos, o retorno ao serviço público federal.\n*   **Observações:**\n    *   Aplicada por quem nomeou o servidor.\n    *   Sempre impede o retorno ao serviço público.",
    "*   **Consequência sobre nova investidura:** Não decorre de toda demissão. O prazo de 5 anos do art. 137 aplica-se às demissões ou destituições fundadas no art. 117, IX ou XI; a proibição por prazo indeterminado do parágrafo único foi invalidada pelo STF na ADI 2.975.\n*   **Observação:** A competência para aplicar a penalidade segue o art. 141 e pode ser delegada nos limites legais.",
    "abrangencia/sec-14 demissão",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "*   **Principal consequência:** Impede, por 5 anos, o retorno ao serviço público federal.\n\n### Destituição de cargo em comissão (CC)",
    "*   **Consequência sobre nova investidura:** Deve ser verificada conforme o fundamento legal da infração; não há impedimento automático de 5 anos para toda cassação.\n\n### Destituição de cargo em comissão (CC)",
    "abrangencia/sec-14 cassação",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "*   **Principal consequência:** Impede, por 5 anos, o retorno ao serviço público federal.\n\n### Destituição de função de confiança (FC)",
    "*   **Consequência sobre nova investidura:** O prazo de 5 anos do art. 137 depende de infração aos incisos IX ou XI do art. 117; não é efeito automático de toda destituição.\n\n### Destituição de função de confiança (FC)",
    "abrangencia/sec-14 destituição de cargo em comissão",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "*   **Principal consequência:** Impede, por 5 anos, o retorno ao serviço público federal.",
    "*   **Consequência sobre nova investidura:** Não há impedimento automático de 5 anos para toda destituição de função comissionada.",
    "abrangencia/sec-14 destituição de função",
  );

  const review = section(payload, 18);
  review.content_markdown = replaceRequired(
    review.content_markdown,
    "Em caso de falência, ausência ou desaparecimento do servidor",
    "Em caso de falecimento, ausência ou desaparecimento do servidor",
    "abrangencia/sec-18 legitimidade revisional",
  );
}

const LAW_8666_CONTEXT = "> **Contexto histórico:** Este módulo descreve a Lei nº 8.666/1993, revogada em 30 de dezembro de 2023. Suas regras permanecem relevantes para licitações realizadas e contratos assinados sob esse regime, nos termos dos arts. 190 e 193, II, da Lei nº 14.133/2021. As novas contratações seguem a Lei nº 14.133/2021.";

function updateLegacyProcurement(payload) {
  const first = section(payload, 1);
  prependHistoricalContext(first, LAW_8666_CONTEXT, "definicoes/sec-01");
  first.content_markdown = replaceRequired(
    first.content_markdown,
    "A ARP estabelece um compromisso para o vencedor do procedimento de **fornecer** os bens ou serviços, e para a Administração Pública de **adquirir**. O registrado possui **preferência** em igualdade de condições.",
    "A ARP obriga o fornecedor registrado a atender às condições assumidas, mas **não obriga a Administração a contratar**. Se realizar contratação correspondente, o beneficiário do registro tem preferência em igualdade de condições.",
    "definicoes/sec-01 efeitos da ARP",
  );
  const arpNote = callout(first, "Compromisso da ARP", "definicoes/sec-01");
  arpNote.text = "A ata vincula o fornecedor às condições registradas, mas não obriga a Administração a contratar; o beneficiário tem preferência em igualdade de condições.";

  const directContracting = section(payload, 4);
  directContracting.content_markdown = replaceRequired(
    directContracting.content_markdown,
    "### Contratação de profissional de setor artístico\nA contratação de profissional do setor artístico é dispensável quando este for **consagrado pela crítica ou opinião pública**. A **exclusividade** deve ser comprovada por atestado de sindicato, federação ou confederação.",
    "### Contratação de profissional do setor artístico\nNo regime da Lei nº 8.666/1993, a contratação direta de profissional do setor artístico consagrado pela crítica especializada ou pela opinião pública, diretamente ou por empresário exclusivo, era hipótese de **inexigibilidade**, e não de dispensa (art. 25, III).",
    "definicoes/sec-04 artista",
  );
  directContracting.content_markdown = replaceRequired(
    directContracting.content_markdown,
    "São exemplos de serviços técnicos especializados que podem ser objeto de dispensa:",
    "No regime da Lei nº 8.666/1993, os serviços técnicos do art. 13 podiam ser contratados por **inexigibilidade** quando possuíssem natureza singular e fossem prestados por profissional ou empresa de notória especialização (art. 25, II). Entre os exemplos estavam:",
    "definicoes/sec-04 serviços técnicos",
  );
}

function updateLegacyAuction(payload) {
  const item = section(payload, 1);
  prependHistoricalContext(
    item,
    "> **Contexto histórico:** Este módulo descreve o pregão sob a Lei nº 10.520/2002, revogada em 30 de dezembro de 2023. Procedimentos iniciados sob o regime anterior continuam regidos pela lei escolhida no edital; para novas licitações, o pregão é disciplinado pela Lei nº 14.133/2021.",
    "objetivos-e-caracteristicas/sec-01",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "O pregão é um procedimento licitatório **obrigatório** para entidades de direito público ou privado que recebem repasses voluntários.",
    "No regime histórico do Decreto nº 5.504/2005, entes públicos ou privados que recebessem transferências voluntárias da União deveriam utilizar pregão, preferencialmente eletrônico, para adquirir bens e serviços comuns com esses recursos.",
    "objetivos-e-caracteristicas/sec-01 transferências voluntárias",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   **Restrições:** O decreto que regulamenta o pregão não admite serviços de engenharia nem obras. Contudo, o Tribunal de Contas da União (TCU) admite os serviços de engenharia.",
    "*   **Engenharia:** O Decreto nº 10.024/2019 admitia serviços comuns de engenharia no pregão eletrônico federal, mas vedava obras e serviços especiais de engenharia.",
    "objetivos-e-caracteristicas/sec-01 engenharia",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   **Obrigatório** para a Administração Pública Federal (ADMPF), preferencialmente na forma **eletrônica** (Decreto 5.450).",
    "*   Na esfera federal, o Decreto nº 10.024/2019 tornou obrigatório o pregão eletrônico para bens e serviços comuns, ressalvadas as hipóteses justificadas de pregão presencial. Esse decreto já havia revogado o Decreto nº 5.450/2005.",
    "objetivos-e-caracteristicas/sec-01 decreto federal",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   **Tipo:** É **sempre** do tipo **menor preço**. Apesar disso, o pregoeiro deve, a todo momento, avaliar se o participante está cumprindo os requisitos técnicos mínimos do edital.",
    "*   **Critério histórico:** A Lei nº 10.520/2002 adotava o **menor preço**, sem afastar as especificações técnicas mínimas do edital. Na Lei nº 14.133/2021, o pregão admite **menor preço** ou **maior desconto**.",
    "objetivos-e-caracteristicas/sec-01 critério",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   Se o primeiro colocado for inabilitado, o segundo é chamado, e assim sucessivamente, **desde que aceitem a proposta feita pelo primeiro colocado**.",
    "*   Se o primeiro colocado for inabilitado, o pregoeiro examina as ofertas subsequentes e a qualificação dos licitantes, na ordem de classificação, até apurar proposta que atenda ao edital; não se exige que o seguinte aceite o preço do primeiro colocado.",
    "objetivos-e-caracteristicas/sec-01 habilitação",
  );
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   O prazo de validade das propostas será de, no mínimo, **60 dias**, ou outro prazo fixado no edital.",
    "*   Na falta de prazo fixado no edital, a validade das propostas era de **60 dias** (art. 6º da Lei nº 10.520/2002); não se tratava de prazo mínimo obrigatório.",
    "objetivos-e-caracteristicas/sec-01 validade das propostas",
  );

  callout(item, "Obrigatoriedade do pregão", "objetivos-e-caracteristicas/sec-01").text = "No regime histórico do Decreto nº 5.504/2005, transferências voluntárias da União destinadas a bens e serviços comuns sujeitavam o convenente ao pregão, preferencialmente eletrônico.";
  callout(item, "Serviços de engenharia no pregão", "objetivos-e-caracteristicas/sec-01").text = "O Decreto nº 10.024/2019 admitia serviços comuns de engenharia no pregão eletrônico federal, mas vedava obras e serviços especiais de engenharia.";
  callout(item, "Tipo de licitação", "objetivos-e-caracteristicas/sec-01").text = "A Lei nº 10.520/2002 adotava menor preço. Sob a Lei nº 14.133/2021, o pregão usa menor preço ou maior desconto.";
}

function updateLegacyContracts(payload) {
  prependHistoricalContext(section(payload, 1), LAW_8666_CONTEXT, "clausulas-necessarias-art-55/sec-01");
  const item = section(payload, 6);
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "*   **Prazo para convocação para assinar**: **60 dias**, prorrogáveis por mais **60 dias**.",
    "*   **Prazo para convocação para assinar:** É o prazo estabelecido no edital. Pode ser prorrogado uma vez, por igual período, quando solicitado justificadamente pelo adjudicatário e aceito pela Administração.",
    "clausulas-necessarias-art-55/sec-06 convocação",
  );
}

function updateCurrentProcurement(payload) {
  const judgment = section(payload, 3);
  judgment.content_markdown = replaceRequired(
    judgment.content_markdown,
    "Durante o julgamento, propostas com **vícios insanáveis** serão desclassificadas.",
    "Durante o julgamento, propostas com **vícios insanáveis** serão desclassificadas. Os critérios do art. 33 são menor preço, maior desconto, melhor técnica ou conteúdo artístico, técnica e preço, maior retorno econômico e **maior lance, exclusivamente no caso de leilão**.",
    "aplicacao-da-lei-14-133-21/sec-03 critérios",
  );

  const qualification = section(payload, 4);
  qualification.content_markdown = replaceRequired(
    qualification.content_markdown,
    "O critério de julgamento na concorrência é o de **maior lance**.",
    "Na concorrência, podem ser utilizados os critérios de **menor preço**, **melhor técnica ou conteúdo artístico**, **técnica e preço**, **maior retorno econômico** ou **maior desconto**. O **maior lance** é exclusivo do leilão.",
    "aplicacao-da-lei-14-133-21/sec-04 concorrência",
  );
  qualification.content_markdown = replaceAllRequired(
    qualification.content_markdown,
    /R\$(?=\s*[\d])/g,
    "R\\$",
    "aplicacao-da-lei-14-133-21/sec-04 valores monetários",
  );

  const sanctions = section(payload, 15);
  const sanctionsStart = sanctions.content_markdown.indexOf("### Sanções administrativas");
  const processStart = sanctions.content_markdown.indexOf("### Condução do processo de responsabilização");
  if (sanctionsStart < 0 || processStart <= sanctionsStart) {
    throw new Error("Bloco de sanções não encontrado em aplicacao-da-lei-14-133-21/sec-15");
  }
  const correctedSanctions = `### Sanções administrativas
As sanções administrativas aplicáveis são:

*   **Advertência:** Aplicável exclusivamente à inexecução parcial do contrato (art. 155, I), quando não se justificar penalidade mais grave. Não impede licitar ou contratar.
*   **Multa:** Aplicável a qualquer infração do art. 155, entre **0,5% e 30%** do valor do contrato licitado ou celebrado; pode cumular-se com as demais sanções. A defesa é apresentada em **15 dias úteis**.
*   **Impedimento de licitar e contratar:** Aplicável, quando não se justificar sanção mais grave, às infrações dos incisos II a VII do art. 155. Alcança a Administração direta e indireta do **ente federativo que aplicou a sanção**, por prazo máximo de **3 anos**. O prazo mínimo de reabilitação é de **1 ano**.
*   **Declaração de inidoneidade:** Aplicável às infrações dos incisos VIII a XII do art. 155 e, quando a gravidade justificar, também às dos incisos II a VII. Alcança a Administração direta e indireta de **todos os entes federativos**, por prazo mínimo de **3 anos** e máximo de **6 anos**. O prazo mínimo de reabilitação é de **3 anos**, além das demais condições legais.

`;
  sanctions.content_markdown = `${sanctions.content_markdown.slice(0, sanctionsStart)}${correctedSanctions}${sanctions.content_markdown.slice(processStart)}`;
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "\nPraticar atos ilícitos com o objetivo de frustrar os propósitos da licitação.\nPraticar ato lesivo conforme o artigo 5º da Lei nº 12.846/13 (Lei Anticorrupção).\nApresentar declaração ou documentação falsa, ou prestar declaração inverídica.\n",
    "\n",
    "aplicacao-da-lei-14-133-21/sec-15 infrações deslocadas",
  );
  callout(sanctions, "Efeito da Advertência", "aplicacao-da-lei-14-133-21/sec-15").text = "A advertência não impede licitar ou contratar; aplica-se exclusivamente à inexecução parcial do contrato quando não se justificar sanção mais grave.";
  const effects = callout(sanctions, "Efeito de Impedimento e Inidoneidade", "aplicacao-da-lei-14-133-21/sec-15");
  effects.text = "O impedimento alcança apenas o ente federativo sancionador e dura até 3 anos. A inidoneidade alcança todos os entes federativos e dura de 3 a 6 anos.";
}

function updateAdministrativeImprobity(payload) {
  const judgments = section(payload, 10);
  judgments.content_markdown = `Sentenças civis produzem efeitos na ação de improbidade quando reconhecem a **inexistência da conduta** ou a **negativa de autoria**.

Após o julgamento das ADIs 7.156 e 7.236 pelo STF, a absolvição criminal só repercute automaticamente na ação de improbidade quando houver decisão **transitada em julgado** fundada nas hipóteses dos arts. 65 ou 386, I ou IV, do Código de Processo Penal. A mera confirmação da absolvição por órgão colegiado não basta.

### Declaração de bens

A **posse** e o **exercício** de agente público ficam condicionados à apresentação da declaração de imposto de renda e proventos de qualquer natureza. A declaração deve ser atualizada anualmente e quando o agente deixar o exercício do mandato, cargo, emprego ou função. A recusa ou a declaração falsa sujeitam o agente à demissão, sem prejuízo de outras sanções.

### Ação de improbidade administrativa

A ação de improbidade tem natureza **repressiva e sancionatória** e não se destina ao controle de legalidade de políticas públicas nem à tutela geral do patrimônio público e social, do meio ambiente ou de outros interesses difusos, coletivos e individuais homogêneos, que devem ser buscados pela via processual adequada.

No julgamento das ADIs 7.156 e 7.236, o STF afastou a utilização da ação de improbidade como substituta da ação civil pública. A improcedência por ausência dos requisitos da improbidade não impede, por si só, o ajuizamento da ação própria para reparar eventual ilegalidade ou dano.

Não se aplicam à ação de improbidade a presunção de veracidade pela revelia, a imposição automática do ônus da prova ao réu nem o reexame necessário da sentença de improcedência ou de extinção sem resolução do mérito. O silêncio do réu em interrogatório não implica confissão.

Atos de enriquecimento ilícito, perda patrimonial, desvio, apropriação, malbaratamento ou dilapidação de recursos públicos dos **partidos políticos** ou de suas fundações são responsabilizados nos termos da **Lei nº 9.096/1995**, sem prejuízo da incidência da Lei de Improbidade quando presentes seus requisitos.

Qualquer pessoa pode representar à autoridade competente. A rejeição administrativa fundamentada não impede representação ao Ministério Público.`;
  callout(judgments, "Efeitos de sentenças civis/penais", "improbidade-administrativa/sec-10").text = "Sentenças civis vinculam a ação de improbidade quanto à inexistência da conduta ou negativa de autoria. A absolvição penal exige trânsito em julgado e fundamento nos arts. 65 ou 386, I ou IV, do CPP.";
  callout(judgments, "Características da Ação por Improbidade", "improbidade-administrativa/sec-10").text = "A ação de improbidade é repressiva e sancionatória. Após as ADIs 7.156 e 7.236, não pode ser empregada como substituta da ação civil pública.";

  const freezing = section(payload, 11);
  freezing.content_markdown = `Na ação de improbidade pode ser formulado, em caráter **antecedente ou incidente**, pedido de **indisponibilidade de bens** para assegurar o ressarcimento integral do dano ao erário e o acréscimo patrimonial resultante de enriquecimento ilícito.

Após as ADIs 7.156 e 7.236, o valor da medida pode abranger também a estimativa da **multa civil**. A indisponibilidade pode alcançar bens adquiridos licitamente, até o limite necessário, porque a origem lícita do patrimônio não impede sua função de garantia. Permanecem as proteções legais de impenhorabilidade, inclusive a do bem de família nas hipóteses legalmente protegidas e a reserva de até **40 salários-mínimos**, conforme a interpretação fixada pelo STF.

A regra é ouvir o réu em **5 dias**. A prévia oitiva pode ser dispensada se comprometer a efetividade da medida. O STF assentou que, excepcionalmente, a tutela pode ser concedida com base em evidência suficiente, inclusive quando a urgência decorrer das circunstâncias demonstradas no caso; a indisponibilidade não é automática.

O valor pode ser substituído por caução idônea, fiança bancária ou seguro-garantia judicial e readequado durante a instrução. Havendo mais de um réu, a soma das indisponibilidades não pode superar o montante fixado, sem prejuízo da individualização da responsabilidade.`;
  callout(freezing, "Indisponibilidade de bens", "improbidade-administrativa/sec-11").text = "A indisponibilidade pode abranger a estimativa da multa civil e alcançar bens de origem lícita até o limite necessário, respeitadas as proteções legais de impenhorabilidade.";

  const interruption = section(payload, 19);
  interruption.content_markdown = `Após o julgamento das ADIs 7.156 e 7.236, a interrupção reinicia a contagem pelo prazo **integral de 8 anos**; o STF invalidou a redução automática pela metade. A pretensão sancionatória fica sujeita ao limite total de **20 anos**.

**Causas de interrupção:**

*   **Ajuizamento** da ação de improbidade administrativa.
*   **Publicação** da sentença condenatória.
*   **Publicação** de decisão ou acórdão de Tribunal de Justiça ou Tribunal Regional Federal que confirme sentença condenatória ou reforme sentença de improcedência.
*   **Publicação** de decisão ou acórdão do Superior Tribunal de Justiça que confirme acórdão condenatório ou reforme acórdão de improcedência.
*   **Publicação** de decisão ou acórdão do Supremo Tribunal Federal que confirme acórdão condenatório ou reforme acórdão de improcedência.`;
  callout(interruption, "Efeito da interrupção", "improbidade-administrativa/sec-19").text = "A interrupção reinicia o prazo integral de 8 anos, observado o limite total de 20 anos fixado pelo STF nas ADIs 7.156 e 7.236.";

  const intercurrent = section(payload, 20);
  intercurrent.content_markdown = `A prescrição intercorrente ocorre quando, entre os marcos interruptivos, transcorre o prazo **integral de 8 anos**, observado o limite total de **20 anos** para a pretensão sancionatória, conforme as ADIs 7.156 e 7.236.

O juiz ou tribunal deve reconhecer a prescrição intercorrente de ofício ou a requerimento da parte, depois de ouvido o Ministério Público, e decretá-la de imediato.`;
  callout(intercurrent, "Definição de prescrição intercorrente", "improbidade-administrativa/sec-20").text = "A prescrição intercorrente ocorre com o transcurso do prazo integral de 8 anos entre marcos interruptivos, observado o limite total de 20 anos.";
}

const UPDATERS = {
  "classificacao-dos-bens-publicos": updatePublicProperty,
  "intervencao-restritiva": updateStateIntervention,
  "abrangencia-arts-1-e-2": updateAccessToInformation,
  "conceito-e-especies": updatePublicAgents,
  abrangencia: updateFederalCivilServants,
  definicoes: updateLegacyProcurement,
  "objetivos-e-caracteristicas": updateLegacyAuction,
  "clausulas-necessarias-art-55": updateLegacyContracts,
  "aplicacao-da-lei-14-133-21": updateCurrentProcurement,
  "improbidade-administrativa": updateAdministrativeImprobity,
};

export function applyRemainingCorrections(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Payload de Direito Administrativo deve ser um objeto");
  }
  const updater = UPDATERS[payload.topic_id];
  if (!updater) {
    throw new Error(`Tópico fora do lote restante de Direito Administrativo: ${payload.topic_id ?? "sem topic_id"}`);
  }

  normalizeContentBreaks(payload);
  updater(payload);
  return payload;
}
