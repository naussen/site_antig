import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [inputArgument, outputArgument] = process.argv.slice(2);

if (!inputArgument || !outputArgument) {
  throw new Error(
    "Uso: node scripts/content-corrections/direito-civil-2026-09-20.mjs <diretorio-entrada> <diretorio-saida>",
  );
}

const inputDirectory = path.resolve(inputArgument);
const outputDirectory = path.resolve(outputArgument);
let appliedCorrectionCount = 0;
let convertedMarkerCount = 0;
let appliedVisualFixCount = 0;

if (inputDirectory === outputDirectory) {
  throw new Error("Os diretórios de entrada e saída devem ser diferentes.");
}

function section(payload, sectionId) {
  const matches = payload.sections.filter((item) => item.section_id === sectionId);
  if (matches.length !== 1) {
    throw new Error(`${sectionId}: esperada exatamente uma seção; encontradas ${matches.length}.`);
  }
  return matches[0];
}

function replaceRequired(item, before, after, label) {
  const occurrences = item.content_markdown.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: esperada uma ocorrência; encontradas ${occurrences}.`);
  }
  item.content_markdown = item.content_markdown.replace(before, after);
  appliedCorrectionCount += 1;
}

function replacePatternRequired(item, pattern, after, expectedCount, label) {
  const matches = item.content_markdown.match(pattern) ?? [];
  if (matches.length !== expectedCount) {
    throw new Error(`${label}: esperadas ${expectedCount} ocorrências; encontradas ${matches.length}.`);
  }
  item.content_markdown = item.content_markdown.replace(pattern, after);
  convertedMarkerCount += matches.length;
}

function replaceVisualRequired(item, before, after, label) {
  const occurrences = item.content_markdown.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: esperada uma ocorrência; encontradas ${occurrences}.`);
  }
  item.content_markdown = item.content_markdown.replace(before, after);
  appliedVisualFixCount += 1;
}

