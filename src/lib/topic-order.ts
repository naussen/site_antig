const TOPIC_ORDER_BY_DISCIPLINE: Record<string, readonly string[]> = {
  "Direito Administrativo": [
    "conceitos-introdutorios-do-direito-administrativo",
    "disposicoes-gerais",
    "deveres",
    "conceitos",
    "desconcentracao-administracao-direta-orgaos",
    "criterio-de-servico-publico-doutrinario",
    "civil",
    "classificacoes-do-controle",
    "disposicoes-gerais-art-1",
    "classificacao-dos-bens-publicos",
    "intervencao-restritiva",
    "abrangencia-arts-1-e-2",
    "conceito-e-especies",
    "abrangencia",
    "definicoes",
    "objetivos-e-caracteristicas",
    "clausulas-necessarias-art-55",
    "aplicacao-da-lei-14-133-21",
    "improbidade-administrativa",
  ],
  "Direito Constitucional": [
    "aspectos-introdutorios-do-direito-constitucional",
    "principios-fundamentais",
    "direitos-e-garantias-fundamentais",
    "organizacao-do-estado",
    "intervencao",
    "administracao-publica",
    "poder-legislativo",
    "processo-legislativo",
    "fiscalizacao-contabil-financeira-orcamentaria",
    "poder-executivo",
    "poder-judiciario",
    "funcoes-essenciais-a-justica",
    "defesa-do-estado-e-das-instituicoes-democraticas",
    "ordem-social",
    "controle-de-constitucionalidade",
  ],
};

const TOPIC_ORDER_LOOKUP = Object.fromEntries(
  Object.entries(TOPIC_ORDER_BY_DISCIPLINE).map(([discipline, topicIds]) => [
    discipline,
    new Map(topicIds.map((topicId, index) => [topicId, index])),
  ])
) as Record<string, ReadonlyMap<string, number>>;

export function getPedagogicalTopicOrder(
  discipline: string | null | undefined,
  topicId: string
) {
  return TOPIC_ORDER_LOOKUP[discipline ?? ""]?.get(topicId) ?? null;
}

interface OrderableTopic {
  topic_id: string;
  title: string;
  sort_order: number | null;
}

export function compareTopicsByOrigin(
  discipline: string | null | undefined,
  left: OrderableTopic,
  right: OrderableTopic
) {
  const leftFallback = getPedagogicalTopicOrder(discipline, left.topic_id);
  const rightFallback = getPedagogicalTopicOrder(discipline, right.topic_id);
  const leftOrder = left.sort_order ?? (leftFallback === null ? null : leftFallback + 1);
  const rightOrder =
    right.sort_order ?? (rightFallback === null ? null : rightFallback + 1);

  if (leftOrder !== null || rightOrder !== null) {
    const difference =
      (leftOrder ?? Number.MAX_SAFE_INTEGER) -
      (rightOrder ?? Number.MAX_SAFE_INTEGER);
    if (difference !== 0) return difference;
  }

  const titleDifference = left.title.localeCompare(right.title, "pt-BR");
  return titleDifference || left.topic_id.localeCompare(right.topic_id, "pt-BR");
}
