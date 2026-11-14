"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { BUDGET_MINUTES_OPTIONS } from "@/lib/gamification/config.mjs";
import type { WeeklyProgressSummary } from "@/lib/gamification/calendar.d.mts";
import type {
  RoutineSnapshot,
  StudyRoutineActivityRecord,
} from "@/lib/gamification/session.d.mts";

interface StudySessionBarProps {
  initialSnapshot: RoutineSnapshot;
  persistenceAvailable: boolean;
  topicId: string;
  topicTitle: string;
  topicDiscipline: string;
  topicSections: Array<{
    section_id: string;
    content_unit_id: string;
    title: string;
  }>;
  onSectionsCompleted?: (sectionIds: string[]) => void;
}

function createClientKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `routine-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StudySessionBar({
  initialSnapshot,
  persistenceAvailable,
  topicId,
  topicTitle,
  topicDiscipline,
  topicSections,
  onSectionsCompleted,
}: StudySessionBarProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<RoutineSnapshot>(initialSnapshot);
  const [selectedBudget, setSelectedBudget] = useState<5 | 15 | 30>(
    initialSnapshot.preferences.default_budget_minutes,
  );
  const [checkedIdsBySession, setCheckedIdsBySession] = useState<Record<string, string[]>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<{
    completedCount: number;
    weeklyProgress: WeeklyProgressSummary;
  } | null>(null);

  const inFlightStartKeyRef = useRef<string | null>(null);
  const completionKeyBySessionRef = useRef<Map<string, string>>(new Map());

  const activeContentUnitIds = useMemo(
    () => new Set(topicSections.map((section) => section.content_unit_id)),
    [topicSections],
  );
  const activeSectionIds = useMemo(
    () => new Set(topicSections.map((section) => section.section_id)),
    [topicSections],
  );

  if (snapshot.preferences.hide_gamification) {
    return null;
  }

  const activeSession = snapshot.activeSession;
  const activeActivities = (activeSession?.activities ?? [])
    .slice()
    .sort((left, right) => left.order_index - right.order_index);

  const sessionBelongsToCurrentTopic = Boolean(
    activeSession &&
      activeActivities.some(
        (activity) =>
          activity.topic_id === topicId ||
          (activity.content_unit_id && activeContentUnitIds.has(activity.content_unit_id)) ||
          (activity.section_id && activeSectionIds.has(activity.section_id)),
      ),
  );

  const selectedActivityIds = activeSession
    ? checkedIdsBySession[activeSession.id] ??
      activeActivities
        .filter((activity) => activity.status === "completed")
        .map((activity) => activity.id)
    : [];

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
      snapshot?: RoutineSnapshot;
      session?: RoutineSnapshot["activeSession"];
      weeklyProgress?: WeeklyProgressSummary;
    } | null;

    if (!response.ok || !data) {
      throw new Error(
        data?.error || "Não foi possível atualizar a sessão de estudo agora.",
      );
    }

    if (data.snapshot) {
      setSnapshot(data.snapshot);
    }
    return data;
  }

  async function handleStartTopicSession(replaceActive: boolean) {
    if (!persistenceAvailable || busyAction) return;

    if (!inFlightStartKeyRef.current) {
      inFlightStartKeyRef.current = createClientKey();
    }
    const idempotencyKey = inFlightStartKeyRef.current;

    setBusyAction("start_session");
    setErrorMessage(null);
    setStatusMessage(null);
    setCompletionSummary(null);
    setDismissedBanner(false);

    try {
      await callRoutineApi({
        action: "start_session",
        budgetMinutes: selectedBudget,
        topicId,
        idempotencyKey,
        replaceActive,
      });
      setStatusMessage("Sessão iniciada para este tópico.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a sessão neste tópico.",
      );
    } finally {
      inFlightStartKeyRef.current = null;
      setBusyAction(null);
    }
  }

  async function handlePauseSession() {
    if (!activeSession || !persistenceAvailable || busyAction) return;

    setBusyAction("pause_session");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await callRoutineApi({
        action: "update_session_status",
        sessionId: activeSession.id,
        status: "interrupted",
      });
      setStatusMessage("Sessão pausada. Você pode retomá-la no Dashboard quando quiser.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível pausar a sessão agora.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReplaceUnavailable(activityId: string) {
    if (!activeSession || !persistenceAvailable || busyAction) return;

    setBusyAction(`replace_${activityId}`);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await callRoutineApi({
        action: "replace_unavailable_activity",
        sessionId: activeSession.id,
        activityId,
      });
      setStatusMessage("Atividade arquivada substituída com segurança.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível substituir a atividade.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCompleteSession() {
    if (!activeSession || !persistenceAvailable || busyAction) return;
    if (selectedActivityIds.length === 0) {
      setErrorMessage("Marque ao menos uma seção estudada antes de concluir a sessão.");
      return;
    }

    let completionKey = completionKeyBySessionRef.current.get(activeSession.id);
    if (!completionKey) {
      completionKey = createClientKey();
      completionKeyBySessionRef.current.set(activeSession.id, completionKey);
    }

    setBusyAction("complete_session");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const data = await callRoutineApi({
        action: "complete_session",
        sessionId: activeSession.id,
        completedActivityIds: selectedActivityIds,
        completionIdempotencyKey: completionKey,
      });

      const completedSectionIds = activeActivities
        .filter((activity) => selectedActivityIds.includes(activity.id))
        .map((activity) => activity.section_id)
        .filter((id): id is string => Boolean(id));

      if (completedSectionIds.length > 0 && onSectionsCompleted) {
        onSectionsCompleted(completedSectionIds);
      }

      if (data.weeklyProgress) {
        setCompletionSummary({
          completedCount: selectedActivityIds.length,
          weeklyProgress: data.weeklyProgress,
        });
      }
      completionKeyBySessionRef.current.delete(activeSession.id);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Falha ao concluir a sessão. Seus dados continuam salvos para tentar novamente.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function toggleActivityChecked(sessionId: string, activityId: string) {
    setCheckedIdsBySession((prev) => {
      const current = prev[sessionId] ?? [];
      const exists = current.includes(activityId);
      const next = exists
        ? current.filter((id) => id !== activityId)
        : [...current, activityId];
      return { ...prev, [sessionId]: next };
    });
    setErrorMessage(null);
  }

  if (dismissedBanner && completionSummary) {
    return null;
  }

  const unavailableIds = new Set(snapshot.recommendation?.unavailableActivityIds ?? []);
  const otherTopicActivity = !sessionBelongsToCurrentTopic
    ? activeActivities.find((activity) => activity.status !== "unavailable" && activity.topic_id)
    : null;

  return (
    <section
      aria-label="Sessão guiada da rotina semanal"
      className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] sm:p-5"
    >
      {/* Resumo discreto pós-conclusão */}
      {completionSummary ? (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                Sessão registrada com sucesso
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Você estudou {completionSummary.completedCount}{" "}
                {completionSummary.completedCount === 1 ? "seção" : "seções"}. Sua semana está
                em{" "}
                <strong>
                  {completionSummary.weeklyProgress.completedDaysCount} de{" "}
                  {completionSummary.weeklyProgress.targetDays} dias
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white"
            >
              Voltar ao Dashboard
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setDismissedBanner(true)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Continuar lendo
            </button>
          </div>
        </div>
      ) : activeSession && sessionBelongsToCurrentTopic ? (
        <div>
          <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--accent)]">
                <CalendarDays size={12} aria-hidden="true" />
                Sessão ativa ({snapshot.weeklyProgress.completedDaysCount} de{" "}
                {snapshot.weeklyProgress.targetDays} dias)
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)]">
                <Clock size={13} aria-hidden="true" />
                aproximadamente {activeSession.estimated_minutes} min
              </span>
            </div>

            <button
              type="button"
              onClick={handlePauseSession}
              disabled={!persistenceAvailable || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:opacity-50"
            >
              {busyAction === "pause_session" ? (
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Pause size={13} aria-hidden="true" />
              )}
              Pausar para retomar depois
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-[var(--text-secondary)]">
            Autodeclaração honesta: marque abaixo as seções que você realmente estudou nesta sessão.
          </p>

          <ul className="mt-2.5 space-y-2">
            {activeActivities.map((activity: StudyRoutineActivityRecord) => {
              const checked = selectedActivityIds.includes(activity.id);
              const isUnavailable =
                activity.status === "unavailable" ||
                unavailableIds.has(activity.id) ||
                (activity.topic_id === topicId &&
                  activity.content_unit_id !== null &&
                  !activeContentUnitIds.has(activity.content_unit_id));

              return (
                <li
                  key={activity.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
                >
                  {isUnavailable ? (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--callout-warning-text)]">
                        {activity.activity_title} (conteúdo arquivado ou movido)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReplaceUnavailable(activity.id)}
                        disabled={!persistenceAvailable || Boolean(busyAction)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-2.5 py-1 text-xs font-bold text-[var(--callout-warning-text)]"
                      >
                        <RefreshCw size={12} aria-hidden="true" />
                        Substituir
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleActivityChecked(activeSession.id, activity.id)
                          }
                          disabled={!persistenceAvailable || Boolean(busyAction)}
                          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                        />
                        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {activity.activity_title}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--text-muted)]">
                          (~{activity.estimated_minutes} min)
                        </span>
                      </label>

                      {activity.section_id && activity.topic_id === topicId && (
                        <a
                          href={`#section-${activity.section_id}`}
                          className="shrink-0 text-xs font-bold text-[var(--accent)] hover:underline"
                        >
                          Ir à seção
                        </a>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {topicDiscipline} · {topicTitle}
            </span>
            <button
              type="button"
              onClick={handleCompleteSession}
              disabled={!persistenceAvailable || Boolean(busyAction)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {busyAction === "complete_session" ? (
                <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Check size={14} aria-hidden="true" />
              )}
              Concluir sessão ({selectedActivityIds.length})
            </button>
          </div>
        </div>
      ) : activeSession ? (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Sessão ativa em outro conteúdo
            </p>
            <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
              {otherTopicActivity
                ? `${otherTopicActivity.topic_title} (${otherTopicActivity.discipline})`
                : "Você possui uma sessão aberta em outro tópico."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {otherTopicActivity?.topic_id && (
              <Link
                href={`/${otherTopicActivity.topic_id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                Retomar anterior
              </Link>
            )}
            <button
              type="button"
              onClick={() => handleStartTopicSession(true)}
              disabled={!persistenceAvailable || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busyAction === "start_session" ? (
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Play size={13} aria-hidden="true" />
              )}
              Iniciar sessão aqui ({selectedBudget} min)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={18} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">
              Rotina semanal:{" "}
              <strong className="text-[var(--text-primary)]">
                {snapshot.weeklyProgress.completedDaysCount} de{" "}
                {snapshot.weeklyProgress.targetDays} dias
              </strong>{" "}
              nesta semana.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label="Duração da sessão">
              {BUDGET_MINUTES_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={selectedBudget === minutes}
                  onClick={() => setSelectedBudget(minutes)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    selectedBudget === minutes
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleStartTopicSession(false)}
              disabled={!persistenceAvailable || Boolean(busyAction)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busyAction === "start_session" ? (
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Play size={13} aria-hidden="true" />
              )}
              Iniciar sessão neste tópico
            </button>
          </div>
        </div>
      )}

      {!persistenceAvailable && (
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--callout-warning-text)]">
          <AlertTriangle size={14} aria-hidden="true" />
          Persistência da rotina temporariamente indisponível; sua leitura e marcação normal continuam funcionando.
        </p>
      )}

      <div aria-live="polite" className="mt-2 space-y-1.5">
        {statusMessage && (
          <p role="status" className="text-xs font-semibold text-[var(--status-success-text)]">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-2 text-xs text-[var(--callout-warning-text)]"
          >
            <span>{errorMessage}</span>
            {activeSession && (
              <button
                type="button"
                onClick={handleCompleteSession}
                disabled={Boolean(busyAction)}
                className="font-bold underline"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
