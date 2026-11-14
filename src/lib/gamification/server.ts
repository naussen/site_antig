import "server-only";

import { hasGoogleSession } from "@/lib/auth/google-only.mjs";
import { createClient } from "@/lib/supabase/server";
import {
  isMissingColumnError,
  isMissingTableError,
} from "@/lib/supabase/errors";
import { compareTopicsByOrigin } from "@/lib/topic-order";
import {
  DEFAULT_BUDGET_MINUTES,
  DEFAULT_TARGET_DAYS,
  DEFAULT_TIMEZONE_IANA,
  isGamificationOperationalEnabled,
} from "./config.mjs";
import {
  previewTimezoneChange,
  resolveEffectiveWeeklyPlan,
  summarizeWeeklyProgress,
} from "./calendar.mjs";
import {
  RoutineDomainError,
  buildStudyRecommendation,
  createRoutineService,
} from "./session.mjs";
import type {
  RoutineRepository,
  RoutineSnapshot,
  RoutineTopicInput,
  StudyRoutinePreferencesRecord,
  StudyRoutineSessionRecord,
  StudyRoutineWeeklyPlanRecord,
} from "./session.d.mts";
import {
  RoutineSchemaUnavailableError,
  createSupabaseRoutineRepository,
  getRoutineErrorLike,
  isRoutineSchemaError,
  logRoutineServerError,
  normalizeBudgetValue,
  throwMappedDatabaseError,
} from "./repository.mjs";

export {
  RoutineSchemaUnavailableError,
  createSupabaseRoutineRepository,
  isRoutineSchemaError,
  logRoutineServerError,
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface DashboardRoutineTopicOption {
  topic_id: string;
  title: string;
  discipline: string;
  sections: Array<{
    section_id: string;
    content_unit_id: string;
    title: string;
  }>;
}

export interface DashboardRoutineState {
  operationalEnabled: boolean;
  persistenceAvailable: boolean;
  snapshot: RoutineSnapshot | null;
  topicOptions: DashboardRoutineTopicOption[];
}

export interface StudyTopicRoutineState {
  operationalEnabled: boolean;
  persistenceAvailable: boolean;
  snapshot: RoutineSnapshot | null;
}

export async function getApiContentAccess(): Promise<
  | { ok: true; supabase: SupabaseServerClient; user: NonNullable<Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>["data"]["user"]> }
  | { ok: false; status: 401 | 403 | 500; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Sessão ausente ou expirada. Entre novamente com Google.",
    };
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !hasGoogleSession(user, claimsData?.claims)) {
    return {
      ok: false,
      status: 403,
      error: "Acesso permitido apenas para sessão autenticada com Google.",
    };
  }

  if (user.app_metadata?.role === "admin") {
    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError || aalData?.currentLevel !== "aal2") {
      return {
        ok: false,
        status: 403,
        error: "Confirme a verificação MFA (AAL2) para operar como administrador.",
      };
    }
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc(
    "has_active_content_access",
  );

  if (accessError) {
    logRoutineServerError("Falha ao verificar acesso ao conteúdo na rotina.", accessError, false);
    return {
      ok: false,
      status: 500,
      error: "Não foi possível validar sua assinatura no momento.",
    };
  }

  if (hasAccess !== true) {
    return {
      ok: false,
      status: 403,
      error: "Assinatura ativa necessária para usar a rotina semanal de estudos.",
    };
  }

  return { ok: true, supabase, user };
}

const devFallbackGlobal = globalThis as typeof globalThis & {
  __studyRoutineDevFallbackStore?: Map<
    string,
    {
      preferences: StudyRoutinePreferencesRecord | null;
      weeklyPlans: StudyRoutineWeeklyPlanRecord[];
      sessions: StudyRoutineSessionRecord[];
    }
  >;
};

export function isExplicitDevFallbackAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production"
    && process.env.STUDY_ROUTINE_DEV_FALLBACK === "1"
  );
}

