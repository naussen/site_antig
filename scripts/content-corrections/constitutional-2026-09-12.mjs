import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve("tmp/constitucional-review-2026-09-12");
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const verifyCurrent = args.has("--verify-current");

if (apply && !args.has("--confirm-constitucional")) {
  throw new Error("Para aplicar, informe --apply --confirm-constitucional.");
}

const corrections = {
  "administracao-publica-sec-02": [
    ["A única exceção são as **indenizações** (diárias, hora extra, etc.).", "Verbas **indenizatórias**, como diárias e ajuda de custo, não integram o subsídio; hora extra não é indenização."],
    ["**STF (SV 14)**: É **inconstitucional** a vinculação do reajuste de vencimentos de servidores estaduais ou municipais a índices federais de correção monetária.", "**STF (Súmula Vinculante 42)**: É **inconstitucional** a vinculação do reajuste de vencimentos de servidores estaduais ou municipais a índices federais de correção monetária."],
    ["**STF (RE 576.6441)**", "**STF**"],
  ],
  "administracao-publica-sec-03": [
    ["*   **Executivo**: Subsídio de **Ministro de Estado**.\n*   **Legislativo**: Subsídio de **Membro do Congresso Nacional**.\n*   **Judiciário**: Subsídio de **Ministro do STF** (teto geral).", "*   Em todos os Poderes: subsídio de **Ministro do STF**, que é o teto geral federal."],
    ["desde que haja **compatibilidade de horários** (carga horária máxima de 60 horas semanais) e **respeito ao teto remuneratório**:", "desde que haja **compatibilidade de horários** e **respeito ao teto remuneratório**. A Constituição não fixa limite geral de 60 horas semanais:"],
    ["#### Mandatos estaduais (Governador, Vice-Governador e Deputado Estadual) e municipais (Prefeito e Vice-Prefeito)\n\n*   O servidor é **afastado** do cargo.\n*   **Opta** pela sua remuneração (do cargo público ou do mandato eletivo).", "#### Mandatos estaduais ou distritais\n\n*   O servidor é **afastado** do cargo, emprego ou função e recebe a remuneração do mandato.\n\n#### Mandato de Prefeito\n\n*   O servidor é **afastado** do cargo, emprego ou função.\n*   Pode optar pela remuneração do cargo público ou do mandato eletivo."],
  ],
  "aspectos-introdutorios-do-direito-constitucional-sec-01": [
    ["Representa como a Constituição *deveria ser na prática* (efetiva), sendo um **fato social**", "Representa a Constituição efetiva tal como resulta das forças sociais e políticas reais, sendo um **fato social**"],
    ["As normas infraconstitucionais **materialmente incompatíveis** com a nova Constituição também serão revogadas.", "As normas infraconstitucionais anteriores **materialmente incompatíveis** com a nova Constituição não são recepcionadas."],
  ],
  "controle-de-constitucionalidade-sec-01": [
    ["Seus pressupostos são uma Constituição **rígida** e **escrita**.", "Seus pressupostos centrais são a **supremacia constitucional**, a rigidez da Constituição e a existência de órgão competente para realizar o controle."],
    ["*   **Controle Repressivo**: Ocorre quando a norma já está em **vigor**. Incide sobre uma norma pronta e acabada, mesmo que ainda não publicada.", "*   **Controle Repressivo**: Incide sobre ato normativo já concluído e integrado ao ordenamento, inclusive durante a *vacatio legis*; uma proposição ainda não publicada permanece no campo do controle preventivo."],
  ],
  "controle-de-constitucionalidade-sec-04": [
    ["*   **Natureza:** É um controle **concentrado**.", "*   **Natureza:** É controle judicial **concreto**, provocado por mandado de segurança impetrado pelo parlamentar para proteger o devido processo legislativo."],
    ["*   **Finalidade:** Assegurar o respeito ao devido processo legislativo (inconstitucionalidade **formal**), independentemente do instrumento em elaboração (PEC, PL, MP, etc.).", "*   **Finalidade:** Assegurar o devido processo legislativo; o controle material preventivo judicial é excepcional e se admite, em especial, diante de PEC que tenda a abolir cláusula pétrea."],
    ["    *   **STF:** Para leis federais.\n    *   **TJ:** Para leis estaduais.", "    *   **STF:** Leis ou atos normativos federais e estaduais em face da Constituição Federal, conforme a ação cabível.\n    *   **TJ:** Leis ou atos normativos estaduais e municipais em face da Constituição Estadual."],
  ],
  "controle-de-constitucionalidade-sec-08": [
    ["Esta regra não se aplica quando se utiliza a \"interpretação conforme\".", "A reserva de plenário também deve ser observada quando a técnica adotada produzir efetivo afastamento da incidência da norma; o rótulo \"interpretação conforme\" não permite contorná-la."],
  ],
  "controle-de-constitucionalidade-sec-09": [
    ["O Senado Federal pode, a qualquer tempo, **ampliar** (*erga omnes*) ou **suspender** os efeitos da decisão do STF em sede de controle difuso.", "Nos termos do art. 52, X, da Constituição, o Senado Federal pode suspender, no todo ou em parte, a execução de lei declarada inconstitucional por decisão definitiva do STF em controle difuso, conferindo alcance geral à suspensão."],
    ["Se o Plenário do STF decidir sobre a constitucionalidade ou inconstitucionalidade de uma lei ou ato normativo, mesmo em controle difuso, essa decisão terá os mesmos efeitos do controle concentrado, ou seja, eficácia *erga omnes* (contra todos) e vinculante. O Art. 52, X, da CF/88 sofreu uma mutação constitucional e, portanto, deve ser reinterpretado. Dessa forma, o papel do Senado, atualmente, é apenas o de dar publicidade à decisão do STF.", "Precedentes do Plenário em controle difuso podem adquirir força obrigatória por mecanismos próprios, como repercussão geral e súmula vinculante. Isso não autoriza afirmar, de forma geral, que toda decisão plenária em controle difuso tenha automaticamente os mesmos efeitos de uma decisão em controle concentrado, nem elimina o texto do art. 52, X, da Constituição."],
  ],
  "defesa-do-estado-e-das-instituicoes-democraticas-sec-01": [
    ["Ambos são mecanismos que permitem a convocação do Congresso Nacional pelo Presidente do Senado.", "Durante esses regimes, o Congresso Nacional permanece em funcionamento; se estiver em recesso, há convocação extraordinária nas hipóteses constitucionais."],
  ],
  "defesa-do-estado-e-das-instituicoes-democraticas-sec-08": [
    ["É uma polícia administrativa destinada exclusivamente à proteção dos bens, serviços e instalações **municipais**. **Não é responsável pela segurança pública** em sentido amplo. Para sua constituição, basta que o Município possua recursos financeiros.", "As guardas municipais integram o Sistema de Segurança Pública. Podem exercer ações de segurança urbana, inclusive policiamento ostensivo e comunitário, respeitadas as atribuições dos demais órgãos do art. 144 da Constituição; não exercem polícia judiciária e submetem-se ao controle externo do Ministério Público."],
  ],
  "direitos-e-garantias-fundamentais-sec-06": [
    ["1.  **Cancelamento da naturalização:** Por sentença judicial, devido a atividade nociva ao interesse nacional.", "1.  **Cancelamento da naturalização:** Por sentença judicial, em virtude de fraude relacionada ao processo de naturalização ou de atentado contra a ordem constitucional e o Estado Democrático."],
    ["2.  **Aquisição de outra nacionalidade:** Inclusive para brasileiros natos, **SALVO** nos seguintes casos, em que não há perda da nacionalidade brasileira:\n    *   Reconhecimento de nacionalidade originária pela lei estrangeira.\n    *   Imposição de naturalização, pela norma estrangeira, como condição para permanência em seu território ou para o exercício de direitos civis.\n\n> **Conclusão:** É possível adquirir outra nacionalidade sem perder a brasileira, e a perda **não ocorre automaticamente**.", "2.  **Pedido expresso de perda:** Formulado perante autoridade brasileira competente, ressalvadas as situações que acarretem apatridia. A renúncia não impede a posterior readquisição da nacionalidade brasileira originária, nos termos da lei.\n\n> **Conclusão:** Desde a EC 131/2023, a mera aquisição de outra nacionalidade não causa a perda da nacionalidade brasileira."],
    ["| **Obrigatório** | • Maiores de 18 anos                      | • Maiores de 18 anos                      |", "| **Obrigatório** | • Maiores de 18 anos, salvo os grupos de alistamento facultativo | • Maiores de 18 anos, salvo os grupos de voto facultativo |"],
    ["| Prefeito   | Prefeito, Vice-Prefeito e Vereador                                                                  |\n| Governador | Prefeito, Vice-Prefeito e Vereador                                                                  |\n\n### Governador e vice-governador\nA inelegibilidade de **Governador e Vice-Governador** se estende a quem os tiver substituído nos seis meses anteriores ao pleito.", "| Prefeito   | Qualquer cargo eletivo no território do Município                                                  |\n| Governador | Qualquer cargo eletivo no território do Estado                                                     |\n| Presidente | Qualquer cargo eletivo no território nacional                                                       |\n\nA regra alcança também quem tenha substituído o titular nos seis meses anteriores ao pleito."],
    ["*   Tiverem elegido pelo menos **15 Deputados Federais**, distribuídos em pelo menos **1/3 das UF**.\n\n> Ao eleito", "*   Tiverem elegido pelo menos **15 Deputados Federais**, distribuídos em pelo menos **1/3 das UF**.\n\n> Esses percentuais e números são a regra permanente aplicável à legislatura iniciada após as eleições de 2030. Na transição da EC 97/2017, aplicam-se **2% e 11 deputados** na legislatura de 2023 a 2027 e **2,5% e 13 deputados** na legislatura de 2027 a 2031.\n\n> Ao eleito"],
  ],
  "fiscalizacao-contabil-financeira-orcamentaria-sec-02": [
    ["*   Ter idade entre 35 e 70 anos.", "*   Ter mais de 35 e menos de 70 anos."],
  ],
  "funcoes-essenciais-a-justica-sec-01": [
    ["*   **Conselho Nacional do Ministério Público (CNMP)**\n*   **Ministério Público Estadual (MPE)**", "*   **Ministério Público Estadual (MPE)**"],
    ["*   **Corregedor Nacional**: Eleito por votação secreta, dentre os membros do CNMP, **vedada a recondução**.", "*   **Corregedor Nacional**: Eleito por votação secreta dentre os membros do Ministério Público que integram o CNMP, **vedada a recondução**."],
    ["*   **Elaborar relatório semestral estatístico** sobre processos e sentenças prolatadas, por unidade da Federação.\n*   **Elaborar relatório anual** propondo providências sobre a situação do MP e as atividades do CNMP. Este relatório deve integrar a mensagem do PGR ao Congresso Nacional, por ocasião da abertura da Sessão Legislativa.\n", ""],
  ],
  "intervencao-sec-01": [
    ["A solicitação é feita pelo Chefe do Poder afetado na UF. Nos casos do Executivo e Legislativo, a decisão de intervir cabe ao Presidente da República.", "A solicitação pode partir do Poder Legislativo ou do Poder Executivo estadual coacto ou impedido. Se a coação recair sobre o Poder Judiciário, a intervenção depende de requisição do STF."],
    ["##### Por requisição\nVisa prover a **execução de ordem ou decisão judicial**.", "##### Por requisição\nPode decorrer de requisição do STF, do STJ ou do TSE para prover a **execução de ordem ou decisão judicial**, conforme a competência constitucional."],
    ["Pode ocorrer em dois casos:\n1.  Para prover a **execução de Lei Federal**.\n2.  Mediante **Ação Direta de Inconstitucionalidade (ADI) Interventiva**, com a hipótese de assegurar a observância dos **princípios sensíveis**:", "Depende de representação do Procurador-Geral da República e de provimento pelo STF, para:\n1.  Prover a **execução de lei federal**.\n2.  Assegurar a observância dos **princípios constitucionais sensíveis**:"],
  ],
  "ordem-social-sec-02": [
    ["*   **Custeio**: A seguridade social é custeada de forma tríplice: pelo governo, pelas empresas e pelos empregadores (incluindo aposentados).", "*   **Custeio**: A seguridade social é financiada por toda a sociedade, direta e indiretamente, mediante recursos orçamentários dos entes federativos e as contribuições sociais previstas na Constituição."],
  ],
  "ordem-social-sec-03": [
    ["> **Cuidado (EC 103/2019)**: A reforma da previdência removeu os eventos de doença, invalidez e morte, substituindo-os por \"incapacidade temporária ou permanente para o trabalho\".", "> **Cuidado (EC 103/2019)**: A reforma substituiu, no inciso I do art. 201, as referências a doença e invalidez por \"incapacidade temporária ou permanente para o trabalho\". A proteção por morte permanece prevista no inciso V, por meio da pensão."],
  ],
  "ordem-social-sec-05": [
    ["ao atingir a idade máxima (70 ou 75 anos), conforme estabelecido em lei.", "ao atingir a idade máxima do art. 40, § 1º, II, atualmente fixada em 75 anos pela legislação aplicável."],
  ],
  "ordem-social-sec-11": [
    ["conforme a lei (renda mensal *per capita* inferior a ¼ do salário mínimo).", "conforme os critérios legais. O parâmetro de renda familiar mensal *per capita* de até ¼ do salário mínimo é um critério objetivo previsto na LOAS, mas não é o único meio admissível de comprovar vulnerabilidade."],
  ],
  "organizacao-do-estado-sec-04": [
    ["b) Educação **infantil** e **fundamental** – **ensino médio**.", "b) Manter, com a cooperação técnica e financeira da União e do Estado, programas de educação **infantil** e de **ensino fundamental**."],
  ],
  "poder-executivo-sec-01": [
    ["Caso o Presidente não o faça, o Congresso Nacional (CD) realiza a tomada de contas.", "Caso o Presidente não o faça, a Câmara dos Deputados realiza a tomada de contas."],
  ],
  "poder-executivo-sec-02": [
    ["A **única imunidade** do Presidente que se estende aos Governadores é o juízo de admissibilidade.", "As imunidades processuais do Presidente da República não se estendem automaticamente a Governadores e Prefeitos."],
  ],
  "poder-executivo-sec-03": [
    ["São escolhidos pelo Presidente e devem ter mais de 21 anos.", "São escolhidos pelo Presidente entre brasileiros maiores de 21 anos e no exercício dos direitos políticos."],
  ],
  "poder-executivo-sec-04": [
    ["*   **Municípios com menos de 200 mil eleitores:** Não há segundo turno, sendo eleito o candidato que alcançar a maioria absoluta dos votos.", "*   **Municípios com até 200 mil eleitores:** Não há segundo turno; elege-se o candidato que obtiver a maioria dos votos válidos."],
  ],
  "poder-judiciario-sec-01": [
    ["*   Ser brasileiro nato.", "*   Ser brasileiro nato ou naturalizado."],
    ["*   Ter idade entre 35 e 70 anos.", "*   Ter mais de 35 e menos de 70 anos."],
    ["As listas tríplices para a escolha dos Ministros são formadas pelo próprio TRF/TJ, para os Desembargadores", "As listas tríplices para a escolha de integrantes oriundos dos TRFs e TJs são elaboradas pelo próprio STJ"],
  ],
  "poder-judiciario-sec-02": [
    ["Caso a nomeação não seja feita no prazo legal, os membros serão escolhidos pelo STF.", "Se as indicações não forem realizadas no prazo legal, caberá ao STF fazer as escolhas."],
    ["> **Súmula Vinculante 45/STF:** É inconstitucional a criação, por Constituição Estadual, de órgão de controle administrativo do Poder Judiciário do qual participem representantes de outros poderes ou entidades.", "> **Súmula 649 do STF:** É inconstitucional a criação, por Constituição Estadual, de órgão de controle administrativo do Poder Judiciário do qual participem representantes de outros poderes ou entidades."],
  ],
  "poder-judiciario-sec-03": [
    ["| Responsabilidade Comum (STF) | Tribunal Especial (STJ) | Tribunal Especial (TRF/TJ) |\n| :--------------------------- | :---------------------- | :------------------------- |\n| Presidente e Vice-Presidente | Membros dos Tribunais Superiores (STJ, TSE, TST e STM) | Governador de Estado e DF |\n| Ministro do STF              | Embaixador              | Conselheiro do TCE e TCM   |\n| PGR                          | Ministro do TCU         | Desembargadores do TJ, TRF, TRE e TRT |\n| AGU                          | Ministro ou Comandantes das Forças Armadas (não conexo com o PR) | Membro do MPU que oficie perante tribunais |\n| Ministros ou Comandantes das Forças Armadas (conexos com o PR) | Deputados e Senadores (inclusive crimes eleitorais e crimes dolosos contra a vida) | Juízes Estaduais e do DF e T |\n| Membros do CNJ e CNMP        |                         | Membros do MP (oficiam perante juízes de 1º grau) |\n| Tribunal de origem do membro |                         |                            |", "| Supremo Tribunal Federal (STF) | Superior Tribunal de Justiça (STJ) | TRF ou TJ |\n| :------------------------------ | :--------------------------------- | :-------- |\n| Presidente e Vice-Presidente; membros do Congresso Nacional; Ministros do STF; PGR | Governadores dos Estados e do DF | Prefeitos, conforme a natureza federal ou estadual do crime |\n| Ministros de Estado e Comandantes das Forças Armadas, ressalvada a conexão com crime do Presidente | Desembargadores dos TJs; membros dos TCEs e TCDF | Juízes federais, estaduais e do DF, ressalvada a competência eleitoral |\n| Membros dos Tribunais Superiores, do TCU e chefes de missão diplomática permanente | Membros dos TRFs, TREs e TRTs; membros de TCs municipais; membros do MPU que oficiem perante tribunais | Membros do MP que oficiem perante juízos, ressalvada a competência eleitoral |\n| Membros do CNJ e do CNMP | | |"],
  ],
  "poder-legislativo-sec-04": [
    ["> **Jurisprudências do STF**: A renúncia de parlamentar, **após o final da instrução**, não acarreta a perda de competência do STF. Se a renúncia ocorrer **antes da instrução**, o processo é remetido para a 1ª instância.", "> **Jurisprudência atual do STF (HC 232.627 e Inq 4.787, 2025):** O foro para crimes praticados no cargo e em razão das funções subsiste mesmo após o afastamento do cargo, ainda que o inquérito ou a ação penal sejam iniciados depois de cessado o exercício."],
  ],
  "poder-legislativo-sec-05": [
    ["Cidadãos comuns envolvidos no mesmo processo de um congressista também serão julgados pelo STF.", "A conexão com investigado detentor de foro não leva automaticamente o corréu sem prerrogativa ao STF; a Corte pode desmembrar o processo, conforme as circunstâncias do caso."],
  ],
  "processo-legislativo-sec-02": [
    ["*   **Vigência**: 60 dias, prorrogáveis por mais 60 dias. O prazo máximo, combinando Regimento Interno e CF/88, é de **145 dias**.", "*   **Vigência**: 60 dias, prorrogáveis uma vez por igual período. A contagem constitucional é suspensa durante o recesso parlamentar; por isso, não se deve apresentar 145 dias corridos como prazo máximo fixo."],
  ],
  "processo-legislativo-sec-04": [
    [", exceto o Crédito Extraordinário, cuja abertura pode ocorrer via Lei Delegada.", ". O crédito extraordinário pode ser aberto por Medida Provisória, não por essa exceção às limitações da lei delegada."],
  ],
  "principios-fundamentais-sec-01": [
    ["mediante solicitação de, no mínimo, um terço do Senado Federal ou da Câmara dos Deputados", "mediante proposta de, no mínimo, um terço dos membros que compõem qualquer das Casas do Congresso Nacional"],
    ["O termo \"povo\" abrange todos os habitantes de um país, sejam eles natos ou naturalizados.", "No sentido político-constitucional, \"povo\" designa o conjunto de nacionais vinculados ao Estado; \"população\" é que abrange todos os habitantes, inclusive estrangeiros."],
  ],
};

