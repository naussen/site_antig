import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarDays,
  getLocalDateParts,
  getWeekBoundsForInstant,
  isValidIanaTimeZone,
  planPreferenceUpdate,
  previewTimezoneChange,
  resolveEffectiveWeeklyPlan,
  summarizeWeeklyProgress,
} from "../src/lib/gamification/calendar.mjs";

test("valida identificadores de fuso IANA e rejeita entradas inválidas", () => {
  assert.equal(isValidIanaTimeZone("America/Sao_Paulo"), true);
  assert.equal(isValidIanaTimeZone("Europe/Lisbon"), true);
  assert.equal(isValidIanaTimeZone("UTC"), true);
  assert.equal(isValidIanaTimeZone(""), false);
  assert.equal(isValidIanaTimeZone("America/Nao_Existe"), false);
  assert.equal(isValidIanaTimeZone("America/Sao_Paulo; DROP TABLE"), false);
});

test("calcula limites de semana de segunda 00h até segunda seguinte no fuso definido", () => {
  // Quarta-feira 2026-11-11 23:55 em São Paulo == 2026-11-12 02:55 UTC
  const wednesdayLateSp = new Date("2026-11-12T02:55:00.000Z");
  const parts = getLocalDateParts(wednesdayLateSp, "America/Sao_Paulo");
  assert.equal(parts.localDate, "2026-11-11");
  assert.equal(parts.hour, 23);
  assert.equal(parts.minute, 55);
  assert.equal(parts.weekdayMondayZero, 2);

  const bounds = getWeekBoundsForInstant(wednesdayLateSp, "America/Sao_Paulo");
  assert.equal(bounds.weekStartDate, "2026-11-09");
  assert.equal(bounds.weekEndDate, "2026-11-15");
  assert.equal(bounds.nextWeekStartDate, "2026-11-16");
  assert.equal(bounds.isPartialStart, true);

  // Após meia-noite em São Paulo (00:05 de 2026-11-12)
  const thursdayEarlySp = new Date("2026-11-12T03:05:00.000Z");
  const afterMidnightParts = getLocalDateParts(thursdayEarlySp, "America/Sao_Paulo");
  assert.equal(afterMidnightParts.localDate, "2026-11-12");
});

test("respeita fronteira domingo para segunda no fuso do aluno mesmo quando UTC já mudou", () => {
  // Domingo 2026-11-15 23:50-03:00 (São Paulo) == Segunda 2026-11-16 02:50:00Z
  const sundayLateSp = new Date("2026-11-16T02:50:00.000Z");
  const sundayBounds = getWeekBoundsForInstant(sundayLateSp, "America/Sao_Paulo");
  assert.equal(sundayBounds.localDate, "2026-11-15");
  assert.equal(sundayBounds.weekStartDate, "2026-11-09");
  assert.equal(sundayBounds.weekEndDate, "2026-11-15");

  // Segunda 2026-11-16 00:05-03:00 (São Paulo) == 2026-11-16 03:05:00Z
  const mondayEarlySp = new Date("2026-11-16T03:05:00.000Z");
  const mondayBounds = getWeekBoundsForInstant(mondayEarlySp, "America/Sao_Paulo");
  assert.equal(mondayBounds.localDate, "2026-11-16");
  assert.equal(mondayBounds.weekStartDate, "2026-11-16");
  assert.equal(mondayBounds.weekEndDate, "2026-11-22");
  assert.equal(mondayBounds.isPartialStart, false);
});

