import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  buildStudyRecommendation,
  canTransitionSessionStatus,
  createRoutineService,
  estimateSectionStudyMinutes,
  RoutineDomainError,
  selectSessionActivitiesForBudget,
} from "../src/lib/gamification/session.mjs";

function makeTopicsFixture() {
  return [
    {
      topic_id: "direito-constitucional-principios",
      title: "Princípios Fundamentais",
      discipline: "Direito Constitucional",
      archived_at: null,
      sections: [
        {
          section_id: "sec-01",
          content_unit_id: "11111111-1111-4111-8111-111111111111",
          title: "Fundamentos da República",
          content_markdown: "palavra ".repeat(450),
          callouts: [{ type: "info", title: "Resumo", text: "Art. 1º" }],
          mnemonics: [{ key: "SO-CI-DI-VA-PLU", meaning: "Fundamentos", description: "Art. 1º" }],
          flashcards: [{ question: "Q1", answer: "Gabarito: CERTO." }],
          mermaid_mindmap: "graph TD\nA-->B",
          sort_order: 1,
          archived_at: null,
        },
        {
          section_id: "sec-02",
          content_unit_id: "22222222-2222-4222-8222-222222222222",
          title: "Objetivos Fundamentais",
          content_markdown: "texto ".repeat(260),
          callouts: [],
          mnemonics: [],
          flashcards: [],
          mermaid_mindmap: null,
          sort_order: 2,
          archived_at: null,
        },
      ],
    },
    {
      topic_id: "direito-administrativo-atos",
      title: "Atos Administrativos",
      discipline: "Direito Administrativo",
      archived_at: null,
      sections: [
        {
          section_id: "adm-sec-01",
          content_unit_id: "33333333-3333-4333-8333-333333333333",
          title: "Elementos e Atributos",
          content_markdown: "conteudo ".repeat(3900),
          callouts: [],
          mnemonics: [],
          flashcards: [],
          mermaid_mindmap: null,
          sort_order: 1,
          archived_at: null,
        },
      ],
    },
  ];
}

