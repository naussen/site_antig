import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const SKIP_BACKUP = process.argv.includes("--skip-backup");
const JSON_DIR = "C:\\PRO\\agente\\json_reescrito_processado\\Análise de Balanços";
const MD_DIR = "C:\\PRO\\agente\\md_reescrito\\Análise de Balanços";
const BACKUP_DIR = "C:\\PRO\\agente\\analise_balancos\\backups\\2026-09-19-pre-revisao";
const ARTIFACT_BACKUP_DIR = path.join(BACKUP_DIR, "artefatos-locais");
const INPUT_JSON_DIR = SKIP_BACKUP ? path.join(ARTIFACT_BACKUP_DIR, "json") : JSON_DIR;

function section(payload) {
  if (payload.sections.length !== 1) {
    throw new Error(`Quantidade inesperada de seções em ${payload.topic_id}`);
  }
  return payload.sections[0];
}

function renderMarkdown(payload) {
  const blocks = [`# ${payload.topic_title}`];
  for (const item of payload.sections) {
    blocks.push(`## ${item.title}`, item.content_markdown.trim());
    for (const callout of item.callouts ?? []) {
      blocks.push(`> **${callout.title}:** ${callout.text}`);
    }
    for (const mnemonic of item.mnemonics ?? []) {
      blocks.push(
        `> **${mnemonic.key}:** ${mnemonic.meaning}${mnemonic.description ? ` — ${mnemonic.description}` : ""}`,
      );
    }
    if (item.mermaid_mindmap?.trim()) {
      blocks.push(`\`\`\`mermaid\n${item.mermaid_mindmap.trim()}\n\`\`\``);
    }
  }
  return `${blocks.join("\n\n")}\n`;
}

function updateVertical(payload) {
  const item = section(payload);
  item.content_markdown = `A **análise vertical**, também conhecida como análise de estrutura, mostra quanto uma conta ou um grupo representa dentro de um valor-base do mesmo demonstrativo e período.

$$
AV\,(\%) = \\frac{\\text{valor da conta}}{\\text{valor-base}} \\times 100
$$

### Exemplo de Estrutura no Ativo

| Nível | Conta | Valor | Participação no ativo total |
| :--- | :--- | ---: | ---: |
| **1** | **Ativo total** | **100.000** | **100%** |
| 1.1 | ↳ Ativo circulante | 30.000 | 30% |
| 1.1.1 | ↳↳ Caixa | 10.000 | 10% |

A numeração e os recuos preservam a relação parte-todo: Caixa integra o Ativo Circulante, que integra o Ativo Total.

### Aplicação nos Demonstrativos

* **Balanço Patrimonial:** o valor-base deve ser declarado, como o total do ativo, o total do passivo e patrimônio líquido ou o total de determinado grupo.
* **Demonstração do Resultado do Exercício (DRE):** na convenção usual deste material, a receita líquida corresponde a 100%, e as demais linhas são comparadas com ela.

A análise vertical compara contas do mesmo período. Ela independe da análise horizontal, embora as duas técnicas possam ser usadas em conjunto.`;
  item.callouts = [
    {
      type: "warning",
      title: "Valor-base deve ser explícito",
      text: "Na DRE, este material adota a receita líquida como base de 100%. Em qualquer demonstrativo, identifique expressamente o denominador antes de interpretar o percentual.",
    },
    {
      type: "info",
      title: "Leitura estrutural",
      text: "A análise vertical evidencia a participação de cada conta em um total do mesmo período; ela não mede, isoladamente, evolução no tempo.",
    },
  ];
}

function updateHorizontal(payload) {
  const item = section(payload);
  item.content_markdown = `A **análise horizontal**, também denominada análise de tendência ou de evolução, compara a mesma conta entre períodos. A base pode ser **fixa** — todos os anos confrontados com um único ano-base — ou **encadeada** — cada período confrontado com o anterior. O critério escolhido deve permanecer explícito e consistente.

No exemplo, **X1 é a base fixa**:

| Conta | X1 (ano-base) | Percentual em X1 | X2 | Variação de X1 para X2 |
| :--- | ---: | ---: | ---: | ---: |
| **Ativo total** | **1.000.000** | **100%** | **1.350.000** | **↑ +35%** |
| Ativo circulante | 300.000 | 30% | 300.000 | → 0% |
| ↳ Caixa | 200.000 | 20% | 150.000 | ↓ -25% |
| Ativo não circulante | 700.000 | 70% | 1.050.000 | ↑ +50% |
| ↳ Imobilizado | 500.000 | 50% | 700.000 | ↑ +40% |

O **índice-base** e a **variação percentual** não são a mesma medida:

$$
\\text{Índice-base} = \\frac{\\text{valor atual}}{\\text{valor-base}} \\times 100
$$

$$
\\text{Variação} = \\left(\\frac{\\text{valor atual}}{\\text{valor-base}} - 1\\right) \\times 100
$$

Assim, para o Ativo Total em X2, o índice-base é 135% e a variação é +35%. As setas reforçam o significado sem depender apenas de cor: ↑ aumento, → estabilidade e ↓ redução.

Na DRE, a análise horizontal permite acompanhar a trajetória de receitas, custos, despesas e resultados. Um lucro ainda crescente pode coexistir com tendências desfavoráveis em seus componentes; a conclusão exige examinar o conjunto e o contexto.`;
  item.callouts = [
    {
      type: "info",
      title: "Técnicas independentes",
      text: "A análise horizontal não depende de uma análise vertical anterior. Elas respondem a perguntas diferentes e podem ser combinadas.",
    },
    {
      type: "warning",
      title: "Base fixa ou encadeada",
      text: "Informe sempre se a comparação usa um único ano-base ou o período imediatamente anterior; trocar o critério altera a leitura dos percentuais.",
    },
  ];
}

