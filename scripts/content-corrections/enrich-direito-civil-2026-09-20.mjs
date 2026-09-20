import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [currentArgument, leiautArgument, outputArgument] = process.argv.slice(2);

if (!currentArgument || !leiautArgument || !outputArgument) {
  throw new Error(
    "Uso: node scripts/content-corrections/enrich-direito-civil-2026-09-20.mjs <diretorio-atuais> <diretorio-leiaut> <diretorio-saida>",
  );
}

const currentDirectory = path.resolve(currentArgument);
const leiautDirectory = path.resolve(leiautArgument);
const outputDirectory = path.resolve(outputArgument);

if (new Set([currentDirectory, leiautDirectory, outputDirectory]).size !== 3) {
  throw new Error("Os três diretórios devem ser diferentes.");
}

const EXPECTED_PAYLOADS = 12;
const EXPECTED_NEW_SECTIONS = 25;
const EXPECTED_LEGAL_CORRECTIONS = 27;
let legalCorrectionCount = 0;

const expectedTitles = new Map([
  ["classificacao-doutrinaria", "Dos Bens"],
  ["classificacao-geral-dos-fatos-juridicos", "Dos Fatos Jurídicos"],
  ["comeco-da-personalidade-juridica", "Das Pessoas Jurídicas"],
  ["da-responsabilidade-civil", "Da Responsabilidade Civil"],
  ["da-sucessao-em-geral", "Direito das Sucessões"],
  ["do-direito-pessoal", "Direito de Família"],
  ["especies-de-contratos", "Das Várias Espécies de Contratos"],
  ["esquema-geral", "Direito das Coisas"],
  ["modalidades-das-obrigacoes", "Direito das Obrigações"],
  ["pessoa", "Das Pessoas Naturais"],
  ["principios-contratuais", "Dos Contratos em Geral"],
  ["vigencia-das-leis", "Lei de Introdução às Normas do Direito Brasileiro - LINDB"],
]);

const mapping = [
  ["das-pessoas-naturais", "das-pessoas-naturais-sec-01", "pessoa", 7],
  ["das-pessoas-naturais", "das-pessoas-naturais-sec-03", "pessoa", 8],
  ["dos-fatos-juridicos", "dos-fatos-juridicos-sec-01", "classificacao-geral-dos-fatos-juridicos", 21],
  ["dos-fatos-juridicos", "dos-fatos-juridicos-sec-02", "classificacao-geral-dos-fatos-juridicos", 22],
  ["dos-fatos-juridicos", "dos-fatos-juridicos-sec-03", "classificacao-geral-dos-fatos-juridicos", 23],
  ["direito-das-obrigacoes", "direito-das-obrigacoes-sec-01", "modalidades-das-obrigacoes", 7],
  ["direito-das-obrigacoes", "direito-das-obrigacoes-sec-02", "modalidades-das-obrigacoes", 8],
  ["direito-das-obrigacoes", "direito-das-obrigacoes-sec-03", "modalidades-das-obrigacoes", 9],
  ["direito-das-obrigacoes", "direito-das-obrigacoes-sec-04", "modalidades-das-obrigacoes", 10],
  ["direito-das-obrigacoes", "direito-das-obrigacoes-sec-05", "modalidades-das-obrigacoes", 11],
  ["das-varias-especies-de-contratos", "das-varias-especies-de-contratos-sec-01", "especies-de-contratos", 7],
  ["das-varias-especies-de-contratos", "das-varias-especies-de-contratos-sec-02", "especies-de-contratos", 8],
  ["direito-das-coisas", "direito-das-coisas-sec-01", "esquema-geral", 8],
  ["direito-das-coisas", "direito-das-coisas-sec-02", "esquema-geral", 9],
  ["direito-das-coisas", "direito-das-coisas-sec-03", "esquema-geral", 10],
  ["direito-das-coisas", "direito-das-coisas-sec-04", "esquema-geral", 11],
  ...Array.from({ length: 9 }, (_, index) => [
    "direito-das-sucessoes",
    `direito-das-sucessoes-sec-${String(index + 1).padStart(2, "0")}`,
    "da-sucessao-em-geral",
    index + 3,
  ]),
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

function replaceExact(object, field, before, after, label, countCorrection = true) {
  if (typeof object?.[field] !== "string") {
    throw new Error(`${label}: campo textual ${field} ausente.`);
  }
  const occurrences = countOccurrences(object[field], before);
  if (occurrences !== 1) {
    throw new Error(`${label}: esperada uma ocorrência em ${field}; encontradas ${occurrences}.`);
  }
  object[field] = object[field].replace(before, after);
  if (countCorrection) legalCorrectionCount += 1;
}

function continueCorrection(object, field, before, after, label) {
  replaceExact(object, field, before, after, label, false);
}

function replaceAllExact(object, field, before, after, expectedCount, label) {
  if (typeof object?.[field] !== "string") {
    throw new Error(`${label}: campo textual ${field} ausente.`);
  }
  const occurrences = countOccurrences(object[field], before);
  if (occurrences !== expectedCount) {
    throw new Error(`${label}: esperadas ${expectedCount} ocorrências em ${field}; encontradas ${occurrences}.`);
  }
  object[field] = object[field].split(before).join(after);
  legalCorrectionCount += 1;
}

function callout(section, title) {
  const matches = section.callouts.filter((item) => item.title === title);
  if (matches.length !== 1) {
    throw new Error(`${section.section_id}/${title}: esperado exatamente um callout; encontrados ${matches.length}.`);
  }
  return matches[0];
}

function section(payload, sectionId) {
  const matches = payload.sections.filter((item) => item.section_id === sectionId);
  if (matches.length !== 1) {
    throw new Error(`${payload.topic_id}/${sectionId}: esperada uma seção; encontradas ${matches.length}.`);
  }
  return matches[0];
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function deterministicUuid(seed) {
  const bytes = Buffer.from(createHash("sha256").update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function remapInternalIds(value, oldSectionId, newSectionId) {
  if (typeof value === "string") return value.split(oldSectionId).join(newSectionId);
  if (Array.isArray(value)) return value.map((item) => remapInternalIds(item, oldSectionId, newSectionId));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remapInternalIds(item, oldSectionId, newSectionId)]));
  }
  return value;
}

