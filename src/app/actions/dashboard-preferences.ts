"use server";

import { revalidatePath } from "next/cache";
import {
  getSafeSupabaseErrorCode,
  isMissingColumnError,
  isMissingTableError,
} from "@/lib/supabase/errors";
import { requireContentAccess } from "@/lib/content-access";
import { parseStartPageSelection } from "@/lib/user-start-page.mjs";

export type SaveDashboardPreferencesState = {
  status: "idle" | "success";
};

export async function saveDashboardPreferences(
  _previousState: SaveDashboardPreferencesState,
  formData: FormData,
): Promise<SaveDashboardPreferencesState> {
  const { supabase, user } = await requireContentAccess();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("discipline")
    .is("archived_at", null);

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
  const { startModule, startDiscipline } = parseStartPageSelection(
    formData.get("startPage"),
    availableDisciplines,
  );

  const { error } = await supabase.from("user_dashboard_preferences").upsert(
    {
      user_id: user.id,
      visible_disciplines: showAll ? null : selectedDisciplines,
      start_module: startModule,
      start_discipline: startDiscipline,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    const preferencesSchemaUnavailable =
      isMissingTableError(error, "user_dashboard_preferences")
      || isMissingColumnError(error, "start_module")
      || isMissingColumnError(error, "start_discipline");

    console.error("Falha ao salvar preferências do Dashboard.", {
      code: getSafeSupabaseErrorCode(error),
      category: preferencesSchemaUnavailable
        ? "schema_unavailable"
        : "query_failed",
    });

    if (preferencesSchemaUnavailable) {
      throw new Error("As preferências estão temporariamente indisponíveis.");
    }

    throw new Error("Não foi possível salvar as preferências do Dashboard.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracoes");

  return { status: "success" };
}