function updateQuotients(payload) {
  const item = section(payload);
  item.content_markdown = `### Quocientes Financeiros

Os índices devem ser interpretados em conjunto, ao longo do tempo e, quando possível, em comparação com empresas do mesmo setor. Nomenclaturas e ajustes podem variar entre autores; por isso, a fórmula adotada precisa ser declarada.

#### Índices Financeiros de Liquidez

| Índice | Significado | Fórmula |
| :--- | :--- | :--- |
| **Liquidez imediata ou instantânea** | Compara disponibilidades imediatamente utilizáveis com obrigações de curto prazo. | $$\\frac{\\text{Disponível}}{PC}$$ |
| **Liquidez corrente** | Compara todo o ativo circulante com o passivo circulante. | $$\\frac{AC}{PC}$$ |
| **Liquidez seca ajustada** | Exclui estoques e despesas antecipadas do ativo circulante. Outros ativos circulantes permanecem no numerador. | $$\\frac{AC - \\text{Estoques} - \\text{Despesas antecipadas}}{PC}$$ |
| **Liquidez geral — fórmula usual** | Compara ativos realizáveis de curto e longo prazo com obrigações exigíveis nos dois horizontes. | $$\\frac{AC + RLP}{PC + PNC}$$ |
| **Liquidez geral — variante ajustada do material** | Também exclui despesas antecipadas, em abordagem conservadora. | $$\\frac{AC + RLP - \\text{Despesas antecipadas}}{PC + PNC}$$ |
| **Solvência geral — fórmula usual** | Relaciona o ativo total ao passivo exigível total. | $$\\frac{\\text{Ativo total}}{PC + PNC}$$ |
| **Solvência geral — variante ajustada do material** | Exclui despesas antecipadas do ativo total. | $$\\frac{\\text{Ativo total} - \\text{Despesas antecipadas}}{PC + PNC}$$ |

*Variáveis:* $AC$ = Ativo Circulante; $RLP$ = Realizável a Longo Prazo; $PC$ = Passivo Circulante; $PNC$ = Passivo Não Circulante.

#### Índices Financeiros de Estrutura de Capital e Endividamento

| Índice | Significado | Fórmula |
| :--- | :--- | :--- |
| **Composição do endividamento** | Parcela das obrigações exigíveis que vence no curto prazo. | $$\\frac{PC}{PC + PNC}$$ |
| **Participação de capitais de terceiros em relação ao capital próprio** | Compara obrigações exigíveis com o patrimônio líquido. Alguns materiais chamam esse quociente de grau de endividamento. | $$\\frac{PC + PNC}{PL}$$ |
| **Imobilização do capital próprio** | Parcela do patrimônio líquido aplicada em Investimentos, Imobilizado e Intangível. | $$\\frac{\\text{Investimentos} + \\text{Imobilizado} + \\text{Intangível}}{PL} = \\frac{ANC - RLP}{PL}$$ |

*Variáveis adicionais:* $PL$ = Patrimônio Líquido; $ANC$ = Ativo Não Circulante. A equivalência $ANC - RLP$ pressupõe a estrutura contábil apresentada no material.

### Quocientes Econômicos

Fluxos de resultado pertencem a um período, enquanto Ativo e Patrimônio Líquido são saldos de uma data. Quando houver saldos inicial e final disponíveis, prefira os saldos médios nos denominadores.

#### Índices Econômicos de Rentabilidade

| Índice | Fórmula e observação |
| :--- | :--- |
| **Giro do ativo** | $$\\frac{\\text{Vendas líquidas}}{\\text{Ativo total médio}}$$ |
| **Giro do ativo operacional — convenção do material** | $$\\frac{\\text{Vendas líquidas}}{AC_{médio} + \\text{Imobilizado}_{médio} + \\text{Intangível}_{médio}}$$ A composição do ativo operacional pode variar conforme a finalidade da análise. |
| **Margem bruta** | $$\\frac{\\text{Lucro bruto}}{\\text{Vendas líquidas}}$$ |
| **Margem operacional** | $$\\frac{\\text{Resultado antes das receitas e despesas financeiras}}{\\text{Vendas líquidas}}$$ O subtotal adotado deve ser declarado. |
| **Margem líquida** | $$\\frac{\\text{Lucro líquido}}{\\text{Vendas líquidas}}$$ |
| **Rentabilidade do ativo** | $$ROA = \\frac{\\text{Lucro líquido}}{\\text{Ativo total médio}} = \\text{Giro do ativo} \\times \\text{Margem líquida}$$ O PDF denomina esse indicador ROI; a sigla ROA evita confundi-lo com retorno de um projeto específico. |
| **Payback simples** | $$\\text{Payback} = \\frac{\\text{Investimento inicial}}{\\text{Fluxo de caixa líquido uniforme por período}}$$ Para fluxos não uniformes, acumulam-se os fluxos até recuperar o investimento inicial. |
| **Rentabilidade do patrimônio líquido** | $$ROE = \\frac{\\text{Lucro líquido}}{\\text{Patrimônio líquido médio}}$$ |
| **Grau de alavancagem financeira** | $$GAF = \\frac{ROE}{ROA_{operacional}}$$ O retorno operacional do ativo deve ser calculado antes dos encargos financeiros, após tributos, e em base temporal compatível com o ROE. |

O recíproco da rentabilidade do ativo não é, em geral, o payback: lucro contábil, fluxo de caixa e investimento inicial são grandezas distintas.`;
  item.callouts = [
    {
      type: "warning",
      title: "Fórmulas usuais e variantes ajustadas",
      text: "A exclusão de despesas antecipadas na liquidez geral e na solvência é uma variante conservadora do material, não uma obrigação universal. O denominador da solvência é o passivo exigível, isto é, PC + PNC.",
    },
    {
      type: "info",
      title: "Margem operacional",
      text: "Resultado antes de IR e CSLL não é sinônimo automático de resultado operacional. A fórmula deve identificar o subtotal anterior às receitas e despesas financeiras.",
    },
    {
      type: "warning",
      title: "Payback não é 1 dividido pelo ROI",
      text: "A aproximação só funcionaria sob premissas muito restritas. O payback é determinado por investimento inicial e fluxos de caixa, não pelo lucro líquido sobre o ativo.",
    },
  ];
  item.mermaid_mindmap = "";
}

