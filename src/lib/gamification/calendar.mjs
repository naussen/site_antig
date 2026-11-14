import {
  DEFAULT_TARGET_DAYS,
  DEFAULT_TIMEZONE_IANA,
  MAX_TARGET_DAYS,
  MIN_TARGET_DAYS,
} from "./config.mjs";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const IANA_ZONE_PATTERN = /^[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)*$/;
const WEEKDAY_SHORT_LABELS = Object.freeze([
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
]);

/**
 * Converte entrada em Date válido ou lança erro explícito.
 * @param {Date | string | number} instantInput
 * @returns {Date}
 */
export function parseValidInstant(instantInput) {
  const date = instantInput instanceof Date ? new Date(instantInput.getTime()) : new Date(instantInput);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Instante temporal inválido.");
  }
  return date;
}

/**
 * Valida se o identificador de fuso horário IANA é aceito pelo runtime Intl.
 * @param {unknown} timeZone
 * @returns {timeZone is string}
 */
export function isValidIanaTimeZone(timeZone) {
  if (typeof timeZone !== "string") return false;
  const trimmed = timeZone.trim();
  if (!trimmed || trimmed.length > 64 || !IANA_ZONE_PATTERN.test(trimmed)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza e valida um fuso horário IANA, usando America/Sao_Paulo apenas quando omitido.
 * @param {string | null | undefined} timeZone
 * @returns {string}
 */
export function normalizeIanaTimeZone(timeZone) {
  if (timeZone === undefined || timeZone === null || timeZone === "") {
    return DEFAULT_TIMEZONE_IANA;
  }
  const trimmed = String(timeZone).trim();
  if (!isValidIanaTimeZone(trimmed)) {
    throw new Error("Fuso horário IANA inválido.");
  }
  return trimmed;
}

/**
 * Valida meta semanal inteira entre 1 e 7 dias.
 * @param {unknown} targetDays
 * @returns {number}
 */
export function normalizeTargetDays(targetDays) {
  const parsed = Number(targetDays);
  if (!Number.isInteger(parsed) || parsed < MIN_TARGET_DAYS || parsed > MAX_TARGET_DAYS) {
    throw new Error(`A meta semanal deve estar entre ${MIN_TARGET_DAYS} e ${MAX_TARGET_DAYS} dias.`);
  }
  return parsed;
}

/**
 * Soma dias civis a uma data YYYY-MM-DD sem depender do fuso local do processo.
 * @param {string} isoDate
 * @param {number} deltaDays
 * @returns {string}
 */
export function addCalendarDays(isoDate, deltaDays) {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) {
    throw new Error("Data ISO inválida (esperado YYYY-MM-DD).");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() + 1 !== month
    || check.getUTCDate() !== day
  ) {
    throw new Error("Data civil inexistente.");
  }
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = String(shifted.getUTCFullYear()).padStart(4, "0");
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Extrai ano, mês, dia, hora e dia da semana (0 = segunda, 6 = domingo) no fuso IANA.
 * @param {Date | string | number} instantInput
 * @param {string} [timeZone]
 */
export function getLocalDateParts(instantInput, timeZone = DEFAULT_TIMEZONE_IANA) {
  const date = parseValidInstant(instantInput);
  const safeZone = normalizeIanaTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: safeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const partMap = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  const hour = partMap.hour;
  const minute = partMap.minute;
  const second = partMap.second;
  const localDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const weekdayMondayZero = (utcDay + 6) % 7;

  return {
    year,
    month,
    day,
    localDate,
    hour,
    minute,
    second,
    weekdayMondayZero,
    isMonday: weekdayMondayZero === 0,
    timeZone: safeZone,
  };
}

/**
 * Calcula os limites da semana (segunda 00h até segunda seguinte 00h) no fuso IANA.
 * @param {Date | string | number} instantInput
 * @param {string} [timeZone]
 */
export function getWeekBoundsForInstant(instantInput, timeZone = DEFAULT_TIMEZONE_IANA) {
  const parts = getLocalDateParts(instantInput, timeZone);
  const weekStartDate = addCalendarDays(parts.localDate, -parts.weekdayMondayZero);
  const weekEndDate = addCalendarDays(weekStartDate, 6);
  const nextWeekStartDate = addCalendarDays(weekStartDate, 7);

  return {
    localDate: parts.localDate,
    weekStartDate,
    weekEndDate,
    nextWeekStartDate,
    weekdayMondayZero: parts.weekdayMondayZero,
    isPartialStart: parts.weekdayMondayZero > 0,
    timeZone: parts.timeZone,
  };
}

/**
 * Formata uma data ISO YYYY-MM-DD para exibição curta em pt-BR (ex: 16/11).
 * @param {string} isoDate
 * @returns {string}
 */
export function formatIsoDatePtBr(isoDate) {
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Resolve o plano semanal efetivo para o instante atual, respeitando congelamento
 * da semana vigente e promoção de alterações agendadas para a próxima segunda-feira.
 * @param {{
 *   preferences?: {
 *     target_days?: number;
 *     timezone_iana?: string;
 *     pending_target_days?: number | null;
 *     pending_timezone_iana?: string | null;
 *     pending_effective_week_start?: string | null;
 *     onboarding_completed_at?: string | null;
 *   } | null;
 *   existingPlanForCurrentWeek?: {
 *     id?: string;
 *     week_start_date: string;
 *     week_end_date: string;
 *     target_days: number;
 *     timezone_iana: string;
 *     is_partial_first_week?: boolean;
 *   } | null;
 *   hasPriorWeeklyPlans?: boolean;
 *   nowUtc?: Date | string | number;
 * }} input
 */
export function resolveEffectiveWeeklyPlan(input) {
  const {
    preferences = null,
    existingPlanForCurrentWeek = null,
    hasPriorWeeklyPlans = false,
    nowUtc = new Date(),
  } = input ?? {};

  const instant = parseValidInstant(nowUtc);

  if (existingPlanForCurrentWeek) {
    const bounds = getWeekBoundsForInstant(instant, existingPlanForCurrentWeek.timezone_iana);
    return {
      planId: existingPlanForCurrentWeek.id ?? null,
      weekStartDate: existingPlanForCurrentWeek.week_start_date,
      weekEndDate: existingPlanForCurrentWeek.week_end_date,
      nextWeekStartDate: addCalendarDays(existingPlanForCurrentWeek.week_start_date, 7),
      localDate: bounds.localDate,
      targetDays: existingPlanForCurrentWeek.target_days,
      timezoneIana: existingPlanForCurrentWeek.timezone_iana,
      isPartialFirstWeek: Boolean(existingPlanForCurrentWeek.is_partial_first_week),
      needsOnboarding: !preferences?.onboarding_completed_at,
      shouldPersistPlan: false,
      shouldPromotePending: false,
    };
  }

  const baseTimezone = normalizeIanaTimeZone(preferences?.timezone_iana);
  const baseTargetDays = preferences?.target_days
    ? normalizeTargetDays(preferences.target_days)
    : DEFAULT_TARGET_DAYS;
  const baseBounds = getWeekBoundsForInstant(instant, baseTimezone);

  if (!preferences?.onboarding_completed_at) {
    return {
      planId: null,
      weekStartDate: baseBounds.weekStartDate,
      weekEndDate: baseBounds.weekEndDate,
      nextWeekStartDate: baseBounds.nextWeekStartDate,
      localDate: baseBounds.localDate,
      targetDays: baseTargetDays,
      timezoneIana: baseTimezone,
      isPartialFirstWeek: baseBounds.isPartialStart,
      needsOnboarding: true,
      shouldPersistPlan: false,
      shouldPromotePending: false,
    };
  }

  const pendingEffectiveWeekStart = preferences.pending_effective_week_start ?? null;
  let effectiveTimezone = baseTimezone;
  let effectiveTargetDays = baseTargetDays;
  let effectiveBounds = baseBounds;
  let shouldPromotePending = false;

  if (pendingEffectiveWeekStart && baseBounds.weekStartDate >= pendingEffectiveWeekStart) {
    const candidateTimezone = preferences.pending_timezone_iana
      ? normalizeIanaTimeZone(preferences.pending_timezone_iana)
      : baseTimezone;
    const candidateBounds = getWeekBoundsForInstant(instant, candidateTimezone);

    // Só promove a troca de fuso quando ambos os fusos já entraram na semana alvo,
    // evitando que o dia de conclusão volte retroativamente para a semana anterior.
    if (candidateBounds.weekStartDate >= pendingEffectiveWeekStart) {
      effectiveTimezone = candidateTimezone;
      effectiveTargetDays = preferences.pending_target_days
        ? normalizeTargetDays(preferences.pending_target_days)
        : baseTargetDays;
      effectiveBounds = candidateBounds;
      shouldPromotePending = true;
    }
  }

  return {
    planId: null,
    weekStartDate: effectiveBounds.weekStartDate,
    weekEndDate: effectiveBounds.weekEndDate,
    nextWeekStartDate: effectiveBounds.nextWeekStartDate,
    localDate: effectiveBounds.localDate,
    targetDays: effectiveTargetDays,
    timezoneIana: effectiveTimezone,
    isPartialFirstWeek: !hasPriorWeeklyPlans && effectiveBounds.isPartialStart,
    needsOnboarding: false,
    shouldPersistPlan: true,
    shouldPromotePending,
  };
}

/**
 * Planeja uma atualização de preferência de rotina:
 * - No primeiro acesso (onboarding), aplica imediatamente na semana corrente.
 * - Após ativação, preserva a semana atual congelada e agenda troca de meta/fuso
 *   exclusivamente para a próxima segunda-feira.
 * @param {{
 *   currentPreferences?: {
 *     target_days?: number;
 *     timezone_iana?: string;
 *     pending_target_days?: number | null;
 *     pending_timezone_iana?: string | null;
 *     pending_effective_week_start?: string | null;
 *     onboarding_completed_at?: string | null;
 *   } | null;
 *   currentWeeklyPlan?: {
 *     id?: string;
 *     week_start_date: string;
 *     week_end_date: string;
 *     target_days: number;
 *     timezone_iana: string;
 *     is_partial_first_week?: boolean;
 *   } | null;
 *   nextTargetDays?: number;
 *   nextTimezoneIana?: string;
 *   nowUtc?: Date | string | number;
 * }} input
 */
export function planPreferenceUpdate(input) {
  const {
    currentPreferences = null,
    currentWeeklyPlan = null,
    nextTargetDays,
    nextTimezoneIana,
    nowUtc = new Date(),
  } = input ?? {};

  const instant = parseValidInstant(nowUtc);
  const currentTimezone = normalizeIanaTimeZone(
    currentWeeklyPlan?.timezone_iana ?? currentPreferences?.timezone_iana,
  );
  const currentTargetDays = currentWeeklyPlan?.target_days
    ?? (currentPreferences?.target_days ? normalizeTargetDays(currentPreferences.target_days) : DEFAULT_TARGET_DAYS);

  const normalizedTargetDays = nextTargetDays !== undefined
    ? normalizeTargetDays(nextTargetDays)
    : currentTargetDays;
  const normalizedTimezone = nextTimezoneIana !== undefined
    ? normalizeIanaTimeZone(nextTimezoneIana)
    : currentTimezone;

  const isFirstActivation = !currentPreferences?.onboarding_completed_at && !currentWeeklyPlan;

  if (isFirstActivation) {
    const bounds = getWeekBoundsForInstant(instant, normalizedTimezone);
    return {
      isFirstActivation: true,
      effectiveImmediately: true,
      effectiveWeekStartDate: bounds.weekStartDate,
      weekEndDate: bounds.weekEndDate,
      isPartialFirstWeek: bounds.isPartialStart,
      appliedTargetDays: normalizedTargetDays,
      appliedTimezoneIana: normalizedTimezone,
      pendingTargetDays: null,
      pendingTimezoneIana: null,
      pendingEffectiveWeekStart: null,
      onboardingCompletedAt: instant.toISOString(),
    };
  }

  const currentBounds = getWeekBoundsForInstant(instant, currentTimezone);
  const targetChanged = normalizedTargetDays !== currentTargetDays;
  const timezoneChanged = normalizedTimezone !== currentTimezone;

  if (!targetChanged && !timezoneChanged) {
    return {
      isFirstActivation: false,
      effectiveImmediately: true,
      effectiveWeekStartDate: currentWeeklyPlan?.week_start_date ?? currentBounds.weekStartDate,
      weekEndDate: currentWeeklyPlan?.week_end_date ?? currentBounds.weekEndDate,
      isPartialFirstWeek: Boolean(currentWeeklyPlan?.is_partial_first_week),
      appliedTargetDays: currentTargetDays,
      appliedTimezoneIana: currentTimezone,
      pendingTargetDays: null,
      pendingTimezoneIana: null,
      pendingEffectiveWeekStart: null,
      onboardingCompletedAt: currentPreferences?.onboarding_completed_at ?? instant.toISOString(),
    };
  }

  return {
    isFirstActivation: false,
    effectiveImmediately: false,
    effectiveWeekStartDate: currentBounds.nextWeekStartDate,
    weekEndDate: currentWeeklyPlan?.week_end_date ?? currentBounds.weekEndDate,
    isPartialFirstWeek: Boolean(currentWeeklyPlan?.is_partial_first_week),
    appliedTargetDays: currentTargetDays,
    appliedTimezoneIana: currentTimezone,
    pendingTargetDays: targetChanged ? normalizedTargetDays : null,
    pendingTimezoneIana: timezoneChanged ? normalizedTimezone : null,
    pendingEffectiveWeekStart: currentBounds.nextWeekStartDate,
    onboardingCompletedAt: currentPreferences?.onboarding_completed_at ?? instant.toISOString(),
  };
}

/**
 * Gera uma prévia legível da mudança de fuso horário sem deslocar histórico.
 * @param {{
 *   currentTimezoneIana?: string;
 *   nextTimezoneIana: string;
 *   nowUtc?: Date | string | number;
 * }} input
 */
export function previewTimezoneChange(input) {
  const instant = parseValidInstant(input?.nowUtc ?? new Date());
  const currentTimezoneIana = normalizeIanaTimeZone(input?.currentTimezoneIana);
  const nextTimezoneIana = normalizeIanaTimeZone(input?.nextTimezoneIana);

  const currentParts = getLocalDateParts(instant, currentTimezoneIana);
  const nextParts = getLocalDateParts(instant, nextTimezoneIana);
  const currentBounds = getWeekBoundsForInstant(instant, currentTimezoneIana);

  const formatHm = (parts) =>
    `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;

  return {
    currentTimezoneIana,
    nextTimezoneIana,
    currentLocalDate: currentParts.localDate,
    currentLocalTime: formatHm(currentParts),
    nextLocalDate: nextParts.localDate,
    nextLocalTime: formatHm(nextParts),
    effectiveWeekStartDate: currentBounds.nextWeekStartDate,
    preservesHistory: true,
  };
}

/**
 * Deriva o resumo de progresso semanal exclusivamente a partir das sessões válidas concluídas.
 * Um dia conta no máximo 1 vez, mesmo quando há múltiplas sessões concluídas no mesmo dia.
 * @param {{
 *   weekStartDate: string;
 *   weekEndDate: string;
 *   targetDays: number;
 *   timezoneIana: string;
 *   isPartialFirstWeek?: boolean;
 *   sessions: Array<{
 *     status: string;
 *     completed_local_date?: string | null;
 *     completed_week_start_date?: string | null;
 *   }>;
 * }} input
 */
export function summarizeWeeklyProgress(input) {
  const targetDays = normalizeTargetDays(input.targetDays);
  const { weekStartDate, weekEndDate, timezoneIana, isPartialFirstWeek = false, sessions = [] } = input;

  const countsByDate = new Map();
  let totalCompletedSessionsInWeek = 0;

  for (const session of sessions) {
    if (session?.status !== "completed" || !session.completed_local_date) continue;
    const localDate = session.completed_local_date;
    const matchesWeek = session.completed_week_start_date
      ? session.completed_week_start_date === weekStartDate
      : (localDate >= weekStartDate && localDate <= weekEndDate);

    if (!matchesWeek) continue;
    totalCompletedSessionsInWeek += 1;
    countsByDate.set(localDate, (countsByDate.get(localDate) ?? 0) + 1);
  }

  const daysOfWeek = WEEKDAY_SHORT_LABELS.map((label, index) => {
    const date = addCalendarDays(weekStartDate, index);
    const sessionsCount = countsByDate.get(date) ?? 0;
    return {
      date,
      label,
      completed: sessionsCount > 0,
      sessionsCount,
    };
  });

  const completedDates = daysOfWeek.filter((day) => day.completed).map((day) => day.date);
  const completedDaysCount = completedDates.length;
  const remainingDaysCount = Math.max(0, targetDays - completedDaysCount);

  return {
    weekStartDate,
    weekEndDate,
    timezoneIana,
    targetDays,
    completedDaysCount,
    remainingDaysCount,
    goalReached: completedDaysCount >= targetDays,
    totalCompletedSessionsInWeek,
    isPartialFirstWeek: Boolean(isPartialFirstWeek),
    completedDates,
    daysOfWeek,
  };
}
