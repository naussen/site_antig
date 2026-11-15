"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  History,
  Loader2,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import {
  BUDGET_MINUTES_OPTIONS,
  MAX_TARGET_DAYS,
  MIN_TARGET_DAYS,
  SUPPORTED_TIMEZONE_OPTIONS,
} from "@/lib/gamification/config.mjs";
import {
  formatIsoDatePtBr,
  previewTimezoneChange,
} from "@/lib/gamification/calendar.mjs";
import type {
  RoutineSnapshot,
  StudyRoutineActivityRecord,
} from "@/lib/gamification/session.d.mts";
import type { DashboardRoutineTopicOption } from "@/lib/gamification/server";

interface TodayStudyCardProps {
  initialSnapshot: RoutineSnapshot;
  persistenceAvailable: boolean;
  demoFallbackActive?: boolean;
  topicOptions: DashboardRoutineTopicOption[];
  availableDisciplines: string[];
}

function createClientKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `routine-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Concluída";
    case "interrupted":
      return "Interrompida";
    case "in_progress":
      return "Em andamento";
    case "discarded":
      return "Descartada";
    case "planned":
      return "Planejada";
    default:
      return status;
  }
}

export function TodayStudyCard({
  initialSnapshot,
  persistenceAvailable,
  demoFallbackActive = false,
  topicOptions,
  availableDisciplines,
}: TodayStudyCardProps) {
  const router = useRouter();
  const [snapshotOverride, setSnapshotOverride] = useState<{
    source: RoutineSnapshot;
    current: RoutineSnapshot;
  } | null>(null);
  const [demoFallbackOverride, setDemoFallbackOverride] = useState<{
    source: RoutineSnapshot;
    value: boolean;
  } | null>(null);
  const snapshot =
    snapshotOverride?.source === initialSnapshot ? snapshotOverride.current : initialSnapshot;
  const isDemoFallback =
    demoFallbackOverride?.source === initialSnapshot
      ? demoFallbackOverride.value
      : demoFallbackActive;
  const hasActivatedRoutine =
    persistenceAvailable && !snapshot.needsOnboarding && Boolean(snapshot.currentPlan);

  const [budgetOverride, setBudgetOverride] = useState<{
    source: RoutineSnapshot;
    value: 5 | 15 | 30;
  } | null>(null);
  const selectedBudget =
    budgetOverride?.source === initialSnapshot
      ? budgetOverride.value
      : snapshot.preferences.default_budget_minutes;

  const [configOpen, setConfigOpen] = useState(
    persistenceAvailable && initialSnapshot.needsOnboarding,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const defaultDraft = {
    targetDays:
      snapshot.preferences.pending_target_days ?? snapshot.preferences.target_days,
    timezone:
      snapshot.preferences.pending_timezone_iana ?? snapshot.preferences.timezone_iana,
    budget: snapshot.preferences.default_budget_minutes,
    discipline: snapshot.preferences.preferred_discipline ?? "",
  };
  const [draftOverride, setDraftOverride] = useState<{
    source: RoutineSnapshot;
    value: typeof defaultDraft;
  } | null>(null);
  const activeDraft =
    draftOverride?.source === initialSnapshot ? draftOverride.value : defaultDraft;
  const draftTargetDays = activeDraft.targetDays;
  const draftTimezone = activeDraft.timezone;
  const draftBudget = activeDraft.budget;
  const draftDiscipline = activeDraft.discipline;

  function updateDraft(patch: Partial<typeof defaultDraft>) {
    setDraftOverride({
      source: initialSnapshot,
      value: {
        ...activeDraft,
        ...patch,
      },
    });
  }

  const [topicSearch, setTopicSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [selectedPickerTopicId, setSelectedPickerTopicId] = useState<string>(
    topicOptions[0]?.topic_id ?? "",
  );
  const [selectedPickerSectionId, setSelectedPickerSectionId] = useState<string>("");

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inFlightStartKeyRef = useRef<string | null>(null);

  function applySnapshotState(nextSnapshot: RoutineSnapshot) {
    setSnapshotOverride({ source: initialSnapshot, current: nextSnapshot });
    setBudgetOverride(null);
    setDraftOverride(null);
  }

  const timezonePreview = useMemo(
    () =>
      previewTimezoneChange({
        currentTimezoneIana: snapshot.preferences.timezone_iana,
        nextTimezoneIana: draftTimezone,
      }),
    [draftTimezone, snapshot.preferences.timezone_iana],
  );

  const filteredTopics = useMemo(() => {
    const query = topicSearch.trim().toLowerCase();
    return topicOptions.filter((topic) => {
      if (disciplineFilter && topic.discipline !== disciplineFilter) {
        return false;
      }
      if (!query) return true;
      return (
        topic.title.toLowerCase().includes(query) ||
        topic.discipline.toLowerCase().includes(query) ||
        topic.sections.some((section) => section.title.toLowerCase().includes(query))
      );
    });
  }, [disciplineFilter, topicOptions, topicSearch]);

  const activePickerTopic = useMemo(
    () =>
      filteredTopics.find((topic) => topic.topic_id === selectedPickerTopicId) ??
      filteredTopics[0] ??
      null,
    [filteredTopics, selectedPickerTopicId],
  );

  async function callRoutineApi(payload: Record<string, unknown>) {
    const response = await fetch(withSiteBasePath("/api/study-routine"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      demoFallbackActive?: boolean;
      snapshot?: RoutineSnapshot;
      session?: RoutineSnapshot["activeSession"];
      updatePlan?: {
        effectiveImmediately?: boolean;
        effectiveWeekStartDate?: string | null;
      };
    } | null;

    if (!response.ok || !data) {
      throw new Error(
        data?.error || "Não foi possível atualizar a rotina semanal agora.",
      );
    }

    if (typeof data.demoFallbackActive === "boolean") {
      setDemoFallbackOverride({ source: initialSnapshot, value: data.demoFallbackActive });
    }
    if (data.snapshot) {
      applySnapshotState(data.snapshot);
    }

    return data;
  }

  async function handleSavePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!persistenceAvailable || busyAction) return;

    setBusyAction("save_preferences");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const data = await callRoutineApi({
        action: "save_preferences",
        targetDays: draftTargetDays,
        timezoneIana: draftTimezone,
        defaultBudgetMinutes: draftBudget,
        preferredDiscipline: draftDiscipline.trim() ? draftDiscipline.trim() : null,
        hideGamification: false,
      });

      setConfigOpen(false);
      if (data.updatePlan?.effectiveImmediately) {
        setStatusMessage("Rotina semanal salva para esta semana.");
      } else if (data.updatePlan?.effectiveWeekStartDate) {
        setStatusMessage(
          `Preferências salvas. Alterações de meta ou fuso passam a valer na segunda-feira (${formatIsoDatePtBr(data.updatePlan.effectiveWeekStartDate)}).`,
        );
      } else {
        setStatusMessage("Preferências da rotina atualizadas.");
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Falha ao salvar suas preferências.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleVisibility(hideGamification: boolean) {
    if (!persistenceAvailable || busyAction) return;

    setBusyAction("toggle_visibility");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await callRoutineApi({
        action: "save_preferences",
        hideGamification,
      });
      setStatusMessage(
        hideGamification
          ? "Estímulos da rotina ocultados. Seu histórico permanece preservado."
          : "Rotina semanal reexibida no seu painel.",
      );
      if (!hideGamification) {
        setConfigOpen(false);
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a visibilidade da rotina.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStartSession(options?: {
    topicId?: string | null;
    sectionId?: string | null;
    contentUnitId?: string | null;
    replaceActive?: boolean;
  }) {
    if (!persistenceAvailable || busyAction) return;

    if (!inFlightStartKeyRef.current) {
      inFlightStartKeyRef.current = createClientKey();
    }
    const idempotencyKey = inFlightStartKeyRef.current;

    setBusyAction("start_session");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const data = await callRoutineApi({
        action: "start_session",
        budgetMinutes: selectedBudget,
        topicId: options?.topicId ?? null,
        sectionId: options?.sectionId ?? null,
        contentUnitId: options?.contentUnitId ?? null,
        idempotencyKey,
        replaceActive: Boolean(options?.replaceActive),
      });

      const targetSession = data.session ?? data.snapshot?.activeSession;
      const firstActivity = targetSession?.activities.find(
        (item) => item.status !== "unavailable" && item.topic_id,
      );
      if (firstActivity?.topic_id) {
        const hash = firstActivity.section_id
          ? `#section-${firstActivity.section_id}`
          : "";
        router.push(`/${firstActivity.topic_id}${hash}`);
        return;
      }

      setStatusMessage("Sessão iniciada.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a sessão de estudo.",
      );
    } finally {
      inFlightStartKeyRef.current = null;
      setBusyAction(null);
    }
  }

  async function handleResumeActiveSession() {
    const active = snapshot.activeSession;
    if (!active || busyAction) return;

    const firstValid = active.activities.find(
      (activity) => activity.status !== "unavailable" && activity.topic_id,
    );

    if (active.status === "interrupted" && persistenceAvailable) {
      setBusyAction("resume_session");
      setErrorMessage(null);
      try {
        await callRoutineApi({
          action: "update_session_status",
          sessionId: active.id,
          status: "in_progress",
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível retomar a sessão agora.",
        );
        setBusyAction(null);
        return;
      }
      setBusyAction(null);
    }

    if (firstValid?.topic_id) {
      const hash = firstValid.section_id ? `#section-${firstValid.section_id}` : "";
      router.push(`/${firstValid.topic_id}${hash}`);
    }
  }

  async function handleReplaceUnavailable(activityId: string) {
    if (!snapshot.activeSession || !persistenceAvailable || busyAction) return;

    setBusyAction(`replace_${activityId}`);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await callRoutineApi({
        action: "replace_unavailable_activity",
        sessionId: snapshot.activeSession.id,
        activityId,
      });
      setStatusMessage("Conteúdo substituído mantendo o restante da sua sessão.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível substituir o conteúdo indisponível.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDiscardActiveSession() {
    if (!snapshot.activeSession || !persistenceAvailable || busyAction) return;

    setBusyAction("discard_session");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await callRoutineApi({
        action: "update_session_status",
        sessionId: snapshot.activeSession.id,
        status: "discarded",
      });
      setStatusMessage("Sessão descartada. Você pode iniciar outra quando quiser.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível descartar a sessão ativa.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  const { weeklyProgress, preferences, activeSession, recommendation } = snapshot;

  if (preferences.hide_gamification) {
    return (
      <section
        id="rotina-semanal"
        aria-label="Rotina semanal oculta"
        className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3">
          <EyeOff size={18} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <div>
            <p className="text-sm text-[var(--text-secondary)]">
              Os estímulos da rotina semanal estão ocultos. Seu histórico de estudos permanece salvo.
            </p>
            {isDemoFallback && (
              <p role="status" className="mt-1 text-xs text-[var(--text-muted)]">
                Modo de demonstração local: os dados desta rotina ficam apenas em memória temporária
                e não comprovam persistência no banco.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleToggleVisibility(false)}
          disabled={!persistenceAvailable || Boolean(busyAction)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-50 motion-reduce:transition-none"
        >
          {busyAction === "toggle_visibility" ? (
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Eye size={14} aria-hidden="true" />
          )}
          Reexibir rotina semanal
        </button>
      </section>
    );
  }

  const unavailableSet = new Set(recommendation?.unavailableActivityIds ?? []);
  const activeActivities = (activeSession?.activities ?? []).slice().sort(
    (left, right) => left.order_index - right.order_index,
  );
  const firstActiveTopicHref = (() => {
    const valid = activeActivities.find(
      (item) => item.status !== "unavailable" && item.topic_id,
    );
    if (!valid?.topic_id) return null;
    return valid.section_id
      ? `/${valid.topic_id}#section-${valid.section_id}`
      : `/${valid.topic_id}`;
  })();

  const activeBudgetOption = recommendation?.optionsByBudget?.[selectedBudget] ?? null;
  const recommendedSections =
    activeBudgetOption?.plannedActivities ?? recommendation?.plannedActivities ?? [];
  const recommendedEstimatedMinutes =
    activeBudgetOption?.estimatedMinutes ??
    recommendation?.estimatedMinutes ??
    selectedBudget;

  return (
    <section
      id="rotina-semanal"
      aria-labelledby="rotina-semanal-titulo"
      className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow)] sm:p-6"
    >
      {/* Cabeçalho e resumo semanal */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              <CalendarDays size={13} aria-hidden="true" />
              Rotina semanal flexível
            </span>
            {!persistenceAvailable && (
              <span className="inline-flex items-center rounded-full border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--callout-warning-text)]">
                Persistência pendente neste ambiente
              </span>
            )}
            {persistenceAvailable && !hasActivatedRoutine && (
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                Rotina ainda não ativada
              </span>
            )}
            {hasActivatedRoutine && weeklyProgress.isPartialFirstWeek && (
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                Semana inicial parcial
              </span>
            )}
            {hasActivatedRoutine && weeklyProgress.goalReached && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--status-success-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--status-success-text)]">
                <Check size={12} aria-hidden="true" />
                Meta semanal atingida
              </span>
            )}
          </div>

          <h2
            id="rotina-semanal-titulo"
            className="mt-2.5 text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl"
          >
            {!persistenceAvailable
              ? "Rotina semanal temporariamente indisponível"
              : snapshot.needsOnboarding
                ? "Configure seu ritmo semanal de estudo"
                : "Seu estudo hoje"}
          </h2>

          {!persistenceAvailable ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Enquanto a gravação da rotina não estiver ativa neste ambiente, o estudo convencional
              pelos resumos e a marcação normal de seções continuam funcionando.
            </p>
          ) : !hasActivatedRoutine ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Você ainda não ativou uma rotina semanal nesta conta. Defina uma meta inicial abaixo ou
              siga estudando livremente pelo acervo.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <strong className="font-bold text-[var(--text-primary)]">
                {weeklyProgress.completedDaysCount} de {weeklyProgress.targetDays} dias
              </strong>{" "}
              nesta semana ({formatIsoDatePtBr(weeklyProgress.weekStartDate)} a{" "}
              {formatIsoDatePtBr(weeklyProgress.weekEndDate)}) · Fuso:{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {weeklyProgress.timezoneIana}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfigOpen((current) => !current)}
            aria-expanded={configOpen}
            disabled={!persistenceAvailable || Boolean(busyAction)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-50 motion-reduce:transition-none"
          >
            <Settings2 size={14} aria-hidden="true" />
            {snapshot.needsOnboarding ? "Personalizar" : "Meta e fuso"}
          </button>

          <button
            type="button"
            onClick={() => handleToggleVisibility(true)}
            disabled={!persistenceAvailable || Boolean(busyAction)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:opacity-50 motion-reduce:transition-none"
          >
            <EyeOff size={14} aria-hidden="true" />
            Ocultar estímulos
          </button>
        </div>
      </div>

      {/* Aviso de persistência indisponível antes de solicitar preenchimento */}
      {!persistenceAvailable && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] p-4 text-sm text-[var(--callout-warning-text)]"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p>
              A persistência da rotina semanal está temporariamente indisponível neste ambiente. Por
              isso, a configuração de metas e o salvamento de sessões ficam bloqueados até a
              ativação do banco de dados, sem afetar seu acesso ao acervo abaixo.
            </p>
            <a
              href="#library-title"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
            >
              Ir para os resumos disponíveis
              <ArrowRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {/* Aviso discreto do modo de demonstração em memória */}
      {persistenceAvailable && isDemoFallback && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs text-[var(--text-secondary)]"
        >
          Modo de demonstração local: os dados desta rotina ficam apenas em memória temporária e não
          comprovam persistência no banco.
        </p>
      )}

      {/* Feedback de sucesso ou erro com região live */}
      <div aria-live="polite" className="mt-4 space-y-2">
        {statusMessage && (
          <p
            role="status"
            className="rounded-xl border border-[var(--border)] bg-[var(--status-success-bg)] px-4 py-2.5 text-sm font-medium text-[var(--status-success-text)]"
          >
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-4 py-2.5 text-sm text-[var(--callout-warning-text)]"
          >
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Indicador visual dos 7 dias (Seg a Dom) */}
      {hasActivatedRoutine && (
        <div className="mt-4">
          <ol
            aria-label="Dias estudados nesta semana"
            className="grid grid-cols-7 gap-1.5 sm:gap-2.5"
          >
            {weeklyProgress.daysOfWeek.map((day) => (
              <li
                key={day.date}
                aria-label={`${day.label} ${formatIsoDatePtBr(day.date)}: ${
                  day.completed
                    ? `${day.sessionsCount} sessão concluída`
                    : "sem sessão concluída"
                }`}
                className={`flex flex-col items-center justify-center rounded-xl border px-1 py-2 text-center ${
                  day.completed
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  {day.label}
                </span>
                <span
                  className={`mt-1 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                    day.completed
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                  }`}
                  aria-hidden="true"
                >
                  {day.completed ? <Check size={13} strokeWidth={3} /> : day.date.slice(8, 10)}
                </span>
              </li>
            ))}
          </ol>

          {preferences.pending_effective_week_start &&
            (preferences.pending_target_days !== null ||
              preferences.pending_timezone_iana !== null) && (
              <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs text-[var(--text-secondary)]">
                Alteração agendada para{" "}
                <strong>{formatIsoDatePtBr(preferences.pending_effective_week_start)}</strong>
                {preferences.pending_target_days !== null
                  ? ` · nova meta: ${preferences.pending_target_days} dia(s)/semana`
                  : ""}
                {preferences.pending_timezone_iana !== null
                  ? ` · novo fuso: ${preferences.pending_timezone_iana}`
                  : ""}
                . O histórico já concluído desta semana permanece preservado.
              </p>
            )}
        </div>
      )}

      {/* Formulário de Onboarding / Edição de Meta e Fuso */}
      {((persistenceAvailable && snapshot.needsOnboarding) || configOpen) && (
        <form
          onSubmit={handleSavePreferences}
          className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5"
        >
          {!persistenceAvailable && (
            <p
              role="status"
              className="mb-4 rounded-xl border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3.5 py-2.5 text-xs text-[var(--callout-warning-text)]"
            >
              O preenchimento destas preferências aguarda a ativação da persistência neste ambiente.
            </p>
          )}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {snapshot.needsOnboarding
                  ? "Escolha uma meta leve e realista"
                  : "Ajustar meta semanal e fuso horário"}
              </h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                {snapshot.needsOnboarding
                  ? "Você define quantos dias por semana quer estudar. A semana conta de segunda a domingo e sua primeira semana começa a partir de hoje."
                  : "Mudanças de meta ou fuso entram em vigor na próxima segunda-feira, sem apagar o histórico das semanas já registradas."}
              </p>
            </div>
          </div>

          <fieldset
            disabled={!persistenceAvailable || Boolean(busyAction)}
            className="grid gap-4 sm:grid-cols-2 disabled:opacity-60"
          >
            <div>
              <label
                htmlFor="routine-target-days"
                className="block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]"
              >
                Meta de dias por semana ({MIN_TARGET_DAYS} a {MAX_TARGET_DAYS})
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    aria-pressed={draftTargetDays === days}
                    onClick={() => updateDraft({ targetDays: days })}
                    className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-bold transition-colors motion-reduce:transition-none ${
                      draftTargetDays === days
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
              <input
                id="routine-target-days"
                type="hidden"
                name="targetDays"
                value={draftTargetDays}
              />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                Duração sugerida da sessão
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_MINUTES_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={draftBudget === minutes}
                    onClick={() => updateDraft({ budget: minutes })}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors motion-reduce:transition-none ${
                      draftBudget === minutes
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="routine-timezone"
                className="block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]"
              >
                Fuso horário da sua rotina
              </label>
              <select
                id="routine-timezone"
                value={draftTimezone}
                onChange={(event) => updateDraft({ timezone: event.target.value })}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              >
                {SUPPORTED_TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Prévia agora: {formatIsoDatePtBr(timezonePreview.nextLocalDate)} às{" "}
                {timezonePreview.nextLocalTime}.
                {!snapshot.needsOnboarding &&
                  draftTimezone !== snapshot.preferences.timezone_iana && (
                    <>
                      {" "}
                      Vigência em{" "}
                      <strong>{formatIsoDatePtBr(timezonePreview.effectiveWeekStartDate)}</strong>{" "}
                      preservando semanas anteriores.
                    </>
                  )}
              </p>
            </div>

            <div>
              <label
                htmlFor="routine-preferred-discipline"
                className="block text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]"
              >
                Disciplina prioritária (opcional)
              </label>
              <select
                id="routine-preferred-discipline"
                value={draftDiscipline}
                onChange={(event) => updateDraft({ discipline: event.target.value })}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <option value="">Seguir ordem geral do acervo</option>
                {availableDisciplines.map((discipline) => (
                  <option key={discipline} value={discipline}>
                    {discipline}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {!snapshot.needsOnboarding && (
              <button
                type="button"
                onClick={() => setConfigOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent)]"
              >
                Fechar
              </button>
            )}
            <button
              type="submit"
              disabled={!persistenceAvailable || Boolean(busyAction)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {busyAction === "save_preferences" ? (
                <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Check size={16} aria-hidden="true" />
              )}
              {snapshot.needsOnboarding ? "Ativar rotina semanal" : "Salvar ajustes"}
            </button>
          </div>
        </form>
      )}

      {/* Área principal da sessão de hoje (somente após ativação da rotina) */}
      {hasActivatedRoutine && (
        <div className="mt-5">
          {activeSession ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-bold text-white">
                      <Play size={11} aria-hidden="true" />
                      {getSessionStatusLabel(activeSession.status)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                      <Clock size={13} aria-hidden="true" />
                      Estimativa: aproximadamente {activeSession.estimated_minutes} min
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-[var(--text-primary)]">
                    Retome sua sessão de estudo
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {activeActivities.map((activity: StudyRoutineActivityRecord) => {
                      const isUnavailable =
                        activity.status === "unavailable" ||
                        unavailableSet.has(activity.id);
                      return (
                        <li
                          key={activity.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {activity.activity_title}
                            </p>
                            <p className="truncate text-xs text-[var(--text-muted)]">
                              {activity.discipline} · {activity.topic_title} · ~
                              {activity.estimated_minutes} min
                            </p>
                          </div>
                          {isUnavailable ? (
                            <button
                              type="button"
                              onClick={() => handleReplaceUnavailable(activity.id)}
                              disabled={!persistenceAvailable || Boolean(busyAction)}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-1.5 text-xs font-bold text-[var(--callout-warning-text)] hover:opacity-90 disabled:opacity-50"
                            >
                              <RefreshCw size={13} aria-hidden="true" />
                              Substituir conteúdo arquivado
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-[var(--text-secondary)]">
                              {activity.status === "completed" ? "Marcada" : "Pendente"}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  {firstActiveTopicHref ? (
                    <button
                      type="button"
                      onClick={handleResumeActiveSession}
                      disabled={Boolean(busyAction)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      {busyAction === "resume_session" ? (
                        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <ArrowRight size={16} aria-hidden="true" />
                      )}
                      Retomar sessão
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleDiscardActiveSession}
                    disabled={!persistenceAvailable || Boolean(busyAction)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:opacity-50"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Descartar sessão
                  </button>
                </div>
              </div>
            </div>
          ) : recommendation?.primaryTarget ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      <Sparkles size={13} aria-hidden="true" />
                      {recommendation.isReview
                        ? "Revisão sugerida"
                        : "Próximo estudo sugerido"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                      <Clock size={13} aria-hidden="true" />
                      aproximadamente {recommendedEstimatedMinutes} min
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-lg font-extrabold text-[var(--text-primary)]">
                    {recommendation.primaryTarget.topic_title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {recommendation.primaryTarget.discipline} ·{" "}
                    {recommendedSections.length}{" "}
                    {recommendedSections.length === 1 ? "seção sugerida" : "seções sugeridas"}
                  </p>

                  {recommendedSections.length > 0 && (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {recommendedSections.map((item) => (
                        <li
                          key={
                            item.content_unit_id ??
                            ("id" in item ? item.id : item.section_id)
                          }
                          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                        >
                          {"title" in item ? item.title : item.activity_title} (~
                          {item.estimated_minutes} min)
                        </li>
                      ))}
                    </ul>
                  )}

                  {recommendedEstimatedMinutes > selectedBudget && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      A primeira seção completa leva cerca de {recommendedEstimatedMinutes} min e foi preservada na íntegra.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
                  <div
                    role="group"
                    aria-label="Escolher orçamento de tempo"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    {BUDGET_MINUTES_OPTIONS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        aria-pressed={selectedBudget === minutes}
                        onClick={() =>
                          setBudgetOverride({ source: initialSnapshot, value: minutes })
                        }
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors motion-reduce:transition-none ${
                          selectedBudget === minutes
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartSession()}
                      disabled={!persistenceAvailable || Boolean(busyAction)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      {busyAction === "start_session" ? (
                        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <Play size={16} aria-hidden="true" />
                      )}
                      Continuar estudo ({selectedBudget} min)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPickerOpen((open) => !open)}
                      aria-expanded={pickerOpen}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"
                    >
                      <BookOpen size={14} aria-hidden="true" />
                      Escolher outro conteúdo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
              Nenhum resumo ativo disponível para iniciar uma sessão no momento.
            </p>
          )}

          {/* Seletor alternativo sem punição */}
          {pickerOpen && topicOptions.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Escolher tópico ou seção livremente
                </h4>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Fechar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="picker-discipline-filter"
                    className="block text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Filtrar disciplina
                  </label>
                  <select
                    id="picker-discipline-filter"
                    value={disciplineFilter}
                    onChange={(event) => {
                      setDisciplineFilter(event.target.value);
                      setSelectedPickerSectionId("");
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Todas as disciplinas</option>
                    {availableDisciplines.map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {discipline}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="picker-topic-search"
                    className="block text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Buscar tópico ou seção
                  </label>
                  <input
                    id="picker-topic-search"
                    type="search"
                    value={topicSearch}
                    onChange={(event) => {
                      setTopicSearch(event.target.value);
                      setSelectedPickerSectionId("");
                    }}
                    placeholder="Ex.: Princípios, Poder Executivo..."
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="picker-topic-select"
                    className="block text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Tópico ({filteredTopics.length} disponíveis)
                  </label>
                  <select
                    id="picker-topic-select"
                    value={activePickerTopic?.topic_id ?? ""}
                    onChange={(event) => {
                      setSelectedPickerTopicId(event.target.value);
                      setSelectedPickerSectionId("");
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    {filteredTopics.length === 0 ? (
                      <option value="">Nenhum tópico encontrado para o filtro</option>
                    ) : (
                      filteredTopics.map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.discipline} — {topic.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="picker-section-select"
                    className="block text-xs font-bold text-[var(--text-secondary)]"
                  >
                    Seção inicial (opcional)
                  </label>
                  <select
                    id="picker-section-select"
                    value={selectedPickerSectionId}
                    onChange={(event) => setSelectedPickerSectionId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Próxima seção ainda não marcada</option>
                    {(activePickerTopic?.sections ?? []).map((section) => (
                      <option key={section.section_id} value={section.section_id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {activePickerTopic && (
                  <Link
                    href={`/${activePickerTopic.topic_id}${
                      selectedPickerSectionId ? `#section-${selectedPickerSectionId}` : ""
                    }`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"
                  >
                    Abrir sem iniciar sessão
                  </Link>
                )}
                <button
                  type="button"
                  disabled={!activePickerTopic || !persistenceAvailable || Boolean(busyAction)}
                  onClick={() => {
                    if (!activePickerTopic) return;
                    const chosenSection = activePickerTopic.sections.find(
                      (section) => section.section_id === selectedPickerSectionId,
                    );
                    handleStartSession({
                      topicId: activePickerTopic.topic_id,
                      sectionId: chosenSection?.section_id ?? null,
                      contentUnitId: chosenSection?.content_unit_id ?? null,
                      replaceActive: Boolean(snapshot.activeSession),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Play size={13} aria-hidden="true" />
                  Iniciar neste conteúdo ({selectedBudget} min)
                </button>
              </div>
            </div>
          )}

          {/* Histórico recente colapsável */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent)]"
            >
              <History size={14} aria-hidden="true" />
              Histórico recente ({snapshot.recentSessions.length})
              {historyOpen ? (
                <ChevronUp size={14} aria-hidden="true" />
              ) : (
                <ChevronDown size={14} aria-hidden="true" />
              )}
            </button>

            {historyOpen && (
              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3.5">
                {snapshot.recentSessions.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    Nenhuma sessão registrada até agora nesta conta.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {snapshot.recentSessions.map((session) => {
                      const firstActivity = session.activities[0];
                      return (
                        <li
                          key={session.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[var(--text-primary)]">
                              {firstActivity?.topic_title ?? "Sessão de estudo"}
                            </p>
                            <p className="text-[var(--text-muted)]">
                              {firstActivity?.discipline ?? "Resumos"} ·{" "}
                              {session.completed_local_date
                                ? formatIsoDatePtBr(session.completed_local_date)
                                : "Ainda não concluída"}{" "}
                              · ~{session.estimated_minutes} min
                            </p>
                          </div>
                          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 font-semibold text-[var(--text-secondary)]">
                            {getSessionStatusLabel(session.status)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rodapé informativo de escopo e propriedade dos dados */}
      <div className="mt-4 flex flex-col gap-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>{snapshot.accountOwnershipNotice}</p>
        <p>
          Escopo atual: Resumos ativos. Leis, Questões e Flashcards dedicados entrarão nas próximas fases.
        </p>
      </div>
    </section>
  );
}