test("primeiro acesso no meio da semana ativa semana parcial e mudanças posteriores valem só na próxima segunda", () => {
  const wednesdaySp = new Date("2026-11-11T15:00:00.000Z");
  const initialPlan = planPreferenceUpdate({
    currentPreferences: null,
    currentWeeklyPlan: null,
    nextTargetDays: 4,
    nextTimezoneIana: "America/Sao_Paulo",
    nowUtc: wednesdaySp,
  });

  assert.equal(initialPlan.isFirstActivation, true);
  assert.equal(initialPlan.effectiveImmediately, true);
  assert.equal(initialPlan.effectiveWeekStartDate, "2026-11-09");
  assert.equal(initialPlan.isPartialFirstWeek, true);
  assert.equal(initialPlan.appliedTargetDays, 4);

  const currentPreferences = {
    target_days: 4,
    timezone_iana: "America/Sao_Paulo",
    pending_target_days: null,
    pending_timezone_iana: null,
    pending_effective_week_start: null,
    onboarding_completed_at: initialPlan.onboardingCompletedAt,
  };
  const currentWeeklyPlan = {
    id: "plan-w1",
    week_start_date: "2026-11-09",
    week_end_date: "2026-11-15",
    target_days: 4,
    timezone_iana: "America/Sao_Paulo",
    is_partial_first_week: true,
  };

  // Quinta-feira: troca meta para 2 dias e fuso para Europe/Lisbon
  const thursdaySp = new Date("2026-11-12T15:00:00.000Z");
  const scheduledChange = planPreferenceUpdate({
    currentPreferences,
    currentWeeklyPlan,
    nextTargetDays: 2,
    nextTimezoneIana: "Europe/Lisbon",
    nowUtc: thursdaySp,
  });

  assert.equal(scheduledChange.effectiveImmediately, false);
  assert.equal(scheduledChange.appliedTargetDays, 4);
  assert.equal(scheduledChange.appliedTimezoneIana, "America/Sao_Paulo");
  assert.equal(scheduledChange.pendingTargetDays, 2);
  assert.equal(scheduledChange.pendingTimezoneIana, "Europe/Lisbon");
  assert.equal(scheduledChange.pendingEffectiveWeekStart, "2026-11-16");

  // Na segunda-feira 2026-11-16 09:00 UTC (já segunda em SP e em Lisboa)
  const mondayNextWeek = new Date("2026-11-16T09:00:00.000Z");
  const resolved = resolveEffectiveWeeklyPlan({
    preferences: {
      ...currentPreferences,
      pending_target_days: scheduledChange.pendingTargetDays,
      pending_timezone_iana: scheduledChange.pendingTimezoneIana,
      pending_effective_week_start: scheduledChange.pendingEffectiveWeekStart,
    },
    existingPlanForCurrentWeek: null,
    hasPriorWeeklyPlans: true,
    nowUtc: mondayNextWeek,
  });

  assert.equal(resolved.weekStartDate, "2026-11-16");
  assert.equal(resolved.targetDays, 2);
  assert.equal(resolved.timezoneIana, "Europe/Lisbon");
  assert.equal(resolved.shouldPromotePending, true);
  assert.equal(resolved.isPartialFirstWeek, false);
});

test("prévia de mudança de fuso preserva histórico e bloqueia deslocamento retroativo entre segunda e domingo", () => {
  const instant = new Date("2026-11-16T01:00:00.000Z"); // 22:00 domingo em SP; 01:00 segunda em Lisboa
  const preview = previewTimezoneChange({
    currentTimezoneIana: "America/Sao_Paulo",
    nextTimezoneIana: "Europe/Lisbon",
    nowUtc: instant,
  });

  assert.equal(preview.currentLocalDate, "2026-11-15");
  assert.equal(preview.nextLocalDate, "2026-11-16");
  assert.equal(preview.effectiveWeekStartDate, "2026-11-16");
  assert.equal(preview.preservesHistory, true);

  // Caso inverso: quem estava em Lisboa na segunda 01:00 e muda para SP (ainda domingo 22:00)
  // não deve promover antes de SP também entrar na segunda 2026-11-16.
  const prematureWestward = resolveEffectiveWeeklyPlan({
    preferences: {
      target_days: 3,
      timezone_iana: "Europe/Lisbon",
      pending_target_days: null,
      pending_timezone_iana: "America/Sao_Paulo",
      pending_effective_week_start: "2026-11-16",
      onboarding_completed_at: "2026-11-09T12:00:00.000Z",
    },
    existingPlanForCurrentWeek: null,
    hasPriorWeeklyPlans: true,
    nowUtc: instant,
  });

  assert.equal(prematureWestward.shouldPromotePending, false);
  assert.equal(prematureWestward.timezoneIana, "Europe/Lisbon");
  assert.equal(prematureWestward.weekStartDate, "2026-11-16");
});

