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
  buildStudyRecommendation,
  createRoutineService,
} from "./session.mjs";
import type {
  RoutineSnapshot,
  RoutineTopicInput,
  StudyRoutinePreferencesRecord,
} from "./session.d.mts";
import {
  RoutineSchemaUnavailableError,
  createDevFallbackRepository,
  createSupabaseRoutineRepository,
  getRoutineErrorLike,
  isRoutineSchemaError,
  logRoutineServerError,
  mergeDevFallbackCompletedUnitIds,
  throwMappedDatabaseError,
} from "./repository.mjs";

export {
  RoutineSchemaUnavailableError,
  createDevFallbackRepository,
  createSupabaseRoutineRepository,
  isRoutineSchemaError,
  logRoutineServerError,
  mergeDevFallbackCompletedUnitIds,
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
  demoFallbackActive: boolean;
  snapshot: RoutineSnapshot | null;
  topicOptions: DashboardRoutineTopicOption[];
}

export interface StudyTopicRoutineState {
  operationalEnabled: boolean;
  persistenceAvailable: boolean;
  demoFallbackActive: boolean;
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

export function isExplicitDevFallbackAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production"
    && process.env.STUDY_ROUTINE_DEV_FALLBACK === "1"
  );
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

  const mergedIds = new Set<string>();
  if (error) {
    logRoutineServerError("Falha ao consultar progresso para recomendação da rotina.", error, false);
  } else {
    for (const row of data ?? []) {
      if (typeof row.content_unit_id === "string" && row.content_unit_id.length > 0) {
        mergedIds.add(row.content_unit_id);
      }
    }
  }

  if (isExplicitDevFallbackAllowed()) {
    return mergeDevFallbackCompletedUnitIds(mergedIds, userId);
  }

  return mergedIds;
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

async function hydrateDashboardRecommendationIfNeeded(input: {
  supabase: SupabaseServerClient;
  orderedTopics: RoutineTopicInput[];
  snapshot: RoutineSnapshot;
  completedContentUnitIds: Set<string>;
  visibleDisciplines: string[] | null;
}) {
  const { supabase, orderedTopics, snapshot, completedContentUnitIds, visibleDisciplines } = input;
  const targetIds = new Set<string>();
  if (snapshot.recommendation?.primaryTarget?.topic_id) {
    targetIds.add(snapshot.recommendation.primaryTarget.topic_id);
  }
  if (snapshot.recommendation?.replacementCandidate?.topic_id) {
    targetIds.add(snapshot.recommendation.replacementCandidate.topic_id);
  }

  if (snapshot.activeSession || targetIds.size === 0) {
    return snapshot;
  }

  const hydratedTopics = await hydrateRoutineTopicsByIds(
    supabase,
    orderedTopics,
    Array.from(targetIds),
  );
  snapshot.recommendation = buildStudyRecommendation({
    topics: hydratedTopics,
    completedContentUnitIds,
    activeSession: null,
    preferredDiscipline: snapshot.preferences.preferred_discipline,
    visibleDisciplines,
    budgetMinutes: snapshot.preferences.default_budget_minutes,
  });
  return snapshot;
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
      demoFallbackActive: false,
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

    await hydrateDashboardRecommendationIfNeeded({
      supabase: input.supabase,
      orderedTopics,
      snapshot,
      completedContentUnitIds: input.completedContentUnitIds,
      visibleDisciplines: input.visibleDisciplines,
    });

    return {
      operationalEnabled: true,
      persistenceAvailable: true,
      demoFallbackActive: false,
      snapshot,
      topicOptions,
    };
  } catch (error) {
    if (error instanceof RoutineSchemaUnavailableError) {
      if (isExplicitDevFallbackAllowed()) {
        const mergedCompleted = mergeDevFallbackCompletedUnitIds(
          input.completedContentUnitIds,
          input.userId,
        );

        const devSnapshot = await createRoutineServiceForDevFallback().getSnapshot({
          userId: input.userId,
          topics: orderedTopics,
          completedContentUnitIds: mergedCompleted,
          visibleDisciplines: input.visibleDisciplines,
        });
        await hydrateDashboardRecommendationIfNeeded({
          supabase: input.supabase,
          orderedTopics,
          snapshot: devSnapshot,
          completedContentUnitIds: mergedCompleted,
          visibleDisciplines: input.visibleDisciplines,
        });
        return {
          operationalEnabled: true,
          persistenceAvailable: true,
          demoFallbackActive: true,
          snapshot: devSnapshot,
          topicOptions,
        };
      }

      return {
        operationalEnabled: true,
        persistenceAvailable: false,
        demoFallbackActive: false,
        snapshot: buildReadOnlyFallbackSnapshot(input.userId),
        topicOptions,
      };
    }

    logRoutineServerError("Falha inesperada ao carregar rotina semanal no Dashboard.", error, false);
    return {
      operationalEnabled: true,
      persistenceAvailable: false,
      demoFallbackActive: false,
      snapshot: buildReadOnlyFallbackSnapshot(input.userId),
      topicOptions,
    };
  }
}

