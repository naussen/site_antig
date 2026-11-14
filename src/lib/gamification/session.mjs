import {
  ACTIVE_SESSION_STATUSES,
  BUDGET_MINUTES_OPTIONS,
  DEFAULT_BUDGET_MINUTES,
  DEFAULT_TARGET_DAYS,
  DEFAULT_TIMEZONE_IANA,
} from "./config.mjs";
import {
  addCalendarDays,
  getWeekBoundsForInstant,
  normalizeIanaTimeZone,
  normalizeTargetDays,
  parseValidInstant,
  planPreferenceUpdate,
  previewTimezoneChange,
  resolveEffectiveWeeklyPlan,
  summarizeWeeklyProgress,
} from "./calendar.mjs";

const VALID_STATUS_TRANSITIONS = Object.freeze({
  planned: new Set(["planned", "in_progress", "interrupted", "completed", "discarded"]),
  in_progress: new Set(["in_progress", "interrupted", "completed", "discarded"]),
  interrupted: new Set(["interrupted", "in_progress", "completed", "discarded"]),
  completed: new Set(["completed"]),
  discarded: new Set(["discarded"]),
});

export class RoutineDomainError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {string} [code]
   */
  constructor(message, status = 400, code = "routine_error") {
    super(message);
    this.name = "RoutineDomainError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Valida se uma transição de estado da sessão é permitida pelo domínio.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
export function canTransitionSessionStatus(fromStatus, toStatus) {
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
  return Boolean(allowed && allowed.has(toStatus));
}

/**
 * Valida o orçamento de tempo permitido para sessões curtas no MVP.
 * @param {unknown} value
 * @returns {5 | 15 | 30}
 */
export function normalizeBudgetMinutes(value) {
  const parsed = Number(value);
  if (!BUDGET_MINUTES_OPTIONS.includes(parsed)) {
    throw new RoutineDomainError(
      "Escolha um orçamento de tempo válido: 5, 15 ou 30 minutos.",
      400,
      "invalid_budget_minutes",
    );
  }
  return /** @type {5 | 15 | 30} */ (parsed);
}

/**
 * Estima de forma conservadora o tempo de estudo de uma seção (entre 3 e 45 min).
 * Nunca trunca texto longo: serve apenas para dimensionar a sugestão.
 * @param {{
 *   content_markdown?: string | null;
 *   callouts?: unknown[] | null;
 *   mnemonics?: unknown[] | null;
 *   flashcards?: unknown[] | null;
 *   mermaid_mindmap?: string | null;
 * }} section
 * @returns {number}
 */
export function estimateSectionStudyMinutes(section) {
  const markdown = typeof section?.content_markdown === "string" ? section.content_markdown : "";
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|\[\]()-]/g, " ")
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  const readingMinutes = wordCount / 130;
  const calloutMinutes = Array.isArray(section?.callouts) ? section.callouts.length * 0.6 : 0;
  const mnemonicMinutes = Array.isArray(section?.mnemonics) ? section.mnemonics.length * 0.7 : 0;
  const flashcardMinutes = Array.isArray(section?.flashcards) ? section.flashcards.length * 0.8 : 0;
  const mindmapMinutes = typeof section?.mermaid_mindmap === "string" && section.mermaid_mindmap.trim()
    ? 1.5
    : 0;

  const total = Math.ceil(
    readingMinutes + calloutMinutes + mnemonicMinutes + flashcardMinutes + mindmapMinutes,
  );

  return Math.max(3, Math.min(45, total || 3));
}

/**
 * Filtra tópicos e seções ativos (archived_at == null) preservando ordem didática.
 * @param {Array<Record<string, any>>} topics
 */
export function indexActiveTopics(topics) {
  const activeTopics = [];
  const sectionByContentUnitId = new Map();
  const topicById = new Map();

  for (const topic of topics ?? []) {
    if (!topic || topic.archived_at) continue;
    const activeSections = (topic.sections ?? [])
      .filter((section) => section && !section.archived_at && section.content_unit_id)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    if (activeSections.length === 0) continue;

    const normalizedSections = activeSections.map((section) => {
      const estimatedMinutes = estimateSectionStudyMinutes(section);
      const entry = {
        section_id: section.section_id,
        content_unit_id: section.content_unit_id,
        topic_id: topic.topic_id,
        topic_title: topic.title,
        discipline: topic.discipline || "Geral",
        title: section.title,
        sort_order: section.sort_order ?? 0,
        estimated_minutes: estimatedMinutes,
      };
      sectionByContentUnitId.set(entry.content_unit_id, entry);
      return entry;
    });

    const normalizedTopic = {
      topic_id: topic.topic_id,
      title: topic.title,
      discipline: topic.discipline || "Geral",
      sections: normalizedSections,
    };
    activeTopics.push(normalizedTopic);
    topicById.set(normalizedTopic.topic_id, normalizedTopic);
  }

  return { activeTopics, sectionByContentUnitId, topicById };
}