function replaceCorrectionContinuation(item, before, after, label) {
  const occurrences = item.content_markdown.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: esperada uma ocorrência; encontradas ${occurrences}.`);
  }
  item.content_markdown = item.content_markdown.replace(before, after);
}

function setMermaid(item, source, label) {
  if (item.mermaid_mindmap?.trim()) {
    throw new Error(`${label}: mermaid_mindmap já preenchido.`);
  }
  item.mermaid_mindmap = source;
  appliedVisualFixCount += 1;
}

const corrections = {
  "vigencia-das-leis": (payload) => {
    const foreignJudgments = section(payload, "vigencia-das-leis-sec-06");
    replaceRequired(
      foreignJudgments,
      `**IMÓVEIS situados no Brasil:** SOMENTE a autoridade judiciária brasileira é competente.

**Requisitos para que uma sentença proferida no estrangeiro seja executada no Brasil:**

*   Proferida por juiz competente.
*   Partes citadas ou verificada a revelia.
*   Passada em julgado no estrangeiro.
*   Traduzida.
*   Homologada pelo Superior Tribunal de Justiça (STJ).`,
      `A autoridade judiciária brasileira possui competência **exclusiva** para conhecer de ações relativas a imóveis situados no Brasil. Também lhe compete exclusivamente, em matéria de sucessão hereditária, confirmar testamento particular e proceder ao inventário e à partilha de bens situados no Brasil, ainda que o autor da herança seja estrangeiro ou domiciliado fora do país.

**Requisitos para a homologação de decisão estrangeira no Brasil (art. 963 do CPC):**

*   Ser proferida por autoridade competente.
*   Ser precedida de citação regular, ainda que verificada a revelia.
*   Ser eficaz no país em que foi proferida.
*   Não ofender a coisa julgada brasileira.
*   Estar acompanhada de tradução oficial, salvo disposição que a dispense em tratado.
*   Não conter manifesta ofensa à ordem pública.

A decisão estrangeira não será homologada quando a matéria estiver sujeita à competência exclusiva da autoridade judiciária brasileira.`,
      "correção 01/competência e homologação",
    );

    const renvoi = section(payload, "vigencia-das-leis-sec-07");
    replaceRequired(
      renvoi,
      `A **Teoria do Retorno** é um método de interpretação das normas do Direito Internacional Privado que busca substituir a lei nacional pela estrangeira, dando preferência ao ordenamento jurídico estrangeiro. A lei estrangeira pode ser utilizada no Brasil, mas **não pode prevalecer sobre a lei brasileira**, suspendendo sua eficácia.`,
      `O **reenvio** ocorre quando a norma estrangeira indicada remete a disciplina da matéria a outro ordenamento. O art. 16 da LINDB determina que se aplique a disposição material da lei estrangeira indicada, desconsiderando qualquer remissão que ela faça a outra lei.`,
      "correção 02/reenvio",
    );
  },

  pessoa: (payload) => {
    const treatment = section(payload, "pessoa-sec-01");
    replaceRequired(
      treatment,
      `

**Exceções:**
*   Quando a pessoa não consegue expressar sua vontade, o direito de decisão é transferido para a **família**.
*   Em situações extremas de **risco de vida iminente**, o médico pode realizar intervenções **sem consentimento**.`,
      "",
      "correção 03/tratamento médico",
    );

    const name = section(payload, "pessoa-sec-02");
    replaceRequired(
      name,
      `Em regra, o nome é **imutável**. Contudo, existem algumas **exceções** para sua alteração:
*   No primeiro ano após a maioridade civil (18 anos), sem necessidade de motivação.`,
      `A alteração do nome observa as hipóteses previstas na Lei de Registros Públicos. Após atingir a maioridade civil, a pessoa registrada pode requerer pessoal e imotivadamente, **uma vez**, a alteração extrajudicial do prenome. Alteração posterior depende de decisão judicial, salvo as hipóteses legais. O sobrenome pode ser alterado extrajudicialmente nas hipóteses do art. 57 da Lei nº 6.015/1973.`,
      "correção 04/nome civil",
    );

    const capacity = section(payload, "pessoa-sec-05");
    replaceRequired(
      capacity,
      `> **Atenção:** Indivíduos com deficiência mental **não** são considerados nem absolutamente incapazes (AI), nem relativamente incapazes (RI) conforme a legislação atual.

A interdição deve ocorrer para os relativamente incapazes.`,
      `> **Atenção:** A deficiência, por si só, não afeta a plena capacidade civil. A pessoa que, por causa transitória ou permanente, não puder exprimir sua vontade pode enquadrar-se no art. 4º, III, do Código Civil. Eventual curatela é medida protetiva extraordinária, proporcional às necessidades e às circunstâncias do caso e deve durar o menor tempo possível.`,
      "correção 05/capacidade e curatela",
    );

    const emancipation = section(payload, "pessoa-sec-06");
    replaceRequired(
      emancipation,
      `*   **Aos 16 anos completos** (ambos os casos precisam de registro em instrumento público):
    *   **Voluntária:** Concessão dos pais, ou de um deles, **independentemente** de homologação judicial.
    *   **Judicial:** Sentença do juiz, ouvido o tutor.`,
      `*   **Aos 16 anos completos:**
    *   **Voluntária:** Concessão dos pais, ou de um deles na falta do outro, por instrumento público, **independentemente** de homologação judicial.
    *   **Judicial:** Sentença do juiz, ouvido o tutor.`,
      "correção 06/emancipação",
    );
    replaceRequired(
      emancipation,
      `> **STJ:** A redução da maioridade civil **não** implica cancelamento automático da pensão alimentícia. Em regra, ela continua até o término da faculdade (24 anos).`,
      `> **STJ:** A maioridade civil não extingue automaticamente a obrigação alimentar. A exoneração depende de decisão judicial com contraditório, e a necessidade deve ser examinada no caso concreto; não há término automático geral aos 24 anos.`,
      "correção 07/alimentos",
    );
  },

  "comeco-da-personalidade-juridica": (payload) => {
    const beginning = section(payload, "comeco-da-personalidade-juridica-sec-01");
    replaceRequired(
      beginning,
      `Os atos dos administradores **obrigam** a PJ, desde que exercidos nos limites de seus poderes. O representante da PJ responderá **pessoalmente** pelo **excesso** (atos *ultra vires*).`,
      `Os atos dos administradores **obrigam** a pessoa jurídica quando exercidos nos limites definidos no ato constitutivo. Eventual responsabilidade pelo excesso depende do regime jurídico aplicável e das circunstâncias; não decorre automaticamente do art. 47 do Código Civil.`,
      "correção 08/atos dos administradores",
    );

    const associates = section(payload, "comeco-da-personalidade-juridica-sec-08");
    replaceRequired(
      associates,
      `*   A **exclusão** de associado requer **justa causa**, em Processo Administrativo que assegure defesa e recurso.`,
      `*   A **exclusão** de associado só é admissível por **justa causa**, reconhecida em procedimento que assegure direito de defesa e recurso, nos termos previstos no estatuto.`,
      "correção 09/exclusão de associado",
    );

    const foundation = section(payload, "comeco-da-personalidade-juridica-sec-11");
    replaceRequired(
      foundation,
      `• Bens, em regra, **INALIENÁVEIS** (vendidos ou doados) e **IMPENHORÁVEIS**.
`,
      "",
      "correção 10/bens de fundação",
    );

    const statute = section(payload, "comeco-da-personalidade-juridica-sec-14");
    replaceRequired(
      statute,
      `*   Deve ser deliberada por **2/3** dos presentes. (Cuidado com a pegadinha de "unanimidade").`,
      `*   Deve ser deliberada por **2/3 dos competentes para gerir e representar a fundação**.`,
      "correção 11/alteração do estatuto",
    );

    const extinction = section(payload, "comeco-da-personalidade-juridica-sec-15");
    replaceRequired(
      extinction,
      `que se proponha a fim **IGUAL**.`,
      `que se proponha a fim **IGUAL ou SEMELHANTE**.`,
      "correção 12/extinção da fundação",
    );

    const disregard = section(payload, "comeco-da-personalidade-juridica-sec-16");
    replaceRequired(
      disregard,
      `dos **administradores** ou **sócios** da Pessoa Jurídica (que participem da administração, **NÃO** meros quotistas) beneficiados direta ou indiretamente pelo abuso.`,
      `dos **administradores** ou **sócios** da pessoa jurídica beneficiados direta ou indiretamente pelo abuso.`,
      "correção 13/pessoas alcançadas",
    );
    replaceRequired(
      disregard,
      `**NÃO** ocorre de ofício, exceto quando se trata de relações de consumo (CDC), onde pode ser aplicada de ofício.`,
      `A instauração da desconsideração depende de requerimento da parte ou do Ministério Público, quando lhe couber intervir. O CDC altera os pressupostos materiais da medida, mas não estabelece autorização genérica para sua instauração de ofício.`,
      "correção 14/iniciativa da desconsideração",
    );
  },

  "classificacao-doutrinaria": (payload) => {
    const goods = section(payload, "classificacao-doutrinaria-sec-02");
    replaceRequired(
      goods,
      `    *   Abrange bens móveis que, incorporados ao solo pelo trabalho humano, tornam-se imóveis (ex: caminhões, escavadeiras, colheitadeiras).
`,
      "",
      "correção 15/máquinas móveis",
    );
    replaceRequired(
      goods,
      `> **Cuidado!** Aeronaves e embarcações: A **doutrina** os considera bens móveis especiais, mas a **lei** os trata como imóveis.`,
      `> **Cuidado!** Aeronaves e embarcações são bens móveis. Excepcionalmente, podem ser objeto de hipoteca, nas hipóteses legais.`,
      "correção 16/aeronaves e embarcações",
    );
    replaceRequired(
      goods,
      `*   Venda, doação e hipoteca **dependem** de outorga conjugal.`,
      `*   Ressalvado o regime da separação absoluta e as demais hipóteses legais, a alienação ou a gravação de ônus real sobre imóvel exige autorização do outro cônjuge.`,
      "correção 17/outorga conjugal",
    );
    replaceRequired(
      goods,
      `Exemplos: mar territorial, terrenos de marinha e terras devolutas.`,
      `Exemplos: terrenos de marinha e terras devolutas. O mar territorial integra os bens de uso comum do povo.`,
      "correção 18/mar territorial",
    );
  },

  "classificacao-geral-dos-fatos-juridicos": (payload) => {
    const defects = section(payload, "classificacao-geral-dos-fatos-juridicos-sec-02");
    replaceRequired(
      defects,
      `### Fraude contra credores
São atos praticados pelo devedor que resultam na diminuição de seu patrimônio, tornando-o insolvente, com a **intenção de prejudicar seus credores**.`,
      `### Fraude contra credores
A fraude contra credores abrange atos que prejudicam a garantia patrimonial do credor. Os requisitos variam conforme o ato: nos negócios gratuitos e na remissão de dívida, aplica-se o art. 158 do Código Civil; nos contratos onerosos, o art. 159 exige que a insolvência seja notória ou cognoscível pelo outro contratante.`,
      "correção 19/fraude contra credores",
    );

    const regress = section(payload, "classificacao-geral-dos-fatos-juridicos-sec-08");
    replaceRequired(
      regress,
      `Conforme o Art. 195, os **representantes legais** (RL) e as **pessoas jurídicas** (PJ) possuem **ação de regresso** contra seus assistentes ou representantes legais que, por **dolo**, causarem a prescrição ou deixarem de alegá-la no momento oportuno.`,
      `Conforme o art. 195, os **relativamente incapazes** e as **pessoas jurídicas** possuem ação contra seus assistentes ou representantes legais que derem causa à prescrição ou não a alegarem oportunamente.`,
      "correção 20/artigo 195",
    );
    replaceRequired(
      regress,
      `O Art. 196 estabelece que a **prescrição iniciada contra uma pessoa continua contra seu sucessor**, exceto se o sucessor for um **absolutamente incapaz (AI)**, até que este atinja a capacidade relativa.`,
      `O art. 196 estabelece que a **prescrição iniciada contra uma pessoa continua a correr contra seu sucessor**. O dispositivo não contém exceção expressa para sucessor absolutamente incapaz; a proteção dos absolutamente incapazes é disciplinada separadamente pelo art. 198, I.`,
      "correção 21/artigo 196",
    );
    replaceRequired(
      regress,
      `#### Decadência (Art. 211)

*   A **parte a quem aproveita** pode alegar a decadência.
*   A alegação pode ser feita em **qualquer grau de jurisdição**.
*   **Contrariamente à prescrição**, o juiz **não pode suprir a alegação** de decadência de ofício.

### O juiz pode reconhecer de ofício?

*   **Prescrição**: **SIM**, o juiz pode reconhecer a prescrição de ofício.
*   **Decadência**: **NÃO**, o juiz não pode reconhecer a decadência de ofício, salvo se a lei expressamente permitir ou se tratar de decadência legal (não convencional).

O juiz **pode** reconhecer a prescrição de ofício, sem necessidade de requerimento.

*   **Legal:** O artigo 210 estabelece que o juiz **deve** conhecer de ofício.
*   **Convencional:** O juiz **não pode** reconhecer de ofício (deve ser provocado).`,
      `#### Decadência (arts. 210 e 211)

*   **Decadência legal:** o juiz deve conhecê-la de ofício.
*   **Decadência convencional:** a parte a quem aproveita pode alegá-la em qualquer grau de jurisdição, mas o juiz não pode suprir a alegação.

### O juiz pode reconhecer de ofício?

*   **Prescrição:** sim, observada a prévia manifestação das partes no processo.
*   **Decadência legal:** sim; o art. 210 determina seu conhecimento de ofício.
*   **Decadência convencional:** não; depende de alegação da parte a quem aproveita.`,
      "correção 22/decadência de ofício",
    );

    const periods = section(payload, "classificacao-geral-dos-fatos-juridicos-sec-13");
    replaceRequired(
      periods,
      `(ex: crédito tributário).`,
      `(o crédito tributário segue a legislação tributária própria, e não este inciso do Código Civil).`,
      "correção 23/crédito tributário",
    );
  },

  "modalidades-das-obrigacoes": (payload) => {
    const defaultItem = section(payload, "modalidades-das-obrigacoes-sec-02");
    replaceRequired(
      defaultItem,
      `*   **Caso fortuito ou força maior:** O devedor responde se o evento ocorrer durante o atraso, salvo se provar isenção de culpa.`,
      `*   **Caso fortuito ou força maior:** O devedor em mora responde pela impossibilidade da prestação, ainda que decorrente de caso fortuito ou força maior durante o atraso, salvo se provar isenção de culpa **ou** que o dano sobreviria mesmo com o adimplemento oportuno.`,
      "correção 24/caso fortuito durante a mora",
    );

    const penalty = section(payload, "modalidades-das-obrigacoes-sec-03");
    replaceRequired(
      penalty,
      `*   **NÃO** cabem lucros cessantes.`,
      `*   A cumulação com lucros cessantes não é automaticamente admitida nem vedada em toda hipótese. O art. 416, parágrafo único, condiciona a indenização suplementar à convenção expressa e à prova do prejuízo excedente. No Tema 970 do STJ, a multa moratória equivalente ao valor locativo, em regra, afasta a cumulação com lucros cessantes no atraso da entrega de imóvel.`,
      "correção 25/lucros cessantes",
    );
  },

  "principios-contratuais": (payload) => {
    const defects = section(payload, "principios-contratuais-sec-05");
    replaceRequired(
      defects,
      `> **Atenção:** Os prazos acima não correm na constância de cláusula de garantia. Contudo, o adquirente deve denunciar o defeito ao alienante nos 30 dias seguintes ao seu descobrimento, sob pena de decadência (Art. 446).`,
      `> **Atenção:** Se o vício, por sua natureza, só puder ser conhecido mais tarde, o prazo conta da ciência, até o máximo de **180 dias para bens móveis** e **1 ano para bens imóveis** (art. 445, § 1º). Os prazos não correm na constância de cláusula de garantia; o adquirente deve denunciar o defeito ao alienante nos 30 dias seguintes ao descobrimento, sob pena de decadência (art. 446).`,
      "correção 26/vício conhecido posteriormente",
    );

    const extinction = section(payload, "principios-contratuais-sec-10");
    replaceRequired(
      extinction,
      `### Resolução
Extinção por fato **não imputável ao devedor** (ex: força maior).

### Rescisão
Extinção por **falta imputável ao devedor** (inadimplemento).`,
      `### Resolução
Extinção do vínculo por inadimplemento ou por causa superveniente prevista em lei, como a onerosidade excessiva. Pode decorrer de fato imputável ou não ao devedor, conforme a hipótese.

### Rescisão
“Rescisão” não constitui, no Código Civil, categoria geral oposta à resolução com base na imputabilidade. O termo é empregado em hipóteses legais específicas e também, em uso amplo, para designar o desfazimento do contrato.`,
      "correção 27/extinção contratual",
    );
  },

  "especies-de-contratos": (payload) => {
    const donation = section(payload, "especies-de-contratos-sec-01");
    replaceRequired(
      donation,
      `#### Doação a ascendente, descendente ou cônjuge
A doação feita a ascendente, descendente ou cônjuge é considerada um **adiantamento de herança**.`,
      `#### Doação de ascendente a descendente ou entre cônjuges
A doação de **ascendente a descendente**, ou de **um cônjuge a outro**, importa adiantamento do que lhes cabe por herança (art. 544). A regra não abrange, genericamente, doação de descendente a ascendente.`,
      "correção 28/doação e adiantamento",
    );

    const loan = section(payload, "especies-de-contratos-sec-04");
    replaceRequired(
      loan,
      `### Outros pontos bastante cobrados em prova

*   Móvel: 180 dias (ausente 3 dias)
*   Imóvel: 2 anos (ausente 60 dias)
    *   Até pagamento integral.

#### Observações

*   É cessível e transmissível a herdeiros e legatários.
*   NÃO se transmite aos herdeiros.
*   Cláusula estipulada por escrito e depende de registro para valer contra terceiros.

`,
      "",
      "correção 29/bloco órfão no empréstimo",
    );
    replaceRequired(
      loan,
      `O prazo do mútuo, se não houver convenção expressa, será:
*   **Até a próxima colheita** para produtos agrícolas.
*   **Pelo menos 30 dias** para dinheiro.`,
      `O prazo do mútuo, se não houver convenção expressa, será:
*   **Até a próxima colheita** para produtos agrícolas, tanto para consumo quanto para semeadura.
*   **Pelo menos 30 dias** para dinheiro.
*   **O espaço de tempo que declarar o mutuante**, se o mútuo for de qualquer outra coisa fungível (art. 592, III).`,
      "correção 30/artigo 592 III",
    );
  },

  "da-responsabilidade-civil": (payload) => {
    const overview = section(payload, "da-responsabilidade-civil-sec-01");
    replaceRequired(
      overview,
      `    *   **Estado de necessidade**.`,
      `    *   **Estado de necessidade**: a deterioração ou destruição da coisa alheia, ou a lesão a pessoa, para remover perigo iminente, não constitui ato ilícito quando absolutamente necessária e limitada ao indispensável (art. 188, II e parágrafo único). Se o dono da coisa ou a pessoa lesada não tiver culpa pelo perigo, terá direito à indenização; quem indenizar poderá exercer regresso contra o terceiro culpado (arts. 929 e 930).`,
      "correção 31/estado de necessidade",
    );
  },

  "do-direito-pessoal": (payload) => {
    const custody = section(payload, "do-direito-pessoal-sec-02");
    replaceRequired(
      custody,
      `será aplicada a guarda compartilhada, **salvo se** um dos genitores declarar ao magistrado que não deseja a guarda do menor (art. 1.584, §2º do Código Civil).`,
      `será aplicada a guarda compartilhada, **salvo se** um dos genitores declarar ao magistrado que não deseja a guarda ou quando houver elementos que evidenciem a probabilidade de risco de violência doméstica ou familiar (art. 1.584, § 2º, com redação da Lei nº 14.713/2023).`,
      "correção 32/guarda e violência",
    );

    const kinship = section(payload, "do-direito-pessoal-sec-03");
    replaceRequired(
      kinship,
      `    C --- G[TIO - 3º GRAU]
    G --- H[IRMÃO - 2º GRAU]
    H --- I[PRIMO - 4º GRAU]
    B --- J[TIO AVÔ - 4º GRAU]`,
      `    B --> G[TIO - 3º GRAU]
    C --> H[IRMÃO - 2º GRAU]
    G --> I[PRIMO - 4º GRAU]
    A --> J[TIO-AVÔ - 4º GRAU]`,
      "correção 39/árvore de parentesco",
    );

    const propertyRegime = section(payload, "do-direito-pessoal-sec-04");
    replaceRequired(
      propertyRegime,
      `#### Comunhão universal

Neste regime, há a comunicação de **todos os bens presentes e futuros** dos cônjuges e de suas dívidas (art. 1.667 do Código Civil).

*   É o regime "padrão" quando **não houver convenção** ou quando esta for nula ou ineficaz (art. 1.640 do Código Civil).
*   **Forma:** A convenção deve ser reduzida a termo (art. 1.640, parágrafo único do Código Civil).`,
      `#### Regime legal: comunhão parcial

Não havendo convenção, ou sendo ela nula ou ineficaz, vigora o regime da **comunhão parcial** (art. 1.640 do Código Civil).

No processo de habilitação, os nubentes podem optar pela comunhão parcial mediante termo. A escolha de regime diverso depende de pacto antenupcial por escritura pública (art. 1.640, parágrafo único). A comunhão universal é regime convencional e comunica os bens presentes e futuros e as dívidas, ressalvadas as exceções legais.`,
      "correção 33/regime legal",
    );

    const regimes = section(payload, "do-direito-pessoal-sec-05");
    replaceRequired(
      regimes,
      `2.  Pessoa maior de 70 anos. O STJ (Súmula 655) entende que se aplica à união estável contraída por septuagenário, comunicando-se os bens adquiridos na constância da união, desde que comprovado o esforço comum.`,
      `2.  Pessoa maior de 70 anos. Conforme o Tema 1.236 do STF, o regime de separação obrigatória pode ser afastado por manifestação expressa de vontade das partes, mediante escritura pública. Para casamentos e uniões estáveis iniciados antes do julgamento, a alteração produz efeitos patrimoniais apenas para o futuro. A Súmula 655 do STJ registra que, na união estável de pessoa maior de 70 anos, os bens adquiridos onerosamente comunicam-se quando comprovado o esforço comum.`,
      "correção 34/maior de 70 anos",
    );
  },

  "da-sucessao-em-geral": (payload) => {
    const inventory = section(payload, "da-sucessao-em-geral-sec-01");
    replaceRequired(
      inventory,
      `A **colação** é o meio pelo qual os herdeiros necessários restituem à herança aquilo que receberam em vida do *de cujus*. Aplica-se apenas a doações feitas a herdeiros necessários, excluindo doações a terceiros.`,
      `A **colação** é a conferência do valor das doações recebidas em vida, para igualar as legítimas. O art. 2.002 impõe o dever aos **descendentes que concorrerem à sucessão do ascendente comum**, ressalvadas as hipóteses legais de dispensa; não se aplica genericamente a todo herdeiro necessário.`,
      "correção 40/colação",
    );
  },

  "esquema-geral": (payload) => {
    const adversePossession = section(payload, "esquema-geral-sec-03");
    replaceRequired(
      adversePossession,
      `*   **Requisitos**:
    *   **Área rural**: Menor que 50 hectares, utilizada para produção e moradia.
    *   **Área urbana**: Menor que 250 m², utilizada para moradia, desde que o possuidor não seja proprietário de outro imóvel urbano ou rural.`,
      `*   **Requisitos**:
    *   **Área rural**: área **não superior a 50 hectares**, tornada produtiva pelo trabalho do possuidor ou de sua família e utilizada como moradia, desde que o possuidor não seja proprietário de outro imóvel rural ou urbano.
    *   **Área urbana**: área **não superior a 250 m²**, utilizada para moradia do possuidor ou de sua família, desde que ele não seja proprietário de outro imóvel urbano ou rural.`,
      "correção 35/limites da usucapião especial",
    );
    replaceCorrectionContinuation(
      adversePossession,
      `*   **Requisitos**: A propriedade era dividida com ex-cônjuge ou ex-companheiro que **abandonou o lar**. A área urbana deve ser inferior a 250 m², utilizada para moradia, e o possuidor não pode ser proprietário de outro imóvel.`,
      `*   **Requisitos**: A propriedade era dividida com ex-cônjuge ou ex-companheiro que **abandonou o lar**. A área urbana deve ser **de até 250 m²**, utilizada para moradia própria ou da família, e o possuidor não pode ser proprietário de outro imóvel urbano ou rural.`,
      "correção 35b/limite da usucapião familiar",
    );
    replaceRequired(
      adversePossession,
      `*   **Sentença judicial**: É meramente **declaratória**, sendo indispensável o **registro** (constitutivo) para a efetivação da propriedade. Por ser declaratória, a sentença **retroage**, ou seja, o ocupante do imóvel já era proprietário antes mesmo da decisão judicial, que apenas viabiliza o registro.`,
      `*   **Reconhecimento e registro**: A usucapião pode ser reconhecida judicial ou extrajudicialmente. A decisão ou o reconhecimento é **declaratório** de aquisição já consumada pelo preenchimento dos requisitos; o registro dá publicidade e regularidade registral ao domínio, mas não é constitutivo da aquisição por usucapião.`,
      "correção 36/registro da usucapião",
    );
    replacePatternRequired(
      adversePossession,
      /^@@@\s+/gm,
      "### ",
      2,
      "normalização de headings/esquema-geral-sec-03",
    );

    const rights = section(payload, "esquema-geral-sec-07");
    replaceRequired(
      rights,
      `Trata-se de um ato administrativo, registrado no Cartório de Imóveis, que concede a utilização privativa de um bem público a pessoas que, até 27/04/2006, possuíam como seu, por 5 anos ininterruptos e sem oposição, área urbana (incluindo terreno de marinha) de até 250m², utilizada como moradia, e que não fossem proprietárias de outro imóvel.`,
      `Trata-se de direito real reconhecido a quem, até **22/12/2016**, possuía como sua, por 5 anos ininterruptos e sem oposição, área urbana pública de até 250 m² utilizada para moradia própria ou da família, desde que não fosse proprietário ou concessionário, a qualquer título, de outro imóvel urbano ou rural.`,
      "correção 37/concessão especial de uso",
    );
    replaceRequired(
      rights,
      `É um ato administrativo vinculado, de competência exclusiva da Secretaria de Patrimônio da União, registrado no Cartório de Imóveis. Concede a posse para atender a programas habitacionais ou para regularização fundiária de interesse social, destinados a famílias de baixa renda.`,
      `A concessão de direito real de uso, prevista no Decreto-Lei nº 271/1967, pode ser gratuita ou onerosa, por tempo certo ou indeterminado, e recair sobre terrenos públicos ou particulares para fins específicos de urbanização, industrialização, edificação, cultivo da terra, aproveitamento sustentável, preservação de comunidades tradicionais e outras modalidades de interesse social. Não é ato de competência exclusiva da Secretaria do Patrimônio da União nem se limita a programas habitacionais de baixa renda.`,
      "correção 38/concessão de direito real de uso",
    );
  },
};

function applyVisualFixes(payload) {
  if (payload.topic_id === "do-direito-pessoal") {
    const kinship = section(payload, "do-direito-pessoal-sec-03");
    const fencedDiagrams = kinship.content_markdown.match(/```mermaid\r?\n[\s\S]*?```/g) ?? [];
    if (fencedDiagrams.length !== 2) {
      throw new Error(`do-direito-pessoal-sec-03: esperados 2 fences Mermaid; encontrados ${fencedDiagrams.length}.`);
    }
    kinship.content_markdown = kinship.content_markdown
      .replace(/```mermaid\r?\n[\s\S]*?```/g, "")
      .replace(/\n{3,}/g, "\n\n");
    setMermaid(kinship, `flowchart TD
    A["Relações familiares"] --> R["Parentesco"]
    A --> P["Poder familiar"]
    R --> LR["Linha reta"]
    LR --> ASC["Ascendentes<br/>pai 1º, avô 2º, bisavô 3º"]
    LR --> DES["Descendentes<br/>filho 1º, neto 2º"]
    R --> LC["Linha colateral"]
    LC --> IR["Irmão 2º"]
    LC --> TI["Tio e sobrinho 3º"]
    LC --> PR["Primo e tio-avô 4º"]
    P --> EX["Extinção<br/>art. 1.635"]
    P --> PE["Perda judicial<br/>art. 1.638"]`, "visual/parentesco e poder familiar");
  }

  if (payload.topic_id === "esquema-geral") {
    for (const [sectionId, expectedCount] of [
      ["esquema-geral-sec-06", 6],
      ["esquema-geral-sec-07", 15],
    ]) {
      const item = section(payload, sectionId);
      const matches = item.content_markdown.match(/<br\s*\/?>/gi) ?? [];
      if (matches.length !== expectedCount) {
        throw new Error(`${sectionId}: esperados ${expectedCount} <br>; encontrados ${matches.length}.`);
      }
      item.content_markdown = item.content_markdown.replace(/\s*<br\s*\/?>\s*/gi, " — ");
      appliedVisualFixCount += 1;
    }
  }

  if (payload.topic_id === "classificacao-geral-dos-fatos-juridicos") {
    const defects = section(payload, "classificacao-geral-dos-fatos-juridicos-sec-02");
    replaceVisualRequired(
      defects,
      `| Defeito | Definição | Início da contagem | Prazo* (DECADENCIAL) |
| :------ | :-------- | :----------------- | :------------------- |
|         |           |                    |                      |`,
      `| Defeito | Elemento central | Início da contagem | Prazo decadencial |
| :--- | :--- | :--- | ---: |
| **Erro** | Engano substancial | Realização do negócio | **4 anos** |
| **Dolo** | Indução intencional a erro | Realização do negócio | **4 anos** |
| **Estado de perigo** | Obrigação excessivamente onerosa para evitar grave dano conhecido pela outra parte | Realização do negócio | **4 anos** |
| **Lesão** | Prestação manifestamente desproporcional por necessidade ou inexperiência | Realização do negócio | **4 anos** |
| **Fraude contra credores** | Prejuízo à garantia patrimonial do credor | Realização do negócio | **4 anos** |
| **Coação** | Ameaça capaz de incutir temor de dano | Cessação da coação | **4 anos** |
| **Incapacidade relativa** | Negócio praticado sem a assistência necessária | Cessação da incapacidade | **4 anos** |`,
      "visual/tabela de defeitos",
    );

    const limitation = section(payload, "classificacao-geral-dos-fatos-juridicos-sec-07");
    replaceVisualRequired(
      limitation,
      `| Característica | Prescrição | Decadência |
| :------------- | :--------- | :--------- |
| **É possível renunciar?** | **SIM** | **LEGAL:** Nula a renúncia à decadência legal (Art. 209). |
| | Conforme o Art. 191, a renúncia da prescrição (ato do devedor) pode ser **expressa** ou **tácita**. | **CONVENCIONAL:** É possível a renúncia, em virtude da autonomia privada. |
| | A renúncia só é válida após a consumação da prescrição e sem prejuízo a terceiros. | | |
| | **Tácita:** Presume-se de fatos do interessado (devedor) incompatíveis com a prescrição, como o pagamento de uma dívida prescrita. | | |`,
      `| Instituto | Renúncia |
| :--- | :--- |
| **Prescrição** | Pode ser expressa ou tácita, somente depois de consumada e sem prejuízo de terceiro. A renúncia tácita decorre de fato incompatível com a prescrição. |
| **Decadência legal** | A renúncia é nula. |
| **Decadência convencional** | A renúncia é admitida pela autonomia privada. |`,
      "visual/tabela de renúncia",
    );
    replaceVisualRequired(
      limitation,
      `| Característica | Prescrição | Decadência |
| :------------- | :--------- | :--------- |
| **Prazos livremente alteráveis?** | **NÃO** | **LEGAL:** NÃO |
| | O Art. 192 estabelece que os prazos de prescrição **não podem ser alterados por acordo**, sendo todos os prazos prescricionais de natureza legal. | **CONVENCIONAL:** SIM |`,
      `| Instituto | Alteração do prazo pelas partes |
| :--- | :--- |
| **Prescrição** | Não; os prazos prescricionais não podem ser alterados por acordo. |
| **Decadência legal** | Não. |
| **Decadência convencional** | Sim. |`,
      "visual/tabela de alteração de prazos",
    );
    replaceVisualRequired(
      limitation,
      `| Característica | Prescrição | Decadência |
| :------------- | :--------- | :--------- |
| **Prazos suspendem/interrompem?** | **SIM** | |`,
      `| Instituto | Impedimento, suspensão e interrupção |
| :--- | :--- |
| **Prescrição** | Aplicam-se as causas legais. |
| **Decadência** | Em regra, não se aplicam as normas da prescrição, salvo disposição legal em contrário. |`,
      "visual/tabela de suspensão e interrupção",
    );
  }

  if (payload.topic_id === "modalidades-das-obrigacoes") {
    const earnestMoney = section(payload, "modalidades-das-obrigacoes-sec-04");
    replaceVisualRequired(
      earnestMoney,
      `| Característica          | Arras Confirmatórias (art. 418)                               | Arras Penitenciais (art. 420)                                 |
| :---------------------- | :------------------------------------------------------------ | :------------------------------------------------------------ |
| **Hipótese**            | Quando uma das partes não cumpre a execução do contrato.      | Quando uma das partes se arrepende do contrato.               |
| **Função**              | Garantia. Tornar o contrato definitivo e antecipar perdas e danos. | Indenizatória.                                                |
| **Cláusula de Arrependimento** | **NÃO** há previsão contratual.                               | Há previsão contratual.                                       |
| **Indenização Suplementar** |                                                               |                                                               |`,
      `| Característica | Arras confirmatórias (art. 418) | Arras penitenciais (art. 420) |
| :--- | :--- | :--- |
| **Hipótese** | Inexecução do contrato sem cláusula de arrependimento. | Exercício do arrependimento previsto no contrato. |
| **Função** | Confirmar o negócio e prefixar o mínimo das perdas e danos. | Fixar a indenização pelo arrependimento. |
| **Consequência** | Quem deu as arras perde-as; quem recebeu devolve-as mais o equivalente. | Quem deu as arras perde-as; quem recebeu devolve-as mais o equivalente. |
| **Indenização suplementar** | Pode ser exigida se houver prova de prejuízo maior, valendo as arras como taxa mínima. | Não cabe indenização suplementar. |`,
      "visual/tabela de arras",
    );
  }

  const maps = {
    "vigencia-das-leis": [
      ["vigencia-das-leis-sec-05", `flowchart TD
    A["Conflito de leis no espaço"] --> P["Pessoa e família<br/>lei do domicílio"]
    A --> B["Bens<br/>lei da situação"]
    A --> O["Obrigações<br/>lei do lugar de constituição"]
    A --> S["Sucessão<br/>lei do domicílio do falecido"]`],
      ["vigencia-das-leis-sec-06", `flowchart TD
    A["Decisão estrangeira"] --> R["Requisitos do art. 963 do CPC"]
    R --> H["Homologação pelo STJ"]
    H --> E["Eficácia no Brasil"]
    X["Competência exclusiva brasileira"] --> N["Impede homologação"]`],
      ["vigencia-das-leis-sec-11", `flowchart LR
    A["Compromisso administrativo"] --> B["Eliminar irregularidade"]
    A --> C["Eliminar incerteza jurídica"]
    A --> D["Resolver situação contenciosa"]`],
    ],
    "classificacao-geral-dos-fatos-juridicos": [
      ["classificacao-geral-dos-fatos-juridicos-sec-13", `flowchart LR
    A["Prazos prescricionais"] --> B["Regra geral<br/>10 anos"]
    A --> C["Especiais"]
    C --> D["2 anos<br/>alimentos"]
    C --> E["3 anos<br/>reparação, títulos e aluguéis"]
    C --> F["4 anos<br/>tutela"]
    C --> G["5 anos<br/>honorários e dívida líquida"]`],
    ],
    "principios-contratuais": [
      ["principios-contratuais-sec-01", `flowchart TD
    A["Contratos"] --> B["Unilaterais"]
    A --> C["Bilaterais"]
    A --> D["Plurilaterais"]
    D --> E["Várias partes<br/>finalidade comum"]`],
      ["principios-contratuais-sec-10", `flowchart TD
    A["Extinção do contrato"] --> B["Resilição"]
    B --> C["Distrato"]
    B --> D["Denúncia"]
    A --> E["Resolução"]
    E --> F["Inadimplemento"]
    E --> G["Onerosidade excessiva"]`],
    ],
    "da-responsabilidade-civil": [
      ["da-responsabilidade-civil-sec-01", `flowchart LR
    A["Responsabilidade civil"] --> C["Conduta"]
    A --> D["Dano"]
    A --> N["Nexo causal"]
    A --> S["Subjetiva<br/>culpa"]
    A --> O["Objetiva<br/>lei ou risco"]`],
    ],
    "esquema-geral": [
      ["esquema-geral-sec-03", `flowchart TD
    A["Aquisição por usucapião"] --> E["Extraordinária"]
    A --> O["Ordinária"]
    A --> R["Especial rural"]
    A --> U["Especial urbana"]
    A --> F["Familiar"]`],
    ],
    "do-direito-pessoal": [
      ["do-direito-pessoal-sec-02", `flowchart TD
    A["Guarda"] --> U["Unilateral"]
    A --> C["Compartilhada"]
    C --> R["Regra quando ambos aptos"]
    C --> E["Exceções<br/>desinteresse ou risco de violência"]`],
      ["do-direito-pessoal-sec-05", `flowchart TD
    A["Regimes de bens"] --> CP["Comunhão parcial"]
    A --> SE["Separação"]
    A --> PF["Participação final nos aquestos"]
    SE --> SO["Separação obrigatória<br/>art. 1.641"]`],
      ["do-direito-pessoal-sec-11", `flowchart TD
    A["União estável"] --> P["Pública"]
    A --> C["Contínua"]
    A --> D["Duradoura"]
    A --> F["Objetivo de constituir família"]
    A --> R["Regime supletivo<br/>comunhão parcial"]`],
      ["do-direito-pessoal-sec-12", `flowchart TD
    A["Curatela"] --> E["Medida extraordinária"]
    A --> P["Proporcional às necessidades"]
    A --> T["Menor tempo possível"]
    A --> N["Atos patrimoniais e negociais"]`],
    ],
    "da-sucessao-em-geral": [
      ["da-sucessao-em-geral-sec-01", `flowchart TD
    A["Inventário"] --> B["Administração da herança"]
    A --> S["Sonegados"]
    A --> D["Pagamento de dívidas"]
    A --> C["Colação"]
    C --> I["Igualar as legítimas"]`],
    ],
  };

  for (const [sectionId, source] of maps[payload.topic_id] ?? []) {
    setMermaid(section(payload, sectionId), source, `visual/${sectionId}`);
  }
}

const jsonFiles = (await readdir(inputDirectory))
  .filter((name) => name.endsWith(".json"))
  .sort((left, right) => left.localeCompare(right, "pt-BR", { numeric: true }));

if (jsonFiles.length === 0) {
  throw new Error(`Nenhum JSON encontrado em ${inputDirectory}.`);
}

const outputRecords = [];
const seenTopics = new Set();

for (const fileName of jsonFiles) {
  const source = await readFile(path.join(inputDirectory, fileName), "utf8");
  const payload = JSON.parse(source.replace(/^\uFEFF/, ""));
  if (!payload.topic_id || !Array.isArray(payload.sections)) {
    throw new Error(`${fileName}: payload de conteúdo inválido.`);
  }

  if (seenTopics.has(payload.topic_id)) {
    throw new Error(`topic_id duplicado no diretório: ${payload.topic_id}.`);
  }
  seenTopics.add(payload.topic_id);

  const originalFlashcards = payload.sections.map((item) => JSON.stringify(item.flashcards ?? []));
  corrections[payload.topic_id]?.(payload);
  applyVisualFixes(payload);

  payload.sections.forEach((item, index) => {
    if (JSON.stringify(item.flashcards ?? []) !== originalFlashcards[index]) {
      throw new Error(`${item.section_id}: flashcards foram alterados.`);
    }
  });

  outputRecords.push({ fileName, payload });
}

const requiredTopics = Object.keys(corrections);
const missingTopics = requiredTopics.filter((topicId) => !seenTopics.has(topicId));
if (missingTopics.length > 0) {
  throw new Error(`Payloads obrigatórios ausentes: ${missingTopics.join(", ")}.`);
}
if (appliedCorrectionCount !== 40) {
  throw new Error(`Esperadas 40 correções jurídicas; aplicadas ${appliedCorrectionCount}.`);
}
if (convertedMarkerCount !== 2) {
  throw new Error(`Esperadas 2 conversões de marcador; aplicadas ${convertedMarkerCount}.`);
}

await mkdir(outputDirectory, { recursive: true });
for (const { fileName, payload } of outputRecords) {
  await writeFile(
    path.join(outputDirectory, fileName),
    `${JSON.stringify(payload, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" },
  );
}

console.log(`Payloads lidos: ${outputRecords.length}`);
console.log(`Payloads corrigidos: ${requiredTopics.length}`);
console.log(`Correções jurídicas aplicadas: ${appliedCorrectionCount}`);
console.log(`Marcadores @@@ convertidos em headings: ${convertedMarkerCount}`);
console.log(`Correções visuais aplicadas: ${appliedVisualFixCount}`);
console.log(`Saída: ${outputDirectory}`);