function createDevFallbackRepository(): RoutineRepository {
  if (!devFallbackGlobal.__studyRoutineDevFallbackStore) {
    devFallbackGlobal.__studyRoutineDevFallbackStore = new Map();
  }
  const store = devFallbackGlobal.__studyRoutineDevFallbackStore;

  const ensureUserStore = (userId: string) => {
    let entry = store.get(userId);
    if (!entry) {
      entry = { preferences: null, weeklyPlans: [], sessions: [] };
      store.set(userId, entry);
    }
    return entry;
  };

  return {
    async getPreferences(userId) {
      return ensureUserStore(userId).preferences;
    },
    async upsertPreferences(userId, record) {
      const entry = ensureUserStore(userId);
      const next: StudyRoutinePreferencesRecord = {
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
      return ensureUserStore(userId).weeklyPlans.slice();
    },
    async createWeeklyPlan(userId, plan) {
      const entry = ensureUserStore(userId);
      const existing = entry.weeklyPlans.find(
        (item) => item.week_start_date === plan.week_start_date,
      );
      if (existing) return existing;
      const created: StudyRoutineWeeklyPlanRecord = {
        id: crypto.randomUUID(),
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
      return ensureUserStore(userId).sessions.filter(
        (session) =>
          session.status === "completed"
          && session.completed_local_date !== null
          && session.completed_local_date >= weekStartDate
          && session.completed_local_date <= weekEndDate,
      );
    },
    async listRecentSessions(userId, limit) {
      return ensureUserStore(userId).sessions.slice(0, limit);
    },
    async findActiveSession(userId) {
      return (
        ensureUserStore(userId).sessions.find(
          (session) =>
            session.status === "planned"
            || session.status === "in_progress"
            || session.status === "interrupted",
        ) ?? null
      );
    },
    async findSessionByIdempotencyKey(userId, key) {
      return (
        ensureUserStore(userId).sessions.find((session) => session.idempotency_key === key)
        ?? null
      );
    },
    async findSessionByCompletionKey(userId, key) {
      return (
        ensureUserStore(userId).sessions.find(
          (session) => session.completion_idempotency_key === key,
        ) ?? null
      );
    },
    async getSessionById(userId, sessionId) {
      return ensureUserStore(userId).sessions.find((session) => session.id === sessionId) ?? null;
    },
    async createSessionWithActivities(userId, session, activities) {
      const entry = ensureUserStore(userId);
      const sessionId = crypto.randomUUID();
      const created: StudyRoutineSessionRecord = {
        id: sessionId,
        user_id: userId,
        weekly_plan_id: String(session.weekly_plan_id),
        status: (session.status as StudyRoutineSessionRecord["status"]) ?? "in_progress",
        budget_minutes: normalizeBudgetValue(session.budget_minutes),
        estimated_minutes: Number(session.estimated_minutes ?? 10),
        selection_mode: (session.selection_mode as StudyRoutineSessionRecord["selection_mode"]) ?? "recommended",
        idempotency_key: String(session.idempotency_key),
        completion_idempotency_key: null,
        started_at: String(session.started_at),
        last_activity_at: String(session.last_activity_at),
        completed_at: null,
        completed_local_date: null,
        completed_week_start_date: null,
        completed_timezone_iana: null,
        activities: activities.map((activity) => ({
          id: crypto.randomUUID(),
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
      if (!activity) throw new RoutineDomainError("Atividade não encontrada.", 404, "activity_not_found");
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
    async markLegacyProgressCompleted() {},
  };
}

export function createRoutineServiceForSupabase(supabase: SupabaseServerClient) {
  return createRoutineService(createSupabaseRoutineRepository(supabase));
}

export function createRoutineServiceForDevFallback() {
  return createRoutineService(createDevFallbackRepository());
}

export function sortRoutineTopics(topics: RoutineTopicInput[]): RoutineTopicInput[] {
  return topics.slice().sort((left, right) => {
    const leftDiscipline = left.discipline || "Geral";
    const rightDiscipline = right.discipline || "Geral";
    const discOrder = leftDiscipline.localeCompare(rightDiscipline, "pt-BR");
    if (discOrder !== 0) return discOrder;

    return compareTopicsByOrigin(
      leftDiscipline,
      {
        topic_id: left.topic_id,
        title: left.title,
        sort_order: left.sort_order ?? null,
      },
      {
        topic_id: right.topic_id,
        title: right.title,
        sort_order: right.sort_order ?? null,
      },
    );
  });
}

export async function loadActiveRoutineTopics(
  supabase: SupabaseServerClient,
): Promise<RoutineTopicInput[]> {
  const { data, error } = await supabase
    .from("topics")
    .select(
      "topic_id, discipline, title, sort_order, archived_at, sections(section_id, content_unit_id, title, sort_order, archived_at)",
    )
    .is("archived_at", null)
    .is("sections.archived_at", null);

  if (error) {
    throwMappedDatabaseError("Falha ao listar tópicos ativos para a rotina.", error);
  }

  return sortRoutineTopics((data ?? []) as RoutineTopicInput[]);
}

export async function hydrateRoutineTopicsByIds(
  supabase: SupabaseServerClient,
  topics: RoutineTopicInput[],
  topicIds: Array<string | null | undefined>,
): Promise<RoutineTopicInput[]> {
  const uniqueIds = Array.from(
    new Set(topicIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)),
  );
  if (uniqueIds.length === 0) return topics;

  const { data, error } = await supabase
    .from("sections")
    .select(
      "section_id, content_unit_id, topic_id, title, sort_order, archived_at, content_markdown, callouts, mnemonics, flashcards, mermaid_mindmap",
    )
    .in("topic_id", uniqueIds)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    logRoutineServerError("Falha ao hidratar seções para estimativa da rotina.", error, false);
    return topics;
  }

  const sectionsByTopic = new Map<string, NonNullable<RoutineTopicInput["sections"]>>();
  for (const row of (data ?? []) as Array<
    NonNullable<RoutineTopicInput["sections"]>[number] & { topic_id: string }
  >) {
    const list = sectionsByTopic.get(row.topic_id) ?? [];
    list.push(row);
    sectionsByTopic.set(row.topic_id, list);
  }

  return topics.map((topic) => {
    const detailed = sectionsByTopic.get(topic.topic_id);
    if (!detailed) return topic;
    return {
      ...topic,
      sections: detailed,
    };
  });
}

export async function loadUserCompletedContentUnitIds(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("content_unit_id, section_id, completed")
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) {
    logRoutineServerError("Falha ao consultar progresso para recomendação da rotina.", error, false);
    return new Set<string>();
  }

  return new Set(
    (data ?? [])
      .map((row) => row.content_unit_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
}

export async function loadUserVisibleDisciplines(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("user_dashboard_preferences")
    .select("visible_disciplines")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (
      !isMissingTableError(getRoutineErrorLike(error), "user_dashboard_preferences")
      && !isMissingColumnError(getRoutineErrorLike(error), "visible_disciplines")
    ) {
      logRoutineServerError("Falha ao consultar disciplinas visíveis na rotina.", error, false);
    }
    return null;
  }

  return Array.isArray(data?.visible_disciplines) ? data.visible_disciplines : null;
}

export function buildTopicOptionsForPicker(
  topics: RoutineTopicInput[],
): DashboardRoutineTopicOption[] {
  return sortRoutineTopics(topics)
    .map((topic) => {
      const sections = (topic.sections ?? [])
        .filter((section) => !section.archived_at && Boolean(section.content_unit_id))
        .slice()
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
        .map((section) => ({
          section_id: section.section_id,
          content_unit_id: section.content_unit_id,
          title: section.title,
        }));

      return {
        topic_id: topic.topic_id,
        title: topic.title,
        discipline: topic.discipline || "Geral",
        sections,
      };
    })
    .filter((topic) => topic.sections.length > 0);
}

function buildReadOnlyFallbackSnapshot(userId: string): RoutineSnapshot {
  const nowUtc = new Date();
  const resolution = resolveEffectiveWeeklyPlan({
    preferences: null,
    existingPlanForCurrentWeek: null,
    hasPriorWeeklyPlans: false,
    nowUtc,
  });

  return {
    needsOnboarding: true,
    preferences: {
      user_id: userId,
      target_days: DEFAULT_TARGET_DAYS,
      timezone_iana: DEFAULT_TIMEZONE_IANA,
      default_budget_minutes: DEFAULT_BUDGET_MINUTES,
      preferred_discipline: null,
      hide_gamification: false,
      pending_target_days: null,
      pending_timezone_iana: null,
      pending_effective_week_start: null,
      onboarding_completed_at: null,
    },
    currentPlan: null,
    weeklyProgress: summarizeWeeklyProgress({
      weekStartDate: resolution.weekStartDate,
      weekEndDate: resolution.weekEndDate,
      targetDays: DEFAULT_TARGET_DAYS,
      timezoneIana: DEFAULT_TIMEZONE_IANA,
      isPartialFirstWeek: resolution.isPartialFirstWeek,
      sessions: [],
    }),
    activeSession: null,
    recentSessions: [],
    recommendation: null,
    timezonePreviewNow: previewTimezoneChange({
      currentTimezoneIana: DEFAULT_TIMEZONE_IANA,
      nextTimezoneIana: DEFAULT_TIMEZONE_IANA,
      nowUtc,
    }),
    moduleAvailability: {
      summaries: true,
      laws: false,
      questions: false,
      flashcards: false,
    },
    accountOwnershipNotice:
      "Sua meta semanal e seu histórico de dias pertencem apenas à sua conta autenticada.",
  };
}

export async function loadDashboardRoutineState(input: {
  supabase: SupabaseServerClient;
  userId: string;
  topics: RoutineTopicInput[];
  completedContentUnitIds: Set<string>;
  visibleDisciplines: string[] | null;
}): Promise<DashboardRoutineState> {
  if (!isGamificationOperationalEnabled()) {
    return {
      operationalEnabled: false,
      persistenceAvailable: false,
      snapshot: null,
      topicOptions: [],
    };
  }

  const orderedTopics = sortRoutineTopics(input.topics);
  const topicOptions = buildTopicOptionsForPicker(orderedTopics);
  const service = createRoutineServiceForSupabase(input.supabase);

  try {
    const snapshot = await service.getSnapshot({
      userId: input.userId,
      topics: orderedTopics,
      completedContentUnitIds: input.completedContentUnitIds,
      visibleDisciplines: input.visibleDisciplines,
    });

    const targetIds = new Set<string>();
    if (snapshot.recommendation?.primaryTarget?.topic_id) {
      targetIds.add(snapshot.recommendation.primaryTarget.topic_id);
    }
    if (snapshot.recommendation?.replacementCandidate?.topic_id) {
      targetIds.add(snapshot.recommendation.replacementCandidate.topic_id);
    }

    if (!snapshot.activeSession && targetIds.size > 0) {
      const hydratedTopics = await hydrateRoutineTopicsByIds(
        input.supabase,
        orderedTopics,
        Array.from(targetIds),
      );
      snapshot.recommendation = buildStudyRecommendation({
        topics: hydratedTopics,
        completedContentUnitIds: input.completedContentUnitIds,
        activeSession: null,
        preferredDiscipline: snapshot.preferences.preferred_discipline,
        visibleDisciplines: input.visibleDisciplines,
        budgetMinutes: snapshot.preferences.default_budget_minutes,
      });
    }

    return {
      operationalEnabled: true,
      persistenceAvailable: true,
      snapshot,
      topicOptions,
    };
  } catch (error) {
    if (error instanceof RoutineSchemaUnavailableError) {
      if (isExplicitDevFallbackAllowed()) {
        const devSnapshot = await createRoutineServiceForDevFallback().getSnapshot({
          userId: input.userId,
          topics: orderedTopics,
          completedContentUnitIds: input.completedContentUnitIds,
          visibleDisciplines: input.visibleDisciplines,
        });
        return {
          operationalEnabled: true,
          persistenceAvailable: true,
          snapshot: devSnapshot,
          topicOptions,
        };
      }

      return {
        operationalEnabled: true,
        persistenceAvailable: false,
        snapshot: buildReadOnlyFallbackSnapshot(input.userId),
        topicOptions,
      };
    }

    logRoutineServerError("Falha inesperada ao carregar rotina semanal no Dashboard.", error, false);
    return {
      operationalEnabled: true,
      persistenceAvailable: false,
      snapshot: buildReadOnlyFallbackSnapshot(input.userId),
      topicOptions,
    };
  }
}

export async function loadStudyTopicRoutineState(input: {
  supabase: SupabaseServerClient;
  userId: string;
  topic: RoutineTopicInput;
  completedContentUnitIds: Set<string>;
}): Promise<StudyTopicRoutineState> {
  if (!isGamificationOperationalEnabled()) {
    return {
      operationalEnabled: false,
      persistenceAvailable: false,
      snapshot: null,
    };
  }

  const service = createRoutineServiceForSupabase(input.supabase);
  const repository = createSupabaseRoutineRepository(input.supabase);

  try {
    const activeSession = await repository.findActiveSession(input.userId);
    const extraTopicIds = Array.from(
      new Set(
        (activeSession?.activities ?? [])
          .map((item) => item.topic_id)
          .filter((id): id is string => Boolean(id) && id !== input.topic.topic_id),
      ),
    );

    let scopedTopics: RoutineTopicInput[] = [input.topic];
    if (extraTopicIds.length > 0) {
      const { data: extraTopicsData } = await input.supabase
        .from("topics")
        .select(
          "topic_id, discipline, title, sort_order, archived_at, sections(section_id, content_unit_id, title, sort_order, archived_at)",
        )
        .in("topic_id", extraTopicIds)
        .is("archived_at", null)
        .is("sections.archived_at", null);

      if (Array.isArray(extraTopicsData)) {
        scopedTopics = sortRoutineTopics([
          input.topic,
          ...(extraTopicsData as RoutineTopicInput[]),
        ]);
      }
    }

    const snapshot = await service.getSnapshot({
      userId: input.userId,
      topics: scopedTopics,
      completedContentUnitIds: input.completedContentUnitIds,
      visibleDisciplines: null,
    });

    return {
      operationalEnabled: true,
      persistenceAvailable: true,
      snapshot,
    };
  } catch (error) {
    if (error instanceof RoutineSchemaUnavailableError) {
      if (isExplicitDevFallbackAllowed()) {
        const devSnapshot = await createRoutineServiceForDevFallback().getSnapshot({
          userId: input.userId,
          topics: [input.topic],
          completedContentUnitIds: input.completedContentUnitIds,
          visibleDisciplines: null,
        });
        return {
          operationalEnabled: true,
          persistenceAvailable: true,
          snapshot: devSnapshot,
        };
      }

      return {
        operationalEnabled: true,
        persistenceAvailable: false,
        snapshot: buildReadOnlyFallbackSnapshot(input.userId),
      };
    }

    logRoutineServerError("Falha ao carregar barra de sessão na página de estudo.", error, false);
    return {
      operationalEnabled: true,
      persistenceAvailable: false,
      snapshot: buildReadOnlyFallbackSnapshot(input.userId),
    };
  }
}
