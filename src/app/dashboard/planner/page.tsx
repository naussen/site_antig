import { AlertTriangle, CalendarDays } from "lucide-react";
import { requireContentAccess } from "@/lib/content-access";
import { isMissingTableError } from "@/lib/supabase/errors";
import type { PlannerItem, PlannerPlan } from "@/lib/planner/types";
import { DashboardPageHero } from "@/components/dashboard/dashboard-page-hero";
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
        <DashboardPageHero
          icon={CalendarDays}
          eyebrow="Área do aluno"
          title="Planner de estudos"
          description="Arraste as disciplinas para os horários e pronto: cada alteração é salva automaticamente."
        />

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