function applyAuditedCorrections(payloads) {
  const person = section(payloads.get("pessoa"), "pessoa-sec-08");
  replaceExact(person, "content_markdown",
    "*   **Doação pós-morte:** Exige a manifestação de vontade expressa realizada antes da morte ou, na ausência desta, a decisão da família.",
    "*   **Doação pós-morte:** A retirada de tecidos, órgãos e partes do corpo de pessoa falecida para transplantes ou outra finalidade terapêutica depende da autorização do cônjuge ou parente maior de idade, obedecida a linha sucessória, reta ou colateral, até o segundo grau inclusive, firmada em documento subscrito por duas testemunhas presentes à verificação da morte (art. 4º da Lei nº 9.434/1997).",
    "correção 01/doação pós-morte");

  const obligations = section(payloads.get("modalidades-das-obrigacoes"), "modalidades-das-obrigacoes-sec-07");
  replaceExact(obligations, "content_markdown",
    "*   **Devedor recusa prestação:** Indenização por perdas e danos.",
    "*   **Devedor recusa prestação:** Se a prestação só puder ser executada pelo devedor, a recusa sujeita-o a indenizar perdas e danos (art. 247). Se o fato puder ser executado por terceiro, o credor pode mandá-lo executar à custa do devedor, sem prejuízo da indenização cabível (art. 249).",
    "correção 02/obrigação de fazer");
  replaceExact(obligations, "content_markdown",
    "*   **Pluralidade de Credores:** Cada credor pode exigir a dívida inteira. O devedor ou devedores ficam desobrigados pagando a todos os credores conjuntamente, ou pagando a apenas um deles (hipótese em que os demais credores podem exigir sua parte em dinheiro).",
    "*   **Pluralidade de Credores:** Cada credor pode exigir a dívida inteira. O devedor ou devedores ficam desobrigados pagando a todos conjuntamente ou a um deles, desde que este dê caução de ratificação dos outros credores (art. 260). Se apenas um receber a prestação por inteiro, os demais poderão exigir dele, em dinheiro, a parte que lhes caiba no total (art. 261).",
    "correção 03/obrigação indivisível");

  const purchase = section(payloads.get("especies-de-contratos"), "especies-de-contratos-sec-07");
  replaceExact(purchase, "content_markdown",
    "A compra e venda pura é considerada obrigatória e perfeita desde que as partes acordem formalmente no objeto e no preço.",
    "A compra e venda pura é considerada obrigatória e perfeita desde que as partes acordem no objeto e no preço, ressalvada a forma especial exigida por lei em hipóteses específicas.",
    "correção 04/forma da compra e venda");
  replaceExact(purchase, "content_markdown",
    "* Pode ser deixada ao arbítrio de terceiro; caso este não aceite a incumbência, o contrato ficará sem efeito.",
    "* Pode ser deixada ao arbítrio de terceiro; caso este não aceite a incumbência, o contrato ficará sem efeito, salvo quando as partes concordarem em designar outra pessoa (art. 485).",
    "correção 05/fixação do preço");

  const preference = section(payloads.get("especies-de-contratos"), "especies-de-contratos-sec-08");
  replaceExact(preference, "content_markdown",
    "* **Prazo:** Móvel: 180 dias (na ausência de prazo estipulado, o direito deve ser exercido em 3 dias após a notificação). Imóvel: 2 anos (na ausência de prazo estipulado, o direito deve ser exercido em 60 dias após a notificação).",
    "* **Prazo máximo da cláusula de preferência:** 180 dias para bem móvel e 2 anos para bem imóvel (art. 513, parágrafo único). **Prazo para exercer a preferência após a notificação, se outro não tiver sido estipulado:** 3 dias para bem móvel e 60 dias para bem imóvel (art. 516).",
    "correção 06/preempção");

  const factsGeneral = section(payloads.get("classificacao-geral-dos-fatos-juridicos"), "classificacao-geral-dos-fatos-juridicos-sec-21");
  replaceExact(factsGeneral, "content_markdown",
    "*   **Fato Jurídico Natural (em sentido estrito / *stricto sensu*):** Proveniente exclusivamente de fenômenos da natureza, sem a participação da vontade humana, mas que gera repercussão jurídica. Subdivide-se em:\n    *   **Ordinários:** Acontecimentos que normalmente ocorrem, sendo, portanto, previsíveis. Exemplos: prescrição, decadência, nascimento, maioridade e morte.\n    *   **Extraordinários:** Acontecimentos que ocorrem de maneira inesperada, caracterizando-se por serem imprevisíveis, inevitáveis e ausentes de culpa. Exemplos: caso fortuito e força maior.",
    "*   **Fato Jurídico Natural (em sentido estrito / *stricto sensu*):** Proveniente exclusivamente de fenômenos da natureza, sem a participação da vontade humana, mas que gera repercussão jurídica. Subdivide-se em:\n    *   **Ordinários:** Acontecimentos que normalmente ocorrem, sendo, portanto, previsíveis. Exemplos: prescrição, decadência, nascimento, maioridade e morte.\n    *   **Extraordinários:** Acontecimentos como caso fortuito e força maior. Para os efeitos do art. 393, parágrafo único, o dado decisivo é que seus efeitos sejam necessários e não seja possível evitá-los ou impedi-los; a lei não exige cumulativamente imprevisibilidade.",
    "correção 07/art. 393");
  replaceExact(factsGeneral, "content_markdown",
    "*   **Fato Jurídico Humano (ou apenas Ato):** Decorre da atuação humana e subdivide-se em:\n    *   **Ato Lícito (art. 185):** Ato jurídico em sentido amplo praticado em estrita conformidade com a ordem jurídica. Divide-se em:",
    "*   **Fato Jurídico Humano (ou apenas Ato):** Decorre da atuação humana e subdivide-se em:\n    *   **Ato Lícito:** Ato humano conforme ao ordenamento jurídico. O art. 185 determina que aos atos jurídicos lícitos que não sejam negócios jurídicos se apliquem, no que couber, as disposições do título anterior. Divide-se em:",
    "correção 08/art. 185");
  replaceExact(factsGeneral, "content_markdown",
    "    *   **Ato Ilícito (ou Involuntário):** Consiste na transgressão de um dever jurídico. Não gera direitos, mas sim obrigações. A natureza involuntária não se refere à conduta em si, mas sim aos seus efeitos, que são sempre definidos pela lei. O ato ilícito não é considerado um ato jurídico, mas sim um mero fato jurídico humano, visto que não é praticado em conformidade com a ordem jurídica. Classifica-se em:",
    "    *   **Ato Ilícito:** Consiste na violação de um dever jurídico e pode produzir efeitos jurídicos definidos pela lei, em especial a obrigação de reparar o dano (art. 927). Não é ato jurídico lícito, mas fato jurídico humano ilícito. Classifica-se em:",
    "correção 09/efeitos do ilícito");

  const legalBusiness = section(payloads.get("classificacao-geral-dos-fatos-juridicos"), "classificacao-geral-dos-fatos-juridicos-sec-22");
  replaceExact(legalBusiness, "content_markdown",
    "    *   *Exemplo:* É impossível vender um bezerro que ainda não nasceu, mas assim que ele nascer, a venda poderá ser realizada. Essa impossibilidade inicial não invalida o contrato de compra e venda.",
    "    *   *Exemplo:* A compra e venda pode ter por objeto coisa futura, como a produção vindoura, ficando o contrato sem efeito se a coisa não vier a existir, salvo se a intenção das partes era concluir contrato aleatório (art. 483).",
    "correção 10/coisa futura");
  replaceExact(legalBusiness, "content_markdown",
    "*   **Art. 108.** Não dispondo a lei em contrário, a escritura pública é essencial à validade dos negócios jurídicos que visem à constituição, transferência, modificação ou renúncia de direitos reais sobre imóveis de valor superior a 30 (trinta) salários mínimos.",
    "*   **Art. 108.** Não dispondo a lei em contrário, a escritura pública é essencial à validade dos negócios jurídicos que visem à constituição, transferência, modificação ou renúncia de direitos reais sobre imóveis de valor superior a trinta vezes o maior salário mínimo vigente no País.",
    "correção 11/art. 108");
  continueCorrection(callout(legalBusiness, "Escritura pública"), "text",
    "É essencial para a validade de negócios jurídicos que envolvam direitos reais sobre imóveis de valor superior a 30 salários mínimos, salvo disposição legal em contrário (Art. 108 do CC).",
    "É essencial para a validade de negócios jurídicos que envolvam direitos reais sobre imóveis de valor superior a trinta vezes o maior salário mínimo vigente no País, salvo disposição legal em contrário (art. 108 do CC).",
    "correção 11/art. 108/callout");
  replaceExact(legalBusiness, "content_markdown",
    "*   **Art. 110.** A manifestação de vontade subsiste ainda que o seu autor haja feito a reserva mental de não querer o que manifestou, salvo se dela o destinatário tinha conhecimento. A reserva mental ocorre quando a vontade declarada não coincide com a vontade real, com o propósito de enganar o destinatário, diferindo da simulação, que pressupõe conluio entre as partes.",
    "*   **Art. 110.** A manifestação de vontade subsiste ainda que o seu autor haja feito a reserva mental de não querer o que manifestou, salvo se dela o destinatário tinha conhecimento. A reserva mental ocorre quando a vontade declarada não coincide com a vontade real, independentemente de propósito de enganar; difere da simulação, que pressupõe conluio entre as partes.",
    "correção 12/reserva mental");
  continueCorrection(callout(legalBusiness, "Reserva mental"), "text",
    "Ocorre quando a vontade declarada não coincide com a vontade real, com o propósito de enganar o destinatário. A manifestação de vontade subsiste, salvo se o destinatário tinha conhecimento da reserva mental.",
    "Ocorre quando a vontade declarada não coincide com a vontade real, independentemente de propósito de enganar. A manifestação de vontade subsiste, salvo se o destinatário tinha conhecimento da reserva mental.",
    "correção 12/reserva mental/callout");

  const form = section(payloads.get("classificacao-geral-dos-fatos-juridicos"), "classificacao-geral-dos-fatos-juridicos-sec-23");
  replaceExact(form, "content_markdown",
    "A forma do negócio jurídico pode ser prescrita ou não defesa em lei. Caso a forma exigida por lei não seja cumprida, o ato será considerado **NULO**.",
    "A validade da declaração de vontade não depende de forma especial, salvo quando a lei expressamente a exigir (art. 107). O negócio jurídico será **NULO** quando não revestir a forma prescrita em lei ou quando for preterida solenidade que a lei considere essencial à sua validade (art. 166, IV e V).",
    "correção 13/forma do negócio");
  continueCorrection(callout(form, "Forma não cumprida"), "text",
    "Se a forma exigida por lei para o negócio jurídico não for cumprida, o ato será considerado nulo.",
    "A forma é livre, salvo exigência legal expressa (art. 107). A nulidade ocorre nas hipóteses do art. 166, IV e V: falta da forma prescrita ou preterição de solenidade essencial.",
    "correção 13/forma/callout");
  replaceExact(form, "content_markdown",
    "A declaração de vontade constitui pressuposto do negócio jurídico, configurando-se como um elemento essencial e indispensável, além de se caracterizar como uma condição de validade.",
    "A declaração de vontade é elemento constitutivo do negócio jurídico. Sua validade depende dos requisitos do art. 104: agente capaz; objeto lícito, possível, determinado ou determinável; e forma prescrita ou não defesa em lei.",
    "correção 14/declaração de vontade");
  continueCorrection(callout(form, "Declaração de vontade"), "text",
    "É um elemento essencial e indispensável do negócio jurídico, sendo também uma condição de validade.",
    "É elemento constitutivo do negócio jurídico; os requisitos de validade estão previstos no art. 104 do Código Civil.",
    "correção 14/declaração/callout");

  const thingsOverview = section(payloads.get("esquema-geral"), "esquema-geral-sec-08");
  replaceExact(thingsOverview, "content_markdown",
    "    * *Imóvel:* Enfiteuse, Superfície, Servidão, Usufruto, Uso, Habitação.",
    "    * *Imóvel:* Enfiteuses e subenfiteuses já existentes, regidas até sua extinção pelo Código Civil anterior (art. 2.038), Superfície, Servidão, Usufruto, Uso e Habitação.",
    "correção 15/enfiteuse");
  replaceExact(thingsOverview, "content_markdown",
    "  * **Aquisição:** Direito do promitente comprador.",
    "  * **Aquisição:** Direito do promitente comprador.\n  * **Outros direitos do rol legal:** Direito real de laje e direitos oriundos da imissão provisória na posse, quando concedida à União, aos Estados, ao Distrito Federal, aos Municípios ou às suas entidades delegadas, com fundamento em desapropriação por utilidade ou necessidade pública ou interesse social (art. 1.225, XIII e XIV). Os incisos XI e XII contemplam, respectivamente, a concessão de uso especial para fins de moradia e a concessão de direito real de uso.",
    "correção 16/rol art. 1.225");

  const realRights = section(payloads.get("esquema-geral"), "esquema-geral-sec-10");
  replaceExact(realRights, "content_markdown",
    "Nesta hipótese, o objeto da propriedade é limitado. Trata-se do direito de receber permissão para usar ou ter a coisa como se fosse sua, sob determinadas circunstâncias ou condições estabelecidas pela lei e pelo contrato.",
    "Nesta hipótese, o titular exerce poderes jurídicos limitados sobre coisa pertencente a outrem, nos limites do direito real tipificado em lei; não se trata de mera permissão do proprietário.",
    "correção 17/direito real limitado");

  const possession = section(payloads.get("esquema-geral"), "esquema-geral-sec-11");
  replaceExact(possession, "content_markdown",
    "* **Posse Direta (imediata):** É aquela exercida por quem detém materialmente a coisa. Exemplos: proprietário, locatário, entre outros.\n  * **Art. 1.197 do Código Civil:** A posse direta não anula a indireta, sendo permitido ao possuidor direto defender a sua posse contra o possuidor indireto. A recíproca também é verdadeira, conforme o Enunciado 76.\n* **Posse Indireta (mediata):** É aquela exercida por quem não detém o contato direto com a coisa, em razão de ter cedido o seu uso. Exemplos: proprietário (indireto) e locatário (direto).",
    "* **Posse Direta (imediata):** É exercida temporariamente por quem tem a coisa em virtude de direito pessoal ou real, como o locatário.\n  * **Art. 1.197 do Código Civil:** A posse direta não anula a indireta, sendo permitido ao possuidor direto defender a sua posse contra o possuidor indireto. A recíproca também é verdadeira, conforme o Enunciado 76.\n* **Posse Indireta (mediata):** Permanece com quem cedeu temporariamente o uso da coisa, como o locador/proprietário.",
    "correção 18/posse direta e indireta");
  replaceExact(possession, "content_markdown",
    "* **Ad interdicta:** É a posse que pode ser defendida pelas ações possessórias, mas que impede a aquisição da propriedade por meio de usucapião.",
    "* **Ad interdicta:** É a posse protegida por ações possessórias. Essa proteção não exclui, por si só, a possibilidade de a posse também ser *ad usucapionem*, se preenchidos os requisitos da modalidade de usucapião.",
    "correção 19/ad interdicta");
  replaceExact(possession, "content_markdown",
    "| **Benfeitorias Necessárias** | Deve ser indenizado. | Deve ser indenizado, contudo não possui o direito de retenção nem o de levantar as benfeitorias. |\n| **Benfeitorias Úteis** | Deve ser indenizado. | Não tem direito a indenização, retenção ou levantamento. |\n| **Benfeitorias Voluptuárias** | Deve ser indenizado, sendo-lhe permitido levantar as benfeitorias (retirá-las da coisa). | Não tem direito a indenização, retenção ou levantamento. |",
    "| **Benfeitorias Necessárias** | Tem direito à indenização e à retenção. | Deve ser indenizado, contudo não possui o direito de retenção nem o de levantar as benfeitorias. |\n| **Benfeitorias Úteis** | Tem direito à indenização e à retenção. | Não tem direito a indenização, retenção ou levantamento. |\n| **Benfeitorias Voluptuárias** | Pode levantá-las, se não forem pagas e se a retirada não causar detrimento à coisa (art. 1.219). | Não tem direito a indenização, retenção ou levantamento. |",
    "correção 20/benfeitorias de boa-fé");
  replaceAllExact(possession, "content_markdown",
    "* **Formalização:** A propriedade é declarada por sentença do juiz.",
    "* **Reconhecimento:** A usucapião pode ser reconhecida judicialmente ou extrajudicialmente; o registro imobiliário dá publicidade e regularidade registral a uma aquisição originária já consumada.",
    2,
    "correção 21/reconhecimento da usucapião");
  continueCorrection(possession, "content_markdown",
    "* **Natureza da Sentença:** A sentença do juiz é meramente declaratória, sendo o registro no Cartório de Registro de Imóveis um ato indispensável e de caráter constitutivo para a transmissão formal.",
    "* **Natureza do reconhecimento e do registro:** O reconhecimento judicial ou extrajudicial e o registro imobiliário têm natureza declaratória da aquisição originária já consumada pelo preenchimento dos requisitos legais; o registro não é constitutivo da usucapião.",
    "correção 21/natureza declaratória");
  replaceExact(possession, "content_markdown",
    "* **Confisco:** Ocorre em decorrência da cultura ilegal de plantas psicotrópicas, conforme previsto no art. 243 da Constituição Federal.",
    "* **Expropriação do art. 243 da Constituição:** Alcança propriedades rurais e urbanas onde forem localizadas culturas ilegais de plantas psicotrópicas ou exploração de trabalho escravo, na forma da lei, sem indenização ao proprietário e sem prejuízo de outras sanções.",
    "correção 22/art. 243 da Constituição");

  const exclusion = section(payloads.get("da-sucessao-em-geral"), "da-sucessao-em-geral-sec-06");
  replaceExact(exclusion, "content_markdown",
    "*   **Necessidade de sentença:** A exclusão do herdeiro ou legatário deve ser declarada por sentença judicial (artigo 1.815).",
    "*   **Necessidade de sentença:** Em regra, a exclusão do herdeiro ou legatário deve ser declarada por sentença judicial (art. 1.815). Contudo, o trânsito em julgado da sentença penal condenatória, em qualquer dos casos de indignidade do art. 1.814, acarreta a imediata exclusão do indigno, independentemente da sentença civil prevista no art. 1.815 (art. 1.815-A).",
    "correção 23/art. 1.815-A");

  const representation = section(payloads.get("da-sucessao-em-geral"), "da-sucessao-em-geral-sec-09");
  replaceExact(representation, "content_markdown",
    "*   **Linha transversal:** Na linha transversal, o direito de representação aplica-se somente a sobrinhos do falecido (art. 1.853).",
    "*   **Linha transversal:** Na linha transversal, o direito de representação aplica-se somente aos filhos de irmãos do falecido, quando concorrerem com irmãos deste (art. 1.853).",
    "correção 24/representação transversal");

  const testament = section(payloads.get("da-sucessao-em-geral"), "da-sucessao-em-geral-sec-10");
  replaceExact(testament, "content_markdown",
    "*   **Maiores de 16 anos:** Podem testar.\n*   **Incapazes:** Não podem testar.\n*   **Pleno discernimento:** Não podem testar aqueles que não tiverem pleno discernimento no ato da feitura do testamento.",
    "*   **Maiores de 16 anos:** Podem testar, ainda que relativamente incapazes por motivo de idade (art. 1.860, parágrafo único).\n*   **Incapazes e ausência de discernimento:** Além dos incapazes, não podem testar os que, no ato de fazê-lo, não tiverem pleno discernimento (art. 1.860, caput).",
    "correção 25/capacidade testamentária");
  replaceExact(testament, "content_markdown",
    "Deve ser escrito e assinado pelo testador, sendo lido por ele a pelo menos 3 testemunhas, que também deverão subscrevê-lo. Se o testamento for assinado apenas pelo testador, sem testemunhas, ele poderá ser confirmado a critério do juiz.",
    "Deve ser escrito e assinado pelo testador, sendo lido por ele a pelo menos 3 testemunhas, que também deverão subscrevê-lo. Somente em circunstâncias excepcionais declaradas na cédula o testamento particular de próprio punho e assinado pelo testador, sem testemunhas, poderá ser confirmado, a critério do juiz (art. 1.879).",
    "correção 26/testamento particular excepcional");

  const dispositions = section(payloads.get("da-sucessao-em-geral"), "da-sucessao-em-geral-sec-11");
  replaceExact(dispositions, "content_markdown",
    "4.  Que deixe ao arbítrio do herdeiro, ou de outrem, a fixação do valor do legado.",
    "4.  Que deixe ao arbítrio do herdeiro, ou de outrem, a fixação do valor do legado;\n5.  Que favoreça as pessoas a que se referem os arts. 1.801 e 1.802 (art. 1.900, V).",
    "correção 27/art. 1.900, V");
}

