import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const SKIP_BACKUP = process.argv.includes("--skip-backup");
const JSON_DIR = "C:\\PRO\\agente\\json_reescrito_processado\\Administração Pública";
const MD_DIR = "C:\\PRO\\agente\\md_reescrito\\Administração Pública";
const BACKUP_DIR = "C:\\PRO\\agente\\administracao_publica\\backups\\2026-09-19-pre-revisao";
const ARTIFACT_BACKUP_DIR = path.join(BACKUP_DIR, "artefatos-locais");
const INPUT_JSON_DIR = SKIP_BACKUP ? path.join(ARTIFACT_BACKUP_DIR, "json") : JSON_DIR;

function replaceRequired(text, before, after, label) {
  if (!text.includes(before)) {
    throw new Error(`Trecho não encontrado em ${label}: ${before.slice(0, 120)}`);
  }
  return text.replace(before, after);
}

function section(payload, number) {
  const item = payload.sections[number - 1];
  if (!item) throw new Error(`Seção ${number} ausente em ${payload.topic_id}`);
  return item;
}

function renderMarkdown(payload) {
  const blocks = [`# ${payload.topic_title}`];
  for (const item of payload.sections) {
    blocks.push(`## ${item.title}`, item.content_markdown.trim());

    for (const callout of item.callouts ?? []) {
      blocks.push(`> **${callout.title}:** ${callout.text}`);
    }

    for (const mnemonic of item.mnemonics ?? []) {
      blocks.push(`> **${mnemonic.key}:** ${mnemonic.meaning}${mnemonic.description ? ` — ${mnemonic.description}` : ""}`);
    }

    if (item.mermaid_mindmap?.trim()) {
      blocks.push(`\`\`\`mermaid\n${item.mermaid_mindmap.trim()}\n\`\`\``);
    }
  }
  return `${blocks.join("\n\n")}\n`;
}

function update001(payload) {
  const introductoryItem = section(payload, 1);
  introductoryItem.content_markdown = replaceRequired(
    introductoryItem.content_markdown,
    "La estruturação",
    "A estruturação",
    "001/sec-01",
  );

  const item = section(payload, 3);
  item.content_markdown = replaceRequired(
    item.content_markdown,
    "**Reforma de 1930**; *(Criação do DASP)*",
    "**Reforma iniciada nos anos 1930**; *(DASP criado em 1938 pelo Decreto-Lei nº 579/1938)*",
    "001/sec-03",
  );
  item.mermaid_mindmap = `flowchart LR
    A["Anos 1930<br/>Reforma burocrática"] --> B["1938<br/>Criação do DASP"]
    B --> C["1967<br/>Decreto-Lei 200"]
    C --> D["1995<br/>PDRAE"]`;
}

function update002(payload) {
  section(payload, 1).content_markdown = `A gestão pública e a privada compartilham técnicas administrativas, embora estejam submetidas a finalidades e regimes jurídicos distintos.

* **Resultados:** ambas buscam eficiência, eficácia e efetividade.
* **Público-alvo:** ambas organizam serviços para destinatários; no setor público, predomina a condição de cidadão e usuário de serviço público.
* **Estruturação do trabalho:** ambas dividem atividades, responsabilidades e recursos.
* **Práticas gerenciais:** ambas podem empregar gestão por competências e por resultados.
* **Funções administrativas:** planejamento, organização, direção e controle são aplicáveis aos dois setores.
* **Ambiente:** ambas são influenciadas por fatores internos e externos.`;

  section(payload, 2).content_markdown = `As diferenças devem ser tratadas como tendências institucionais, não como regras absolutas.

| Critério | Gestão pública | Gestão privada |
| :--- | :--- | :--- |
| **Finalidade** | Busca realizar o interesse público definido pelo ordenamento. | Empresas com fins lucrativos buscam retorno econômico; associações e fundações privadas podem não ter finalidade lucrativa. |
| **Tratamento dos destinatários** | Observa legalidade, impessoalidade e isonomia; diferenciações exigem fundamento jurídico e finalidade legítima. | Pode segmentar públicos conforme estratégia e regras aplicáveis, sem violar a legislação. |
| **Financiamento** | Combina tributos, tarifas, preços públicos, transferências e outras receitas; nem todo serviço depende de utilização individual. | Pode utilizar preços, tarifas, mensalidades, assinaturas, doações e outras receitas privadas. |
| **Ambiente de atuação** | Certas atividades são exclusivas do Estado; serviços públicos também podem ser delegados, e a exploração estatal de atividade econômica é excepcional. | Em regra atua em ambiente concorrencial, sujeito à regulação. |
| **Resultados** | Produz efeitos sociais, econômicos, jurídicos e políticos. | Afeta usuários, trabalhadores, proprietários e demais partes interessadas; cotação de ações só se aplica a companhias com valores negociados. |`;
}

