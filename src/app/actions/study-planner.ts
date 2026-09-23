"use server";

import { revalidatePath } from "next/cache";
import { requireContentAccess } from "@/lib/content-access";
import {
  createPlanSchema,
  itemIdSchema,
  planItemSchema,
  updatePlanSchema,
} from "@/lib/planner/validation";
import type { PlannerActionResult } from "@/lib/planner/types";

const plannerPath = "/dashboard/planner";

function failure(message: string): PlannerActionResult {
  return { ok: false, message };
}

function success(message: string): PlannerActionResult {
  revalidatePath(plannerPath);
  return { ok: true, message };
}

function plannerErrorMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === "23P01" || error?.message?.includes("nesse horário")) {
    return "Já existe um estudo nesse horário.";
  }
  if (error?.code === "23514") {
    return "A data ou o horário não respeita os limites do plano.";
  }
  return "Não foi possível salvar o planner. Tente novamente.";
}

async function disciplineExists(
  supabase: Awaited<ReturnType<typeof requireContentAccess>>["supabase"],
  discipline: string,
) {
  const { data, error } = await supabase
    .from("topics")
    .select("topic_id")
    .eq("discipline", discipline)
    .is("archived_at", null)
    .limit(1);

  return !error && (data?.length ?? 0) > 0;
}

export async function createStudyPlan(input: unknown): Promise<PlannerActionResult> {
  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) return failure("Revise as configurações do plano.");

  const { supabase, user } = await requireContentAccess();
  const value = parsed.data;
  const { error } = await supabase.from("study_plans").insert({
    user_id: user.id,
    title: value.title,
    start_date: value.startDate,
    weeks_count: value.weeksCount,
    day_start_minute: value.dayStartMinute,
    day_end_minute: value.dayEndMinute,
    slot_minutes: value.slotMinutes,
  });

  if (error) {
    console.error("Falha ao criar plano de estudos.", { code: error.code });
    return failure(plannerErrorMessage(error));
  }

  return success("Plano de estudos criado.");
}

export async function updateStudyPlan(input: unknown): Promise<PlannerActionResult> {
  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) return failure("Revise as configurações do plano.");

  const { supabase, user } = await requireContentAccess();
  const value = parsed.data;
  const { error } = await supabase
    .from("study_plans")
    .update({
      title: value.title,
      start_date: value.startDate,
      weeks_count: value.weeksCount,
      day_start_minute: value.dayStartMinute,
      day_end_minute: value.dayEndMinute,
      slot_minutes: value.slotMinutes,
    })
    .eq("id", value.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Falha ao atualizar plano de estudos.", { code: error.code });
    return failure(plannerErrorMessage(error));
  }

  return success("Configurações atualizadas.");
}

export async function saveStudyPlanItem(input: unknown): Promise<PlannerActionResult> {
  const parsed = planItemSchema.safeParse(input);
  if (!parsed.success) return failure("Revise a disciplina, a data e os horários.");

  const { supabase, user } = await requireContentAccess();
  const value = parsed.data;
  if (!(await disciplineExists(supabase, value.discipline))) {
    return failure("A disciplina selecionada não está disponível.");
  }

  const payload = {
    plan_id: value.planId,
    user_id: user.id,
    discipline: value.discipline,
    study_date: value.studyDate,
    start_minute: value.startMinute,
    end_minute: value.endMinute,
    note: value.note || null,
  };

  const query = value.id
    ? supabase
        .from("study_plan_items")
        .update(payload)
        .eq("id", value.id)
        .eq("user_id", user.id)
    : supabase.from("study_plan_items").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("Falha ao salvar bloco do planner.", { code: error.code });
    return failure(plannerErrorMessage(error));
  }

  return success(value.id ? "Horário atualizado." : "Estudo adicionado ao planner.");
}

export async function deleteStudyPlanItem(input: unknown): Promise<PlannerActionResult> {
  const parsed = itemIdSchema.safeParse(input);
  if (!parsed.success) return failure("Bloco de estudo inválido.");

  const { supabase, user } = await requireContentAccess();
  const { error } = await supabase
    .from("study_plan_items")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Falha ao excluir bloco do planner.", { code: error.code });
    return failure("Não foi possível excluir o estudo.");
  }

  return success("Estudo removido.");
}