async function loadJsonDirectory(directory, expectedCount, label) {
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name).sort();
  if (expectedCount !== undefined && files.length !== expectedCount) {
    throw new Error(`${label}: esperados ${expectedCount} JSONs; encontrados ${files.length}.`);
  }
  const records = [];
  for (const file of files) {
    const raw = await readFile(path.join(directory, file), "utf8");
    const payload = JSON.parse(raw);
    records.push({ file, raw, payload });
  }
  return records;
}

const currentRecords = await loadJsonDirectory(currentDirectory, EXPECTED_PAYLOADS, "payloads atuais");
const leiautRecords = await loadJsonDirectory(leiautDirectory, 12, "payloads LEIAUT");
const currentByTopic = new Map(currentRecords.map((record) => [record.payload.topic_id, record]));
const leiautByTopic = new Map(leiautRecords.map((record) => [record.payload.topic_id, record.payload]));

if (currentByTopic.size !== EXPECTED_PAYLOADS || leiautByTopic.size !== 12) {
  throw new Error("topic_id duplicado em um dos diretórios de entrada.");
}
for (const [topicId, expectedTitle] of expectedTitles) {
  const payload = currentByTopic.get(topicId)?.payload;
  if (!payload || payload.discipline !== "Direito Civil" || payload.topic_title !== expectedTitle) {
    throw new Error(`${topicId}: disciplina ou título divergente do contrato esperado.`);
  }
}
if (mapping.length !== EXPECTED_NEW_SECTIONS) {
  throw new Error(`Mapeamento interno inválido: ${mapping.length} seções.`);
}

