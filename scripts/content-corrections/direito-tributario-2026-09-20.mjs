import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const LEGACY_TOPIC_ID = "impostos-de-competencia-da-uniao";

const EDITORIAL_TITLES = new Map([
  ["IMUNIDADE", "Imunidade"],
  ["NOVENTENA", "Noventena"],
  ["CIDE-COMBUSTÍVEIS", "CIDE-Combustíveis"],
  ["CRÉDITO TRIBUTÁRIO", "Crédito Tributário"],
  ["LANÇAMENTO", "Lançamento"],
  ["ASPECTO TEMPORAL", "Aspecto Temporal"],
  ["FLASHCARDS: DÍVIDA ATIVA E EXECUÇÃO FISCAL", "Flashcards: Dívida Ativa e Execução Fiscal"],
  ["CERTIDÕES", "Certidões"],
  ["HIPÓTESES E PRAZO DE RESTITUIÇÃO", "Hipóteses e Prazo de Restituição"],
  ["RESTITUIÇÃO DE TRIBUTO INDIRETO", "Restituição de Tributo Indireto"],
  ["DENEGAÇÃO DO PEDIDO DE RESTITUIÇÃO NO ÂMBITO ADMINISTRATIVO", "Denegação do Pedido de Restituição no Âmbito Administrativo"],
  ["DECADÊNCIA E PRESCRIÇÃO", "Decadência e Prescrição"],
  ["DECADÊNCIA", "Decadência"],
  ["ICMS-MONOFÁSICO", "ICMS Monofásico"],
  ["LEI COMPLEMENTAR X ICMS (ART. 155, §2, XII)", "Lei Complementar e ICMS (Art. 155, § 2º, XII)"],
  ["IMPOSTOS DE COMPETÊNCIA DOS ESTADOS: IPVA - Visão Geral", "Impostos de Competência dos Estados: IPVA — Visão Geral"],
  ["IMPOSTOS DE COMPETÊNCIA DOS MUNICÍPIOS", "Impostos de Competência dos Municípios"],
  ["ITBI – IMPOSTO SOBRE A TRANSMISSÃO DE BENS IMÓVEIS", "ITBI — Imposto sobre a Transmissão de Bens Imóveis"],
  ["CONFLITO DE COMPETÊNCIA: ISS X ICMS", "Conflito de Competência: ISS × ICMS"],
  ["LIBERDADE DE TRÁFEGO", "Liberdade de Tráfego"],
  ["UNIFORMIDADE GEOGRÁFICA", "Uniformidade Geográfica"],
  ["UNIFORMIDADE DA TRIBUTAÇÃO DA RENDA", "Uniformidade da Tributação da Renda"],
  ["VEDAÇÃO ÀS ISENÇÕES HETERÔNOMAS / HETEROTÓPICAS", "Vedação às Isenções Heterônomas ou Heterotópicas"],
  ["NÃO DIFERENCIAÇÃO TRIBUTÁRIA", "Não Diferenciação Tributária"],
  ["NÃO-CUMULATIVIDADE", "Não Cumulatividade"],
  ["IMUNIDADES, NÃO-INCIDÊNCIA E DESONERAÇÃO TRIBUTÁRIA", "Imunidades, Não Incidência e Desoneração Tributária"],
  ["ANTERIORIDADE", "Anterioridade"],
  ["ANTERIORIDADE X NOVENTENA", "Anterioridade × Noventena"],
  ["FLASHCARDS (Estilo CEBRASPE)", "Flashcards (Estilo CEBRASPE)"],
  ["MEDIDA PROVISÓRIA X ANTERIORIDADE E NOVENTENA", "Medida Provisória, Anterioridade e Noventena"],
  ["PRINCÍPIO DO NÃO-CONFISCO", "Princípio do Não Confisco"],
  ["RESPONSABILIDADE DE TERCEIROS", "Responsabilidade de Terceiros"],
  ["RESPONSABILIDADE POR INFRAÇÕES", "Responsabilidade por Infrações"],
]);

const SECTION_TITLE_OVERRIDES = new Map([
  ["direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-04", "IPTU — Visão Geral"],
  ["direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-05", "IPTU — Fato Gerador e Base de Cálculo"],
  ["direito-tributario-suspensao-exigibilidade-credito-tributario-sec-02", "Visão Geral da Moratória"],
  ["direito-tributario-suspensao-exigibilidade-credito-tributario-sec-04", "Regras da Moratória"],
]);

