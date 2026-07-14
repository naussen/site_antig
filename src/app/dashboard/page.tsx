import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CirclePlay,
  GraduationCap,
  Layers3,
  Library,
  Settings2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { TopicRow } from "@/types/database";
import { formatSupabaseError, isMissingTableError } from "@/lib/supabase/errors";

type DashboardTopic = TopicRow & {
  sections: { section_id: string }[];
};

type TopicProgress = {
  completedCount: number;
  totalCount: number;
  percent: number;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  // getUser valida o token contra o servidor — mais seguro que getSession (local-only)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let topics: DashboardTopic[] = [];
  let completedSectionIds = new Set<string>();
  let preferredDisciplines: string[] | null = null;
  let preferencesAvailable = true;
  const loadErrors: string[] = [];

  try {
    const { data, error } = await supabase
      .from("topics")
      .select("topic_id, discipline, title, created_at, sections(section_id)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar tópicos:", error);
      loadErrors.push("Não foi possível carregar a biblioteca de tópicos.");
    } else if (data) {
      topics = data;
    }

    const allSectionIds = topics.flatMap((topic) =>
      topic.sections.map((section) => section.section_id)
    );

    if (allSectionIds.length > 0) {
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("section_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("section_id", allSectionIds);

      if (progressError) {
        console.error("Erro ao buscar progresso:", progressError);
        loadErrors.push("Não foi possível carregar seu progresso.");
      } else if (progressData) {
        completedSectionIds = new Set(
          progressData.map((progress) => progress.section_id)
        );
      }
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from("user_dashboard_preferences")
      .select("visible_disciplines")
      .eq("user_id", user.id)
      .maybeSingle();

    if (preferencesError) {
      if (isMissingTableError(preferencesError, "user_dashboard_preferences")) {
        preferencesAvailable = false;
      } else {
        console.error(
          `Erro ao buscar preferências do Dashboard: ${formatSupabaseError(preferencesError)}`
        );
        loadErrors.push("Não foi possível carregar suas preferências do Dashboard.");
      }
    } else if (preferences?.visible_disciplines) {
      preferredDisciplines = preferences.visible_disciplines as string[];
    }
  } catch (error) {
    console.error("Exceção ao buscar tópicos:", error);
    loadErrors.push("O Dashboard não conseguiu carregar todos os seus dados.");
  }

  const progressByTopic = topics.reduce((acc, topic) => {
    const totalCount = topic.sections.length;
    const completedCount = topic.sections.filter((section) =>
      completedSectionIds.has(section.section_id)
    ).length;
    const percent =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    acc[topic.topic_id] = {
      completedCount,
      totalCount,
      percent,
    };

    return acc;
  }, {} as Record<string, TopicProgress>);

  const displayedTopics = preferredDisciplines
    ? topics.filter((topic) => preferredDisciplines.includes(topic.discipline || "Geral"))
    : topics;
  const allDisciplines = Array.from(
    new Set(topics.map((topic) => topic.discipline || "Geral"))
  );
  const hiddenDisciplineCount = preferredDisciplines
    ? allDisciplines.filter((discipline) => !preferredDisciplines.includes(discipline)).length
    : 0;

  const groupedTopics = displayedTopics.reduce((acc, topic) => {
    const d = topic.discipline || 'Geral';
    if (!acc[d]) acc[d] = [];
    acc[d].push(topic);
    return acc;
  }, {} as Record<string, DashboardTopic[]>);

  const disciplines = Object.keys(groupedTopics).sort();
  const displayedProgress = displayedTopics.map((topic) => progressByTopic[topic.topic_id]);
  const totalSections = displayedProgress.reduce(
    (total, progress) => total + progress.totalCount,
    0
  );
  const completedSections = displayedProgress.reduce(
    (total, progress) => total + progress.completedCount,
    0
  );
  const overallPercent = totalSections > 0
    ? Math.round((completedSections / totalSections) * 100)
    : 0;
  const suggestedTopic =
    displayedTopics.find((topic) => {
      const percent = progressByTopic[topic.topic_id]?.percent ?? 0;
      return percent > 0 && percent < 100;
    }) ??
    displayedTopics.find(
      (topic) => (progressByTopic[topic.topic_id]?.percent ?? 0) < 100
    );
  const suggestedProgress = suggestedTopic
    ? progressByTopic[suggestedTopic.topic_id]
    : null;

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 md:px-10 md:py-10 lg:px-12"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-7xl">
        <header
          className="relative overflow-hidden rounded-[28px] border px-5 py-7 sm:px-8 sm:py-9 lg:px-10"
          style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 85% 10%, var(--accent-soft), transparent 34%), linear-gradient(135deg, var(--bg-card), var(--bg-secondary))",
            }}
          />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                <Sparkles size={14} />
                Painel de estudos
              </div>
              <h1
                className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                Sua biblioteca de estudos
              </h1>
              <p
                className="mt-4 max-w-xl text-sm leading-6 sm:text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                Acompanhe sua evolução, encontre seus resumos por disciplina e continue avançando uma seção de cada vez.
              </p>
              <Link
                href="/dashboard/configuracoes"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-card)" }}
              >
                <Settings2 size={17} style={{ color: "var(--accent)" }} />
                Configurar matérias
                {hiddenDisciplineCount > 0 && (
                  <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {hiddenDisciplineCount} {hiddenDisciplineCount === 1 ? "oculta" : "ocultas"}
                  </span>
                )}
              </Link>
              {!preferencesAvailable && (
                <p className="mt-3 max-w-xl text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                  A configuração de matérias aguarda a aplicação da migration 005 no Supabase. Enquanto isso, todas as matérias permanecem visíveis.
                </p>
              )}
            </div>

            {displayedTopics.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
                {[
                  { label: "Resumos", value: displayedTopics.length, icon: Library },
                  { label: "Disciplinas", value: disciplines.length, icon: GraduationCap },
                  { label: "Seções concluídas", value: `${completedSections}/${totalSections}`, icon: CheckCircle2 },
                  { label: "Progresso geral", value: `${overallPercent}%`, icon: Layers3 },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border p-3 sm:p-4"
                      style={{
                        background: "color-mix(in srgb, var(--bg-card) 86%, transparent)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <Icon size={17} className="mb-3" style={{ color: "var(--accent)" }} />
                      <strong className="block text-lg sm:text-xl" style={{ color: "var(--text-primary)" }}>
                        {stat.value}
                      </strong>
                      <span className="mt-1 block text-[11px] leading-tight" style={{ color: "var(--text-muted)" }}>
                        {stat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {loadErrors.length > 0 && (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm"
            style={{
              background: "var(--callout-warning-bg)",
              borderColor: "var(--callout-warning-border)",
              color: "var(--callout-warning-text)",
            }}
            role="alert"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Alguns dados personalizados não foram carregados.</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {Array.from(new Set(loadErrors)).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">Atualize a página para tentar novamente.</p>
            </div>
          </div>
        )}

        {suggestedTopic && suggestedProgress && (
          <section
            className="mt-6 flex flex-col justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:p-6"
            style={{ background: "var(--accent-soft)", borderColor: "var(--border)" }}
            aria-labelledby="suggested-study-title"
          >
            <div className="flex min-w-0 items-start gap-4">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                style={{ background: "var(--accent)", color: "var(--bg-card)" }}
              >
                <CirclePlay size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
                  Sugestão de estudo
                </p>
                <h2 id="suggested-study-title" className="mt-1 truncate text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {suggestedTopic.title}
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {suggestedTopic.discipline || "Geral"} · {suggestedProgress.percent}% concluído
                </p>
              </div>
            </div>
            <Link
              href={`/${suggestedTopic.topic_id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--accent)", color: "var(--bg-card)" }}
            >
              Continuar estudando
              <ArrowUpRight size={17} />
            </Link>
          </section>
        )}

        <section className="mt-10" aria-labelledby="library-title">
        {displayedTopics.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed px-6 py-20 text-center"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <BookOpen size={27} />
            </span>
            <p
              id="library-title"
              className="mb-2 text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {topics.length === 0 ? "Nenhum tópico disponível." : "Nenhuma matéria selecionada."}
            </p>
            <p className="mx-auto max-w-md text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              {topics.length === 0
                ? "Você ainda não importou nenhum resumo para a sua conta."
                : "Ajuste as matérias visíveis nas configurações da sua biblioteca."}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                  Acervo
                </p>
                <h2 id="library-title" className="mt-2 text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  Resumos por disciplina
                </h2>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {displayedTopics.length} {displayedTopics.length === 1 ? "resumo disponível" : "resumos disponíveis"}
              </p>
            </div>

            <div className="flex flex-col gap-12">
            {disciplines.map((discipline) => (
              <section key={discipline} aria-labelledby={`discipline-${discipline}`}>
                <div className="mb-5 flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <BookOpen size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 id={`discipline-${discipline}`} className="truncate text-lg font-extrabold sm:text-xl" style={{ color: "var(--text-primary)" }}>
                      {discipline}
                    </h3>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {groupedTopics[discipline].length} {groupedTopics[discipline].length === 1 ? "resumo" : "resumos"}
                    </p>
                  </div>
                  <span className="hidden h-px flex-1 sm:block" style={{ background: "var(--border)" }} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {groupedTopics[discipline].map((topic) => {
                    const progress = progressByTopic[topic.topic_id] ?? {
                      completedCount: 0,
                      totalCount: 0,
                      percent: 0,
                    };

                    return (
                      <Link
                        key={topic.topic_id}
                        href={`/${topic.topic_id}`}
                        className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-6"
                        style={{
                          background: "var(--bg-card)",
                          borderColor: "var(--border)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--progress-bg)" }}>
                          <span className="block h-full" style={{ width: `${progress.percent}%`, background: "var(--progress-bar)" }} />
                        </span>

                        <div className="mb-5 flex items-center justify-between gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            {progress.percent === 100 ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                          </span>
                          <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                            {progress.percent === 100 ? "Concluído" : progress.percent > 0 ? `${progress.percent}%` : "Novo"}
                          </span>
                        </div>
                        <h3
                          className="text-lg font-bold leading-snug transition-colors group-hover:text-[var(--accent)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {topic.title}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          <span className="inline-flex items-center gap-1.5">
                            <Layers3 size={14} />
                            {progress.totalCount} {progress.totalCount === 1 ? "seção" : "seções"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {new Date(topic.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <div className="mt-auto pt-6">
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Progresso
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              {progress.completedCount} de {progress.totalCount}
                            </span>
                          </div>
                          <div
                            className="h-2 overflow-hidden rounded-full"
                            style={{ background: "var(--progress-bg)" }}
                            aria-label={`Progresso: ${progress.percent}%`}
                            aria-valuemax={100}
                            aria-valuemin={0}
                            aria-valuenow={progress.percent}
                            role="progressbar"
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress.percent}%`,
                                background: "var(--progress-bar)",
                              }}
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm font-bold" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
                            <span>{progress.percent > 0 ? "Continuar resumo" : "Começar resumo"}</span>
                            <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
            </div>
          </div>
        )}
        </section>
      </div>
    </main>
  );
}