function update003(payload) {
  section(payload, 1).content_markdown = `A distinção clássica usada em provas separa a sustentação política do governo de sua capacidade de transformar decisões em ação. A literatura, porém, usa “governança” em mais de uma acepção.

| Critério | Governabilidade | Governança |
| :--- | :--- | :--- |
| **Dimensão clássica** | Condições políticas e institucionais para exercer o poder com legitimidade e apoio. | Capacidade institucional de formular e implementar políticas públicas. |
| **Foco** | Articulação política, legitimidade e sustentação. | Na acepção organizacional atual, mecanismos de liderança, estratégia e controle para avaliar, direcionar e monitorar a gestão. |
| **Atores** | Governo, sistema político e sociedade. | Alta administração, gestores, instâncias de controle e partes interessadas; não provém exclusivamente do corpo técnico. |

No referencial contemporâneo do TCU, **governança** direciona e monitora; **gestão** planeja, executa e controla as ações necessárias para cumprir esse direcionamento.`;

  section(payload, 2).content_markdown = `### Ingovernabilidade e Não-Governabilidade

Alguns materiais distinguem **ingovernabilidade** como incapacidade de oferecer resposta a uma demanda e **não-governabilidade** como ausência de apoio político. Essa terminologia varia entre autores e não deve ser equiparada automaticamente, respectivamente, a “falta de governança” e “falta de governabilidade”.

### Accountability e Compliance

* **Accountability:** dever de informar, justificar decisões, prestar contas e sujeitar-se à responsabilização.
* **Compliance:** atuação em conformidade com leis, regulamentos e normas internas aplicáveis.`;
}

function update004(payload) {
  const relations = section(payload, 1);
  relations.content_markdown = `O governo eletrônico utiliza tecnologias da informação e comunicação para prestar serviços, ampliar a participação cidadã e modernizar processos internos.

| Relação | Destinatário | Exemplo |
| :--- | :--- | :--- |
| **G2C** (*Government to Citizen*) | Cidadãos | Serviços digitais e entrega eletrônica da DIRPF. |
| **G2B** (*Government to Business*) | Empresas | Compras públicas eletrônicas. |
| **G2G** (*Government to Government*) | Órgãos e entes federativos | Intercâmbio de dados e consulta ao CAUC, sistema de informações sobre requisitos fiscais. |`;
  relations.mermaid_mindmap = `flowchart TD
    A["Governo eletrônico"] --> B["G2C<br/>Cidadãos"]
    A --> C["G2B<br/>Empresas"]
    A --> D["G2G<br/>Órgãos e entes"]`;

  section(payload, 2).content_markdown = `As diretrizes do Comitê Executivo de Governo Eletrônico (CEGE) pertencem à fase histórica de implantação do governo eletrônico federal, iniciada em 2000. Entre elas estavam promoção da cidadania, inclusão digital, software livre, gestão do conhecimento, racionalização de recursos, padrões comuns e integração entre poderes e níveis de governo.

O marco atual é mais amplo e deve ser estudado separadamente:

* **Lei nº 14.129/2021:** princípios, regras e instrumentos para o Governo Digital e o aumento da eficiência pública.
* **Decreto nº 12.069/2024:** Estratégia Nacional de Governo Digital.
* **Decreto nº 12.198/2024:** Estratégia Federal de Governo Digital 2024–2027 e Infraestrutura Nacional de Dados.

O modelo atual enfatiza centralidade no cidadão, inclusão, integração de dados e serviços, segurança, privacidade, transparência, participação, eficiência e sustentabilidade.`;
}