function removeRawMermaidFence(markdown) {
  return markdown.replace(/\n*```mermaid\s*[\s\S]*?```\s*/gi, "\n").trim();
}

function normalizeMarkdown(markdown) {
  return removeRawMermaidFence(markdown)
    .replace(/<br\s*\/?\s*>/gi, "; ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeMermaid(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:style|classDef|class)\b/i.test(line))
    .join("\n")
    .trim();
}

function ensureEditorialBody(section) {
  const hasEditorialResource = Boolean(
    section.content_markdown.trim()
      || section.mermaid_mindmap.trim()
      || section.callouts.length
      || section.mnemonics.length,
  );
  if (hasEditorialResource) return;

  if (/flashcard|caderno/i.test(section.title)) {
    section.content_markdown = "Use os flashcards desta seção para revisar os pontos centrais do assunto.";
    return;
  }

  section.content_markdown = `Esta seção apresenta uma visão geral de **${section.title}** e organiza os subtópicos desenvolvidos a seguir.`;
}

function findSection(payloads, sectionId) {
  for (const payload of payloads) {
    const section = payload.sections.find((item) => item.section_id === sectionId);
    if (section) return section;
  }
  throw new Error(`Seção não encontrada: ${sectionId}`);
}

function replaceRequired(section, pattern, replacement, label) {
  if (!pattern.test(section.content_markdown)) {
    throw new Error(`Trecho não encontrado em ${section.section_id}: ${label}`);
  }
  section.content_markdown = section.content_markdown.replace(pattern, replacement);
}

function appendUpdate(section, markdown) {
  section.content_markdown = `${section.content_markdown.trim()}\n\n${markdown.trim()}`;
}

function replaceInResources(section, pattern, replacement) {
  for (const callout of section.callouts) {
    callout.title = callout.title.replace(pattern, replacement);
    callout.text = callout.text.replace(pattern, replacement);
  }
  for (const mnemonic of section.mnemonics) {
    mnemonic.key = mnemonic.key.replace(pattern, replacement);
    mnemonic.meaning = mnemonic.meaning.replace(pattern, replacement);
    mnemonic.description = mnemonic.description.replace(pattern, replacement);
  }
  section.mermaid_mindmap = section.mermaid_mindmap.replace(pattern, replacement);
}

function applyLegalCorrections(payloads) {
  let corrections = 0;
  const section = (id) => findSection(payloads, id);

  const species05 = section("direito-tributario-especies-tributarias-competencia-sec-05");
  replaceRequired(species05, /\*\*COSIP \(Contribuição para o Custeio do Serviço de Iluminação Pública\):\*\* Competência de Municípios e Distrito Federal\./, "**COSIP:** Municípios e o Distrito Federal podem instituí-la para o custeio, a expansão e a melhoria da iluminação pública e de sistemas de monitoramento destinados à segurança e à preservação de logradouros públicos.", "finalidade atual da COSIP");
  corrections++;

  const species06 = section("direito-tributario-especies-tributarias-competencia-sec-06");
  replaceRequired(species06, /O serviço que enseja a cobrança de taxa deve ser \*\*sempre estatal e compulsório\*\*\. Serviços delegados a concessionárias ou permissionárias são remunerados por tarifa ou preço público, nunca por taxa\./, "A taxa de serviço exige serviço público específico e divisível. A **utilização potencial** somente autoriza a cobrança quando o serviço for de utilização compulsória e estiver em efetivo funcionamento; a utilização efetiva ocorre quando o serviço é usufruído a qualquer título.", "compulsoriedade da taxa de serviço");
  replaceRequired(species06, /Súmula Vinculante 21 do STF/g, "Súmula Vinculante 41 do STF", "SV da iluminação pública");
  replaceInResources(species06, /O serviço que enseja a cobrança de taxa deve ser sempre estatal e compulsório\. Serviços delegados são remunerados por tarifa\./, "A utilização potencial somente permite taxa quando o serviço específico e divisível for compulsório e estiver em efetivo funcionamento.");
  corrections += 2;

  const iptuLegalidade = "Desde a EC nº 132/2023, o art. 156, § 1º, III, da Constituição permite que o Poder Executivo municipal atualize a base de cálculo do IPTU conforme critérios estabelecidos em lei municipal. Sem essa habilitação legal, permanece aplicável a Súmula 160 do STJ: decreto não pode superar a correção monetária.";
  const principles02 = section("direito-tributario-limitacoes-poder-tributar-principios-gerais-sec-02");
  replaceRequired(principles02, /\*\*IPTU\*\*[\s\S]*?lei em sentido estrito\./, `**IPTU:** ${iptuLegalidade}`, "legalidade do IPTU após EC 132");
  corrections++;
  const principles04 = section("direito-tributario-limitacoes-poder-tributar-principios-gerais-sec-04");
  principles04.content_markdown = `### Atualização da Base de Cálculo do IPTU\n${iptuLegalidade}`;
  principles04.callouts = [{ type: "warning", title: "Critérios definidos em lei", text: iptuLegalidade }];
  principles04.mermaid_mindmap = "flowchart TD\n    A[Atualização da base do IPTU] --> B{Há critérios em lei municipal?}\n    B -->|Sim| C[Executivo pode atualizar conforme a lei]\n    B -->|Não| D[Decreto limitado à correção monetária]";
  corrections++;

  const principles12 = section("direito-tributario-limitacoes-poder-tributar-principios-gerais-sec-12");
  replaceRequired(principles12, /\*\*Redução ou Extinção de Desconto:\*\*[\s\S]*?\*\*Atualização Monetária:\*\*/, "**Redução ou Supressão de Benefício Fiscal:** Conforme o Tema 1.383 do STF, a redução ou supressão de benefício ou incentivo que gere majoração indireta deve observar as anterioridades anual e nonagesimal, respeitadas as regras e exceções próprias do tributo.\n*   **Atualização Monetária:**", "Tema 1383/STF");
  principles12.callouts = principles12.callouts.filter((item) => item.title !== "Exceção à Revogação de Isenção");
  principles12.callouts.push({ type: "warning", title: "Tema 1.383 do STF", text: "A redução ou supressão de benefício fiscal que produza majoração indireta observa as anterioridades anual e nonagesimal, conforme as regras do tributo." });
  principles12.mermaid_mindmap = principles12.mermaid_mindmap.replace(/E --> F\[Redução de Desconto\];\n\s*E --> G\["Revogação de Isenção \(regra\)"\];/, "E --> F[Alteração sem majoração indireta];\n    A --> G[Benefício reduzido com majoração indireta: observar anterioridades];");
  corrections++;

  const immunity15 = section("direito-tributario-limitacoes-poder-tributar-outros-principios-imunidades-sec-15");
  replaceRequired(immunity15, /\*\*Súmula Vinculante 52:\*\* Ainda que alugado a terceiros,[\s\S]*?constituídas\./, "**Imóvel de entidade religiosa alugado:** a imunidade pode ser reconhecida quando a renda do aluguel for aplicada nas finalidades essenciais, conforme precedentes específicos do STF; a Súmula Vinculante 52 não trata de templos, mas somente das entidades do art. 150, VI, “c”, da Constituição.", "SV 52 e templos");
  replaceInResources(immunity15, / \(Súmula Vinculante 52\)/g, " (precedentes específicos do STF)");
  corrections++;
  const immunity16 = section("direito-tributario-limitacoes-poder-tributar-outros-principios-imunidades-sec-16");
  replaceRequired(immunity16, /\*   \*\*Requisitos por Lei Complementar[\s\S]*?fruição da imunidade\./, "*   **Regime atual das entidades beneficentes:** A LC nº 187/2021 disciplina a certificação, os procedimentos e os requisitos da imunidade das contribuições para a seguridade social do art. 195, § 7º. O art. 14 do CTN continua pertinente à imunidade de impostos do art. 150, VI, “c”, mas não esgota o regime das contribuições.", "LC 187/2021");
  corrections++;
  const immunity17 = section("direito-tributario-limitacoes-poder-tributar-outros-principios-imunidades-sec-17");
  replaceRequired(immunity17, /O imóvel pertencente a qualquer das entidades imunes/, "O imóvel pertencente a qualquer das entidades referidas no art. 150, VI, “c”, da Constituição", "alcance da SV 52");
  corrections++;

  const establishments = section("direito-tributario-obrigacao-tributaria-fato-gerador-sujeito-passivo-sec-18");
  establishments.content_markdown = "Matriz e filiais podem possuir domicílios tributários e autonomia administrativa ou operacional para fiscalização, mas integram **uma única pessoa jurídica**. Conforme a orientação atual da Primeira Seção do STJ, pendência fiscal de qualquer estabelecimento impede a emissão de CND ou CPEN para outro estabelecimento da mesma pessoa jurídica.";
  establishments.callouts = [{ type: "warning", title: "Unicidade da Pessoa Jurídica", text: "A autonomia operacional dos estabelecimentos não permite CND isolada quando matriz ou filial possui pendência fiscal." }];
  establishments.mermaid_mindmap = "";
  corrections++;

  const transfer = section("direito-tributario-responsabilidade-tributaria-substituicao-transferencia-terceiros-sec-02");
  replaceRequired(transfer, /> ⚖️ \*\*Entendimentos do STJ sobre Hasta Pública:\*\*[\s\S]*$/, "> ⚖️ **Tema 1.134 do STJ:** É inválida cláusula de edital que atribua ao arrematante os tributos incidentes sobre o imóvel antes da alienação. Esses débitos sub-rogam-se no preço, nos termos do art. 130, parágrafo único, do CTN. O precedente foi modulado para editais publicados após a ata do julgamento, ressalvados pedidos e ações pendentes.", "Tema 1134/STJ");
  replaceInResources(transfer, /, salvo menção expressa no edital/, "");
  corrections++;

  const guarantees04 = section("direito-tributario-garantias-privilegios-fiscalizacao-tributaria-sec-04");
  guarantees04.title = "Indisponibilidade de Bens (Art. 185-A do CTN)";
  appendUpdate(guarantees04, "### Natureza e pressupostos\nA indisponibilidade do art. 185-A **não se confunde com penhora**. Ela pressupõe cumulativamente devedor devidamente citado, ausência de pagamento ou de indicação de bens no prazo legal e inexistência de bens penhoráveis. A ordem deve limitar-se ao valor total exigível.");
  corrections++;
  const guarantees11 = section("direito-tributario-garantias-privilegios-fiscalizacao-tributaria-sec-11");
  appendUpdate(guarantees11, "### Igualdade entre entes federados\nA ordem federativa prevista no parágrafo único do art. 187 do CTN não é aplicável. Na ADPF 357, o STF afastou a hierarquia de preferência entre União, Estados, Distrito Federal e Municípios.");
  corrections++;
  const guarantees13 = section("direito-tributario-garantias-privilegios-fiscalizacao-tributaria-sec-13");
  guarantees13.content_markdown = "Após a LC nº 236/2026, o termo de início da fiscalização deve identificar as autoridades, o contribuinte e os estabelecimentos; descrever os trabalhos, o objeto, o período e os documentos examinados; indicar a forma de confirmação de autenticidade; e fixar o prazo de duração. Na fiscalização presencial, uma via deve ser entregue ao contribuinte, representante ou preposto.";
  guarantees13.callouts = [];
  guarantees13.mermaid_mindmap = "";
  corrections++;
  const guarantees16 = section("direito-tributario-garantias-privilegios-fiscalizacao-tributaria-sec-16");
  appendUpdate(guarantees16, "### Fiscalização em estabelecimento ou domicílio\nApós a LC nº 236/2026, o acompanhamento policial depende de justo receio de resistência, reduzido a termo e registrado no documento entregue ao fiscalizado.");
  corrections++;

  const union01 = section("direito-tributario-impostos-competencia-uniao-ii-ie-iof-ipi-sec-01");
  union01.content_markdown = "O art. 153 da Constituição atribui à União II, IE, IR, IPI, IOF, ITR, IGF e, desde a EC nº 132/2023, o **Imposto Seletivo (IS)**. A função extrafiscal predomina especialmente em II, IE, IPI, IOF e IS; não é correto generalizá-la a todos os impostos federais, pois o IR possui função predominantemente fiscal.";
  corrections++;
  const iof = section("direito-tributario-impostos-competencia-uniao-ii-ie-iof-ipi-sec-04");
  replaceRequired(iof, /\*   \*\*STF \(Súmula Vinculante 32\):\*\*[^\n]*/, "*   **STF (Súmula Vinculante 32):** O ICMS não incide sobre a alienação de salvados de sinistro pelas seguradoras. A súmula apenas afasta o ICMS; a alienação do salvado, por si só, não constitui fato gerador de IOF.", "IOF sobre salvados");
  corrections++;
  const ipi06 = section("direito-tributario-impostos-competencia-uniao-ii-ie-iof-ipi-sec-06");
  replaceRequired(ipi06, /\*   \*\*Saída Isenta ou Não Tributada:\*\*[^\n]*/, "*   **Saída Isenta ou com Alíquota Zero:** O produto final isento ou tributado à alíquota zero não implica, por si só, anulação do saldo credor de IPI; o art. 11 da Lei nº 9.779/1999 assegura sua utilização nas condições legais.", "crédito de IPI");
  corrections++;
  const ipi05 = section("direito-tributario-impostos-competencia-uniao-ii-ie-iof-ipi-sec-05");
  appendUpdate(ipi05, "### Transição da reforma tributária\nA partir de 2027, as alíquotas do IPI serão reduzidas a zero, salvo para produtos que tenham industrialização incentivada na Zona Franca de Manaus. O IPI também não incidirá cumulativamente com o Imposto Seletivo, conforme a transição da EC nº 132/2023.");
  corrections++;
  const itr02 = section("direito-tributario-impostos-competencia-uniao-itr-ir-ieg-igf-residuais-sec-02");
  itr02.content_markdown = "Nos termos dos arts. 29 e 30 do CTN, o fato gerador do ITR é a propriedade, o domínio útil ou a posse de imóvel por natureza situado fora da zona urbana do Município. O **valor fundiário**, associado à terra nua segundo a legislação específica, é a base de cálculo; não deve ser confundido com o próprio fato gerador.";
  corrections++;

  const icms13 = section("direito-tributario-impostos-competencia-estados-icms-parte-2-sec-13");
  replaceRequired(icms13, /[^\n]*TUST[^\n]*TUSD[^\n]*/i, "*   **TUST/TUSD e encargos setoriais:** Conforme o Tema 986 do STJ, integram a base do ICMS quando lançados na fatura de energia e suportados pelo consumidor final, ressalvada a modulação definida no repetitivo para decisões liminares anteriores a 27/03/2017.", "Tema 986/STJ");
  corrections++;
  const icms14 = section("direito-tributario-impostos-competencia-estados-icms-parte-2-sec-14");
  replaceRequired(icms14, /\*   \*\*Inclusão da Energia Elétrica:\*\*[^\n]*/, "*   **Energia elétrica:** A tributação no destino decorre do art. 155, § 2º, X, “b”, mas a energia elétrica não integra, por essa razão, o regime monofásico de combustíveis e lubrificantes do § 4º.", "energia e monofasia");
  replaceRequired(icms14, /podem ser reduzidas ou restabelecidas \*\*sem a necessidade de observar os princípios da anterioridade\*\* \(anual e nonagesimal\)/i, "podem ser reduzidas ou restabelecidas sem observar a anterioridade **anual**, mas continuam sujeitas à **noventena**", "anterioridade do ICMS monofásico");
  corrections += 2;
  const icms16 = section("direito-tributario-impostos-competencia-estados-icms-parte-2-sec-16");
  appendUpdate(icms16, "### Transição para o IBS\nNa transição da EC nº 132/2023, as alíquotas do ICMS serão reduzidas para 9/10, 8/10, 7/10 e 6/10 das alíquotas vigentes, respectivamente, de 2029 a 2032. A substituição integral pelo IBS ocorrerá em 2033.");
  corrections++;

  const ipva02 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-02");
  ipva02.content_markdown = "Após a EC nº 132/2023, o IPVA pode incidir sobre veículos automotores **terrestres, aquáticos e aéreos**. A Constituição exclui aeronaves agrícolas e de operadores certificados de serviços aéreos a terceiros; embarcações de transporte aquaviário outorgado e de pesca nas hipóteses constitucionais; determinadas plataformas e embarcações de atividade econômica em águas territoriais ou na zona econômica exclusiva; e tratores e máquinas agrícolas.";
  ipva02.callouts = [];
  ipva02.mermaid_mindmap = "flowchart TD\n    A[IPVA] --> B[Veículos terrestres]\n    A --> C[Veículos aquáticos]\n    A --> D[Veículos aéreos]\n    C --> E[Observar exceções constitucionais]\n    D --> E";
  corrections++;
  const ipva07 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-07");
  ipva07.content_markdown = "O art. 155, § 6º, II, da Constituição permite diferenciar as alíquotas do IPVA em função do **tipo, valor, utilização e impacto ambiental** do veículo, observadas as alíquotas mínimas fixadas pelo Senado Federal.";
  corrections++;
  const ipva10 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-10");
  appendUpdate(ipva10, "### Imunidade por tempo de fabricação\nA EC nº 137/2025 tornou imunes ao IPVA os veículos terrestres de passageiros, caminhonetes e veículos de uso misto com **20 anos ou mais** de fabricação, excetuados micro-ônibus, ônibus, reboques e semirreboques.");
  corrections++;
  const itcmd17 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-17");
  itcmd17.content_markdown = "Após a EC nº 132/2023 e a LC nº 227/2026, as alíquotas do ITCMD **serão progressivas** em razão do valor do quinhão, legado ou doação, observado o teto fixado pelo Senado Federal.";
  corrections++;
  const itcmd18 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-18");
  itcmd18.content_markdown = "Conforme a LC nº 227/2026, são contribuintes do ITCMD o **sucessor**, na transmissão causa mortis, e o **donatário**, na doação. A lei pode disciplinar responsáveis tributários nas hipóteses legais, sem alterar essa definição de contribuinte.";
  corrections++;
  const itcmd19 = section("direito-tributario-impostos-competencia-estados-ipva-itcmd-sec-19");
  itcmd19.content_markdown = "A LC nº 227/2026 regulamentou a competência espacial do ITCMD. Para imóveis e respectivos direitos, aplica-se, em regra, o Estado da situação do bem. Na transmissão causa mortis de bens móveis, títulos e créditos, compete ao Estado do domicílio do falecido; se ele era domiciliado no exterior, ao Estado do domicílio do sucessor ou legatário. Na doação, compete ao Estado do domicílio do doador; se o doador era domiciliado no exterior, ao Estado do domicílio do donatário, observadas as demais regras dos arts. 158 e 159.";
  itcmd19.callouts = [];
  itcmd19.mermaid_mindmap = "";
  corrections++;

  const iss11 = section("direito-tributario-impostos-competencia-municipios-issqn-conflito-competencia-sec-11");
  replaceRequired(iss11, /\*   O valor dos depósitos bancários \(tarifas de transferência como TED, DOC, etc\.\);/, "*   O valor dos depósitos bancários. Essa não incidência não alcança a remuneração de serviços bancários, inclusive transferências previstas no item 15 da lista anexa à LC nº 116/2003;", "ISS sobre serviços bancários");
  corrections++;
  const itbi02 = section("direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-02");
  appendUpdate(itbi02, "### Limite da imunidade na integralização\nSegundo o Tema 796 do STF, a imunidade do ITBI não alcança o valor do imóvel que exceder o montante efetivamente destinado à integralização do capital social.");
  corrections++;
  const iptu04 = section("direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-04");
  appendUpdate(iptu04, "### Imóvel urbano com destinação rural\nO art. 15 do Decreto-Lei nº 57/1966 excepciona o critério puramente geográfico: imóvel situado em zona urbana, mas comprovadamente utilizado em exploração extrativa vegetal, agrícola, pecuária ou agroindustrial, sujeita-se ao ITR nas condições legais.");
  corrections++;
  const iptu06 = section("direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-06");
  appendUpdate(iptu06, `### Atualização da base de cálculo\n${iptuLegalidade}`);
  corrections++;
  const iptu09 = section("direito-tributario-impostos-competencia-municipios-itbi-iptu-sec-09");
  appendUpdate(iptu09, `### Atualização da base de cálculo\n${iptuLegalidade}`);
  corrections++;

  const contributions04 = section("direito-tributario-contribuicoes-especiais-sec-04");
  replaceRequired(contributions04, /\*   \*\*Diferenciação de Alíquotas:\*\*[^\n]*/, "*   **Diferenciação de Alíquotas:** As alíquotas podem ser diferenciadas em razão da atividade econômica, da utilização intensiva de mão de obra, do porte da empresa ou da condição estrutural do mercado de trabalho, conforme o art. 195, § 9º, da Constituição.", "art. 195 § 9º");
  appendUpdate(contributions04, "### Transição para a CBS\nEm 2026, a CBS é cobrada à alíquota de **0,9%**, com compensação nas condições do ADCT. A partir de 2027, passam a ser cobrados CBS e Imposto Seletivo e são extintos PIS/Cofins, conforme a transição constitucional e a LC nº 214/2025.");
  corrections += 2;
  const contributions05 = section("direito-tributario-contribuicoes-especiais-sec-05");
  replaceRequired(contributions05, /3\.  \*\*Fato Gerador e Base de Cálculo Diferentes:\*\*[^\n]*/, "3.  **Fato Gerador e Base de Cálculo:** Não podem reproduzir fatos geradores ou bases de cálculo próprios dos impostos discriminados na Constituição, por força dos arts. 195, § 4º, e 154, I.", "contribuições residuais");
  corrections++;
  const contributions09 = section("direito-tributario-contribuicoes-especiais-sec-09");
  replaceRequired(contributions09, /sem que se aplique a anterioridade nonagesimal \(noventena\) nem a anterioridade anual para o seu restabelecimento/gi, "sem observar a anterioridade anual no restabelecimento, mas com respeito à noventena", "CIDE e noventena");
  replaceInResources(contributions09, /sem a aplicação das anterioridades nonagesimal e anual para o restabelecimento/gi, "sem anterioridade anual, mas com observância da noventena");
  corrections++;
  const contributions10 = section("direito-tributario-contribuicoes-especiais-sec-10");
  replaceRequired(contributions10, /visando custear o serviço de iluminação pública/gi, "destinada ao custeio, à expansão e à melhoria da iluminação pública e de sistemas de monitoramento para segurança e preservação de logradouros públicos");
  corrections++;
  const administration12 = section("direito-tributario-garantias-privilegios-fiscalizacao-tributaria-sec-12");
  appendUpdate(administration12, "### Administração integrada do IBS\nEstados, Distrito Federal e Municípios exercem de forma integrada, exclusivamente por meio do CGIBS, as competências administrativas relativas ao IBS, incluindo regulamentação uniforme, arrecadação e distribuição e contencioso administrativo, nos termos dos arts. 156-A e 156-B da Constituição e da LC nº 227/2026.");
  corrections++;

  if (corrections !== 41) {
    throw new Error(`Quantidade inesperada de correções jurídicas: ${corrections}`);
  }
  return corrections;
}

function applyStructuralCorrections(payload) {
  for (const section of payload.sections) {
    section.title = SECTION_TITLE_OVERRIDES.get(section.section_id)
      ?? EDITORIAL_TITLES.get(section.title)
      ?? section.title;
    section.content_markdown = normalizeMarkdown(section.content_markdown ?? "");
    section.mermaid_mindmap = sanitizeMermaid(section.mermaid_mindmap ?? "");
    ensureEditorialBody(section);
  }
  return payload;
}

export async function buildReviewedPayloads(inputDir, outputDir) {
  const names = (await readdir(inputDir))
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  await mkdir(outputDir, { recursive: true });
  const payloads = [];
  for (const name of names) {
    const sourcePath = join(inputDir, name);
    const payload = JSON.parse(await readFile(sourcePath, "utf8"));
    if (payload.topic_id === LEGACY_TOPIC_ID) continue;

    payloads.push({ name, payload: applyStructuralCorrections(payload) });
  }

  const legalCorrections = applyLegalCorrections(payloads.map((item) => item.payload));
  const written = [];
  for (const { name, payload } of payloads) {
    const destination = join(outputDir, basename(name));
    await writeFile(destination, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    written.push(destination);
  }
  return { written, legalCorrections };
}

async function main() {
  const [inputDir, outputDir] = process.argv.slice(2);
  if (!inputDir || !outputDir) {
    throw new Error("Uso: node direito-tributario-2026-09-20.mjs <entrada> <saida>");
  }
  const { written, legalCorrections } = await buildReviewedPayloads(inputDir, outputDir);
  console.log(`Payloads revisados: ${written.length}`);
  console.log(`Correções jurídicas: ${legalCorrections}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