test("cada dia conta no máximo uma vez por semana, permite exceder a meta e ignora sessões não concluídas", () => {
  const summary = summarizeWeeklyProgress({
    weekStartDate: "2026-11-09",
    weekEndDate: "2026-11-15",
    targetDays: 3,
    timezoneIana: "America/Sao_Paulo",
    isPartialFirstWeek: false,
    sessions: [
      { status: "completed", completed_local_date: "2026-11-09", completed_week_start_date: "2026-11-09" },
      { status: "completed", completed_local_date: "2026-11-09", completed_week_start_date: "2026-11-09" },
      { status: "completed", completed_local_date: "2026-11-11", completed_week_start_date: "2026-11-09" },
      { status: "completed", completed_local_date: "2026-11-13", completed_week_start_date: "2026-11-09" },
      { status: "completed", completed_local_date: "2026-11-14", completed_week_start_date: "2026-11-09" },
      { status: "interrupted", completed_local_date: null, completed_week_start_date: null },
      { status: "discarded", completed_local_date: null, completed_week_start_date: null },
    ],
  });

  assert.equal(summary.completedDaysCount, 4);
  assert.equal(summary.remainingDaysCount, 0);
  assert.equal(summary.goalReached, true);
  assert.equal(summary.totalCompletedSessionsInWeek, 5);
  assert.deepEqual(summary.completedDates, [
    "2026-11-09",
    "2026-11-11",
    "2026-11-13",
    "2026-11-14",
  ]);
  assert.equal(summary.daysOfWeek[0].sessionsCount, 2);
  assert.equal(addCalendarDays("2026-11-09", 6), "2026-11-15");
});

test("atualização parcial preserva agendamento pendente e ocultação pré-onboarding não ativa plano", () => {
  const thursdaySp = new Date("2026-11-12T15:00:00.000Z");

  // Pré-onboarding: ocultar sem concluir onboarding não deve preencher onboardingCompletedAt
  const hiddenBeforeOnboarding = planPreferenceUpdate({
    currentPreferences: null,
    currentWeeklyPlan: null,
    nextTargetDays: undefined,
    nextTimezoneIana: undefined,
    activateOnboarding: false,
    nowUtc: thursdaySp,
  });
  assert.equal(hiddenBeforeOnboarding.onboardingCompletedAt, null);
  assert.equal(hiddenBeforeOnboarding.isFirstActivation, false);

  // Com agendamento pendente (meta 5 dias, fuso Europe/Lisbon), omitir meta/fuso preserva pendência
  const withScheduledChange = {
    target_days: 3,
    timezone_iana: "America/Sao_Paulo",
    pending_target_days: 5,
    pending_timezone_iana: "Europe/Lisbon",
    pending_effective_week_start: "2026-11-16",
    onboarding_completed_at: "2026-11-10T12:00:00.000Z",
  };
  const weeklyPlan = {
    id: "plan-w1",
    week_start_date: "2026-11-09",
    week_end_date: "2026-11-15",
    target_days: 3,
    timezone_iana: "America/Sao_Paulo",
    is_partial_first_week: true,
  };

  const partialToggle = planPreferenceUpdate({
    currentPreferences: withScheduledChange,
    currentWeeklyPlan: weeklyPlan,
    nextTargetDays: undefined,
    nextTimezoneIana: undefined,
    activateOnboarding: true,
    nowUtc: thursdaySp,
  });
  assert.equal(partialToggle.pendingTargetDays, 5);
  assert.equal(partialToggle.pendingTimezoneIana, "Europe/Lisbon");
  assert.equal(partialToggle.pendingEffectiveWeekStart, "2026-11-16");

  // Reenvio explícito igual ao ativo cancela o agendamento anterior
  const explicitCancel = planPreferenceUpdate({
    currentPreferences: withScheduledChange,
    currentWeeklyPlan: weeklyPlan,
    nextTargetDays: 3,
    nextTimezoneIana: "America/Sao_Paulo",
    activateOnboarding: true,
    nowUtc: thursdaySp,
  });
  assert.equal(explicitCancel.pendingTargetDays, null);
  assert.equal(explicitCancel.pendingTimezoneIana, null);
  assert.equal(explicitCancel.pendingEffectiveWeekStart, null);
});