function createInMemoryRoutineRepo({ failNextCompletion = false } = {}) {
  const preferencesByUser = new Map();
  const weeklyPlansByUser = new Map();
  const sessionsById = new Map();
  const legacyProgressByUser = new Map();
  let shouldFailCompletion = failNextCompletion;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const yieldTick = () => new Promise((resolve) => setTimeout(resolve, 2));

  return {
    legacyProgressByUser,
    setFailNextCompletion(value) {
      shouldFailCompletion = value;
    },
    async getPreferences(userId) {
      await yieldTick();
      return clone(preferencesByUser.get(userId) ?? null);
    },
    async upsertPreferences(userId, record) {
      await yieldTick();
      const existing = preferencesByUser.get(userId) ?? {};
      const next = { ...existing, ...record, user_id: userId, updated_at: new Date().toISOString() };
      preferencesByUser.set(userId, next);
      return clone(next);
    },
    async listWeeklyPlans(userId) {
      await yieldTick();
      const plans = weeklyPlansByUser.get(userId) ?? [];
      return clone(plans.slice().sort((a, b) => b.week_start_date.localeCompare(a.week_start_date)));
    },
    async createWeeklyPlan(userId, plan) {
      await yieldTick();
      const existingList = weeklyPlansByUser.get(userId) ?? [];
      const found = existingList.find((item) => item.week_start_date === plan.week_start_date);
      if (found) return clone(found);
      const created = { id: randomUUID(), ...plan, user_id: userId };
      existingList.push(created);
      weeklyPlansByUser.set(userId, existingList);
      return clone(created);
    },
    async listSessionsForWeek(userId, weekStartDate, weekEndDate) {
      await yieldTick();
      const all = Array.from(sessionsById.values()).filter(
        (s) =>
          s.user_id === userId
          && s.status === "completed"
          && (
            s.completed_week_start_date === weekStartDate
            || (s.completed_local_date && s.completed_local_date >= weekStartDate && s.completed_local_date <= weekEndDate)
          ),
      );
      return clone(all);
    },
    async listRecentSessions(userId, limit) {
      await yieldTick();
      const all = Array.from(sessionsById.values())
        .filter((s) => s.user_id === userId)
        .sort((a, b) => b.started_at.localeCompare(a.started_at))
        .slice(0, limit);
      return clone(all);
    },
    async findActiveSession(userId) {
      await yieldTick();
      const active = Array.from(sessionsById.values()).find(
        (s) =>
          s.user_id === userId
          && (s.status === "planned" || s.status === "in_progress" || s.status === "interrupted"),
      );
      return clone(active ?? null);
    },
    async findSessionByIdempotencyKey(userId, key) {
      await yieldTick();
      const found = Array.from(sessionsById.values()).find(
        (s) => s.user_id === userId && s.idempotency_key === key,
      );
      return clone(found ?? null);
    },
    async findSessionByCompletionKey(userId, key) {
      await yieldTick();
      const found = Array.from(sessionsById.values()).find(
        (s) => s.user_id === userId && s.completion_idempotency_key === key,
      );
      return clone(found ?? null);
    },
    async getSessionById(userId, sessionId) {
      await yieldTick();
      const found = sessionsById.get(sessionId);
      if (!found || found.user_id !== userId) return null;
      return clone(found);
    },
    async createSessionWithActivities(userId, sessionInput, activitiesInput) {
      await yieldTick();
      const id = randomUUID();
      const activities = activitiesInput.map((item) => ({
        id: randomUUID(),
        session_id: id,
        user_id: userId,
        completed_at: null,
        ...item,
      }));
      const session = {
        id,
        ...sessionInput,
        user_id: userId,
        completion_idempotency_key: null,
        completed_at: null,
        completed_local_date: null,
        completed_week_start_date: null,
        completed_timezone_iana: null,
        activities,
      };
      sessionsById.set(id, session);
      return clone(session);
    },
    async updateSession(userId, sessionId, patch) {
      await yieldTick();
      const current = sessionsById.get(sessionId);
      if (!current || current.user_id !== userId) throw new Error("not_found");
      const next = { ...current, ...patch };
      sessionsById.set(sessionId, next);
      return clone(next);
    },
    async updateSessionActivity(userId, sessionId, activityId, patch) {
      await yieldTick();
      const current = sessionsById.get(sessionId);
      if (!current || current.user_id !== userId) throw new Error("not_found");
      let updatedActivity = null;
      current.activities = current.activities.map((item) => {
        if (item.id !== activityId) return item;
        updatedActivity = { ...item, ...patch };
        return updatedActivity;
      });
      sessionsById.set(sessionId, current);
      return clone(updatedActivity);
    },
    async completeSessionAtomically(input) {
      await yieldTick();
      if (shouldFailCompletion) {
        throw new Error("simulated_network_or_db_failure");
      }
      const current = sessionsById.get(input.sessionId);
      if (!current || current.user_id !== input.userId) throw new Error("not_found");
      if (current.status === "completed") return clone(current);

      const completedSet = new Set(input.completedActivityIds);
      current.activities = current.activities.map((activity) =>
        completedSet.has(activity.id)
          ? { ...activity, status: "completed", completed_at: input.completedAt }
          : activity,
      );
      current.status = "completed";
      current.weekly_plan_id = input.weeklyPlanId ?? current.weekly_plan_id;
      current.completion_idempotency_key = input.completionIdempotencyKey;
      current.completed_at = input.completedAt;
      current.last_activity_at = input.completedAt;
      current.completed_local_date = input.completedLocalDate;
      current.completed_week_start_date = input.completedWeekStartDate;
      current.completed_timezone_iana = input.completedTimezoneIana;
      sessionsById.set(current.id, current);
      return clone(current);
    },
    async markLegacyProgressCompleted(userId, items) {
      await yieldTick();
      const map = legacyProgressByUser.get(userId) ?? new Map();
      for (const item of items) {
        map.set(item.content_unit_id, true);
      }
      legacyProgressByUser.set(userId, map);
    },
  };
}

