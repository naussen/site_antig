import { normalizeAttachedFlashcard, parseTwoColumnCsv } from "./portuguese-flashcard-import.mjs";

const normalize = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function classifyCostAccountingFlashcard(row) {
  const text = normalize(`${row.question} ${row.answer}`);
  if (/custeio.*abc|activity based/.test(text)) return "custeio-abc-activity-based-costing-sec-01";
  if (/custeio.*absorcao/.test(text)) return "custeio-por-absorcao-sec-01";
  if (/custeio.*(?:direto|variavel)|estoques?.*(?:subavali|absorcao)/.test(text)) return "custeio-direto-ou-variavel-sec-01";
  if (/variacao (?:de )?(?:preco|quantidade|mista|total)|custo padrao.*(?:ideal|corrente)|preco padrao/.test(text)) return "custo-padrao-sec-02";
  if (/custo padrao/.test(text)) return "custo-padrao-sec-01";
  if (/coprodut/.test(text)) return "producao-conjunta-sec-01";
  if (/subprodut/.test(text)) return "producao-conjunta-sec-02";
  if (/sucata/.test(text)) return "producao-conjunta-sec-03";
  if (/departament|centro de custos?/.test(text)) return "departamentalizacao-sec-01";
  if (/margem de contribuicao.*(?:restricao|fator limitador)|teoria da restricao/.test(text)) return "margem-de-contribuicao-sec-02";
  if (/margem de contribuicao|comiss(?:ao|oes).*vendedor|receita total/.test(text)) return "margem-de-contribuicao-sec-01";
  if (/margem de seguranca/.test(text)) return "ponto-de-equilibrio-sec-05";
  if (/equilibrio economico|\bpee\b/.test(text)) return "ponto-de-equilibrio-sec-02";
  if (/equilibrio financeiro|\bpef\b/.test(text)) return "ponto-de-equilibrio-sec-03";
  if (/equilibrio operacional|\bpeo\b/.test(text)) return "ponto-de-equilibrio-sec-04";
  if (/ponto de equilibrio|break-even/.test(text)) return "ponto-de-equilibrio-sec-01";
  if (/custo primario|transformacao|conversao|materia-prima|perdas?|investimento|gastos?|despesa|custo fixo/.test(text)) return "definicoes-e-tipos-de-gastos-sec-04";
  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildCostAccountingFlashcards(sources) {
  return sources.flatMap(({ fileName, content }) => parseTwoColumnCsv(content).map((row, index) => ({ sectionId: classifyCostAccountingFlashcard(row), flashcard: normalizeAttachedFlashcard(row), origin: `${fileName}:${index + 1}` })));
}
