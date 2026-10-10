import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  StickyNote,
} from "lucide-react";
import { DashboardPageHero } from "@/components/dashboard/dashboard-page-hero";
import { ProLogo } from "@/components/brand/pro-logo";
import { ProQuestionsLogo } from "@/components/brand/pro-questions-logo";

const modules = [
  {
    icon: BookOpen,
    eyebrow: "Conteúdo estruturado",
    title: "PRO Resumos",
    description: "Leitura jurídica clara, progresso e revisão no mesmo ambiente.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Rotina de estudo",
    title: "Planner",
    description: "Planejamento semanal simples, visual e adaptado à sua agenda.",
  },
  {
    icon: StickyNote,
    eyebrow: "Revisão pessoal",
    title: "Notas",
    description: "Anotações organizadas por disciplina e tópico estudado.",
  },
] as const;

export default function VisualRegressionPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main
      data-testid="visual-regression-fixture"
      className="pro-resumos-shell min-h-screen bg-[var(--dashboard-bg)] px-4 py-5 text-[var(--text-primary)] sm:px-8 sm:py-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <ProLogo variant="full" size={30} highPriority />
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)]">
            Área do aluno
          </span>
        </header>

        <section className="mt-6">
          <DashboardPageHero
            icon={CheckCircle2}
            eyebrow="Ecossistema PRO Concursos"
            title="Estude com clareza e consistência"
            description="Uma amostra determinística dos elementos compartilhados para validar identidade, contraste e responsividade."
          >
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--catalog-hero-start)] shadow-sm">
                Continuar estudando
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white">
                Ver progresso
              </button>
            </div>
          </DashboardPageHero>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="pro-questions-shell rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <ProQuestionsLogo />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-[var(--accent)]">
              Prática direcionada
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Uma questão por vez
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Filtros objetivos, comentário didático e estatísticas para acompanhar sua evolução.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-white">
                Resolver questão
              </button>
              <button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]">
                Escolher disciplina
              </button>
            </div>
          </article>

          <aside className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--accent)]">
              Hoje
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight">72%</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              de acertos nas últimas atividades
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div className="h-full w-[72%] rounded-full bg-[var(--accent)]" />
            </div>
            <ul className="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center justify-between gap-4">
                <span>Questões resolvidas</span>
                <strong className="text-[var(--text-primary)]">18</strong>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>Tópicos revisados</span>
                <strong className="text-[var(--text-primary)]">6</strong>
              </li>
            </ul>
          </aside>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Módulos do site">
          {modules.map(({ icon: Icon, eyebrow, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon size={21} aria-hidden="true" />
              </span>
              <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {eyebrow}
              </p>
              <h3 className="mt-1 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