const outputByTopic = new Map(currentRecords.map(({ payload }) => [payload.topic_id, clone(payload)]));
const oldSectionsByTopic = new Map(currentRecords.map(({ payload }) => [payload.topic_id, clone(payload.sections)]));
const additionsByTopic = new Map();

for (const [sourceTopicId, sourceSectionId, targetTopicId, targetNumber] of mapping) {
  const sourcePayload = leiautByTopic.get(sourceTopicId);
  const targetPayload = outputByTopic.get(targetTopicId);
  if (!sourcePayload || !targetPayload) {
    throw new Error(`Mapeamento inválido: ${sourceTopicId} -> ${targetTopicId}.`);
  }
  const sourceSection = section(sourcePayload, sourceSectionId);
  const targetSectionId = `${targetTopicId}-sec-${String(targetNumber).padStart(2, "0")}`;
  if (targetPayload.sections.some((item) => item.section_id === targetSectionId)) {
    throw new Error(`${targetSectionId}: recusada sobrescrita de seção existente.`);
  }
  let newSection = remapInternalIds(clone(sourceSection), sourceSectionId, targetSectionId);
  newSection.section_id = targetSectionId;
  newSection.content_unit_id = deterministicUuid(`direito-civil-2026-09-20:${sourceTopicId}:${sourceSectionId}:${targetTopicId}`);
  const baseStableKey = slugify(newSection.title);
  const usedKeys = new Set(targetPayload.sections.map((item) => item.stable_key).filter(Boolean));
  newSection.stable_key = usedKeys.has(baseStableKey) ? `${baseStableKey}-${targetNumber}` : baseStableKey;
  newSection.flashcards = [];
  targetPayload.sections.push(newSection);
  additionsByTopic.set(targetTopicId, (additionsByTopic.get(targetTopicId) ?? 0) + 1);
}