const calloutCorrections = {
  "administracao-publica-sec-02": [
    ["A única exceção são as indenizações.", "Verbas indenizatórias não integram o subsídio; hora extra não é indenização."],
  ],
  "controle-de-constitucionalidade-sec-09": [
    ["O Art. 52, X, da CF/88 sofreu mutação constitucional. Atualmente, o papel do Senado é apenas dar publicidade à decisão do STF, pois a decisão do Plenário do STF em controle difuso já possui eficácia *erga omnes* e vinculante.", "Precedentes do Plenário em controle difuso podem adquirir força obrigatória por mecanismos próprios, mas não se deve equiparar automaticamente toda decisão difusa ao controle concentrado nem eliminar o papel constitucional do Senado."],
  ],
  "defesa-do-estado-e-das-instituicoes-democraticas-sec-08": [
    ["A Guarda Municipal não é responsável pela segurança pública em sentido amplo, atuando exclusivamente na proteção de bens, serviços e instalações municipais.", "As guardas municipais integram o Sistema de Segurança Pública e podem exercer segurança urbana e policiamento ostensivo e comunitário, sem atividade de polícia judiciária."],
    ["Para a constituição da Guarda Municipal, basta que o Município possua recursos financeiros.", "A criação e a atuação da guarda municipal devem observar a Constituição e a legislação aplicável."],
  ],
  "direitos-e-garantias-fundamentais-sec-06": [
    ["A aquisição de outra nacionalidade não implica perda da nacionalidade brasileira se for reconhecimento de nacionalidade originária pela lei estrangeira ou imposição de naturalização como condição de permanência ou exercício de direitos civis.", "Desde a EC 131/2023, a mera aquisição de outra nacionalidade não implica perda da nacionalidade brasileira; a perda voluntária exige pedido expresso e não pode gerar apatridia."],
  ],
  "ordem-social-sec-03": [
    ["A reforma da previdência substituiu os eventos de doença, invalidez e morte por \"incapacidade temporária ou permanente para o trabalho\".", "A reforma substituiu, no inciso I do art. 201, doença e invalidez por incapacidade temporária ou permanente; a pensão por morte permanece no inciso V."],
  ],
  "ordem-social-sec-05": [
    ["ao atingir a idade máxima (70 ou 75 anos), cumprindo tempo mínimo de contribuição.", "ao atingir a idade máxima constitucional, atualmente 75 anos, cumprido o tempo mínimo de contribuição."],
  ],
  "ordem-social-sec-11": [
    ["exige comprovação de renda mensal per capita inferior a ¼ do salário mínimo.", "segue os critérios legais de vulnerabilidade; o parâmetro de ¼ do salário mínimo não é o único meio admissível de comprovação."],
  ],
  "poder-executivo-sec-02": [
    ["exceto a imunidade de juízo de admissibilidade para Governadores.", "e não há extensão automática de suas imunidades processuais."],
  ],
  "poder-judiciario-sec-02": [
    ["É inconstitucional a criação, por Constituição Estadual, de órgão de controle administrativo do Poder Judiciário do qual participem representantes de outros poderes ou entidades.", "Conforme a Súmula 649 do STF, é inconstitucional a criação, por Constituição Estadual, de órgão de controle administrativo do Judiciário com representantes de outros poderes ou entidades."],
  ],
  "processo-legislativo-sec-02": [
    ["A MP tem vigência de 60 dias, prorrogáveis por mais 60 dias, com prazo máximo de 145 dias.", "A MP tem vigência de 60 dias, prorrogável uma vez por igual período, com a contagem suspensa durante o recesso parlamentar; não há prazo máximo fixo de 145 dias corridos."],
  ],
  "processo-legislativo-sec-04": [
    ["Leis delegadas não podem tratar de matérias de competência exclusiva do CN, privativa da Câmara/Senado, reservadas a LC, PPA, LDO, LOA, Créditos Especiais e Suplementares (exceto Crédito Extraordinário), nacionalidade, cidadania, direitos políticos, partidos políticos, direito eleitoral, e organização do Judiciário/MP.", "Leis delegadas não podem tratar de matérias de competência exclusiva do CN, privativa da Câmara/Senado, reservadas a LC, PPA, LDO, LOA, créditos especiais e suplementares, nacionalidade, cidadania, direitos políticos, partidos políticos, direito eleitoral e organização do Judiciário/MP. Crédito extraordinário pode ser aberto por MP, não por lei delegada."],
  ],
  "poder-legislativo-sec-04": [
    ["Segundo o STF, a renúncia de parlamentar após o final da instrução não acarreta a perda de competência do STF; se ocorrer antes da instrução, o processo é remetido à 1ª instância.", "Segundo a jurisprudência atual do STF, o foro relativo a crime praticado no cargo e em razão das funções subsiste mesmo após o afastamento, ainda que a investigação ou ação comece depois."],
  ],
};