function update005(payload) {
  const intro = section(payload, 1);
  intro.content_markdown = replaceRequired(
    intro.content_markdown,
    "No entanto, permanece mantida a obrigação de disponibilizar as informações relativas à execução orçamentária e financeira em tempo real, em local de fácil acesso físico.",
    "A dispensa não alcança a divulgação, em tempo real e em meios eletrônicos de acesso público, das informações relativas à execução orçamentária e financeira exigidas pela Lei de Responsabilidade Fiscal.",
    "005/sec-01 municípios",
  );
  intro.content_markdown += `\n\n#### Atualizações de Transparência Ativa\nOs arts. 8º-A e 8º-B da LAI, incluídos em 2025, estabeleceram deveres específicos de divulgação para serviços sociais autônomos destinatários de determinadas contribuições federais e para conselhos de fiscalização profissional.`;
  const municipalityCallout = intro.callouts.find((item) => item.title === "Dispensa de Transparência Ativa");
  if (municipalityCallout) {
    municipalityCallout.text = "Municípios com até 10.000 habitantes têm a dispensa do art. 8º, § 4º, mas continuam sujeitos à divulgação eletrônica, em tempo real, da execução orçamentária e financeira exigida pela LRF.";
  }

  const procedure = section(payload, 2);
  procedure.content_markdown = replaceRequired(
    procedure.content_markdown,
    "O serviço de busca e fornecimento da informação é totalmente **gratuito**. No entanto, poderá ser cobrado exclusivamente o valor necessário ao ressarcimento dos custos dos materiais e serviços de reprodução de documentos. Fica isento do ressarcimento o solicitante cuja situação econômica não lhe permita realizar o pagamento sem prejuízo do próprio sustento ou de sua família, nos termos da lei.",
    `| Situação | Regra |\n| :--- | :--- |\n| **Busca e fornecimento** | Gratuitos. |\n| **Reprodução** | Pode haver cobrança apenas do custo dos materiais e serviços utilizados. |\n| **Hipossuficiência** | Há isenção quando o pagamento prejudicar o sustento do requerente ou de sua família. |`,
    "005/sec-02 custos",
  );
  procedure.content_markdown = replaceRequired(
    procedure.content_markdown,
    "No caso de indeferimento do pedido de acesso ou de não fornecimento das razões da negativa, o interessado poderá interpor recurso no prazo de **10 dias** a contar da ciência da decisão. Aplica-se subsidiariamente a Lei 9.784/99.",
    "O interessado pode recorrer em **10 dias**. A autoridade hierarquicamente superior decide em **5 dias**. No Poder Executivo federal, depois dessa apreciação, cabe recurso à CGU nas hipóteses do art. 16 e, se a CGU mantiver a negativa, à CMRI. Legislativo, Judiciário e Ministério Público possuem regulamentação recursal própria; CNJ e CNMP recebem informações sobre decisões denegatórias, mas não são instâncias gerais criadas pela LAI.",
    "005/sec-02 recursos",
  );
  procedure.mermaid_mindmap = `flowchart TD
    A["Negativa de acesso"] --> B["Recurso em 10 dias<br/>Autoridade superior"]
    B --> C["Decisão em 5 dias"]
    C --> D["Executivo federal<br/>CGU, art. 16"]
    D --> E["CMRI, se a CGU mantiver a negativa"]
    C --> F["Demais Poderes e MP<br/>regulamentação própria"]`;

  const secrecy = section(payload, 4);
  secrecy.content_markdown = replaceRequired(
    secrecy.content_markdown,
    "Agentes públicos que exerçam funções de direção, comando, chefia ou assessoramento equivalentes ou superiores ao nível DAS 101.5 do Grupo-Direção e Assessoramento Superiores (GDAS).",
    "Agentes públicos que exerçam funções de direção, comando ou chefia, em nível DAS 101.5 ou superior, ou de hierarquia equivalente, conforme regulamentação específica.",
    "005/sec-04 competência",
  );
  secrecy.mermaid_mindmap = `flowchart TD
    A["Graus de sigilo"] --> U["Ultrassecreta<br/>até 25 anos"]
    A --> S["Secreta<br/>até 15 anos"]
    A --> R["Reservada<br/>até 5 anos"]
    U --> P["Prorrogação única pela CMRI<br/>nas hipóteses legais"]`;

  const review = section(payload, 6);
  review.content_markdown = `A autoridade classificadora ou autoridade hierarquicamente superior pode reavaliar a classificação, de ofício ou mediante provocação, para desclassificar a informação ou reduzir o prazo de sigilo.

* **Reavaliação ordinária:** considera a permanência dos motivos da classificação e os danos que a divulgação poderia produzir.
* **Regra transitória do art. 39:** o prazo de **2 anos** contou da vigência da LAI e alcançou informações secretas e ultrassecretas classificadas segundo a legislação anterior. Não existe reavaliação bienal geral.
* **CMRI:** no âmbito federal, pode rever classificações secretas e ultrassecretas; a revisão de ofício prevista no art. 35 ocorre, no máximo, a cada **4 anos**, após a reavaliação transitória do art. 39.
* **Desclassificação automática:** ocorre apenas nas hipóteses e nos prazos expressamente previstos na LAI.`;
  review.callouts = [{
    type: "warning",
    title: "Prazo de dois anos era transitório",
    text: "O art. 39 não criou revisão bienal permanente: tratou da transição das classificações anteriores à LAI.",
  }];
  review.mermaid_mindmap = `flowchart TD
    A["Classificação vigente"] --> B["Reavaliação pelo classificador<br/>ou autoridade superior"]
    B --> C["Manter, reduzir prazo<br/>ou desclassificar"]
    A --> D["CMRI<br/>revisão de secreta e ultrassecreta"]
    D --> E["Máximo de 4 anos<br/>na hipótese do art. 35"]`;

  const sanctions = section(payload, 8);
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "Constituem condutas ilícitas que ensejam responsabilidade:",
    "Entre as condutas ilícitas do art. 32 estão:",
    "005/sec-08 rol",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "* Destruir ou subtrair documentos relativos a possíveis violações de Direitos Humanos cometidas por agentes do Estado.",
    `* Destruir ou subtrair documentos relativos a possíveis violações de Direitos Humanos cometidas por agentes do Estado.\n* Retardar deliberadamente o fornecimento ou apresentar informação intencionalmente incorreta, incompleta ou imprecisa.\n* Utilizar, subtrair, destruir, inutilizar, desfigurar, alterar ou ocultar informação sob sua guarda.\n* Agir com dolo ou má-fé na análise das solicitações ou ocultar informação da revisão por autoridade superior.`,
    "005/sec-08 condutas",
  );
  sanctions.content_markdown = replaceRequired(
    sanctions.content_markdown,
    "| **Agentes Públicos Civis** | No mínimo **Suspensão** (conforme Lei 8.112/90). | Podem responder cumulativamente por improbidade administrativa (esfera civil). |",
    "| **Agentes submetidos à Lei nº 8.112/1990** | Infração administrativa apenada, no mínimo, com **suspensão**, segundo os critérios da lei. | A regra refere-se expressamente ao regime da Lei nº 8.112/1990. |",
    "005/sec-08 suspensão",
  );
  sanctions.content_markdown += `\n\nA mesma responsabilidade direta prevista no art. 34 aplica-se à pessoa física ou entidade privada que, em razão de vínculo com o poder público, tenha acesso a informação sigilosa ou pessoal e a submeta a tratamento indevido.`;
  const suspensionCallout = sanctions.callouts.find((item) => item.title === "Sanção Mínima para Agentes Civis");
  if (suspensionCallout) {
    suspensionCallout.title = "Sanção no regime da Lei nº 8.112/1990";
    suspensionCallout.text = "Para agentes submetidos à Lei nº 8.112/1990, as condutas do art. 32 são infrações apenadas, no mínimo, com suspensão, segundo os critérios legais.";
  }

  const fiscal = section(payload, 9);
  fiscal.content_markdown += `\n\n### Texto atual da LRF\nA LC nº 131/2009 é o marco histórico da transparência em tempo real, mas o art. 48 recebeu alterações posteriores. A leitura atual também deve considerar os §§ 2º a 6º, incluídos pela LC nº 156/2016, e a divulgação de dados atualizados sobre benefícios tributários, financeiros e creditícios prevista no § 1º, IV, incluído pela LC nº 224/2025.`;

  section(payload, 10).mermaid_mindmap = `flowchart TD
    A["Tipos de accountability"] --> H["Horizontal<br/>órgãos e poderes"]
    A --> V["Vertical<br/>cidadãos e eleições"]
    A --> S["Societal<br/>sociedade civil e mídia"]`;
}