applyAuditedCorrections(outputByTopic);

if (legalCorrectionCount !== EXPECTED_LEGAL_CORRECTIONS) {
  throw new Error(`Gate jurídico: esperadas ${EXPECTED_LEGAL_CORRECTIONS} correções; aplicadas ${legalCorrectionCount}.`);
}

let totalAdditions = 0;
for (const [topicId, outputPayload] of outputByTopic) {
  const original = currentByTopic.get(topicId).payload;
  const oldSections = oldSectionsByTopic.get(topicId);
  if (JSON.stringify(outputPayload.sections.slice(0, oldSections.length)) !== JSON.stringify(oldSections)) {
    throw new Error(`${topicId}: uma ou mais seções antigas foram alteradas.`);
  }
  for (const key of Object.keys(original)) {
    if (key !== "sections" && JSON.stringify(outputPayload[key]) !== JSON.stringify(original[key])) {
      throw new Error(`${topicId}: metadado de tópico alterado: ${key}.`);
    }
  }
  const expectedAdditions = additionsByTopic.get(topicId) ?? 0;
  const actualAdditions = outputPayload.sections.length - original.sections.length;
  if (actualAdditions !== expectedAdditions) {
    throw new Error(`${topicId}: esperadas ${expectedAdditions} adições; encontradas ${actualAdditions}.`);
  }
  totalAdditions += actualAdditions;
  const unitIds = new Set();
  const stableKeys = new Set();
  outputPayload.sections.forEach((item, index) => {
    const expectedSectionId = `${topicId}-sec-${String(index + 1).padStart(2, "0")}`;
    if (item.section_id !== expectedSectionId) {
      throw new Error(`${topicId}: sequência inválida; esperado ${expectedSectionId}, recebido ${item.section_id}.`);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.content_unit_id)) {
      throw new Error(`${item.section_id}: content_unit_id inválido.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.stable_key)) {
      throw new Error(`${item.section_id}: stable_key inválida.`);
    }
    if (unitIds.has(item.content_unit_id) || stableKeys.has(item.stable_key)) {
      throw new Error(`${item.section_id}: identidade duplicada no tópico.`);
    }
    unitIds.add(item.content_unit_id);
    stableKeys.add(item.stable_key);
    if (index >= oldSections.length && item.flashcards.length !== 0) {
      throw new Error(`${item.section_id}: seção nova contém flashcards.`);
    }
  });
}

if (totalAdditions !== EXPECTED_NEW_SECTIONS) {
  throw new Error(`Gate estrutural: esperadas ${EXPECTED_NEW_SECTIONS} adições; encontradas ${totalAdditions}.`);
}

await mkdir(outputDirectory, { recursive: true });
const preexistingOutput = await readdir(outputDirectory);
if (preexistingOutput.length !== 0) {
  throw new Error(`O diretório de saída deve estar vazio: ${outputDirectory}`);
}
for (const record of currentRecords) {
  const outputPayload = outputByTopic.get(record.payload.topic_id);
  await writeFile(path.join(outputDirectory, record.file), `${JSON.stringify(outputPayload, null, 2)}\n`, { flag: "wx" });
}

console.log(`Payloads copiados: ${currentRecords.length}`);
console.log(`Seções novas: ${totalAdditions}`);
console.log(`Correções jurídicas: ${legalCorrectionCount}`);
console.log("Flashcards novos: 0");
console.log(`Saída: ${outputDirectory}`);