export interface SettingsRoutineStatus {
  operationalEnabled: boolean;
  persistenceAvailable: boolean;
  demoFallbackActive: boolean;
  hideGamification: boolean;
  needsOnboarding: boolean;
  targetDays: number;
  timezoneIana: string;
}

export async function loadSettingsRoutineStatus(input: {
  supabase: SupabaseServerClient;
  userId: string;
}): Promise<SettingsRoutineStatus> {
  const baseStatus: SettingsRoutineStatus = {
    operationalEnabled: isGamificationOperationalEnabled(),
    persistenceAvailable: true,
    demoFallbackActive: false,
    hideGamification: false,
    needsOnboarding: true,
    targetDays: DEFAULT_TARGET_DAYS,
    timezoneIana: DEFAULT_TIMEZONE_IANA,
  };

  if (!baseStatus.operationalEnabled) {
    baseStatus.persistenceAvailable = false;
    return baseStatus;
  }

  const mapPrefsToStatus = (
    prefs: StudyRoutinePreferencesRecord | null,
    demoFallbackActive: boolean,
  ): SettingsRoutineStatus =>
    prefs
      ? {
          operationalEnabled: true,
          persistenceAvailable: true,
          demoFallbackActive,
          hideGamification: prefs.hide_gamification,
          needsOnboarding: !prefs.onboarding_completed_at,
          targetDays: prefs.target_days,
          timezoneIana: prefs.timezone_iana,
        }
      : {
          ...baseStatus,
          demoFallbackActive,
        };

  try {
    const prefs = await createSupabaseRoutineRepository(input.supabase).getPreferences(
      input.userId,
    );
    return mapPrefsToStatus(prefs, false);
  } catch (error) {
    const schemaMissing = isRoutineSchemaError(error);
    if (schemaMissing && isExplicitDevFallbackAllowed()) {
      const devPrefs = await createDevFallbackRepository().getPreferences(input.userId);
      return mapPrefsToStatus(devPrefs, true);
    }

    logRoutineServerError(
      "Rotina semanal indisponível nas configurações.",
      error,
      schemaMissing,
    );
    return {
      ...baseStatus,
      persistenceAvailable: false,
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
      demoFallbackActive: false,
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
      demoFallbackActive: false,
      snapshot,
    };
  } catch (error) {
    if (error instanceof RoutineSchemaUnavailableError) {
      if (isExplicitDevFallbackAllowed()) {
        const mergedCompleted = mergeDevFallbackCompletedUnitIds(
          input.completedContentUnitIds,
          input.userId,
        );
        const devSnapshot = await createRoutineServiceForDevFallback().getSnapshot({
          userId: input.userId,
          topics: [input.topic],
          completedContentUnitIds: mergedCompleted,
          visibleDisciplines: null,
        });
        return {
          operationalEnabled: true,
          persistenceAvailable: true,
          demoFallbackActive: true,
          snapshot: devSnapshot,
        };
      }

      return {
        operationalEnabled: true,
        persistenceAvailable: false,
        demoFallbackActive: false,
        snapshot: buildReadOnlyFallbackSnapshot(input.userId),
      };
    }

    logRoutineServerError("Falha ao carregar barra de sessão na página de estudo.", error, false);
    return {
      operationalEnabled: true,
      persistenceAvailable: false,
      demoFallbackActive: false,
      snapshot: buildReadOnlyFallbackSnapshot(input.userId),
    };
  }
}