function update006(payload) {
  const concept = section(payload, 1);
  concept.content_markdown = replaceRequired(concept.content_markdown, "**Laswell**", "**Lasswell**", "006/sec-01 Lasswell");

  const nodes = section(payload, 2);
  nodes.content_markdown = replaceRequired(
    nodes.content_markdown,
    "A política pública vai além da mera tomada de decisões, exigindo ações estrategicamente selecionadas para implementar tais decisões (Maria das Graças Ruas).",
    "Na abordagem de Maria das Graças Ruas, a política pública não se reduz à decisão isolada e envolve ações destinadas a implementá-la; outras abordagens, como a de Dye, também admitem a decisão de não agir.",
    "006/sec-02 abordagem",
  );
  const decisionCallout = nodes.callouts.find((item) => item.title === "Diferença entre Decisão Política e Política Pública");
  if (decisionCallout) {
    decisionCallout.text = "Na abordagem de Maria das Graças Ruas, a política pública não se reduz à decisão isolada e envolve ações destinadas a implementá-la; outras abordagens também admitem a decisão de não agir.";
  }

  const dimensions = section(payload, 4);
  dimensions.content_markdown = replaceRequired(
    dimensions.content_markdown,
    `##### Modelos de Formulação (Maria das Graças Ruas):\n*   **Incrementalismo:** Soluções graduais, sem rupturas. Decisões passadas condicionam o presente.\n*   **Mixed-scanning:** Distingue decisões estruturantes (longo prazo) de decisões ordinárias (incrementais).\n*   **Racional-compreensivo:** Busca a solução técnica ideal e de grande impacto, assumindo racionalidade ilimitada.`,
    `##### Modelos de Formulação (Maria das Graças Ruas)\n\n| Modelo | Características | Limitações |\n| :--- | :--- | :--- |\n| **Racional-compreensivo** | Busca conhecer amplamente o problema, comparar alternativas e escolher uma solução técnica de grande impacto. | Pressupõe informações e capacidade de processamento que raramente estão integralmente disponíveis. |\n| **Incrementalismo** | Promove ajustes graduais, condicionados por decisões anteriores, sem grandes rupturas. | Pressões de grupos, racionalidade limitada e tradições reduzem o espaço para mudanças radicais. |\n| **Mixed-scanning** | Combina decisões estruturantes de longo alcance com decisões ordinárias e incrementais mais detalhadas. | Exige articular as duas escalas de análise. |`,
    "006/sec-04 modelos",
  );
  dimensions.content_markdown = replaceRequired(
    dimensions.content_markdown,
    `#### 5. Avaliação\nMensuração e análise *a posteriori* dos efeitos produzidos.`,
    `#### 5. Avaliação\nProcesso sistemático que pode ocorrer antes, durante ou depois da implementação. A avaliação *ex post* examina resultados e efeitos produzidos.`,
    "006/sec-04 avaliação",
  );
  dimensions.content_markdown = replaceRequired(
    dimensions.content_markdown,
    `##### Dimensões do Desempenho:\n*   **Eficiência:** Relação entre produtos e custos dos insumos (foco nos meios).\n*   **Eficácia:** Grau de alcance das metas estabelecidas (foco nos produtos).\n*   **Efetividade:** Impacto real e transformações geradas na sociedade (foco nos efeitos de longo prazo).`,
    `##### Dimensões do Desempenho\n\n| Dimensão | Pergunta central | Foco |\n| :--- | :--- | :--- |\n| **Eficiência** | Como produzir com melhor relação entre recursos e produtos? | Meios e custos. |\n| **Eficácia** | As metas foram alcançadas? | Produtos e objetivos. |\n| **Efetividade** | Que mudanças reais ocorreram para a sociedade? | Resultados e impactos. |`,
    "006/sec-04 desempenho",
  );
  dimensions.mermaid_mindmap = `flowchart LR
    A["Polity<br/>instituições"] --> B["Politics<br/>processo e conflito"]
    B --> C["Policy<br/>conteúdo das decisões"]
    A --> C`;
}

