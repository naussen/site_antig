"use server";

import { revalidatePath } from "next/cache";
import { isMissingTableError } from "@/lib/supabase/errors";
import { requireContentAccess } from "@/lib/content-access";

export type SaveDashboardPreferencesState = {
  status: "idle" | "success";
};

export async function saveDashboardDisciplines(
  _previousState: SaveDashboardPreferencesState,
  formData: FormData,
): Promise<SaveDashboardPreferencesState> {
  const { supabase, user } = await requireContentAccess();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("discipline");

  if (topicsError) {
    throw new Error("Não foi possível validar as disciplinas disponíveis.");
  }

  const availableDisciplines = Array.from(
    new Set((topics ?? []).map((topic) => topic.discipline || "Geral"))
  );
  const availableSet = new Set(availableDisciplines);
  const selectedDisciplines = Array.from(
    new Set(
      formData
        .getAll("disciplines")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => availableSet.has(value))
    )
  );

  const showAll =
    selectedDisciplines.length === 0 ||
    selectedDisciplines.length === availableDisciplines.length;

  const { error } = await supabase.from("user_dashboard_preferences").upsert(
    {
      user_id: user.id,
      visible_disciplines: showAll ? null : selectedDisciplines,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (isMissingTableError(error, "user_dashboard_preferences")) {
      throw new Error(
        "A configuração de matérias ainda não está disponível. Aplique a migration 005 no Supabase."
      );
    }

    throw new Error("Não foi possível salvar as preferências do Dashboard.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracoes");

  return { status: "success" };
}
