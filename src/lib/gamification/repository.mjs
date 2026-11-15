import { DEFAULT_TARGET_DAYS, DEFAULT_TIMEZONE_IANA } from "./config.mjs";
import { getWeekBoundsForInstant } from "./calendar.mjs";
import { RoutineDomainError } from "./session.mjs";

const ROUTINE_TABLES = [
  "user_study_routine_preferences",
  "study_routine_weekly_plans",
  "study_routine_sessions",
  "study_routine_session_activities",
];

const ROUTINE_RPC_NAMES = [
  "ensure_study_routine_weekly_plan",
  "save_study_routine_preferences",
  "create_study_routine_session",
  "update_study_routine_session_status",
  "replace_study_routine_session_activity",
  "complete_study_routine_session",
];

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);
const MISSING_FUNCTION_CODES = new Set(["42883", "PGRST202"]);

export class RoutineSchemaUnavailableError extends Error {
  /**
   * @param {string} [code]
   */
  constructor(code = "SCHEMA_UNAVAILABLE") {
    super("A persistência da rotina semanal ainda não está disponível neste ambiente.");
    this.name = "RoutineSchemaUnavailableError";
    this.code = code;
  }
}

/**
 * @param {unknown} error
 * @returns {{ code?: string; message?: string } | null}
 */
export function getRoutineErrorLike(error) {
  if (!error || typeof error !== "object") return null;
  const record = /** @type {Record<string, unknown>} */ (error);
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getSafeRoutineErrorCode(error) {
  const err = getRoutineErrorLike(error);
  return err?.code ?? "unknown";
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRoutineSchemaError(error) {
  if (error instanceof RoutineSchemaUnavailableError) return true;
  const err = getRoutineErrorLike(error);
  if (!err) return false;

  const message = (err.message ?? "").toLowerCase();

  if (err.code && MISSING_TABLE_CODES.has(err.code)) {
    return true;
  }

  for (const table of ROUTINE_TABLES) {
    if (
      message.includes(table)
      && (message.includes("does not exist") || message.includes("could not find the table"))
    ) {
      return true;
    }
  }

  if (err.code && MISSING_FUNCTION_CODES.has(err.code)) {
    return true;
  }

  return ROUTINE_RPC_NAMES.some(
    (rpcName) =>
      message.includes(rpcName)
      && (message.includes("does not exist") || message.includes("could not find the function")),
  );
}

/**
 * @param {string} context
 * @param {unknown} error
 * @param {boolean} [schemaUnavailable]
 */
export function logRoutineServerError(
  context,
  error,
  schemaUnavailable = isRoutineSchemaError(error),
) {
  console.error(context, {
    code: getSafeRoutineErrorCode(error),
    category: schemaUnavailable ? "schema_unavailable" : "query_failed",
  });
}

/**
 * @param {unknown} value
 * @returns {5 | 15 | 30}
 */
export function normalizeBudgetValue(value) {
  if (value === 5 || value === 30) return value;
  return 15;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toIsoDateString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toIsoTimestampString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * @param {Record<string, any>} row
 */
export function mapPreferencesRow(row) {
  return {
    user_id: String(row.user_id),
    target_days: Number(row.target_days),
    timezone_iana: String(row.timezone_iana),
    default_budget_minutes: normalizeBudgetValue(row.default_budget_minutes),
    preferred_discipline: row.preferred_discipline ?? null,
    hide_gamification: Boolean(row.hide_gamification),
    pending_target_days:
      typeof row.pending_target_days === "number" ? row.pending_target_days : null,
    pending_timezone_iana: row.pending_timezone_iana ?? null,
    pending_effective_week_start: toIsoDateString(row.pending_effective_week_start),
    onboarding_completed_at: toIsoTimestampString(row.onboarding_completed_at),
  };
}

/**
 * @param {Record<string, any>} row
 */
export function mapWeeklyPlanRow(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    week_start_date: /** @type {string} */ (toIsoDateString(row.week_start_date)),
    week_end_date: /** @type {string} */ (toIsoDateString(row.week_end_date)),
    target_days: Number(row.target_days),
    timezone_iana: String(row.timezone_iana),
    is_partial_first_week: Boolean(row.is_partial_first_week),
  };
}

/**
 * @param {Record<string, any>} row
 */
export function mapActivityRow(row) {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    user_id: String(row.user_id),
    order_index: Number(row.order_index),
    activity_type: row.activity_type,
    status: row.status,
    topic_id: row.topic_id ?? null,
    topic_title: String(row.topic_title),
    discipline: String(row.discipline),
    section_id: row.section_id ?? null,
    content_unit_id: row.content_unit_id ?? null,
    activity_title: String(row.activity_title),
    estimated_minutes: Number(row.estimated_minutes),
    evidence_kind: row.evidence_kind ?? "self_declared",
    completed_at: toIsoTimestampString(row.completed_at),
    created_at: toIsoTimestampString(row.created_at) ?? undefined,
    updated_at: toIsoTimestampString(row.updated_at) ?? undefined,
  };
}

/**
 * @param {Record<string, any>} row
 * @param {Array<Record<string, any>>} activities
 */
export function mapSessionRow(row, activities) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    weekly_plan_id: String(row.weekly_plan_id),
    status: row.status,
    budget_minutes: normalizeBudgetValue(row.budget_minutes),
    estimated_minutes: Number(row.estimated_minutes),
    selection_mode: row.selection_mode,
    idempotency_key: String(row.idempotency_key),
    completion_idempotency_key: row.completion_idempotency_key ?? null,
    started_at: /** @type {string} */ (toIsoTimestampString(row.started_at)),
    last_activity_at: /** @type {string} */ (toIsoTimestampString(row.last_activity_at)),
    completed_at: toIsoTimestampString(row.completed_at),
    completed_local_date: toIsoDateString(row.completed_local_date),
    completed_week_start_date: toIsoDateString(row.completed_week_start_date),
    completed_timezone_iana: row.completed_timezone_iana ?? null,
    activities,
  };
}

