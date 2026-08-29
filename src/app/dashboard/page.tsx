import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  FileText,
  Gavel,
  GraduationCap,
  HeartHandshake,
  Landmark,
  PenLine,
  Layers3,
  Leaf,
  Library,
  MonitorCog,
  Scale,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TopicRow } from "@/types/database";
import { formatSupabaseError, isMissingTableError } from "@/lib/supabase/errors";
import { compareTopicsByOrigin } from "@/lib/topic-order";
import { requireContentAccess } from "@/lib/content-access";

type DashboardTopic = TopicRow & {
  sections: { section_id: string }[];
};

type TopicProgress = {
  completedCount: number;
  totalCount: number;
  percent: number;
};

const DISCIPLINE_TONE_CLASSES = [
  "discipline-tone-gold",
  "discipline-tone-blue",
  "discipline-tone-green",
  "discipline-tone-rose",
  "discipline-tone-violet",
  "discipline-tone-cyan",
  "discipline-tone-orange",
  "discipline-tone-teal",
  "discipline-tone-indigo",
  "discipline-tone-lime",
  "discipline-tone-pink",
  "discipline-tone-slate",
  "discipline-tone-red",
  "discipline-tone-sky",
  "discipline-tone-emerald",
  "discipline-tone-purple",
] as const;

const DISCIPLINE_ICON_MATCHERS: ReadonlyArray<{
  pattern: RegExp;
  icon: LucideIcon;
}> = [
  { pattern: /processo|processual/, icon: FileText },
  { pattern: /constitucional/, icon: Landmark },
  { pattern: /administrativ/, icon: Building2 },
  { pattern: /penal|criminal/, icon: Gavel },
  { pattern: /civil/, icon: Scale },
  { pattern: /tribut|contabil|financeir/, icon: Calculator },
  { pattern: /trabalho|trabalhist/, icon: BriefcaseBusiness },
  { pattern: /previdenci|seguridade/, icon: HeartHandshake },
  { pattern: /consumidor/, icon: ShoppingBag },
  { pattern: /ambiental/, icon: Leaf },
  { pattern: /humanos|sociolog|filosof/, icon: Users },
  { pattern: /portugues|redacao|lingua/, icon: PenLine },
  { pattern: /informatica|tecnologia/, icon: MonitorCog },
  { pattern: /logica|matematica|estatistica/, icon: BrainCircuit },
  { pattern: /empresarial|comercial/, icon: BriefcaseBusiness },
  { pattern: /eleitoral|internacional/, icon: ShieldCheck },
];

