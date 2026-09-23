import { AlertTriangle, CalendarDays } from "lucide-react";
import { requireContentAccess } from "@/lib/content-access";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { PlannerItem, PlannerPlan } from "@/lib/planner/types";
import { PlannerClient } from "./planner-client";

export default async function PlannerPage() {
  const { supabase, user } = await requireContentAccess();
  const [{ data: topics, error: topicsError }, { data: planRow, error: planError }] =
    await Promise.all([
      supabase.from("topics").select("discipline").is("archived_at", null),
      supabase
        .from("study_plans")
        .select("id, title, start_date, weeks_count, day_start_minute, day_end_minute, slot_minutes")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  if (topicsError) {
    throw new Error("Não foi possível carregar as disciplinas do planner.");
  }

  const plannerUnavailable = isMissingTableError(planError, "study_plans");
  if (planError && !plannerUnavailable) {
    throw new Error("Não foi possível carregar o planner.");
  }

  let items: PlannerItem[] = [];
  if (planRow && !plannerUnavailable) {
    const { data, error } = await supabase
      .from("study_plan_items")
      .select("id, discipline, study_date, start_minute, end_minute, note")
      .eq("plan_id", planRow.id)
      .eq("user_id", user.id)
      .order("study_date")
      .order("start_minute");

    if (error) throw new Error("Não foi possível carregar os horários do planner.");
    items = (data ?? []).map((item) => ({
      id: item.id,
      discipline: item.discipline,
      studyDate: item.study_date,
      startMinute: item.start_minute,
      endMinute: item.end_minute,
      note: item.note,
    }));
  }

  const disciplines = Array.from(
    new Set((topics ?? []).map((topic) => topic.discipline || "Geral")),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const plan: PlannerPlan | null = planRow
    ? {
        id: planRow.id,
        title: planRow.title,
        startDate: planRow.start_date,
        weeksCount: planRow.weeks_count,
        dayStartMinute: planRow.day_start_minute,
        dayEndMinute: planRow.day_end_minute,
        slotMinutes: planRow.slot_minutes as 15 | 30 | 60,
      }
    : null;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 sm:px-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,var(--catalog-hero-start),var(--catalog-hero-end))] p-6 text-white shadow-[var(--shadow-lg)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[var(--catalog-hero-glow)] blur-3xl" aria-hidden="true" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[var(--catalog-gold-light)]">
              <CalendarDays size={24} />
            </span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-white/75">Área do aluno</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Planner de estudos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Organize até quatro semanas, distribua suas disciplinas e ajuste cada horário à sua rotina.
            </p>
          </div>
        </header>

        {plannerUnavailable ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-secondary)]" role="alert">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            <p>O Planner está aguardando a atualização do banco de dados. Nenhum dado foi perdido.</p>
          </div>
        ) : (
          <PlannerClient disciplines={disciplines} initialPlan={plan} initialItems={items} />
        )}
      </div>
    </main>
  );
}