function update007(payload) {
  section(payload, 1).mermaid_mindmap = `flowchart LR
    A["Fayol"] --> B["Previsão"]
    B --> C["Organização"]
    C --> D["Comando"]
    D --> E["Coordenação"]
    E --> F["Controle"]`;

  const modern = section(payload, 2);
  modern.content_markdown = `As funções administrativas atuais formam um ciclo integrado:

| Função | Natureza predominante | Características principais |
| :--- | :--- | :--- |
| **Planejamento** | Impessoal | Define objetivos, metas, missão, atividades, recursos e meios de acompanhamento. |
| **Organização** | Impessoal | Designa atividades, aloca recursos, distribui trabalho e atribui responsabilidades. |
| **Direção** | Interpessoal | Comunica, lidera, motiva, orienta e coordena pessoas na execução. |
| **Controle e avaliação** | Impessoal | Estabelece padrões, observa o desempenho, compara o realizado com o planejado e corrige desvios. |

**Delegação** transfere autoridade entre pessoas dentro da estrutura. **Descentralização**, em sentido organizacional, distribui autoridade decisória por níveis ou unidades; no Direito Administrativo, o termo também possui acepção jurídica própria e não se limita a “cargos e departamentos”.

O controle administrativo é prospectivo quando produz aprendizado e correções para os ciclos seguintes. Não se confunde com avaliação de desempenho individual.`;
}