function normalizeDisciplineName(discipline: string) {
  return discipline
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getDisciplineIcon(discipline: string) {
  const normalizedDiscipline = normalizeDisciplineName(discipline);

  return DISCIPLINE_ICON_MATCHERS.find(({ pattern }) =>
    pattern.test(normalizedDiscipline)
  )?.icon ?? Library;
}

function getDisciplineToneClass(index: number) {
  const safeIndex = Math.max(index, 0);
  return DISCIPLINE_TONE_CLASSES[safeIndex % DISCIPLINE_TONE_CLASSES.length];
}

function getProgressBadgeClass(percent: number) {
  if (percent === 100) return "bg-[var(--status-success-bg)] text-[var(--status-success-text)]";
  if (percent > 0) return "bg-[var(--catalog-blue-soft)] text-[var(--catalog-blue-text)]";
  return "bg-[var(--accent-soft)] text-[var(--text-secondary)]";
}

function compareTopics(a: DashboardTopic, b: DashboardTopic) {
  const disciplineA = a.discipline || "Geral";
  const disciplineB = b.discipline || "Geral";

  if (disciplineA === disciplineB) {
    return compareTopicsByOrigin(disciplineA, a, b);
  }

  return a.title.localeCompare(b.title, "pt-BR");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string | string[] }>;
}) {
  const query = await searchParams;
  const requestedDiscipline = typeof query.disciplina === "string"
    ? query.disciplina.trim().slice(0, 100)
    : null;
  const { supabase, user } = await requireContentAccess();

  let topics: DashboardTopic[] = [];
  let completedSectionIds = new Set<string>();
  let preferredDisciplines: string[] | null = null;
  let preferencesAvailable = true;
  const loadErrors: string[] = [];

  try {
    const { data, error } = await supabase
      .from("topics")
      .select("topic_id, discipline, title, sort_order, created_at, sections(section_id)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar tópicos:", error);
      loadErrors.push("Não foi possível carregar a biblioteca de tópicos.");
    } else if (data) {
      topics = [...data].sort(compareTopics);
    }

    const hasSections = topics.some((topic) => topic.sections.length > 0);

    if (hasSections) {
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("section_id")
        .eq("user_id", user.id)
        .eq("completed", true);

      if (progressError) {
        console.error(
          `Erro ao buscar progresso: ${formatSupabaseError(progressError)}`
        );
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

  const allDisciplines = Array.from(
    new Set(topics.map((topic) => topic.discipline || "Geral"))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const activeDisciplineFilter = requestedDiscipline && allDisciplines.includes(requestedDiscipline)
    ? requestedDiscipline
    : null;
  const displayedTopics = activeDisciplineFilter
    ? topics.filter((topic) => (topic.discipline || "Geral") === activeDisciplineFilter)
    : preferredDisciplines
      ? topics.filter((topic) => preferredDisciplines.includes(topic.discipline || "Geral"))
      : topics;
  const hiddenDisciplineCount = preferredDisciplines
    ? allDisciplines.filter((discipline) => !preferredDisciplines.includes(discipline)).length
    : 0;

  const groupedTopics = displayedTopics.reduce((acc, topic) => {
    const d = topic.discipline || 'Geral';
    if (!acc[d]) acc[d] = [];
    acc[d].push(topic);
    return acc;
  }, {} as Record<string, DashboardTopic[]>);

  const disciplines = Object.keys(groupedTopics).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
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
        <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,var(--catalog-hero-start),var(--catalog-hero-end))] px-5 py-7 text-white shadow-[var(--shadow-lg)] sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--catalog-hero-glow)] blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/90">
                <Sparkles size={14} />
                Painel de estudos
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Sua biblioteca de estudos
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                Acompanhe sua evolução, encontre seus resumos por disciplina e continue avançando uma seção de cada vez.
              </p>
              <Link
                href="/dashboard/configuracoes"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/30 hover:bg-white/15"
              >
                <Settings2 size={17} className="text-[var(--catalog-gold-light)]" />
                Configurar matérias
                {hiddenDisciplineCount > 0 && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white">
                    {hiddenDisciplineCount} {hiddenDisciplineCount === 1 ? "oculta" : "ocultas"}
                  </span>
                )}
              </Link>
              {!preferencesAvailable && (
                <p className="mt-3 max-w-xl text-xs leading-5 text-white/65">
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
                      className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:p-4"
                    >
                      <Icon size={17} className="mb-3 text-[var(--catalog-gold-light)]" />
                      <strong className="block text-lg text-white sm:text-xl">
                        {stat.value}
                      </strong>
                      <span className="mt-1 block text-[11px] leading-tight text-white/65">
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
                style={{ background: "var(--action)", color: "var(--action-foreground)" }}
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
              style={{ background: "var(--action)", color: "var(--action-foreground)" }}
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
                {activeDisciplineFilter && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full px-3 py-1.5 font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {activeDisciplineFilter}
                    </span>
                    <Link href="/dashboard" className="font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)]">
                      Ver todas as disciplinas
                    </Link>
                  </div>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {displayedTopics.length} {displayedTopics.length === 1 ? "resumo disponível" : "resumos disponíveis"}
              </p>
            </div>

            <div className="flex flex-col gap-12">
              {disciplines.map((discipline) => {
                const DisciplineIcon = getDisciplineIcon(discipline);
                const toneClass = getDisciplineToneClass(
                  allDisciplines.indexOf(discipline)
                );

                return (
                  <details
                    key={discipline}
                    open
                    className={`group ${toneClass}`}
                    aria-labelledby={`discipline-${discipline}`}
                  >
                    <summary className="mb-5 flex cursor-pointer list-none items-center gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden">
                      <span className="discipline-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl" aria-hidden="true">
                        <DisciplineIcon size={19} strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 id={`discipline-${discipline}`} className="truncate text-lg font-black text-[var(--text-primary)] sm:text-xl">
                          {discipline}
                        </h3>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {groupedTopics[discipline].length} {groupedTopics[discipline].length === 1 ? "resumo" : "resumos"}
                        </p>
                      </div>
                      <span className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
                      <span
                        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[var(--accent)]"
                        aria-hidden="true"
                      >
                        <span className="group-open:hidden">Expandir</span>
                        <span className="hidden group-open:inline">Recolher</span>
                        <ChevronDown
                          size={18}
                          className="transition-transform group-open:rotate-180"
                        />
                      </span>
                    </summary>

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
                        className="discipline-card group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)] sm:p-6"
                      >
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <span className="discipline-icon grid h-10 w-10 place-items-center rounded-xl" aria-hidden="true">
                            {progress.percent === 100 ? <CheckCircle2 size={20} /> : <DisciplineIcon size={20} />}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${getProgressBadgeClass(progress.percent)}`}>
                            {progress.percent === 100 ? "Concluído" : progress.percent > 0 ? `${progress.percent}%` : "Novo"}
                          </span>
                        </div>
                        <h3 className="text-xl font-black leading-tight text-[var(--text-primary)]">
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
                  </details>
                );
              })}
            </div>
          </div>
        )}
        </section>
      </div>
    </main>
  );
}
