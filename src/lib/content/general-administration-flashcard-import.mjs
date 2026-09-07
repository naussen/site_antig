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

export function classifyGeneralAdministrationFlashcard(row) {
  const text = normalize(`${row.question} ${row.answer}`);

  if (/modelo humanistico|modelo classico/.test(text)) {
    return "teorias-da-administracao-e-das-organizacoes-sec-01";
  }
  if (/teoria burocratica|teoria cientifica|\btaylor\b|teoria comportamental|teoria x|teoria y|homem administrativo|homo economicus|homo social|\bweber\b/.test(text)) {
    return "teorias-da-administracao-e-das-organizacoes-sec-02";
  }
  if (/processo (?:organizacional|administrativo)|funcoes administrativas.*(?:isolad|sistemic|interativ)|\bpodc\b/.test(text)) {
    return "processo-organizacional-processo-adm-funcoes-administrativas-sec-01";
  }
  if (/\bfayol\b|previsao.*organizacao.*comando/.test(text)) {
    return "processo-organizacional-processo-adm-funcoes-administrativas-sec-02";
  }
  if (/funcao administrativa de organizacao|delegacao.*descentralizacao/.test(text)) {
    return "processo-organizacional-processo-adm-funcoes-administrativas-sec-03";
  }
  if (/funcao.*controle|processo de controle/.test(text)) {
    return "processo-organizacional-processo-adm-funcoes-administrativas-sec-04";
  }
  if (/matriz swot|\bswot\b/.test(text)) return "planejamento-sec-05";
  if (/matriz gut|\bgut\b/.test(text)) return "planejamento-sec-06";
  if (/cenario.*(?:projetivo|prospectivo)|planejamento por cenarios/.test(text)) return "planejamento-sec-07";
  if (/planejamento estrategico situacional|\bpes\b|carlos matus/.test(text)) return "planejamento-sec-01";
  if (/planejamento (?:tatico|estrategico|operacional)|nivel (?:tatico|estrategico|operacional)|niveis de planejamento/.test(text)) return "planejamento-sec-02";
  if (/balanced scorecard|\bbsc\b/.test(text)) return "planejamento-sec-01";
  if (/departamentalizacao/.test(text)) return "organizacao-sec-03";
  if (/estrutura (?:matricial|linear|linha[- ]staff)|tipo linha[- ]staff|unidade de comando|chefe.*generalista/.test(text)) return "organizacao-sec-02";
  if (/amplitude de controle|estrutura.*(?:organica|mecanica)|especializacao (?:horizontal|vertical)|processo escalar/.test(text)) return "organizacao-sec-01";
  if (/herzberg/.test(text)) return "direcao-sec-03";
  if (/equidade de adams|\badams\b|expectacao|\bvroom\b/.test(text)) return "direcao-sec-04";
  if (/lideranca|lideres? /.test(text)) return "direcao-sec-06";
  if (/ruido|redundancia|feedback/.test(text)) return "comunicacao-sec-01";
  if (/canais? .*pobres?/.test(text)) return "comunicacao-sec-02";
  if (/comunicacao (?:ascendente|transversal)|fluxo de comunicacao/.test(text)) return "comunicacao-sec-04";
  if (/filtragem|percepcao seletiva/.test(text)) return "comunicacao-sec-06";
  if (/efeito halo/.test(text)) return "gestao-do-desempenho-sec-04";
  if (/avaliacao de desempenho.*360|360[ºo]/.test(text)) return "gestao-do-desempenho-sec-02";
  if (/avaliacao de desempenho/.test(text)) return "gestao-do-desempenho-sec-02";
  if (/reengenharia/.test(text)) return "gestao-por-processos-sec-09";
  if (/processos? (?:primarios|de suporte)|gestao por processos|gestao de processos/.test(text)) return "gestao-por-processos-sec-02";
  if (/\bas is\b|modelagem de processos/.test(text)) return "gestao-por-processos-sec-07";
  if (/estrutura analitica do projeto|\beap\b|\bwbs\b|grupos? de processos/.test(text)) return "gestao-de-projetos-sec-02";
  if (/ciclo de vida.*projeto|riscos?.*incertezas|custos acumulados/.test(text)) return "gestao-de-projetos-sec-03";
  if (/fast tracking|paralelismo|triangulo das restricoes/.test(text)) return "gestao-de-projetos-sec-05";
  if (/\bprojeto\b|\boperacao\b|\bpmbok\b/.test(text)) return "gestao-de-projetos-sec-01";
  if (/nova gestao publica|modelo gerencial|gestao para resultados/.test(text)) return "controle-e-avaliacao-sec-01";
  if (/deming|metas numericas|slogans?/.test(text)) return "gestao-da-qualidade-sec-02";
  if (/\bpdca\b|fase ['"]?(?:act|check)/.test(text)) return "gestao-da-qualidade-sec-03";
  if (/pareto|ishikawa|espinha de peixe/.test(text)) return "gestao-da-qualidade-sec-04";
  if (/efetividade|eficiencia|eficacia/.test(text)) return "controle-e-avaliacao-sec-02";

  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildGeneralAdministrationFlashcards(sources) {
  return sources.flatMap(({ fileName, content }) => parseTwoColumnCsv(content).map((row, index) => ({
    sectionId: classifyGeneralAdministrationFlashcard(row),
    flashcard: normalizeAttachedFlashcard(row),
    origin: `${fileName}:${index + 1}`,
  })));
}
