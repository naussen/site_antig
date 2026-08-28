const TOPIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_FRAGMENTED_WORD_LENGTH = 4;
const ENCODING_ARTIFACT_PATTERN = /[ÃÂ]|â[\u0080-\u00BF]/;

export const TOPIC_ID_REDIRECTS = Object.freeze([
  ["am-ost-rag-em", "amostragem"],
  ["au-dit-oria-int-ern-a-n-b-c-ti-01", "auditoria-auditoria-interna-nbc-ti-01"],
  ["co-n-co-rdan-cia-co-m-os-te-rm-os-n-b-c-ta-2-10", "concordancia-com-os-termos-nbc-ta-210"],
  ["co-ntroles-inte-rn-os", "controles-internos"],
  ["do-cum-ent-acao-de-au-di-to-ria-p-apei-s-de-t-rab-alho-n-b-c-t-a-230", "documentacao-de-auditoria-papeis-de-trabalho-nbc-ta-230"],
  ["erro-e-frau-de-n-b-c-t-a-240-ti-01", "erro-e-fraude-nbc-ta-240-nbc-ti-01"],
  ["esti-mat-ivas-co-nt-ab-eis-n-b-c-t-a-5-40", "estimativas-contabeis-nbc-ta-540"],
  ["eve-ntos-sub-se-qu-ente-s-nb-c-t-a-56-0", "eventos-subsequentes-nbc-ta-560"],
  ["evi-de-n-ci-as-de-au-dit-oria", "evidencias-de-auditoria"],
  ["indep-en-den-ci-a", "independencia"],
  ["mat-eriali-dade-e-re-lev-an-cia", "materialidade-e-relevancia"],
  ["obje-tivo-s-ge-rais-do-au-dito-r-i-n-de-p-en-de-nte", "objetivos-gerais-do-auditor-independente"],
  ["pe-ri-ci-a-co-ntabi-l-ap-en-as-it-ens-ge-rais", "auditoria-pericia-contabil-apenas-itens-gerais"],
  ["plan-ejame-nto-da-au-dit-oria-nb-c-ta-300", "auditoria-planejamento-da-auditoria-nbc-ta-300"],
  ["re-quisi-tos-p-ara-o-ex-erci-cio-da-au-ditoria-prin-ci-pios-eti-cos-1-integridade-honestidade", "requisitos-para-o-exercicio-da-auditoria-principios-eticos"],
  ["res-pon-sabili-dade-do-au-dit-or-e-da-admi-nist-racao", "responsabilidade-do-auditor-e-da-administracao"],
  ["ris-co-de-au-dito-ri-a", "risco-de-auditoria"],
  ["sup-erv-isao-e-con-tro-le-de-qu-ali-dade-da-au-dito-ri-a-das-dcs", "supervisao-e-controle-de-qualidade-da-auditoria-das-dcs"],
  ["te-cni-cas-p-ro-ce-dimen-tos-de-au-di-t-ori-a", "tecnicas-e-procedimentos-de-auditoria"],
  ["test-es-e-m-are-as-e-spe-ci-fi-cas", "testes-em-areas-especificas"],
  ["trans-acao-co-m-p-art-es-re-lacio-nadas-n-b-c-t-a-5-50", "transacoes-com-partes-relacionadas-nbc-ta-550"],
  ["cu-stei-o-a-bc-a-cti-vi-ty-ba-sed-co-sti-n-g", "custeio-abc-activity-based-costing"],
  ["cu-stei-o-di-r-eto-ou-va-r-i-av-el", "custeio-direto-ou-variavel"],
  ["cu-stei-o-p-o-r-a-bso-r-ca-o", "custeio-por-absorcao"],
  ["cu-sto-p-a-d-ra-o", "custo-padrao"],
  ["d-ef-in-i-co-es-e-ti-p-o-s-d-e-g-a-sto-s", "definicoes-e-tipos-de-gastos"],
  ["d-ep-a-r-ta-m-en-ta-li-za-ca-o", "departamentalizacao"],
  ["mar-g-em-d-e-co-n-tri-bu-i-cao", "margem-de-contribuicao"],
  ["p-o-n-to-d-e-eq-ui-l-i-bri-o", "ponto-de-equilibrio"],
  ["p-r-o-du-ca-o-co-n-ju-n-ta", "producao-conjunta"],
].map(([oldTopicId, newTopicId]) => Object.freeze({ oldTopicId, newTopicId })));

export function slugifyTopicId(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTopicIdIssue(topicId, topicTitle) {
  const normalizedId = String(topicId ?? "").trim();

  if (!TOPIC_ID_PATTERN.test(normalizedId)) {
    return "topic_id deve usar somente letras minúsculas, números e hífens simples.";
  }

  const canonicalTitleId = slugifyTopicId(topicTitle);
  if (!canonicalTitleId || ENCODING_ARTIFACT_PATTERN.test(String(topicTitle))) {
    return null;
  }

  const idSegments = new Set(normalizedId.split("-"));
  const compactId = normalizedId.replaceAll("-", "");
  const fragmentedWords = canonicalTitleId
    .split("-")
    .filter((word) => (
      word.length >= MIN_FRAGMENTED_WORD_LENGTH
      && compactId.includes(word)
      && !idSegments.has(word)
    ));

  if (fragmentedWords.length > 0) {
    return `topic_id fragmenta palavras do título: ${fragmentedWords.join(", ")}.`;
  }

  return null;
}