function update009(payload) {
  const errors = section(payload, 4);
  errors.content_markdown = errors.content_markdown
    .replace("**Efeito Halo (Consciente):**", "**Efeito Halo:**")
    .replace("**Tendência Central (Consciente):**", "**Tendência Central:**")
    .replace("**Recenticidade (Inconsciente):**", "**Recenticidade:**")
    .replace("**Projeção (Subjetividade):**", "**Projeção:**");
}

function update010(payload) {
  const theories = section(payload, 2);
  theories.content_markdown = replaceRequired(
    theories.content_markdown,
    "1.  A ascensão a um nível superior da pirâmide ocorre **somente** quando o nível imediatamente inferior estiver total ou adequadamente satisfeito.",
    "1.  As necessidades tendem a ganhar predominância à medida que as de nível inferior são razoavelmente satisfeitas; a progressão não é rígida nem exige satisfação total.",
    "010/sec-02 Maslow",
  );
  theories.content_markdown = replaceRequired(
    theories.content_markdown,
    `As necessidades são divididas em:\n\n*   **Primárias (Inferiores):** Necessidades fisiológicas e de segurança.\n*   **Secundárias (Superiores):** Necessidades sociais, de estima e de autorrealização.`,
    `| Grupo | Necessidades |\n| :--- | :--- |\n| **Primárias ou inferiores** | Fisiológicas e segurança. |\n| **Secundárias ou superiores** | Sociais, estima e autorrealização. |`,
    "010/sec-02 grupos Maslow",
  );
  theories.content_markdown = replaceRequired(
    theories.content_markdown,
    `*   **Fatores Motivacionais (Intrínsecos):** Relacionam-se com o **conteúdo** do trabalho e com as necessidades secundárias de Maslow. São os únicos capazes de gerar **motivação** real.`,
    `*   **Fatores Motivacionais (Intrínsecos):** Relacionam-se com o **conteúdo** do trabalho e favorecem satisfação e motivação.`,
    "010/sec-02 Herzberg",
  );
  theories.content_markdown = replaceRequired(
    theories.content_markdown,
    `*   **Fatores Higiênicos (Extrínsecos):** Relacionam-se com o **ambiente** de trabalho e com as necessidades primárias de Maslow. Se forem positivos, apenas **evitam a insatisfação**, mas não geram motivação.`,
    `*   **Fatores Higiênicos (Extrínsecos):** Relacionam-se com o **contexto** do trabalho. Sua inadequação favorece insatisfação; sua presença reduz a insatisfação, sem garantir motivação duradoura.`,
    "010/sec-02 higiene",
  );
  theories.content_markdown = replaceRequired(
    theories.content_markdown,
    `Representam duas visões distintas acerca do comportamento humano no ambiente de trabalho:`,
    `Representam conjuntos contrastantes de pressupostos gerenciais sobre o comportamento humano, não descrições universais de todas as pessoas:`,
    "010/sec-02 McGregor",
  );
  theories.mermaid_mindmap = `flowchart TD
    A["Teorias motivacionais"] --> B["Conteúdo<br/>o que motiva"]
    A --> C["Processo<br/>como ocorre"]
    B --> D["Maslow, Herzberg,<br/>McClelland e ERG"]
    C --> E["Vroom, equidade<br/>e reforço"]`;
}

