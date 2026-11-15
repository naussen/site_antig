export const DEFAULT_TIMEZONE_IANA = "America/Sao_Paulo";

export const SUPPORTED_TIMEZONE_OPTIONS = Object.freeze([
  { value: "America/Sao_Paulo", label: "Brasília / São Paulo (America/Sao_Paulo)" },
  { value: "America/Manaus", label: "Manaus (America/Manaus)" },
  { value: "America/Cuiaba", label: "Cuiabá (America/Cuiaba)" },
  { value: "America/Belem", label: "Belém (America/Belem)" },
  { value: "America/Fortaleza", label: "Fortaleza (America/Fortaleza)" },
  { value: "America/Recife", label: "Recife (America/Recife)" },
  { value: "America/Bahia", label: "Salvador / Bahia (America/Bahia)" },
  { value: "America/Campo_Grande", label: "Campo Grande (America/Campo_Grande)" },
  { value: "America/Porto_Velho", label: "Porto Velho (America/Porto_Velho)" },
  { value: "America/Boa_Vista", label: "Boa Vista (America/Boa_Vista)" },
  { value: "America/Rio_Branco", label: "Rio Branco (America/Rio_Branco)" },
  { value: "America/Noronha", label: "Fernando de Noronha (America/Noronha)" },
  { value: "UTC", label: "UTC (Tempo Universal Coordenado)" },
  { value: "Europe/Lisbon", label: "Lisboa (Europe/Lisbon)" },
]);

export const BUDGET_MINUTES_OPTIONS = Object.freeze([5, 15, 30]);
export const DEFAULT_BUDGET_MINUTES = 15;

export const MIN_TARGET_DAYS = 1;
export const MAX_TARGET_DAYS = 7;
export const DEFAULT_TARGET_DAYS = 3;

export const SESSION_STATUSES = Object.freeze([
  "planned",
  "in_progress",
  "interrupted",
  "completed",
  "discarded",
]);

export const ACTIVE_SESSION_STATUSES = Object.freeze([
  "planned",
  "in_progress",
  "interrupted",
]);

export const ACTIVITY_TYPES = Object.freeze([
  "summary",
  "law",
  "question",
  "flashcard",
]);

export const ACTIVITY_STATUSES = Object.freeze([
  "pending",
  "completed",
  "skipped",
  "unavailable",
]);

export const SELECTION_MODES = Object.freeze([
  "recommended",
  "manual",
  "resumed",
]);

/**
 * Rollback operacional: permite desativar a interface de gamificação via variável
 * de ambiente sem remover dados históricos nem tabelas do banco.
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function isGamificationOperationalEnabled(env = process.env) {
  return env?.NEXT_PUBLIC_DISABLE_GAMIFICATION !== "true";
}