/**
 * @param {Record<string, any>} sessionJson
 */
function mapHydratedSessionJson(sessionJson) {
  const rawActivities = Array.isArray(sessionJson?.activities) ? sessionJson.activities : [];
  return mapSessionRow(
    sessionJson,
    rawActivities.map((item) => mapActivityRow(item)),
  );
}

/**
 * @param {string} context
 * @param {unknown} error
 * @returns {never}
 */
export function throwMappedDatabaseError(context, error) {
  if (isRoutineSchemaError(error)) {
    logRoutineServerError(context, error, true);
    throw new RoutineSchemaUnavailableError(getSafeRoutineErrorCode(error));
  }

  logRoutineServerError(context, error, false);
  const err = getRoutineErrorLike(error);
  if (err?.code === "42501") {
    throw new RoutineDomainError(
      "Assinatura ativa ou permissão válida necessária.",
      403,
      "forbidden",
    );
  }
  if (err?.code === "P0002") {
    throw new RoutineDomainError("Registro da rotina não encontrado.", 404, "not_found");
  }
  if (err?.code === "23503") {
    throw new RoutineDomainError(
      "Conteúdo selecionado está arquivado ou indisponível.",
      409,
      "content_unavailable",
    );
  }
  if (err?.code === "23514" || err?.code === "55000") {
    throw new RoutineDomainError(
      "Estado inválido para esta operação na sessão.",
      409,
      "invalid_transition",
    );
  }
  if (err?.code === "22023") {
    throw new RoutineDomainError(
      "Parâmetros inválidos para a operação da rotina.",
      400,
      "invalid_input",
    );
  }
  if (err?.code === "23505") {
    throw new RoutineDomainError(
      "Conflito concorrente na rotina; tente novamente.",
      409,
      "conflict",
    );
  }

  throw new RoutineDomainError(
    "Não foi possível processar a solicitação da rotina agora.",
    500,
    "routine_persistence_error",
  );
}

/**
 * Cria o repositório autenticado no Supabase apoiado exclusivamente por
 * consultas SELECT com RLS e RPCs transacionais SECURITY DEFINER.
 * @param {{ from: Function; rpc: Function }} supabase
 */