test("estima tempo conservador e não corta seção longa mesmo com orçamento de 5 minutos", () => {
  const topics = makeTopicsFixture();
  const shortSection = topics[0].sections[1];
  const longSection = topics[1].sections[0];

  const shortEstimate = estimateSectionStudyMinutes(shortSection);
  const longEstimate = estimateSectionStudyMinutes(longSection);
  assert.equal(shortEstimate >= 3, true);
  assert.equal(longEstimate, 30);

  const selected = selectSessionActivitiesForBudget(
    [
      { ...shortSection, topic_id: "t1", topic_title: "T1", discipline: "D1", estimated_minutes: 3 },
      { ...longSection, topic_id: "t1", topic_title: "T1", discipline: "D1", estimated_minutes: 30 },
    ],
    1,
    5,
  );
  assert.equal(selected.length, 1);
  assert.equal(selected[0].content_unit_id, longSection.content_unit_id);
});

test("valida transições de estado e impede reabrir sessão concluída ou descartada", () => {
  assert.equal(canTransitionSessionStatus("planned", "in_progress"), true);
  assert.equal(canTransitionSessionStatus("in_progress", "interrupted"), true);
  assert.equal(canTransitionSessionStatus("interrupted", "in_progress"), true);
  assert.equal(canTransitionSessionStatus("interrupted", "completed"), true);
  assert.equal(canTransitionSessionStatus("completed", "interrupted"), false);
  assert.equal(canTransitionSessionStatus("discarded", "completed"), false);
});

test("primeiro acesso sem meta sugere escolha inicial sem inventar histórico", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();

  const snapshot = await service.getSnapshot({
    userId: "user-a",
    topics,
    completedContentUnitIds: new Set(["11111111-1111-4111-8111-111111111111"]),
    nowUtc: new Date("2026-11-11T15:00:00.000Z"),
  });

  assert.equal(snapshot.needsOnboarding, true);
  assert.equal(snapshot.preferences.target_days, 3);
  assert.equal(snapshot.weeklyProgress.completedDaysCount, 0);
  assert.equal(snapshot.recentSessions.length, 0);
  // Mesmo havendo checkbox legado antigo, ele orienta o próximo conteúdo sem criar sessões falsas.
  assert.equal(
    snapshot.recommendation?.primaryTarget?.content_unit_id,
    "22222222-2222-4222-8222-222222222222",
  );
});

test("duplo clique e duas abas concorrentes criam apenas uma sessão e uma conclusão", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();
  const now = new Date("2026-11-11T18:00:00.000Z");

  const [start1, start2] = await Promise.all([
    service.startOrResumeSession({
      userId: "user-a",
      topics,
      completedContentUnitIds: new Set(),
      budgetMinutes: 15,
      idempotencyKey: "tab-1-start",
      nowUtc: now,
    }),
    service.startOrResumeSession({
      userId: "user-a",
      topics,
      completedContentUnitIds: new Set(),
      budgetMinutes: 15,
      idempotencyKey: "tab-2-start",
      nowUtc: now,
    }),
  ]);

  assert.equal(start1.session.id, start2.session.id);
  const activityIds = [start1.session.activities[0].id];

  const [complete1, complete2] = await Promise.all([
    service.completeSession({
      userId: "user-a",
      sessionId: start1.session.id,
      completedActivityIds: activityIds,
      completionIdempotencyKey: "complete-key-1",
      topics,
      nowUtc: now,
    }),
    service.completeSession({
      userId: "user-a",
      sessionId: start1.session.id,
      completedActivityIds: activityIds,
      completionIdempotencyKey: "complete-key-2",
      topics,
      nowUtc: now,
    }),
  ]);

  assert.equal(complete1.session.id, complete2.session.id);
  assert.equal(complete1.idempotent || complete2.idempotent, true);
  assert.equal(complete2.weeklyProgress.completedDaysCount, 1);
  assert.equal(complete2.weeklyProgress.totalCompletedSessionsInWeek, 1);

  // Resposta perdida após gravação: retentativa com a mesma chave recupera o mesmo estado
  const retry = await service.completeSession({
    userId: "user-a",
    sessionId: start1.session.id,
    completedActivityIds: activityIds,
    completionIdempotencyKey: "complete-key-1",
    topics,
    nowUtc: new Date("2026-11-11T18:05:00.000Z"),
  });
  assert.equal(retry.idempotent, true);
  assert.equal(retry.session.completed_at, complete1.session.completed_at);
});