const files = [
  "administracao-publica.json",
  "aspectos-introdutorios-do-direito-constitucional.json",
  "controle-de-constitucionalidade.json",
  "defesa-do-estado-e-das-instituicoes-democraticas.json",
  "direitos-e-garantias-fundamentais.json",
  "fiscalizacao-contabil-financeira-orcamentaria.json",
  "funcoes-essenciais-a-justica.json",
  "intervencao.json",
  "ordem-social.json",
  "organizacao-do-estado.json",
  "poder-executivo.json",
  "poder-judiciario.json",
  "poder-legislativo.json",
  "principios-fundamentais.json",
  "processo-legislativo.json",
];

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function replaceExact(value, from, to, sectionId, field) {
  if (!value.includes(from)) {
    throw new Error(`Trecho esperado não encontrado em ${sectionId}.${field}: ${from}`);
  }
  return value.replace(from, to);
}

const expectedSections = [];
const plannedUpdates = [];
const payloadFiles = [];
let replacementCount = 0;

for (const file of files) {
  const filePath = path.join(root, file);
  const payload = JSON.parse(await readFile(filePath, "utf8"));
  payloadFiles.push({ filePath, payload });

  for (const section of payload.sections) {
    const originalContent = section.content_markdown;
    const originalCallouts = structuredClone(section.callouts ?? []);

    if (!verifyCurrent) {
      for (const [from, to] of corrections[section.section_id] ?? []) {
        section.content_markdown = replaceExact(section.content_markdown, from, to, section.section_id, "content_markdown");
        replacementCount += 1;
      }
      for (const callout of section.callouts ?? []) {
        for (const [from, to] of calloutCorrections[section.section_id] ?? []) {
          if (callout.text.includes(from)) {
            callout.text = replaceExact(callout.text, from, to, section.section_id, "callouts.text");
            replacementCount += 1;
          }
        }
      }
    }

    expectedSections.push({
      sectionId: section.section_id,
      content: section.content_markdown,
      callouts: section.callouts ?? [],
    });

    if (
      !verifyCurrent &&
      (section.content_markdown !== originalContent ||
        JSON.stringify(section.callouts ?? []) !== JSON.stringify(originalCallouts))
    ) {
      plannedUpdates.push({
        sectionId: section.section_id,
        originalContent,
        originalCallouts,
        correctedContent: section.content_markdown,
        correctedCallouts: section.callouts ?? [],
      });
    }
  }

}