export function createSupabaseRoutineRepository(supabase) {
  /**
   * @param {string} userId
   * @param {Array<Record<string, any>>} sessionRows
   */
  async function hydrateSessions(userId, sessionRows) {
    if (sessionRows.length === 0) return [];
    const sessionIds = sessionRows.map((row) => row.id);
    const { data, error } = await supabase
      .from("study_routine_session_activities")
      .select("*")
      .eq("user_id", userId)
      .in("session_id", sessionIds)
      .order("order_index", { ascending: true });

    if (error) {
      throwMappedDatabaseError("Falha ao carregar atividades das sessões de rotina.", error);
    }

    const bySession = new Map();
    for (const row of data ?? []) {
      const mapped = mapActivityRow(row);
      const list = bySession.get(mapped.session_id) ?? [];
      list.push(mapped);
      bySession.set(mapped.session_id, list);
    }

    return sessionRows.map((row) => mapSessionRow(row, bySession.get(row.id) ?? []));
  }

  return {
    usesTransactionalRpcs: true,

    async syncWeeklyPlan(_userId, autoActivateIfMissing) {
      const { data, error } = await supabase.rpc("ensure_study_routine_weekly_plan", {
        p_auto_activate: Boolean(autoActivateIfMissing),
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao sincronizar plano semanal de rotina.", error);
      }

      const payload = /** @type {Record<string, any>} */ (data);
      return {
        preferences: payload.preferences ? mapPreferencesRow(payload.preferences) : null,
        currentPlan: payload.current_plan ? mapWeeklyPlanRow(payload.current_plan) : null,
      };
    },

    async savePreferencesAtomically(_userId, input) {
      const { data, error } = await supabase.rpc("save_study_routine_preferences", {
        p_target_days: input.targetDays ?? null,
        p_timezone_iana: input.timezoneIana ?? null,
        p_default_budget_minutes: input.defaultBudgetMinutes ?? null,
        p_preferred_discipline:
          typeof input.preferredDiscipline === "string" ? input.preferredDiscipline : null,
        p_clear_preferred_discipline: Boolean(input.clearPreferredDiscipline),
        p_hide_gamification:
          typeof input.hideGamification === "boolean" ? input.hideGamification : null,
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao salvar preferências da rotina semanal.", error);
      }

      const payload = /** @type {Record<string, any>} */ (data);
      const preferences = mapPreferencesRow(payload.preferences);
      const currentPlan = payload.current_plan ? mapWeeklyPlanRow(payload.current_plan) : null;
      const bounds = getWeekBoundsForInstant(new Date(), preferences.timezone_iana);

      return {
        preferences,
        currentPlan,
        updatePlan: {
          isFirstActivation: Boolean(currentPlan && payload.effective_immediately),
          shouldPersistPlan: Boolean(currentPlan),
          effectiveImmediately: Boolean(payload.effective_immediately),
          effectiveWeekStartDate: toIsoDateString(payload.effective_week_start_date),
          weekEndDate: currentPlan?.week_end_date ?? bounds.weekEndDate,
          isPartialFirstWeek: Boolean(currentPlan?.is_partial_first_week),
          appliedTargetDays: preferences.target_days,
          appliedTimezoneIana: preferences.timezone_iana,
          pendingTargetDays: preferences.pending_target_days,
          pendingTimezoneIana: preferences.pending_timezone_iana,
          pendingEffectiveWeekStart: preferences.pending_effective_week_start,
          onboardingCompletedAt: preferences.onboarding_completed_at,
        },
      };
    },

    async getPreferences(userId) {
      const { data, error } = await supabase
        .from("user_study_routine_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throwMappedDatabaseError("Falha ao ler preferências da rotina semanal.", error);
      }

      return data ? mapPreferencesRow(data) : null;
    },

    async upsertPreferences(userId, record) {
      const saved = await this.savePreferencesAtomically(userId, {
        targetDays: typeof record.target_days === "number" ? record.target_days : undefined,
        timezoneIana: typeof record.timezone_iana === "string" ? record.timezone_iana : undefined,
        defaultBudgetMinutes:
          typeof record.default_budget_minutes === "number"
            ? record.default_budget_minutes
            : undefined,
        preferredDiscipline:
          typeof record.preferred_discipline === "string" ? record.preferred_discipline : undefined,
        clearPreferredDiscipline: record.preferred_discipline === null,
        hideGamification:
          typeof record.hide_gamification === "boolean" ? record.hide_gamification : undefined,
      });
      return saved.preferences;
    },

    async listWeeklyPlans(userId) {
      const { data, error } = await supabase
        .from("study_routine_weekly_plans")
        .select("*")
        .eq("user_id", userId)
        .order("week_start_date", { ascending: false })
        .limit(26);

      if (error) {
        throwMappedDatabaseError("Falha ao listar planos semanais de rotina.", error);
      }

      return (data ?? []).map(mapWeeklyPlanRow);
    },

    async createWeeklyPlan(userId) {
      const synced = await this.syncWeeklyPlan(userId, true);
      if (synced.currentPlan) {
        return synced.currentPlan;
      }
      return {
        id: "",
        user_id: userId,
        week_start_date: getWeekBoundsForInstant(new Date(), DEFAULT_TIMEZONE_IANA).weekStartDate,
        week_end_date: getWeekBoundsForInstant(new Date(), DEFAULT_TIMEZONE_IANA).weekEndDate,
        target_days: DEFAULT_TARGET_DAYS,
        timezone_iana: DEFAULT_TIMEZONE_IANA,
        is_partial_first_week: false,
      };
    },

    async listSessionsForWeek(userId, weekStartDate, weekEndDate) {
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_local_date", weekStartDate)
        .lte("completed_local_date", weekEndDate)
        .order("completed_at", { ascending: false });

      if (error) {
        throwMappedDatabaseError("Falha ao listar sessões concluídas da semana.", error);
      }

      return hydrateSessions(userId, data ?? []);
    },

    async listRecentSessions(userId, limit) {
      const safeLimit = Math.max(1, Math.min(30, limit));
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(safeLimit);

      if (error) {
        throwMappedDatabaseError("Falha ao listar sessões recentes de rotina.", error);
      }

      return hydrateSessions(userId, data ?? []);
    },

    async findActiveSession(userId) {
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["planned", "in_progress", "interrupted"])
        .order("last_activity_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throwMappedDatabaseError("Falha ao consultar sessão ativa de rotina.", error);
      }

      if (!data) return null;
      const [hydrated] = await hydrateSessions(userId, [data]);
      return hydrated ?? null;
    },

    async findSessionByIdempotencyKey(userId, key) {
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", key)
        .maybeSingle();

      if (error) {
        throwMappedDatabaseError("Falha ao verificar idempotência da sessão.", error);
      }

      if (!data) return null;
      const [hydrated] = await hydrateSessions(userId, [data]);
      return hydrated ?? null;
    },

    async findSessionByCompletionKey(userId, key) {
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("completion_idempotency_key", key)
        .maybeSingle();

      if (error) {
        throwMappedDatabaseError("Falha ao verificar idempotência da conclusão.", error);
      }

      if (!data) return null;
      const [hydrated] = await hydrateSessions(userId, [data]);
      return hydrated ?? null;
    },

    async getSessionById(userId, sessionId) {
      const { data, error } = await supabase
        .from("study_routine_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("id", sessionId)
        .maybeSingle();

      if (error) {
        throwMappedDatabaseError("Falha ao consultar sessão de rotina.", error);
      }

      if (!data) return null;
      const [hydrated] = await hydrateSessions(userId, [data]);
      return hydrated ?? null;
    },

    async createSessionWithActivities(_userId, session, activities, options = {}) {
      const activityPayloads = activities.map((activity) => ({
        activity_type: activity.activity_type,
        topic_id: activity.topic_id ?? null,
        topic_title: activity.topic_title,
        discipline: activity.discipline,
        section_id: activity.section_id ?? null,
        content_unit_id: activity.content_unit_id ?? null,
        activity_title: activity.activity_title,
        estimated_minutes: activity.estimated_minutes,
        evidence_kind: activity.evidence_kind ?? "self_declared",
      }));

      const { data, error } = await supabase.rpc("create_study_routine_session", {
        p_budget_minutes: session.budget_minutes,
        p_selection_mode: session.selection_mode,
        p_idempotency_key: session.idempotency_key,
        p_activities: activityPayloads,
        p_replace_active: Boolean(options?.replaceActive),
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao iniciar sessão de rotina.", error);
      }

      const payload = /** @type {Record<string, any>} */ (data);
      if (!payload.session) {
        throwMappedDatabaseError("Resposta incompleta ao criar sessão de rotina.", null);
      }

      return {
        session: mapHydratedSessionJson(payload.session),
        resumed: Boolean(payload.resumed),
        idempotent: Boolean(payload.idempotent),
      };
    },

    async updateSession(_userId, sessionId, patch) {
      const { data, error } = await supabase.rpc("update_study_routine_session_status", {
        p_session_id: sessionId,
        p_status: patch.status,
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao atualizar sessão de rotina.", error);
      }

      return mapHydratedSessionJson(/** @type {Record<string, any>} */ (data));
    },

    async replaceSessionActivityAtomically(_userId, sessionId, activityId, replacement) {
      const { data, error } = await supabase.rpc("replace_study_routine_session_activity", {
        p_session_id: sessionId,
        p_activity_id: activityId,
        p_content_unit_id: replacement.content_unit_id,
        p_topic_id: replacement.topic_id ?? null,
        p_topic_title: replacement.topic_title,
        p_discipline: replacement.discipline,
        p_section_id: replacement.section_id ?? null,
        p_activity_title: replacement.activity_title,
        p_estimated_minutes: replacement.estimated_minutes,
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao substituir atividade indisponível.", error);
      }

      return mapHydratedSessionJson(/** @type {Record<string, any>} */ (data));
    },

    async updateSessionActivity(userId, sessionId, activityId, patch) {
      const updatedSession = await this.replaceSessionActivityAtomically(
        userId,
        sessionId,
        activityId,
        {
          topic_id: patch.topic_id ?? null,
          topic_title: String(patch.topic_title ?? ""),
          discipline: String(patch.discipline ?? ""),
          section_id: patch.section_id ?? null,
          content_unit_id: patch.content_unit_id ?? null,
          activity_title: String(patch.activity_title ?? ""),
          estimated_minutes: Number(patch.estimated_minutes ?? 1),
        },
      );
      const found = updatedSession.activities.find((item) => item.id === activityId);
      if (!found) {
        throw new RoutineDomainError("Atividade não encontrada nesta sessão.", 404, "activity_not_found");
      }
      return found;
    },

    async completeSessionAtomically({
      userId,
      sessionId,
      weeklyPlanId,
      completedActivityIds,
      completionIdempotencyKey,
    }) {
      const { data, error } = await supabase.rpc("complete_study_routine_session", {
        p_session_id: sessionId,
        p_completed_activity_ids: completedActivityIds,
        p_completion_idempotency_key: completionIdempotencyKey,
        p_weekly_plan_id: weeklyPlanId ?? null,
      });

      if (error || !data) {
        throwMappedDatabaseError("Falha ao concluir sessão de rotina.", error);
      }

      const rawRow = Array.isArray(data) ? data[0] : data;
      const hydrated = await this.getSessionById(userId, rawRow.id);
      return hydrated ?? mapSessionRow(rawRow, []);
    },

    async markLegacyProgressCompleted() {
      // A RPC complete_study_routine_session já sincroniza user_progress na mesma transação.
    },
  };
}

const DEV_FALLBACK_STORE_KEY = "__studyRoutineDevFallbackStore";

/**
 * @returns {Map<string, {
 *   preferences: import("./session.d.mts").StudyRoutinePreferencesRecord | null;
 *   weeklyPlans: import("./session.d.mts").StudyRoutineWeeklyPlanRecord[];
 *   sessions: import("./session.d.mts").StudyRoutineSessionRecord[];
 *   completedContentUnitIds: Set<string>;
 * }>}
 */
function getDevFallbackStore() {
  const host = /** @type {Record<string, unknown>} */ (globalThis);
  if (!(host[DEV_FALLBACK_STORE_KEY] instanceof Map)) {
    host[DEV_FALLBACK_STORE_KEY] = new Map();
  }
  return /** @type {Map<string, any>} */ (host[DEV_FALLBACK_STORE_KEY]);
}

/**
 * @param {string} userId
 */
function ensureDevFallbackUserEntry(userId) {
  const store = getDevFallbackStore();
  let entry = store.get(userId);
  if (!entry) {
    entry = {
      preferences: null,
      weeklyPlans: [],
      sessions: [],
      completedContentUnitIds: new Set(),
    };
    store.set(userId, entry);
  } else if (!(entry.completedContentUnitIds instanceof Set)) {
    entry.completedContentUnitIds = new Set();
  }
  return entry;
}

/**
 * @param {string} userId
 * @returns {Set<string> | null}
 */
export function getDevFallbackCompletedUnitIds(userId) {
  return getDevFallbackStore().get(userId)?.completedContentUnitIds ?? null;
}

/**
 * @param {Iterable<string>} baseCompletedIds
 * @param {string} userId
 * @returns {Set<string>}
 */
export function mergeDevFallbackCompletedUnitIds(baseCompletedIds, userId) {
  const merged = new Set(baseCompletedIds);
  const devCompleted = getDevFallbackCompletedUnitIds(userId);
  if (devCompleted) {
    for (const contentUnitId of devCompleted) {
      merged.add(contentUnitId);
    }
  }
  return merged;
}

/**
 * @param {string} [userId]
 */
export function resetDevFallbackStore(userId) {
  const store = getDevFallbackStore();
  if (typeof userId === "string" && userId.length > 0) {
    store.delete(userId);
  } else {
    store.clear();
  }
}

/**
 * Repositório 100% em memória para demonstração local controlada.
 * Não realiza leituras ou escritas no Supabase.
 * @returns {import("./session.d.mts").RoutineRepository}
 */
export function createDevFallbackRepository() {
  const createId = () => globalThis.crypto.randomUUID();

  return {
    async getPreferences(userId) {
      return ensureDevFallbackUserEntry(userId).preferences;
    },
    async upsertPreferences(userId, record) {
      const entry = ensureDevFallbackUserEntry(userId);
      const next = {
        user_id: userId,
        target_days: Number(record.target_days ?? DEFAULT_TARGET_DAYS),
        timezone_iana: String(record.timezone_iana ?? DEFAULT_TIMEZONE_IANA),
        default_budget_minutes: normalizeBudgetValue(record.default_budget_minutes),
        preferred_discipline:
          typeof record.preferred_discipline === "string" ? record.preferred_discipline : null,
        hide_gamification: Boolean(record.hide_gamification),
        pending_target_days:
          typeof record.pending_target_days === "number" ? record.pending_target_days : null,
        pending_timezone_iana:
          typeof record.pending_timezone_iana === "string" ? record.pending_timezone_iana : null,
        pending_effective_week_start:
          typeof record.pending_effective_week_start === "string"
            ? record.pending_effective_week_start
            : null,
        onboarding_completed_at:
          typeof record.onboarding_completed_at === "string"
            ? record.onboarding_completed_at
            : null,
      };
      entry.preferences = next;
      return next;
    },
    async listWeeklyPlans(userId) {
      return ensureDevFallbackUserEntry(userId).weeklyPlans.slice();
    },
    async createWeeklyPlan(userId, plan) {
      const entry = ensureDevFallbackUserEntry(userId);
      const existing = entry.weeklyPlans.find(
        (/** @type {{ week_start_date: string }} */ item) =>
          item.week_start_date === plan.week_start_date,
      );
      if (existing) return existing;
      const created = {
        id: createId(),
        user_id: userId,
        week_start_date: String(plan.week_start_date),
        week_end_date: String(plan.week_end_date),
        target_days: Number(plan.target_days ?? DEFAULT_TARGET_DAYS),
        timezone_iana: String(plan.timezone_iana ?? DEFAULT_TIMEZONE_IANA),
        is_partial_first_week: Boolean(plan.is_partial_first_week),
      };
      entry.weeklyPlans.unshift(created);
      return created;
    },
    async listSessionsForWeek(userId, weekStartDate, weekEndDate) {
      return ensureDevFallbackUserEntry(userId).sessions.filter(
        (/** @type {import("./session.d.mts").StudyRoutineSessionRecord} */ session) =>
          session.status === "completed"
          && session.completed_local_date !== null
          && session.completed_local_date >= weekStartDate
          && session.completed_local_date <= weekEndDate,
      );
    },
    async listRecentSessions(userId, limit) {
      return ensureDevFallbackUserEntry(userId).sessions.slice(0, limit);
    },
    async findActiveSession(userId) {
      return (
        ensureDevFallbackUserEntry(userId).sessions.find(
          (/** @type {import("./session.d.mts").StudyRoutineSessionRecord} */ session) =>
            session.status === "planned"
            || session.status === "in_progress"
            || session.status === "interrupted",
        ) ?? null
      );
    },
    async findSessionByIdempotencyKey(userId, key) {
      return (
        ensureDevFallbackUserEntry(userId).sessions.find(
          (/** @type {import("./session.d.mts").StudyRoutineSessionRecord} */ session) =>
            session.idempotency_key === key,
        ) ?? null
      );
    },
    async findSessionByCompletionKey(userId, key) {
      return (
        ensureDevFallbackUserEntry(userId).sessions.find(
          (/** @type {import("./session.d.mts").StudyRoutineSessionRecord} */ session) =>
            session.completion_idempotency_key === key,
        ) ?? null
      );
    },
    async getSessionById(userId, sessionId) {
      return (
        ensureDevFallbackUserEntry(userId).sessions.find(
          (/** @type {import("./session.d.mts").StudyRoutineSessionRecord} */ session) =>
            session.id === sessionId,
        ) ?? null
      );
    },
    async createSessionWithActivities(userId, session, activities) {
      const entry = ensureDevFallbackUserEntry(userId);
      const sessionId = createId();
      /** @type {import("./session.d.mts").StudyRoutineSessionRecord} */
      const created = {
        id: sessionId,
        user_id: userId,
        weekly_plan_id: String(session.weekly_plan_id),
        status: /** @type {import("./session.d.mts").StudyRoutineSessionRecord["status"]} */ (
          session.status ?? "in_progress"
        ),
        budget_minutes: normalizeBudgetValue(session.budget_minutes),
        estimated_minutes: Number(session.estimated_minutes ?? 10),
        selection_mode: /** @type {import("./session.d.mts").StudyRoutineSessionRecord["selection_mode"]} */ (
          session.selection_mode ?? "recommended"
        ),
        idempotency_key: String(session.idempotency_key),
        completion_idempotency_key: null,
        started_at: String(session.started_at),
        last_activity_at: String(session.last_activity_at),
        completed_at: null,
        completed_local_date: null,
        completed_week_start_date: null,
        completed_timezone_iana: null,
        activities: activities.map((activity) => ({
          id: createId(),
          session_id: sessionId,
          user_id: userId,
          order_index: Number(activity.order_index ?? 0),
          activity_type: "summary",
          status: "pending",
          topic_id: typeof activity.topic_id === "string" ? activity.topic_id : null,
          topic_title: String(activity.topic_title),
          discipline: String(activity.discipline),
          section_id: typeof activity.section_id === "string" ? activity.section_id : null,
          content_unit_id:
            typeof activity.content_unit_id === "string" ? activity.content_unit_id : null,
          activity_title: String(activity.activity_title),
          estimated_minutes: Number(activity.estimated_minutes ?? 5),
          evidence_kind: "self_declared",
          completed_at: null,
        })),
      };
      entry.sessions.unshift(created);
      return created;
    },
    async updateSession(userId, sessionId, patch) {
      const target = await this.getSessionById(userId, sessionId);
      if (!target) throw new RoutineDomainError("Sessão não encontrada.", 404, "session_not_found");
      Object.assign(target, patch);
      return target;
    },
    async updateSessionActivity(userId, sessionId, activityId, patch) {
      const target = await this.getSessionById(userId, sessionId);
      const activity = target?.activities.find((item) => item.id === activityId);
      if (!activity) {
        throw new RoutineDomainError("Atividade não encontrada.", 404, "activity_not_found");
      }
      Object.assign(activity, patch);
      return activity;
    },
    async completeSessionAtomically({
      userId,
      sessionId,
      weeklyPlanId,
      completedActivityIds,
      completionIdempotencyKey,
      completedAt,
      completedLocalDate,
      completedWeekStartDate,
      completedTimezoneIana,
    }) {
      const target = await this.getSessionById(userId, sessionId);
      if (!target) throw new RoutineDomainError("Sessão não encontrada.", 404, "session_not_found");
      if (target.status === "completed") return target;
      const completedSet = new Set(completedActivityIds);
      for (const activity of target.activities) {
        if (completedSet.has(activity.id)) {
          activity.status = "completed";
          activity.completed_at = completedAt;
        }
      }
      target.status = "completed";
      target.weekly_plan_id = weeklyPlanId ?? target.weekly_plan_id;
      target.completion_idempotency_key = completionIdempotencyKey;
      target.completed_at = completedAt;
      target.completed_local_date = completedLocalDate;
      target.completed_week_start_date = completedWeekStartDate;
      target.completed_timezone_iana = completedTimezoneIana;
      target.last_activity_at = completedAt;
      return target;
    },
    async markLegacyProgressCompleted(userId, items) {
      const entry = ensureDevFallbackUserEntry(userId);
      const validItems = items.filter(
        (item) => Boolean(item.content_unit_id && item.section_id),
      );
      for (const item of validItems) {
        entry.completedContentUnitIds.add(item.content_unit_id);
      }
    },
  };
}