const updaters = new Map([
  ["analise-vertical-analise-de-estrutura", updateVertical],
  ["analise-horizontal-analise-de-tendencia-ou-de-evolucao", updateHorizontal],
  ["analise-por-quocientes", updateQuotients],
]);

const backupFiles = (await readdir(BACKUP_DIR)).filter((name) => name.endsWith(".json"));
const published = new Map();
for (const name of backupFiles) {
  const payload = JSON.parse(await readFile(path.join(BACKUP_DIR, name), "utf8"));
  published.set(payload.topic_id, payload);
}

const jsonFiles = (await readdir(INPUT_JSON_DIR)).filter((name) => name.endsWith(".json")).sort();
if (jsonFiles.length !== 4) throw new Error(`Esperados 4 payloads; encontrados ${jsonFiles.length}`);

const outputs = [];
for (const name of jsonFiles) {
  const payload = JSON.parse(await readFile(path.join(INPUT_JSON_DIR, name), "utf8"));
  if (payload.discipline !== "Análise de Balanços") {
    throw new Error(`Disciplina incorreta em ${name}: ${payload.discipline}`);
  }
  updaters.get(payload.topic_id)?.(payload);

  const backup = published.get(payload.topic_id);
  const publishedSection = backup?.sections?.[0];
  const item = section(payload);
  if (!publishedSection?.content_unit_id || !publishedSection?.stable_key) {
    throw new Error(`Identidade permanente ausente no backup de ${payload.topic_id}`);
  }
  if (publishedSection.section_id !== item.section_id) {
    throw new Error(`section_id divergente em ${payload.topic_id}`);
  }
  item.content_unit_id = publishedSection.content_unit_id;
  item.stable_key = publishedSection.stable_key;
  item.flashcards = [];
  item.mnemonics ??= [];
  item.callouts ??= [];
  item.mermaid_mindmap ??= "";
  outputs.push({ name, payload, changed: updaters.has(payload.topic_id) });
}

console.log(`Payloads validados: ${outputs.length}`);
console.log(`Payloads corrigidos: ${outputs.filter((item) => item.changed).length}`);

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
    const mdName = name.replace(/_reescrito_processado\.json$/, "_reescrito.md");
    await writeFile(path.join(MD_DIR, mdName), renderMarkdown(payload), "utf8");
  }
}

console.log(
  SKIP_BACKUP
    ? "Artefatos revisados gravados sem substituir o backup original."
    : `Artefatos revisados gravados. Backup local: ${ARTIFACT_BACKUP_DIR}`,
);