/**
 * Seleciona 1 ou mais seções contíguas do mesmo tópico respeitando o orçamento de tempo,
 * garantindo sempre ao menos a primeira seção completa mesmo quando ela ultrapassa o orçamento.
 * @param {Array<{
 *   section_id: string;
 *   content_unit_id: string;
 *   topic_id: string;
 *   topic_title: string;
 *   discipline: string;
 *   title: string;
 *   estimated_minutes: number;
 * }>} orderedSections
 * @param {number} startSectionIndex
 * @param {number} budgetMinutes
 */
export function selectSessionActivitiesForBudget(orderedSections, startSectionIndex, budgetMinutes) {
  if (!Array.isArray(orderedSections) || orderedSections.length === 0) {
    return [];
  }
  const safeStart = Math.max(0, Math.min(startSectionIndex, orderedSections.length - 1));
  const selected = [orderedSections[safeStart]];
  let accumulatedMinutes = orderedSections[safeStart].estimated_minutes;

  for (let index = safeStart + 1; index < orderedSections.length && selected.length < 4; index += 1) {
    const candidate = orderedSections[index];
    if (accumulatedMinutes + candidate.estimated_minutes <= budgetMinutes) {
      selected.push(candidate);
      accumulatedMinutes += candidate.estimated_minutes;
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Seleciona o melhor próximo conteúdo ou identifica sessão interrompida para retomar.
 * @param {{
 *   topics: Array<Record<string, any>>;
 *   completedContentUnitIds: Set<string>;
 *   activeSession?: Record<string, any> | null;
 *   preferredDiscipline?: string | null;
 *   visibleDisciplines?: string[] | null;
 *   budgetMinutes?: number;
 *   excludeContentUnitIds?: Set<string>;
 * }} input
 */
export function buildStudyRecommendation(input) {
  const {
    topics = [],
    completedContentUnitIds = new Set(),
    activeSession = null,
    preferredDiscipline = null,
    visibleDisciplines = null,
    budgetMinutes = DEFAULT_BUDGET_MINUTES,
    excludeContentUnitIds = new Set(),
  } = input ?? {};

  const { activeTopics, sectionByContentUnitId } = indexActiveTopics(topics);
  if (activeTopics.length === 0) {
    return null;
  }

  const pickNextSection = (excludedIds = excludeContentUnitIds) => {
    const visibleSet = Array.isArray(visibleDisciplines) && visibleDisciplines.length > 0
      ? new Set(visibleDisciplines)
      : null;

    const visiblePool = visibleSet
      ? activeTopics.filter((topic) => visibleSet.has(topic.discipline))
      : activeTopics;
    const pool = visiblePool.length > 0 ? visiblePool : activeTopics;

    const preferredPool = preferredDiscipline
      ? pool.filter((topic) => topic.discipline === preferredDiscipline)
      : [];
    const orderedPools = preferredPool.length > 0 ? [preferredPool, pool] : [pool];

    for (const candidateTopics of orderedPools) {
      for (const topic of candidateTopics) {
        const eligibleSections = topic.sections.filter((s) => !excludedIds.has(s.content_unit_id));
        if (eligibleSections.length === 0) continue;
        const completedInTopic = topic.sections.filter((s) =>
          completedContentUnitIds.has(s.content_unit_id),
        ).length;
        if (completedInTopic > 0 && completedInTopic < topic.sections.length) {
          const nextSection = eligibleSections.find(
            (s) => !completedContentUnitIds.has(s.content_unit_id),
          );
          if (nextSection) {
            const startIndex = topic.sections.findIndex(
              (s) => s.content_unit_id === nextSection.content_unit_id,
            );
            return {
              topic,
              startIndex,
              isReview: false,
            };
          }
        }
      }

      for (const topic of candidateTopics) {
        const eligibleSections = topic.sections.filter((s) => !excludedIds.has(s.content_unit_id));
        if (eligibleSections.length === 0) continue;
        const completedInTopic = topic.sections.filter((s) =>
          completedContentUnitIds.has(s.content_unit_id),
        ).length;
        if (completedInTopic === 0) {
          const firstEligible = eligibleSections[0];
          const startIndex = topic.sections.findIndex(
            (s) => s.content_unit_id === firstEligible.content_unit_id,
          );
          return {
            topic,
            startIndex,
            isReview: false,
          };
        }
      }
    }

    for (const topic of pool) {
      const firstEligible = topic.sections.find((s) => !excludedIds.has(s.content_unit_id));
      if (firstEligible) {
        const startIndex = topic.sections.findIndex(
          (s) => s.content_unit_id === firstEligible.content_unit_id,
        );
        return {
          topic,
          startIndex,
          isReview: true,
        };
      }
    }

    const fallbackTopic = pool[0];
    return {
      topic: fallbackTopic,
      startIndex: 0,
      isReview: true,
    };
  };

  if (activeSession && ACTIVE_SESSION_STATUSES.includes(activeSession.status)) {
    const activities = (activeSession.activities ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const unavailableActivityIds = [];
    let firstAvailableTarget = null;

    for (const activity of activities) {
      if (activity.status === "skipped") continue;
      const available = activity.activity_type === "summary"
        && typeof activity.content_unit_id === "string"
        && sectionByContentUnitId.has(activity.content_unit_id);

      if (!available) {
        unavailableActivityIds.push(activity.id);
      } else if (!firstAvailableTarget) {
        firstAvailableTarget = sectionByContentUnitId.get(activity.content_unit_id);
      }
    }

    const sessionContentIds = new Set(
      activities.map((activity) => activity.content_unit_id).filter(Boolean),
    );
    const replacement = unavailableActivityIds.length > 0
      ? pickNextSection(sessionContentIds)
      : null;

    return {
      kind: "resume",
      sessionId: activeSession.id,
      sessionStatus: activeSession.status,
      budgetMinutes: activeSession.budget_minutes,
      estimatedMinutes: activeSession.estimated_minutes,
      hasUnavailableContent: unavailableActivityIds.length > 0,
      unavailableActivityIds,
      replacementCandidate: replacement
        ? replacement.topic.sections[replacement.startIndex]
        : null,
      primaryTarget: firstAvailableTarget,
      plannedActivities: activities,
      isReview: false,
    };
  }

  const chosen = pickNextSection(excludeContentUnitIds);
  const plannedSections = selectSessionActivitiesForBudget(
    chosen.topic.sections,
    chosen.startIndex,
    budgetMinutes,
  );
  const estimatedMinutes = plannedSections.reduce(
    (sum, item) => sum + item.estimated_minutes,
    0,
  );

  return {
    kind: "start",
    sessionId: null,
    sessionStatus: null,
    budgetMinutes,
    estimatedMinutes,
    hasUnavailableContent: false,
    unavailableActivityIds: [],
    replacementCandidate: null,
    primaryTarget: plannedSections[0] ?? null,
    plannedActivities: plannedSections,
    isReview: chosen.isReview,
  };
}

/**
 * Cria um coordenador de domínio para rotina de estudo com controle de concorrência,
 * idempotência e isolamento estrito por userId.
 * @param {{
 *   getPreferences: (userId: string) => Promise<Record<string, any> | null>;
 *   upsertPreferences: (userId: string, record: Record<string, any>) => Promise<Record<string, any>>;
 *   listWeeklyPlans: (userId: string) => Promise<Array<Record<string, any>>>;
 *   createWeeklyPlan: (userId: string, plan: Record<string, any>) => Promise<Record<string, any>>;
 *   listSessionsForWeek: (userId: string, weekStartDate: string, weekEndDate: string) => Promise<Array<Record<string, any>>>;
 *   listRecentSessions: (userId: string, limit: number) => Promise<Array<Record<string, any>>>;
 *   findActiveSession: (userId: string) => Promise<Record<string, any> | null>;
 *   findSessionByIdempotencyKey: (userId: string, key: string) => Promise<Record<string, any> | null>;
 *   findSessionByCompletionKey: (userId: string, key: string) => Promise<Record<string, any> | null>;
 *   getSessionById: (userId: string, sessionId: string) => Promise<Record<string, any> | null>;
 *   createSessionWithActivities: (userId: string, session: Record<string, any>, activities: Array<Record<string, any>>) => Promise<Record<string, any>>;
 *   updateSession: (userId: string, sessionId: string, patch: Record<string, any>) => Promise<Record<string, any>>;
 *   updateSessionActivity: (userId: string, sessionId: string, activityId: string, patch: Record<string, any>) => Promise<Record<string, any>>;
 *   completeSessionAtomically: (input: Record<string, any>) => Promise<Record<string, any>>;
 *   markLegacyProgressCompleted: (userId: string, items: Array<{ section_id: string; content_unit_id: string }>) => Promise<void>;
 * }} repository
 */
export function createRoutineService(repository) {
  const lockChains = new Map();

  async function withLock(lockKey, task) {
    const previous = lockChains.get(lockKey) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => current, () => current);
    lockChains.set(lockKey, tail);

    await previous.catch(() => {});
    try {
      return await task();
    } finally {
      release();
      if (lockChains.get(lockKey) === tail) {
        lockChains.delete(lockKey);
      }
    }
  }

  function requireUserId(userId) {
    if (typeof userId !== "string" || !userId.trim()) {
      throw new RoutineDomainError("Autenticação obrigatória.", 401, "unauthorized");
    }
    return userId.trim();
  }

  async function ensureCurrentWeeklyPlan(userId, nowUtc, autoActivateIfMissing = false) {
    if (typeof repository.syncWeeklyPlan === "function") {
      const synced = await repository.syncWeeklyPlan(userId, autoActivateIfMissing, nowUtc);
      const preferences = synced?.preferences ?? null;
      const currentPlan = synced?.currentPlan ?? null;
      const resolution = resolveEffectiveWeeklyPlan({
        preferences,
        existingPlanForCurrentWeek: currentPlan,
        hasPriorWeeklyPlans: Boolean(currentPlan),
        nowUtc,
      });
      return { preferences, currentPlan, resolution };
    }

    let preferences = await repository.getPreferences(userId);
    const weeklyPlans = await repository.listWeeklyPlans(userId);
    const hasPriorWeeklyPlans = weeklyPlans.length > 0;

    if (!preferences && autoActivateIfMissing) {
      preferences = await repository.upsertPreferences(userId, {
        user_id: userId,
        target_days: DEFAULT_TARGET_DAYS,
        timezone_iana: DEFAULT_TIMEZONE_IANA,
        default_budget_minutes: DEFAULT_BUDGET_MINUTES,
        preferred_discipline: null,
        hide_gamification: false,
        pending_target_days: null,
        pending_timezone_iana: null,
        pending_effective_week_start: null,
        onboarding_completed_at: parseValidInstant(nowUtc).toISOString(),
      });
    } else if (preferences && !preferences.onboarding_completed_at && autoActivateIfMissing) {
      preferences = await repository.upsertPreferences(userId, {
        ...preferences,
        user_id: userId,
        onboarding_completed_at: parseValidInstant(nowUtc).toISOString(),
      });
    }

    const baseTimezone = normalizeIanaTimeZone(preferences?.timezone_iana);
    const baseBounds = getWeekBoundsForInstant(nowUtc, baseTimezone);

    // Procura plano existente que contenha a data local atual ou corresponda à semana atual.
    let existingPlanForCurrentWeek = weeklyPlans.find(
      (plan) => plan.week_start_date === baseBounds.weekStartDate,
    ) ?? null;

    if (!existingPlanForCurrentWeek && weeklyPlans.length > 0) {
      existingPlanForCurrentWeek = weeklyPlans.find((plan) => {
        const planBounds = getWeekBoundsForInstant(nowUtc, plan.timezone_iana);
        return planBounds.localDate >= plan.week_start_date && planBounds.localDate <= plan.week_end_date;
      }) ?? null;
    }

    const resolution = resolveEffectiveWeeklyPlan({
      preferences,
      existingPlanForCurrentWeek,
      hasPriorWeeklyPlans,
      nowUtc,
    });

    let currentPlan = existingPlanForCurrentWeek;

    if (!resolution.needsOnboarding && resolution.shouldPersistPlan && !currentPlan) {
      currentPlan = await repository.createWeeklyPlan(userId, {
        user_id: userId,
        week_start_date: resolution.weekStartDate,
        week_end_date: resolution.weekEndDate,
        target_days: resolution.targetDays,
        timezone_iana: resolution.timezoneIana,
        is_partial_first_week: resolution.isPartialFirstWeek,
      });

      if (resolution.shouldPromotePending && preferences) {
        preferences = await repository.upsertPreferences(userId, {
          ...preferences,
          user_id: userId,
          target_days: resolution.targetDays,
          timezone_iana: resolution.timezoneIana,
          pending_target_days: null,
          pending_timezone_iana: null,
          pending_effective_week_start: null,
        });
      }
    }

    return { preferences, currentPlan, resolution };
  }

  async function buildWeeklyProgressSnapshot(userId, currentPlan, resolution) {
    const weekSessions = await repository.listSessionsForWeek(
      userId,
      resolution.weekStartDate,
      resolution.weekEndDate,
    );

    return summarizeWeeklyProgress({
      weekStartDate: currentPlan?.week_start_date ?? resolution.weekStartDate,
      weekEndDate: currentPlan?.week_end_date ?? resolution.weekEndDate,
      targetDays: currentPlan?.target_days ?? resolution.targetDays,
      timezoneIana: currentPlan?.timezone_iana ?? resolution.timezoneIana,
      isPartialFirstWeek: currentPlan?.is_partial_first_week ?? resolution.isPartialFirstWeek,
      sessions: weekSessions,
    });
  }

  return {
    async getSnapshot({
      userId,
      topics = [],
      completedContentUnitIds = new Set(),
      visibleDisciplines = null,
      nowUtc = new Date(),
    }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);

      const { preferences, currentPlan, resolution } = await withLock(
        `user:${uid}`,
        () => ensureCurrentWeeklyPlan(uid, instant, false),
      );

      const [weeklyProgress, recentSessions, activeSession] = await Promise.all([
        buildWeeklyProgressSnapshot(uid, currentPlan, resolution),
        repository.listRecentSessions(uid, 10),
        repository.findActiveSession(uid),
      ]);

      const effectiveBudget = activeSession?.budget_minutes
        ?? preferences?.default_budget_minutes
        ?? DEFAULT_BUDGET_MINUTES;

      const recommendation = buildStudyRecommendation({
        topics,
        completedContentUnitIds,
        activeSession,
        preferredDiscipline: preferences?.preferred_discipline ?? null,
        visibleDisciplines,
        budgetMinutes: effectiveBudget,
      });

      const activeTz = currentPlan?.timezone_iana ?? preferences?.timezone_iana ?? DEFAULT_TIMEZONE_IANA;

      return {
        needsOnboarding: resolution.needsOnboarding,
        preferences: preferences ?? {
          user_id: uid,
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
        currentPlan,
        weeklyProgress,
        activeSession,
        recentSessions,
        recommendation,
        timezonePreviewNow: previewTimezoneChange({
          currentTimezoneIana: activeTz,
          nextTimezoneIana: preferences?.pending_timezone_iana ?? activeTz,
          nowUtc: instant,
        }),
        moduleAvailability: {
          summaries: true,
          laws: false,
          questions: false,
          flashcards: false,
        },
        accountOwnershipNotice: "Metas e progresso desta rotina pertencem a esta conta.",
      };
    },

    async savePreferences({
      userId,
      targetDays,
      timezoneIana,
      defaultBudgetMinutes,
      preferredDiscipline,
      hideGamification,
      nowUtc = new Date(),
    }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);

      return withLock(`user:${uid}`, async () => {
        const hasTargetDays = targetDays !== undefined;
        const hasTimezone = timezoneIana !== undefined;
        const normalizedTargetDays = hasTargetDays ? normalizeTargetDays(targetDays) : undefined;
        const normalizedTimezone = hasTimezone ? normalizeIanaTimeZone(timezoneIana) : undefined;
        const normalizedBudget = defaultBudgetMinutes !== undefined
          ? normalizeBudgetMinutes(defaultBudgetMinutes)
          : undefined;
        const normalizedHide = hideGamification !== undefined
          ? Boolean(hideGamification)
          : undefined;
        const hasPreferredDisciplinePatch = preferredDiscipline !== undefined;
        const normalizedDiscipline = hasPreferredDisciplinePatch
          ? (preferredDiscipline ? String(preferredDiscipline).trim().slice(0, 120) : null)
          : undefined;

        const activateOnboarding = hasTargetDays
          || hasTimezone
          || normalizedBudget !== undefined
          || hasPreferredDisciplinePatch;

        if (typeof repository.savePreferencesAtomically === "function") {
          return repository.savePreferencesAtomically(uid, {
            targetDays: normalizedTargetDays,
            timezoneIana: normalizedTimezone,
            defaultBudgetMinutes: normalizedBudget,
            preferredDiscipline: normalizedDiscipline ?? undefined,
            clearPreferredDiscipline: hasPreferredDisciplinePatch && normalizedDiscipline === null,
            hideGamification: normalizedHide,
            nowUtc: instant,
          });
        }

        const { preferences: currentPreferences, currentPlan } = await ensureCurrentWeeklyPlan(
          uid,
          instant,
          false,
        );

        const nextBudget = normalizedBudget
          ?? (currentPreferences?.default_budget_minutes ?? DEFAULT_BUDGET_MINUTES);
        const nextHide = normalizedHide
          ?? Boolean(currentPreferences?.hide_gamification);
        const nextPreferredDiscipline = hasPreferredDisciplinePatch
          ? (normalizedDiscipline ?? null)
          : (currentPreferences?.preferred_discipline ?? null);

        const updatePlan = planPreferenceUpdate({
          currentPreferences,
          currentWeeklyPlan: currentPlan,
          nextTargetDays: normalizedTargetDays,
          nextTimezoneIana: normalizedTimezone,
          activateOnboarding,
          nowUtc: instant,
        });

        const updatedPreferences = await repository.upsertPreferences(uid, {
          user_id: uid,
          target_days: updatePlan.appliedTargetDays,
          timezone_iana: updatePlan.appliedTimezoneIana,
          default_budget_minutes: nextBudget,
          preferred_discipline: nextPreferredDiscipline,
          hide_gamification: nextHide,
          pending_target_days: updatePlan.pendingTargetDays,
          pending_timezone_iana: updatePlan.pendingTimezoneIana,
          pending_effective_week_start: updatePlan.pendingEffectiveWeekStart,
          onboarding_completed_at: updatePlan.onboardingCompletedAt,
        });

        let activePlan = currentPlan;
        if (updatePlan.shouldPersistPlan && updatePlan.isFirstActivation && !activePlan) {
          activePlan = await repository.createWeeklyPlan(uid, {
            user_id: uid,
            week_start_date: updatePlan.effectiveWeekStartDate,
            week_end_date: updatePlan.weekEndDate,
            target_days: updatePlan.appliedTargetDays,
            timezone_iana: updatePlan.appliedTimezoneIana,
            is_partial_first_week: updatePlan.isPartialFirstWeek,
          });
        }

        return {
          preferences: updatedPreferences,
          currentPlan: activePlan,
          updatePlan,
        };
      });
    },

    async startOrResumeSession({
      userId,
      topics = [],
      completedContentUnitIds = new Set(),
      visibleDisciplines = null,
      budgetMinutes = DEFAULT_BUDGET_MINUTES,
      topicId = null,
      sectionId = null,
      contentUnitId = null,
      idempotencyKey,
      replaceActive = false,
      nowUtc = new Date(),
    }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);
      const safeBudget = normalizeBudgetMinutes(budgetMinutes);
      const safeKey = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";

      if (!safeKey || safeKey.length > 128) {
        throw new RoutineDomainError("Chave de idempotência da sessão inválida.", 400, "invalid_idempotency_key");
      }

      return withLock(`user:${uid}`, async () => {
        const existingByKey = await repository.findSessionByIdempotencyKey(uid, safeKey);
        if (existingByKey) {
          return { session: existingByKey, resumed: true, idempotent: true };
        }

        const { activeTopics, sectionByContentUnitId, topicById } = indexActiveTopics(topics);

        const existingActive = await repository.findActiveSession(uid);
        if (existingActive) {
          const requestedSameUnit = !contentUnitId && !topicId
            ? true
            : Boolean(
                existingActive.activities?.some(
                  (activity) =>
                    (contentUnitId && activity.content_unit_id === contentUnitId)
                    || (!contentUnitId && topicId && activity.topic_id === topicId),
                ),
              );

          if (!replaceActive && requestedSameUnit) {
            const resumed = existingActive.status === "in_progress"
              ? existingActive
              : await repository.updateSession(uid, existingActive.id, {
                  status: "in_progress",
                  last_activity_at: instant.toISOString(),
                });
            return { session: resumed, resumed: true, idempotent: false };
          }

          if (!repository.usesTransactionalRpcs) {
            await repository.updateSession(uid, existingActive.id, {
              status: "discarded",
              last_activity_at: instant.toISOString(),
            });
          }
        }

        const { preferences, currentPlan, resolution } = await ensureCurrentWeeklyPlan(
          uid,
          instant,
          !repository.usesTransactionalRpcs,
        );

        let plannedSections = [];
        let selectionMode = "recommended";

        if (contentUnitId || topicId) {
          selectionMode = "manual";
          if (contentUnitId) {
            const target = sectionByContentUnitId.get(contentUnitId);
            if (!target || (topicId && target.topic_id !== topicId)) {
              throw new RoutineDomainError("Conteúdo indisponível ou restrito.", 404, "content_unavailable");
            }
            const topic = topicById.get(target.topic_id);
            const startIndex = topic.sections.findIndex((s) => s.content_unit_id === contentUnitId);
            plannedSections = selectSessionActivitiesForBudget(topic.sections, startIndex, safeBudget);
          } else if (topicId) {
            const topic = topicById.get(topicId);
            if (!topic) {
              throw new RoutineDomainError("Tópico indisponível ou restrito.", 404, "content_unavailable");
            }
            const explicitIndex = sectionId
              ? topic.sections.findIndex((s) => s.section_id === sectionId)
              : -1;
            const firstUncompletedIndex = topic.sections.findIndex(
              (s) => !completedContentUnitIds.has(s.content_unit_id),
            );
            const startIndex = explicitIndex >= 0
              ? explicitIndex
              : (firstUncompletedIndex >= 0 ? firstUncompletedIndex : 0);
            plannedSections = selectSessionActivitiesForBudget(topic.sections, startIndex, safeBudget);
          }
        } else {
          if (activeTopics.length === 0) {
            throw new RoutineDomainError("Nenhum conteúdo disponível para estudo.", 404, "no_available_content");
          }
          const recommendation = buildStudyRecommendation({
            topics,
            completedContentUnitIds,
            activeSession: null,
            preferredDiscipline: preferences?.preferred_discipline ?? null,
            visibleDisciplines,
            budgetMinutes: safeBudget,
          });
          plannedSections = recommendation?.plannedActivities ?? [];
        }

        if (plannedSections.length === 0) {
          throw new RoutineDomainError("Conteúdo indisponível ou restrito.", 404, "content_unavailable");
        }

        const estimatedMinutes = plannedSections.reduce(
          (sum, section) => sum + section.estimated_minutes,
          0,
        );

        const createdResult = await repository.createSessionWithActivities(
          uid,
          {
            user_id: uid,
            weekly_plan_id: currentPlan?.id ?? resolution.planId,
            status: "in_progress",
            budget_minutes: safeBudget,
            estimated_minutes: Math.max(1, estimatedMinutes),
            selection_mode: selectionMode,
            idempotency_key: safeKey,
            started_at: instant.toISOString(),
            last_activity_at: instant.toISOString(),
          },
          plannedSections.map((section, index) => ({
            user_id: uid,
            order_index: index,
            activity_type: "summary",
            status: "pending",
            topic_id: section.topic_id,
            topic_title: section.topic_title,
            discipline: section.discipline,
            section_id: section.section_id,
            content_unit_id: section.content_unit_id,
            activity_title: section.title,
            estimated_minutes: section.estimated_minutes,
            evidence_kind: "self_declared",
          })),
          { replaceActive: Boolean(replaceActive) },
        );

        if (createdResult && typeof createdResult === "object" && "session" in createdResult && createdResult.session) {
          return {
            session: createdResult.session,
            resumed: Boolean(createdResult.resumed),
            idempotent: Boolean(createdResult.idempotent),
          };
        }

        return { session: createdResult, resumed: false, idempotent: false };
      });
    },

    async updateSessionStatus({ userId, sessionId, status, nowUtc = new Date() }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);

      if (status === "completed") {
        throw new RoutineDomainError(
          "Use a conclusão explícita da sessão para registrar atividades.",
          400,
          "use_complete_session",
        );
      }

      return withLock(`user:${uid}`, async () => {
        const session = await repository.getSessionById(uid, sessionId);
        if (!session || session.user_id !== uid) {
          throw new RoutineDomainError("Sessão não encontrada.", 404, "session_not_found");
        }

        if (!canTransitionSessionStatus(session.status, status)) {
          throw new RoutineDomainError(
            "Esta sessão já foi encerrada e não aceita esta transição.",
            409,
            "invalid_transition",
          );
        }

        return repository.updateSession(uid, sessionId, {
          status,
          last_activity_at: instant.toISOString(),
        });
      });
    },

    async replaceUnavailableActivity({
      userId,
      sessionId,
      activityId,
      topics = [],
      completedContentUnitIds = new Set(),
      visibleDisciplines = null,
      nowUtc = new Date(),
    }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);

      return withLock(`user:${uid}`, async () => {
        const session = await repository.getSessionById(uid, sessionId);
        if (!session || session.user_id !== uid) {
          throw new RoutineDomainError("Sessão não encontrada.", 404, "session_not_found");
        }
        if (session.status === "completed" || session.status === "discarded") {
          throw new RoutineDomainError(
            "Não é possível alterar atividades de uma sessão encerrada.",
            409,
            "invalid_transition",
          );
        }

        const targetActivity = session.activities?.find((item) => item.id === activityId);
        if (!targetActivity) {
          throw new RoutineDomainError("Atividade não encontrada nesta sessão.", 404, "activity_not_found");
        }

        const usedIds = new Set(
          (session.activities ?? [])
            .map((item) => item.content_unit_id)
            .filter(Boolean),
        );

        const replacement = buildStudyRecommendation({
          topics,
          completedContentUnitIds,
          activeSession: null,
          visibleDisciplines,
          budgetMinutes: session.budget_minutes,
          excludeContentUnitIds: usedIds,
        });

        const nextSection = replacement?.primaryTarget;
        if (!nextSection) {
          throw new RoutineDomainError(
            "Não há outro resumo disponível para substituição.",
            404,
            "no_replacement_available",
          );
        }

        if (typeof repository.replaceSessionActivityAtomically === "function") {
          return repository.replaceSessionActivityAtomically(uid, sessionId, activityId, {
            topic_id: nextSection.topic_id,
            topic_title: nextSection.topic_title,
            discipline: nextSection.discipline,
            section_id: nextSection.section_id,
            content_unit_id: nextSection.content_unit_id,
            activity_title: nextSection.title,
            estimated_minutes: nextSection.estimated_minutes,
          });
        }

        await repository.updateSessionActivity(uid, sessionId, activityId, {
          topic_id: nextSection.topic_id,
          topic_title: nextSection.topic_title,
          discipline: nextSection.discipline,
          section_id: nextSection.section_id,
          content_unit_id: nextSection.content_unit_id,
          activity_title: nextSection.title,
          estimated_minutes: nextSection.estimated_minutes,
          status: "pending",
        });

        const refreshed = await repository.getSessionById(uid, sessionId);
        const updatedEstimate = (refreshed?.activities ?? []).reduce(
          (sum, item) => sum + (item.estimated_minutes ?? 0),
          0,
        );

        return repository.updateSession(uid, sessionId, {
          estimated_minutes: Math.max(1, updatedEstimate),
          last_activity_at: instant.toISOString(),
        });
      });
    },

    async completeSession({
      userId,
      sessionId,
      completedActivityIds,
      completionIdempotencyKey,
      topics = [],
      nowUtc = new Date(),
    }) {
      const uid = requireUserId(userId);
      const instant = parseValidInstant(nowUtc);
      const safeCompletionKey = typeof completionIdempotencyKey === "string"
        ? completionIdempotencyKey.trim()
        : "";

      if (!safeCompletionKey || safeCompletionKey.length > 128) {
        throw new RoutineDomainError(
          "Chave de idempotência da conclusão inválida.",
          400,
          "invalid_completion_key",
        );
      }

      return withLock(`user:${uid}`, async () => {
        const existingByCompletionKey = await repository.findSessionByCompletionKey(
          uid,
          safeCompletionKey,
        );
        if (existingByCompletionKey && existingByCompletionKey.id === sessionId) {
          const { currentPlan, resolution } = await ensureCurrentWeeklyPlan(uid, instant, false);
          const weeklyProgress = await buildWeeklyProgressSnapshot(
            uid,
            currentPlan,
            {
              ...resolution,
              weekStartDate: existingByCompletionKey.completed_week_start_date ?? resolution.weekStartDate,
            },
          );
          return {
            session: existingByCompletionKey,
            idempotent: true,
            weeklyProgress,
          };
        }

        const session = await repository.getSessionById(uid, sessionId);
        if (!session || session.user_id !== uid) {
          throw new RoutineDomainError("Sessão não encontrada.", 404, "session_not_found");
        }

        if (session.status === "completed") {
          const { currentPlan, resolution } = await ensureCurrentWeeklyPlan(uid, instant, false);
          const weeklyProgress = await buildWeeklyProgressSnapshot(
            uid,
            currentPlan,
            {
              ...resolution,
              weekStartDate: session.completed_week_start_date ?? resolution.weekStartDate,
            },
          );
          return { session, idempotent: true, weeklyProgress };
        }

        if (!canTransitionSessionStatus(session.status, "completed")) {
          throw new RoutineDomainError(
            "Esta sessão foi descartada e não pode ser concluída.",
            409,
            "invalid_transition",
          );
        }

        const requestedIds = Array.isArray(completedActivityIds)
          ? Array.from(new Set(completedActivityIds.filter((id) => typeof id === "string" && id.trim())))
          : [];
        if (requestedIds.length === 0) {
          throw new RoutineDomainError(
            "Marque pelo menos uma seção estudada para concluir a sessão.",
            400,
            "no_completed_activity",
          );
        }

        const activitiesById = new Map((session.activities ?? []).map((item) => [item.id, item]));
        const selectedActivities = requestedIds
          .map((id) => activitiesById.get(id))
          .filter(Boolean);

        if (selectedActivities.length === 0) {
          throw new RoutineDomainError(
            "As atividades selecionadas não pertencem a esta sessão.",
            400,
            "invalid_activity_selection",
          );
        }

        const { sectionByContentUnitId } = indexActiveTopics(topics);
        for (const activity of selectedActivities) {
          if (
            activity.activity_type !== "summary"
            || !activity.content_unit_id
            || !sectionByContentUnitId.has(activity.content_unit_id)
          ) {
            throw new RoutineDomainError(
              "Um conteúdo desta sessão ficou indisponível. Substitua-o antes de concluir.",
              409,
              "activity_unavailable",
            );
          }
        }

        const { currentPlan, resolution } = await ensureCurrentWeeklyPlan(
          uid,
          instant,
          !repository.usesTransactionalRpcs,
        );
        const completionTimezone = currentPlan?.timezone_iana ?? resolution.timezoneIana;
        const completionBounds = getWeekBoundsForInstant(instant, completionTimezone);

        const completedSession = await repository.completeSessionAtomically({
          userId: uid,
          sessionId,
          weeklyPlanId: currentPlan?.id ?? resolution.planId ?? null,
          completedActivityIds: selectedActivities.map((item) => item.id),
          completionIdempotencyKey: safeCompletionKey,
          completedAt: instant.toISOString(),
          completedLocalDate: completionBounds.localDate,
          completedWeekStartDate: completionBounds.weekStartDate,
          completedTimezoneIana: completionTimezone,
        });

        await repository.markLegacyProgressCompleted(
          uid,
          selectedActivities
            .filter((item) => item.section_id && item.content_unit_id)
            .map((item) => ({
              section_id: item.section_id,
              content_unit_id: item.content_unit_id,
            })),
        );

        const effectiveWeekStart = completedSession.completed_week_start_date ?? completionBounds.weekStartDate;
        const effectiveWeekEnd = completedSession.completed_week_start_date
          ? addCalendarDays(completedSession.completed_week_start_date, 6)
          : completionBounds.weekEndDate;

        const weeklyProgress = await buildWeeklyProgressSnapshot(uid, currentPlan, {
          ...resolution,
          timezoneIana: completedSession.completed_timezone_iana ?? resolution.timezoneIana,
          weekStartDate: effectiveWeekStart,
          weekEndDate: effectiveWeekEnd,
        });

        return {
          session: completedSession,
          idempotent: false,
          weeklyProgress,
        };
      });
    },
  };
}