if (!verifyCurrent) {
  for (const { filePath, payload } of payloadFiles) {
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

if (!verifyCurrent && replacementCount !== 64) {
  throw new Error(`Quantidade inesperada de correções: ${replacementCount}; esperado: 64.`);
}

if (verifyCurrent) {
  const verifier = createClient(
    requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await verifier
    .from("sections")
    .select("section_id,content_markdown,callouts")
    .in("section_id", expectedSections.map(({ sectionId }) => sectionId));
  if (error) throw new Error(`Falha ao verificar persistência: ${error.message}`);
  const liveById = new Map(data.map((section) => [section.section_id, section]));
  for (const expected of expectedSections) {
    const live = liveById.get(expected.sectionId);
    if (
      !live ||
      live.content_markdown !== expected.content ||
      JSON.stringify(live.callouts ?? []) !== JSON.stringify(expected.callouts)
    ) {
      throw new Error(`Divergência após persistência em ${expected.sectionId}.`);
    }
  }
  console.log(`Persistência confirmada em ${expectedSections.length} seções de Direito Constitucional.`);
} else {
console.log(`Correções preparadas: ${replacementCount} substituições em ${plannedUpdates.length} seções.`);
if (!apply) {
  console.log("Prévia concluída; nenhuma escrita foi feita no Supabase.");
  process.exit(0);
}

const supabase = createClient(
  requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const sectionIds = plannedUpdates.map(({ sectionId }) => sectionId);
const { data: liveSections, error: readError } = await supabase
  .from("sections")
  .select("section_id,content_markdown,callouts")
  .in("section_id", sectionIds);
if (readError) throw new Error(`Falha ao conferir conteúdo atual: ${readError.message}`);
if (liveSections.length !== sectionIds.length) {
  throw new Error(`Foram encontradas ${liveSections.length} de ${sectionIds.length} seções esperadas.`);
}

const liveById = new Map(liveSections.map((section) => [section.section_id, section]));
for (const update of plannedUpdates) {
  const live = liveById.get(update.sectionId);
  const originalMatches =
    live.content_markdown === update.originalContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.originalCallouts);
  const correctedMatches =
    live.content_markdown === update.correctedContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.correctedCallouts);
  if (!originalMatches && !correctedMatches) {
    throw new Error(`Conteúdo concorrente detectado em ${update.sectionId}; nenhuma escrita iniciada.`);
  }
}

let updatedSections = 0;
for (const update of plannedUpdates) {
  const live = liveById.get(update.sectionId);
  if (
    live.content_markdown === update.correctedContent &&
    JSON.stringify(live.callouts ?? []) === JSON.stringify(update.correctedCallouts)
  ) continue;

  const { error } = await supabase
    .from("sections")
    .update({ content_markdown: update.correctedContent, callouts: update.correctedCallouts })
    .eq("section_id", update.sectionId);
  if (error) throw new Error(`Falha ao atualizar ${update.sectionId}: ${error.message}`);
  updatedSections += 1;
}

console.log(`Supabase atualizado: ${updatedSections} seções; flashcards e demais campos preservados.`);
}
