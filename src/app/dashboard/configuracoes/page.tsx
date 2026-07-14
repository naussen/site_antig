import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Settings2, SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { saveDashboardDisciplines } from "@/app/actions/dashboard-preferences";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError, isMissingTableError } from "@/lib/supabase/errors";

export default async function DashboardSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: topics, error: topicsError },
    { data: preferences, error: preferencesError },
  ] = await Promise.all([
    supabase.from("topics").select("discipline"),
    supabase
      .from("user_dashboard_preferences")
      .select("visible_disciplines")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (topicsError) {
    throw new Error("Não foi possível carregar as disciplinas disponíveis.");
  }

  const preferencesAvailable = !isMissingTableError(
    preferencesError,
    "user_dashboard_preferences"
  );

  if (preferencesError && preferencesAvailable) {
    throw new Error(
      `Não foi possível carregar as preferências do Dashboard: ${formatSupabaseError(preferencesError)}`
    );
  }

  const disciplines = Array.from(
    new Set((topics ?? []).map((topic) => topic.discipline || "Geral"))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const selectedDisciplines = preferences?.visible_disciplines as string[] | null | undefined;
  const showAll = !selectedDisciplines || selectedDisciplines.length === 0;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--accent)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={17} />
          Voltar ao Dashboard
        </Link>

        <header className="rounded-3xl border p-6 sm:p-8" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Settings2 size={24} />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            Configuração da biblioteca
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Matérias no Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            Escolha as disciplinas que deseja encontrar ao entrar. A seleção fica salva na sua conta e pode ser alterada a qualquer momento.
          </p>
        </header>

        <form action={saveDashboardDisciplines} className="mt-6 rounded-3xl border p-5 sm:p-7" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {!preferencesAvailable && (
            <div
              className="mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6"
              style={{ background: "var(--accent-soft)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              role="status"
            >
              <AlertTriangle className="mt-0.5 shrink-0" size={19} style={{ color: "var(--accent)" }} />
              <p>
                A seleção ainda não pode ser salva neste ambiente. Aplique a migration
                <strong style={{ color: "var(--text-primary)" }}> 005_create_user_dashboard_preferences.sql</strong> no Supabase e recarregue esta página.
              </p>
            </div>
          )}
          <div className="mb-5 flex items-start gap-3 border-b pb-5" style={{ borderColor: "var(--border)" }}>
            <SlidersHorizontal size={20} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Disciplinas disponíveis</h2>
              <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                Se nenhuma opção for marcada, o Dashboard voltará a mostrar todas as disciplinas, inclusive as importadas futuramente.
              </p>
            </div>
          </div>

          {disciplines.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Nenhuma disciplina disponível no momento.
            </p>
          ) : (
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Selecione as disciplinas visíveis</legend>
              {disciplines.map((discipline) => (
                <label
                  key={discipline}
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                >
                  <input
                    type="checkbox"
                    name="disciplines"
                    value={discipline}
                    defaultChecked={showAll || (selectedDisciplines?.includes(discipline) ?? false)}
                    className="peer sr-only"
                  />
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] peer-checked:text-white"
                    style={{ borderColor: "var(--border)", color: "transparent" }}
                    aria-hidden="true"
                  >
                    <Check size={15} strokeWidth={3} />
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {discipline}
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: "var(--border)" }}>
            <Link href="/dashboard" className="rounded-xl border px-5 py-3 text-center text-sm font-bold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!preferencesAvailable}
              className="rounded-xl px-5 py-3 text-sm font-bold transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--bg-card)" }}
            >
              Salvar preferências
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