test("falha antes da gravação não gera sucesso falso e preserva sessão para nova tentativa", async () => {
  const repo = createInMemoryRoutineRepo({ failNextCompletion: true });
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();
  const now = new Date("2026-11-12T15:00:00.000Z");

  const { session } = await service.startOrResumeSession({
    userId: "user-a",
    topics,
    completedContentUnitIds: new Set(),
    budgetMinutes: 15,
    idempotencyKey: "net-fail-start",
    nowUtc: now,
  });

  await assert.rejects(() =>
    service.completeSession({
      userId: "user-a",
      sessionId: session.id,
      completedActivityIds: [session.activities[0].id],
      completionIdempotencyKey: "net-fail-complete",
      topics,
      nowUtc: now,
    }),
  );

  const afterFailure = await repo.getSessionById("user-a", session.id);
  assert.equal(afterFailure.status, "in_progress");
  assert.equal(afterFailure.completed_at, null);

  repo.setFailNextCompletion(false);
  const recovered = await service.completeSession({
    userId: "user-a",
    sessionId: session.id,
    completedActivityIds: [session.activities[0].id],
    completionIdempotencyKey: "net-fail-complete",
    topics,
    nowUtc: now,
  });
  assert.equal(recovered.session.status, "completed");
  assert.equal(recovered.weeklyProgress.completedDaysCount, 1);
});

test("releitura em dias diferentes conta cada dia e desmarcar seção depois não apaga histórico", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();

  const day1 = await service.startOrResumeSession({
    userId: "user-a",
    topics,
    completedContentUnitIds: new Set(),
    budgetMinutes: 5,
    contentUnitId: "11111111-1111-4111-8111-111111111111",
    idempotencyKey: "day1-start",
    nowUtc: new Date("2026-11-09T14:00:00.000Z"),
  });
  await service.completeSession({
    userId: "user-a",
    sessionId: day1.session.id,
    completedActivityIds: [day1.session.activities[0].id],
    completionIdempotencyKey: "day1-complete",
    topics,
    nowUtc: new Date("2026-11-09T14:06:00.000Z"),
  });

  // Simula usuário desmarcando o checkbox legado em user_progress depois da sessão
  repo.legacyProgressByUser.get("user-a").set("11111111-1111-4111-8111-111111111111", false);

  const day2 = await service.startOrResumeSession({
    userId: "user-a",
    topics,
    completedContentUnitIds: new Set(),
    budgetMinutes: 5,
    contentUnitId: "11111111-1111-4111-8111-111111111111",
    idempotencyKey: "day2-start",
    nowUtc: new Date("2026-11-10T14:00:00.000Z"),
  });
  const day2Result = await service.completeSession({
    userId: "user-a",
    sessionId: day2.session.id,
    completedActivityIds: [day2.session.activities[0].id],
    completionIdempotencyKey: "day2-complete",
    topics,
    nowUtc: new Date("2026-11-10T14:06:00.000Z"),
  });

  assert.equal(day2Result.weeklyProgress.completedDaysCount, 2);
  assert.deepEqual(day2Result.weeklyProgress.completedDates, ["2026-11-09", "2026-11-10"]);
});

