import {
  normalizeAttachedFlashcard,
  parseTwoColumnCsv,
} from "./portuguese-flashcard-import.mjs";

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyAccountingFlashcard(row) {
  const text = normalize(`${row.question} ${row.answer}`);

  if (includesAny(text, [/cpc\s*00|estrutura conceitual/])) {
    if (/capital fisico|manutencao do capital/.test(text)) return "cpc-00-estrutura-conceitual-sec-03";
    if (/prudencia|neutralidade|materialidade|caracteristica qualitativa/.test(text)) return "cpc-00-estrutura-conceitual-sec-02";
    return "cpc-00-estrutura-conceitual-sec-01";
  }
  if (/teoria das contas|teoria personalista|teoria materialista/.test(text)) return "conceitos-basicos-da-contabilidade-sec-02";
  if (/estorno|retificacao de lancamento/.test(text)) return "conceitos-basicos-da-contabilidade-sec-03";
  if (/fatos contabeis|integralizacao de capital/.test(text)) return "conceitos-basicos-da-contabilidade-sec-04";
  if (/livro razao|principio da competencia|principio da prudencia/.test(text)) return "conceitos-basicos-da-contabilidade-sec-07";
  if (/balancete de verificacao/.test(text)) return "balancete-de-verificacao-sec-01";

  if (/cpc\s*01|recuperabilidade|impairment|desvalorizacao/.test(text)) {
    if (/reversao|perda por desvalorizacao|perda estimada/.test(text)) return "cpc-01-teste-de-recuperabilidade-sec-02";
    return "cpc-01-teste-de-recuperabilidade-sec-01";
  }
  if (/intangivel|goodwill|fase de pesquisa|desenvolvimento.*software/.test(text)) {
    if (/pesquisa|desenvolvimento|gerado internamente|goodwill/.test(text)) return "cpc-27-intangivel-sec-05";
    if (/amortizacao/.test(text)) return "cpc-27-intangivel-sec-06";
    return "cpc-27-intangivel-sec-01";
  }
  if (/imobilizado|desmontagem|depreciacao.*ativo/.test(text)) {
    if (/reconhecimento inicial|treinamento|desmontagem|restauracao/.test(text)) return "cpc-27-imobilizado-sec-03";
    if (/depreciacao|ocioso/.test(text)) return "cpc-27-imobilizado-sec-04";
    return "cpc-27-imobilizado-sec-01";
  }
  if (/estoque|estoques|vrl|valor realizavel liquido|peavm/.test(text)) {
    if (/desperdicio|nao compoem o custo/.test(text)) return "conceito-e-mensuracao-de-estoques-sec-03";
    if (/valor realizavel|vrl/.test(text)) return "conceito-e-mensuracao-de-estoques-sec-04";
    if (/peavm|valor de mercado/.test(text)) return "conceito-e-mensuracao-de-estoques-sec-05";
    return "conceito-e-mensuracao-de-estoques-sec-01";
  }
  if (/provisao|passivo contingente|reserva de contingencia/.test(text)) {
    if (/reserva de contingencia/.test(text)) return "cpc-25-provisoes-e-passivos-contingentes-sec-07";
    if (/passivo contingente/.test(text)) return "cpc-25-provisoes-e-passivos-contingentes-sec-08";
    return "cpc-25-provisoes-e-passivos-contingentes-sec-02";
  }
  if (/subvencao governamental|cpc\s*07/.test(text)) return "cpc-07-subvencao-e-assistencia-governamentais-sec-02";
  if (/ajuste a valor presente|\bavp\b|cpc\s*12/.test(text)) return "cpc-12-ajuste-a-valor-presente-sec-02";
  if (/custos? de transacao|debentures|cpc\s*08/.test(text)) return "cpc-08-custos-de-transacao-e-premios-na-emissao-de-tvm-sec-05";
  if (/metodo de equivalencia patrimonial|\bmep\b/.test(text)) return "cpc-18-investimento-em-coligada-controlada-e-empreendimento-controlado-em-conjunto-ecc-sec-02";
  if (/consolida|intercompany|upstream/.test(text)) return "cpc-36-demonstracoes-consolidadas-sec-04";
  if (/politica contabil|criterio na avaliacao de estoques/.test(text)) return "cpc-23-politicas-estimativas-contabeis-e-retificacao-de-erros-sec-01";
  if (/metodo de depreciacao|estimativa contabil/.test(text)) return "cpc-23-politicas-estimativas-contabeis-e-retificacao-de-erros-sec-02";
  if (/ajustes? de exercicios anteriores|retificacao de erros/.test(text)) return "cpc-23-politicas-estimativas-contabeis-e-retificacao-de-erros-sec-03";
  if (/ajuste acumulado de conversao|moeda estrangeira|taxa de fechamento/.test(text)) return "cpc-02-efeitos-das-mudancas-nas-taxas-de-cambio-e-conversao-de-dc-sec-03";
  if (/leaseback|retroarrendamento/.test(text)) return "cpc-06-operacoes-de-arrendamento-mercantil-sec-04";
  if (/arrendamento mercantil|leasing/.test(text)) return "cpc-06-operacoes-de-arrendamento-mercantil-sec-03";
  if (/propriedade.*investimento|\bpiv\b/.test(text)) return "cpc-28-propriedade-mantida-para-investimento-piv-sec-03";
  if (/mantido para venda|ancmv/.test(text)) return "cpc-31-ativo-nao-circulante-mantido-para-venda-sec-02";
  if (/instrumentos financeiros|vjora|destinados para negociacao/.test(text)) return "cpc-48-instrumentos-financeiros-sec-01";

  if (/acoes em tesouraria/.test(text)) return "lei-6-404-76-acoes-em-tesouraria-sec-03";
  if (/reserva legal|reservas de lucro/.test(text)) return "lei-6-404-76-reservas-de-lucro-sec-02";
  if (/reservas de capital|bonus de subscricao/.test(text)) return "lei-6-404-76-reservas-de-capital-sec-01";
  if (/dividendos|jscp/.test(text)) return "lei-6-404-76-dividendos-sec-02";
  if (/exercicio social|ativo diferido|ativo imobilizado compreende/.test(text)) return "ativo-e-criterios-de-avaliacao-do-ativo-sec-01";

  if (/dva|demonstracao do valor adicionado/.test(text)) return "cpc-26-demonstracoes-contabeis-sec-11";
  if (/fluxo de caixa|\bdfc\b|metodo indireto/.test(text)) return "cpc-26-demonstracoes-contabeis-sec-10";
  if (/dre|resultado abrangente|\bdra\b/.test(text)) return "cpc-26-demonstracoes-contabeis-sec-05";
  if (/balanco patrimonial|notas explicativas|continuidade|dlpa|dmpl/.test(text)) return "cpc-26-demonstracoes-contabeis-sec-02";

  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildAccountingFlashcards(sources) {
  return sources.flatMap(({ fileName, content }) => parseTwoColumnCsv(content).map((row, index) => ({
    sectionId: classifyAccountingFlashcard(row),
    flashcard: normalizeAttachedFlashcard(row),
    origin: `${fileName}:${index + 1}`,
  })));
}
