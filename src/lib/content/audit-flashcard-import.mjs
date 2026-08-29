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

export function classifyAuditFlashcard(row) {
  const text = normalize(`${row.question} ${row.answer}`);

  if (/auditoria interna|auditor interno|relatorio.*intern/.test(text)) return "auditoria-auditoria-interna-nbc-ti-01-sec-02";
  if (/ceticismo|confidencialidade|confidenciais|sigilo|registro no crc/.test(text)) return "requisitos-para-o-exercicio-da-auditoria-principios-eticos-sec-01";
  if (/consultoria|asseguracao/.test(text)) return "requisitos-para-o-exercicio-da-auditoria-principios-eticos-sec-03";
  if (/autorrevisao|auto-revisao|interesses? financeiro/.test(text)) return "independencia-sec-01";
  if (/responsavel tecnico|\brt\b/.test(text)) return "independencia-sec-02";
  if (/instrucao cvm|firma de auditoria.*10 anos|comite de auditoria estatutario/.test(text)) return "independencia-sec-03";
  if (/responsabilidade da administracao|acesso irrestrito/.test(text)) return "responsabilidade-do-auditor-e-da-administracao-sec-02";
  if (/objetivos gerais|identificar.*fraudes.*erros.*exaust/.test(text)) return "objetivos-gerais-do-auditor-independente-sec-01";
  if (/estrategia global|programa de auditoria|auditoria inicial|primeira auditoria|planejamento.*processo/.test(text)) return "auditoria-planejamento-da-auditoria-nbc-ta-300-sec-01";
  if (/materialidade/.test(text)) return "materialidade-e-relevancia-sec-01";
  if (/segregacao de funcoes|custo.*beneficio/.test(text)) return "controles-internos-sec-02";
  if (/deficiencias?.*controles? internos?|comunicacao.*controles? internos?/.test(text)) return "controles-internos-sec-03";
  if (/controle interno.*testes substantivos|testes substantivos.*controle interno|testes de observancia|testes de aderencia/.test(text)) return "tecnicas-e-procedimentos-de-auditoria-sec-01";
  if (/revisao.*controle de qualidade/.test(text)) return "supervisao-e-controle-de-qualidade-da-auditoria-das-dcs-sec-02";
  if (/risco de auditoria|risco de deteccao|risco inerente|risco insignificante/.test(text)) return "risco-de-auditoria-sec-01";
  if (/\berro\b.*\bfraude\b|fraude.*\berro\b/.test(text)) return "erro-e-fraude-nbc-ta-240-nbc-ti-01-sec-01";
  if (/fatores? de risco de fraude|frf|testes surpresa|visitas?.*anuncio/.test(text)) return "erro-e-fraude-nbc-ta-240-nbc-ti-01-sec-02";
  if (/comunic.*fraude|fraude.*comunic/.test(text)) return "erro-e-fraude-nbc-ta-240-nbc-ti-01-sec-03";
  if (/amostragem estatistica|tamanho da amostra|amostragem por blocos/.test(text)) return "amostragem-sec-02";
  if (/estratificacao/.test(text)) return "amostragem-sec-03";
  if (/anomalia.*amostra|projetar.*distorcao/.test(text)) return "amostragem-sec-04";
  if (/suficiencia.*evidencia|quantidade.*evidencias|maior quantidade.*evidencias/.test(text)) return "evidencias-de-auditoria-sec-01";
  if (/adequacao.*evidencia|qualidade.*evidencias|inspecao fisica/.test(text)) return "evidencias-de-auditoria-sec-02";
  if (/circularizacao|confirmacao externa|reexecucao|inspecao|revisao analitica|procedimentos analiticos/.test(text)) return "tecnicas-e-procedimentos-de-auditoria-sec-02";
  if (/papeis de trabalho.*permanente/.test(text)) return "documentacao-de-auditoria-papeis-de-trabalho-nbc-ta-230-sec-02";
  if (/propriedade.*papeis de trabalho|papeis de trabalho.*propriedade|alteracoes.*administrativ/.test(text)) return "documentacao-de-auditoria-papeis-de-trabalho-nbc-ta-230-sec-03";
  if (/arquivo final|60 dias|guardados.*5 anos/.test(text)) return "documentacao-de-auditoria-papeis-de-trabalho-nbc-ta-230-sec-04";
  if (/estimativa contabil.*desfecho|desfecho.*estimativa/.test(text)) return "estimativas-contabeis-nbc-ta-540-sec-03";
  if (/criterios.*metodologia.*estimativas/.test(text)) return "estimativas-contabeis-nbc-ta-540-sec-02";
  if (/eventos? subsequentes?|dupla data/.test(text)) return "eventos-subsequentes-nbc-ta-560-sec-02";
  if (/representacao formal|carta de responsabilidade/.test(text)) return "concordancia-com-os-termos-nbc-ta-210-sec-05";
  if (/especialista externo|mencao.*especialista/.test(text)) return "trabalho-de-especialistas-nbc-ta-620-sec-02";
  if (/trabalho da auditoria interna/.test(text)) return "trabalho-de-especialistas-nbc-ta-620-sec-04";
  if (/assistencia direta.*auditores internos/.test(text)) return "trabalho-de-especialistas-nbc-ta-620-sec-05";
  if (/partes relacionadas/.test(text)) return "transacoes-com-partes-relacionadas-nbc-ta-550-sec-02";
  if (/pericia contabil|termo de diligencia|viamceia/.test(text)) return "auditoria-pericia-contabil-apenas-itens-gerais-sec-02";
  if (/superavaliacao.*ativo|ativo.*superavaliacao|documento suporte.*razao|razao.*documento suporte/.test(text)) return "testes-em-areas-especificas-sec-01";
  if (/passivos.*pagos|omissao de receita/.test(text)) return "testes-em-areas-especificas-sec-03";
  if (/opiniao com ressalva|opiniao adversa|abstencao de opiniao/.test(text)) return "relatorio-de-auditoria-nbc-ta-700-701-705-e-706-sec-02";
  if (/base para.*opiniao|estrutura.*relatorio/.test(text)) return "relatorio-de-auditoria-nbc-ta-700-701-705-e-706-sec-04";
  if (/paragrafo de enfase/.test(text)) return "relatorio-de-auditoria-nbc-ta-700-701-705-e-706-sec-05";

  throw new Error(`Não foi possível classificar o flashcard: ${row.question}`);
}

export function buildAuditFlashcards(sources) {
  return sources.flatMap(({ fileName, content }) => parseTwoColumnCsv(content).map((row, index) => ({
    sectionId: classifyAuditFlashcard(row),
    flashcard: normalizeAttachedFlashcard(row),
    origin: `${fileName}:${index + 1}`,
  })));
}