function update011(payload) {
  const structures = section(payload, 1);
  structures.content_markdown = structures.content_markdown.replace(
    "É o modelo mais utilizado nas organizações. Sua principal característica",
    "Sua principal característica",
  );

  const departments = section(payload, 2);
  departments.content_markdown = departments.content_markdown
    .replace("prestação de serviços descentrilizados", "prestação de serviços descentralizados")
    .replace("Apresenta total falta de flexibilidade diante de mudanças tecnológicas ou operacionais.", "Pode reduzir a flexibilidade diante de mudanças tecnológicas ou operacionais quando o fluxo é excessivamente rígido.");

  section(payload, 3).mermaid_mindmap = `flowchart TD
    A["Estruturas organizacionais"] --> B["Linear<br/>unidade de comando"]
    A --> C["Funcional<br/>especialização"]
    A --> D["Linha-staff<br/>hierarquia e assessoria"]
    A --> E["Divisional<br/>resultados por unidade"]
    A --> F["Matricial<br/>dupla autoridade"]
    A --> G["Rede<br/>parcerias flexíveis"]`;
}

function update012(payload) {
  const planning = section(payload, 1);
  planning.content_markdown = `Os níveis de planejamento variam conforme amplitude, horizonte temporal e detalhamento. Os prazos são relativos ao contexto da organização, não faixas universais rígidas.

| Nível | Abrangência | Horizonte | Conteúdo | Responsabilidade predominante |
| :--- | :--- | :--- | :--- | :--- |
| **Estratégico** | Organização como um todo | Longo prazo | Genérico, sintético e orientador | Alta administração; formula direção e objetivos globais e acompanha resultados. |
| **Tático** | Unidades e departamentos | Médio prazo | Desdobra objetivos e aloca recursos por área | Gestão intermediária. |
| **Operacional** | Atividades e tarefas | Curto prazo | Detalhado e analítico | Supervisão e equipes de execução. |

O planejamento estratégico orienta a organização; sua execução é desdobrada pelos planos táticos e operacionais.

* **Indicador:** medida que representa um aspecto relevante do desempenho ou da realidade observada.
* **Índice:** medida sintética, frequentemente calculada pela combinação ou agregação de indicadores segundo método definido.`;
  planning.callouts = [{
    type: "info",
    title: "Horizontes são relativos",
    text: "Longo, médio e curto prazo dependem do setor e do contexto; a diferença essencial está na abrangência e no nível de detalhamento.",
  }];
}