test("detecta conteúdo arquivado durante sessão interrompida e permite substituição segura", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const initialTopics = makeTopicsFixture();

  const { session } = await service.startOrResumeSession({
    userId: "user-a",
    topics: initialTopics,
    completedContentUnitIds: new Set(),
    budgetMinutes: 5,
    contentUnitId: "11111111-1111-4111-8111-111111111111",
    idempotencyKey: "archive-start",
    nowUtc: new Date("2026-11-12T10:00:00.000Z"),
  });
  await service.updateSessionStatus({
    userId: "user-a",
    sessionId: session.id,
    status: "interrupted",
    nowUtc: new Date("2026-11-12T10:02:00.000Z"),
  });

  // Arquiva a primeira seção no acervo
  const updatedTopics = makeTopicsFixture();
  updatedTopics[0].sections[0].archived_at = "2026-11-12T11:00:00.000Z";

  const snapshot = await service.getSnapshot({
    userId: "user-a",
    topics: updatedTopics,
    completedContentUnitIds: new Set(),
    nowUtc: new Date("2026-11-12T12:00:00.000Z"),
  });
  assert.equal(snapshot.recommendation?.kind, "resume");
  assert.equal(snapshot.recommendation?.hasUnavailableContent, true);
  assert.equal(snapshot.recommendation?.replacementCandidate?.content_unit_id, "22222222-2222-4222-8222-222222222222");

  // Tentar concluir o conteúdo arquivado deve falhar
  await assert.rejects(
    () =>
      service.completeSession({
        userId: "user-a",
        sessionId: session.id,
        completedActivityIds: [session.activities[0].id],
        completionIdempotencyKey: "archive-complete",
        topics: updatedTopics,
        nowUtc: new Date("2026-11-12T12:01:00.000Z"),
      }),
    (err) => err instanceof RoutineDomainError && err.status === 409,
  );

  // Substitui a atividade indisponível pela elegível e conclui
  const replaced = await service.replaceUnavailableActivity({
    userId: "user-a",
    sessionId: session.id,
    activityId: session.activities[0].id,
    topics: updatedTopics,
    completedContentUnitIds: new Set(),
    nowUtc: new Date("2026-11-12T12:02:00.000Z"),
  });
  assert.equal(replaced.activities[0].content_unit_id, "22222222-2222-4222-8222-222222222222");

  const completed = await service.completeSession({
    userId: "user-a",
    sessionId: session.id,
    completedActivityIds: [replaced.activities[0].id],
    completionIdempotencyKey: "archive-complete-after-replace",
    topics: updatedTopics,
    nowUtc: new Date("2026-11-12T12:05:00.000Z"),
  });
  assert.equal(completed.session.status, "completed");
});

test("rejeita usuário sem sessão e garante isolamento negativo entre Usuário A e Usuário B", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();

  await assert.rejects(
    () =>
      service.getSnapshot({
        userId: "",
        topics,
        completedContentUnitIds: new Set(),
      }),
    (err) => err instanceof RoutineDomainError && err.status === 401,
  );

  const { session } = await service.startOrResumeSession({
    userId: "user-a",
    topics,
    completedContentUnitIds: new Set(),
    budgetMinutes: 5,
    idempotencyKey: "iso-start-a",
    nowUtc: new Date("2026-11-12T10:00:00.000Z"),
  });

  await assert.rejects(
    () =>
      service.updateSessionStatus({
        userId: "user-b",
        sessionId: session.id,
        status: "interrupted",
        nowUtc: new Date("2026-11-12T10:01:00.000Z"),
      }),
    (err) => err instanceof RoutineDomainError && err.status === 404,
  );

  await assert.rejects(
    () =>
      service.completeSession({
        userId: "user-b",
        sessionId: session.id,
        completedActivityIds: [session.activities[0].id],
        completionIdempotencyKey: "iso-complete-b",
        topics,
        nowUtc: new Date("2026-11-12T10:02:00.000Z"),
      }),
    (err) => err instanceof RoutineDomainError && err.status === 404,
  );

  const snapshotB = await service.getSnapshot({
    userId: "user-b",
    topics,
    completedContentUnitIds: new Set(),
    nowUtc: new Date("2026-11-12T10:03:00.000Z"),
  });
  assert.equal(snapshotB.activeSession, null);
  assert.equal(snapshotB.recentSessions.length, 0);
});

