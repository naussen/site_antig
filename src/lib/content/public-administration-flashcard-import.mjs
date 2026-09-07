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

export function classifyPublicAdministrationFlashcard(row) {
  const text = normalize(`${row.question} ${row.answer}`);

  if (/modelo (?:patrimonial|burocratic)|consumerism|public service orientation|\bpso\b|autorreferenc/.test(text)) {
    return "modelos-teoricos-e-evolucao-da-adm-publica-no-brasil-sec-02";
  }
  if (/decreto-lei.*200|dl.*200|\bdasp\b|pdrae|plano diretor de reforma/.test(text)) {
    return "modelos-teoricos-e-evolucao-da-adm-publica-no-brasil-sec-03";
  }
  if (/governabilidade|governanca|ingovernabilidade|nao-governabilidade/.test(text)) {
    return "governabilidade-e-governanca-sec-01";
  }
  if (/accountability/.test(text)) return "transparencia-e-accountability-sec-10";
  if (/governo eletronico|\be-gov\b|\bg2[bg]\b|comprasnet/.test(text)) {
    if (/cege|software proprietario/.test(text)) return "governo-eletronico-sec-02";
    return "governo-eletronico-sec-01";
  }
  if (/lei complementar 131|lc 131|lei da transparencia|execucao orcamentaria|municipios?.*10\.000/.test(text)) {
    return "transparencia-e-accountability-sec-09";
  }
  if (/ultrassecret|\bsecretas?\b|classificad[ao].*sigilo/.test(text)) {
    return "transparencia-e-accountability-sec-04";
  }
  if (/vida privada|honra e imagem|informacoes pessoais/.test(text)) {
    return "transparencia-e-accountability-sec-05";
  }
  if (/extravio.*informacao|sindicancia/.test(text)) {
    return "transparencia-e-accountability-sec-07";
  }
  if (/recurso.*cgu|pedido.*acesso|justificar.*pedido|projetos? de pesquisa|lei 12\.527|\blai\b|publicidade.*regra|direitos humanos|entidades privadas sem fins lucrativos|compliance/.test(text)) {
    if (/recurso.*cgu|pedido.*acesso|justificar.*pedido/.test(text)) return "transparencia-e-accountability-sec-02";
    if (/direitos humanos|entidades privadas sem fins lucrativos/.test(text)) return "transparencia-e-accountability-sec-03";
    return "transparencia-e-accountability-sec-01";
  }
  if (/\bpolicy\b|\bpolitics\b/.test(text)) return "politicas-publicas-sec-04";
  if (/mixed-scanning|sondagem mista|agenda|incremental|ex-ante|efetividade|eficacia|top-down|fluxos multiplos|tipologia de lowi|implementacao/.test(text)) {
    return "politicas-publicas-sec-02";
  }
  if (/planejamento estrategico|planejamento tatico|planejamento operacional/.test(text)) {
    return "processo-de-planejamento-sec-01";
  }
  if (/departamentalizacao|estrutura organizacional.*(?:matricial|linear)|estrutura (?:matricial|linear)/.test(text)) {
    if (/departamentalizacao/.test(text)) return "processo-de-organizacao-sec-02";
    return "processo-de-organizacao-sec-01";
  }
  if (/avaliacao de desempenho|360 graus/.test(text)) return "gestao-de-pessoas-sec-01";
  if (/efeito halo/.test(text)) return "gestao-de-pessoas-sec-04";
  if (/teoria erc|alderfer|\bmaslow\b/.test(text)) return "comportamento-organizacional-sec-02";
  if (/herzberg|teoria x|teoria y|expectacao de vroom|\bvroom\b|\btaylor\b|teoria cientifica|teoria burocratica|max weber|homo social|homo organizacional/.test(text)) {
    return "teorias-administrativas-sec-02";
  }
  if (/planejamento e organizacao|funcao administrativa|\bpodc\b|funcao.*controle|processo de controle|controle administrativo|\bfayol\b/.test(text)) {
    return "processo-organizacional-e-funcoes-administrativas-sec-02";
  }

  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildPublicAdministrationFlashcards(sources) {
  return sources.flatMap(({ fileName, content }) => parseTwoColumnCsv(content).map((row, index) => ({
    sectionId: classifyPublicAdministrationFlashcard(row),
    flashcard: normalizeAttachedFlashcard(row),
    origin: `${fileName}:${index + 1}`,
  })));
}