const updaters = {
  "modelos-teoricos-e-evolucao-da-adm-publica-no-brasil": update001,
  "convergencias-e-diferencas-entre-a-gestao-publica-e-a-privada": update002,
  "governabilidade-e-governanca": update003,
  "governo-eletronico": update004,
  "transparencia-e-accountability": update005,
  "politicas-publicas": update006,
  "processo-organizacional-e-funcoes-administrativas": update007,
  "gestao-de-pessoas": update009,
  "comportamento-organizacional": update010,
  "processo-de-organizacao": update011,
  "processo-de-planejamento": update012,
};

const jsonFiles = (await readdir(INPUT_JSON_DIR)).filter((name) => name.endsWith(".json")).sort();
const backupFiles = (await readdir(BACKUP_DIR)).filter((name) => name.endsWith(".json"));
const backups = new Map();

for (const name of backupFiles) {
  const payload = JSON.parse(await readFile(path.join(BACKUP_DIR, name), "utf8"));
  backups.set(payload.topic_id, payload);
}

const outputs = [];
for (const name of jsonFiles) {
  const filePath = path.join(INPUT_JSON_DIR, name);
  const payload = JSON.parse(await readFile(filePath, "utf8"));
  const backup = backups.get(payload.topic_id);
  if (!backup) throw new Error(`Backup publicado ausente para ${payload.topic_id}`);
  if (payload.sections.length !== backup.sections.length) {
    throw new Error(`Quantidade de seções divergente em ${payload.topic_id}`);
  }

  updaters[payload.topic_id]?.(payload);

  for (const item of payload.sections) {
    const published = backup.sections.find((candidate) => candidate.section_id === item.section_id);
    if (!published?.content_unit_id || !published?.stable_key) {
      throw new Error(`Identidade permanente ausente no backup: ${item.section_id}`);
    }
    item.content_unit_id = published.content_unit_id;
    item.stable_key = published.stable_key;
    item.flashcards = [];
  }

  outputs.push({ name, payload, changed: Boolean(updaters[payload.topic_id]) });
}

console.log(`Payloads validados: ${outputs.length}`);
console.log(`Payloads com correções editoriais: ${outputs.filter((item) => item.changed).length}`);

if (!APPLY) {
  console.log("Pré-visualização concluída. Use --apply para gravar os artefatos revisados.");
  process.exit(0);
}

if (!SKIP_BACKUP) {
  await mkdir(ARTIFACT_BACKUP_DIR, { recursive: true });
  await cp(JSON_DIR, path.join(ARTIFACT_BACKUP_DIR, "json"), { recursive: true, force: true });
  await cp(MD_DIR, path.join(ARTIFACT_BACKUP_DIR, "md"), { recursive: true, force: true });
}

for (const { name, payload, changed } of outputs) {
  await writeFile(path.join(JSON_DIR, name), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  if (changed) {
    const prefix = name.replace(/_reescrito_processado\.json$/, "_reescrito.md");
    await writeFile(path.join(MD_DIR, prefix), renderMarkdown(payload), "utf8");
  }
}

console.log(
  SKIP_BACKUP
    ? "Artefatos revisados gravados sem substituir o backup original."
    : `Artefatos revisados gravados. Backup local: ${ARTIFACT_BACKUP_DIR}`,
);