test("buildStudyRecommendation prioriza revisão apenas quando tudo visível foi concluído", () => {
  const topics = makeTopicsFixture();
  const allCompleted = new Set([
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
  ]);
  const rec = buildStudyRecommendation({
    topics,
    completedContentUnitIds: allCompleted,
    budgetMinutes: 15,
  });
  assert.equal(rec?.isReview, true);
  assert.equal(rec?.primaryTarget?.content_unit_id, "11111111-1111-4111-8111-111111111111");
});

test("savePreferences parcial preserva meta e fuso agendados e ocultar pré-onboarding não cria plano", async () => {
  const repo = createInMemoryRoutineRepo();
  const service = createRoutineService(repo);
  const topics = makeTopicsFixture();

  // 1. Ocultar antes do onboarding preserva needsOnboarding e não cria plano semanal
  const hiddenFirst = await service.savePreferences({
    userId: "user-partial",
    hideGamification: true,
    nowUtc: new Date("2026-11-12T12:00:00.000Z"),
  });
  assert.equal(hiddenFirst.preferences.hide_gamification, true);
  assert.equal(hiddenFirst.preferences.onboarding_completed_at, null);
  const preOnboardingSnap = await service.getSnapshot({
    userId: "user-partial",
    topics,
    completedContentUnitIds: new Set(),
    nowUtc: new Date("2026-11-12T12:01:00.000Z"),
  });
  assert.equal(preOnboardingSnap.needsOnboarding, true);
  assert.equal(preOnboardingSnap.currentPlan, null);

  // 2. Configura meta inicial (3 dias) e depois agenda alteração para 5 dias + Europe/Lisbon
  await service.savePreferences({
    userId: "user-partial",
    targetDays: 3,
    timezoneIana: "America/Sao_Paulo",
    defaultBudgetMinutes: 15,
    hideGamification: false,
    nowUtc: new Date("2026-11-12T12:02:00.000Z"),
  });
  const scheduled = await service.savePreferences({
    userId: "user-partial",
    targetDays: 5,
    timezoneIana: "Europe/Lisbon",
    defaultBudgetMinutes: 15,
    hideGamification: false,
    nowUtc: new Date("2026-11-12T12:03:00.000Z"),
  });
  assert.equal(scheduled.preferences.pending_target_days, 5);
  assert.equal(scheduled.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(scheduled.preferences.pending_effective_week_start, "2026-11-16");

  // 3. Ocultar gamificação e alterar apenas orçamento devem manter o agendamento pendente
  const hiddenAfterSchedule = await service.savePreferences({
    userId: "user-partial",
    hideGamification: true,
    nowUtc: new Date("2026-11-12T12:04:00.000Z"),
  });
  assert.equal(hiddenAfterSchedule.preferences.hide_gamification, true);
  assert.equal(hiddenAfterSchedule.preferences.pending_target_days, 5);
  assert.equal(hiddenAfterSchedule.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(hiddenAfterSchedule.preferences.pending_effective_week_start, "2026-11-16");

  const budgetOnly = await service.savePreferences({
    userId: "user-partial",
    defaultBudgetMinutes: 30,
    nowUtc: new Date("2026-11-12T12:05:00.000Z"),
  });
  assert.equal(budgetOnly.preferences.default_budget_minutes, 30);
  assert.equal(budgetOnly.preferences.pending_target_days, 5);
  assert.equal(budgetOnly.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(budgetOnly.preferences.pending_effective_week_start, "2026-11-16");

  const unhidden = await service.savePreferences({
    userId: "user-partial",
    hideGamification: false,
    nowUtc: new Date("2026-11-12T12:06:00.000Z"),
  });
  assert.equal(unhidden.preferences.hide_gamification, false);
  assert.equal(unhidden.preferences.pending_target_days, 5);
  assert.equal(unhidden.preferences.pending_timezone_iana, "Europe/Lisbon");
  assert.equal(unhidden.preferences.pending_effective_week_start, "2026-11-16");
});
