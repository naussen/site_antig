import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Map,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Mnemônicos Poderosos",
    desc: "Associações mentais precisas criadas para você nunca mais esquecer listas, artigos e regras no dia da prova.",
    badge: "Alta retenção",
  },
  {
    icon: BookOpen,
    title: "Flashcards 3D Interativos",
    desc: "Repetição espaçada integrada diretamente no resumo. Teste seu conhecimento enquanto estuda.",
    badge: "Memória ativa",
  },
  {
    icon: Map,
    title: "Mapas Mentais",
    desc: "Diagramas Mermaid gerados automaticamente para conectar ideias e visualizar hierarquias de conteúdo.",
    badge: "Visão sistêmica",
  },
  {
    icon: Layers3,
    title: "Resumos por Seções",
    desc: "Conteúdo dividido em seções progressivas. Avance no ritmo certo e acompanhe seu progresso em tempo real.",
    badge: "Progresso rastreado",
  },
  {
    icon: TrendingUp,
    title: "Painel de Progresso",
    desc: "Dashboard completo com estatísticas de leitura, disciplinas concluídas e sugestão do próximo passo.",
    badge: "Dados inteligentes",
  },
  {
    icon: Shield,
    title: "Conteúdo Jurídico Curado",
    desc: "Resumos revisados com linguagem didática, callouts de atenção e alertas de pegadinhas de prova.",
    badge: "Qualidade editorial",
  },
];

const disciplines = [
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Civil",
  "Direito Penal",
  "Direito Tributário",
  "Direito do Trabalho",
  "Direito Processual Civil",
  "Direito Processual Penal",
];

const steps = [
  {
    number: "01",
    title: "Escolha sua disciplina",
    desc: "Acesse o dashboard e selecione as matérias do seu edital. O sistema organiza tudo por disciplina automaticamente.",
  },
  {
    number: "02",
    title: "Estude com profundidade",
    desc: "Leia os resumos estruturados com mnemônicos, mapas mentais e callouts de atenção a cada seção.",
  },
  {
    number: "03",
    title: "Pratique com flashcards",
    desc: "Ao final de cada seção, teste seu conhecimento com flashcards 3D integrados ao conteúdo.",
  },
  {
    number: "04",
    title: "Monitore seu avanço",
    desc: "Acompanhe o progresso por tópico, receba sugestões de estudo e chegue à prova com mais segurança.",
  },
];

/** Renderiza o visual completo da landing page, sem lógica de autenticação. */
export function LandingPageContent() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Navbar ── */}
      <nav
        className="w-full sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 backdrop-blur-sm"
        style={{
          background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
            }}
          >
            <Sparkles size={17} className="text-white" />
          </div>
          PRO Resumos
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[var(--accent-soft)]"
            style={{ color: "var(--text-primary)" }}
          >
            Entrar
          </Link>
          <Link
            id="nav-cta"
            href="/login"
            className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "var(--accent)",
              color: "#fff",
              boxShadow:
                "0 4px 14px -2px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--accent-soft) 60%, transparent), transparent 70%)",
          }}
        />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 text-xs font-bold tracking-[0.18em] uppercase animate-fade-in-up"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border:
                "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
            }}
          >
            <Zap size={13} />
            Plataforma de Alta Performance
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-7 leading-[1.05] tracking-tight text-balance animate-fade-in-up"
            style={{ color: "var(--text-primary)", animationDelay: "60ms" }}
          >
            Estude menos.{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Retenha mais.
            </span>
            <br className="hidden md:block" />
            Seja aprovado.
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-11 leading-relaxed animate-fade-in-up"
            style={{ color: "var(--text-secondary)", animationDelay: "120ms" }}
          >
            Resumos jurídicos estruturados com mnemônicos, flashcards 3D, mapas
            mentais e progresso rastreado. Tudo que você precisa para concursos
            públicos em um só lugar.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              id="hero-cta-primary"
              href="/login"
              className="inline-flex items-center gap-2.5 text-base font-bold px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{
                background: "var(--action)",
                color: "var(--action-foreground)",
                boxShadow:
                  "0 10px 30px -8px color-mix(in srgb, var(--action) 55%, transparent)",
              }}
            >
              Começar a estudar agora
              <ArrowRight size={19} />
            </Link>
            <Link
              id="hero-cta-secondary"
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-4 rounded-2xl border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Ver demonstração
            </Link>
          </div>

          {/* Social proof mini-stats */}
          <div
            className="mt-16 inline-flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm animate-fade-in-up"
            style={{ color: "var(--text-muted)", animationDelay: "240ms" }}
          >
            {[
              { value: "8+", label: "Disciplinas jurídicas" },
              { value: "Flashcards", label: "3D integrados" },
              { value: "3 temas", label: "Light · Dark · Sepia" },
            ].map((stat) => (
              <span key={stat.label} className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  style={{ color: "var(--accent)" }}
                  aria-hidden="true"
                />
                <strong style={{ color: "var(--text-primary)" }}>
                  {stat.value}
                </strong>{" "}
                {stat.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Dashboard Preview Banner ── */}
      <section
        className="mx-4 md:mx-auto md:max-w-5xl rounded-3xl border overflow-hidden mb-20"
        style={{
          background: "var(--dashboard-sidebar)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        aria-label="Prévia do painel de estudos"
      >
        {/* Fake window chrome */}
        <div
          className="flex items-center gap-2 px-5 py-3 border-b"
          style={{
            borderColor: "var(--dashboard-sidebar-border)",
            background:
              "color-mix(in srgb, var(--dashboard-sidebar) 80%, transparent)",
          }}
        >
          <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
          <span
            className="ml-4 text-xs font-mono tracking-wider opacity-40"
            style={{ color: "var(--dashboard-sidebar-text)" }}
          >
            pro-resumos.app / dashboard
          </span>
        </div>

        {/* Mock dashboard content */}
        <div className="p-5 md:p-8 grid md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar mock */}
          <aside
            className="hidden md:flex flex-col gap-3 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="flex items-center gap-2 mb-4 text-sm font-bold"
              style={{ color: "var(--dashboard-sidebar-text)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--accent)" }}
              >
                <Sparkles size={13} className="text-white" />
              </div>
              PRO Resumos
            </div>
            {["Início", "Notas", "Matérias"].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background:
                    i === 0 ? "var(--dashboard-sidebar-active)" : "transparent",
                  color:
                    i === 0 ? "var(--accent)" : "var(--dashboard-sidebar-muted)",
                }}
              >
                <div
                  className="w-4 h-4 rounded opacity-70"
                  style={{ background: "currentColor" }}
                />
                {item}
              </div>
            ))}
          </aside>

          {/* Main mock content */}
          <div className="flex flex-col gap-5 min-w-0">
            {/* Header card */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: "var(--dashboard-card)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <Sparkles size={11} />
                Painel de estudos
              </div>
              <div
                className="text-xl font-extrabold mb-1"
                style={{ color: "#E8E8F0" }}
              >
                Sua biblioteca de estudos
              </div>
              <div className="text-xs" style={{ color: "#9898AA" }}>
                Acompanhe sua evolução por disciplina
              </div>
              {/* Stats row */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Resumos", value: "12" },
                  { label: "Disciplinas", value: "4" },
                  { label: "Seções", value: "8/48" },
                  { label: "Progresso", value: "17%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <strong
                      className="block text-base font-extrabold"
                      style={{ color: "#E8E8F0" }}
                    >
                      {s.value}
                    </strong>
                    <span className="text-[10px]" style={{ color: "#64647A" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sugestão de estudo mock */}
            <div
              className="rounded-2xl border p-4 flex items-center gap-4"
              style={{
                background: "var(--accent-soft)",
                borderColor: "rgba(108,92,231,0.2)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--action)" }}
              >
                <GraduationCap size={20} style={{ color: "#121212" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent)" }}
                >
                  Sugestão de estudo
                </p>
                <p
                  className="text-sm font-bold truncate"
                  style={{ color: "#E8E8F0" }}
                >
                  Princípios da Administração Pública
                </p>
                <p className="text-xs" style={{ color: "#9898AA" }}>
                  Direito Administrativo · 34% concluído
                </p>
              </div>
              <div
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
                style={{ background: "var(--action)", color: "#121212" }}
              >
                Continuar
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Topic cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: "Poder Constituinte",
                  discipline: "Dir. Constitucional",
                  progress: 100,
                  sections: 8,
                },
                {
                  title: "Atos Administrativos",
                  discipline: "Dir. Administrativo",
                  progress: 34,
                  sections: 12,
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border p-4"
                  style={{
                    background: "var(--dashboard-card)",
                    borderColor: "rgba(255,255,255,0.08)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Progress top bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${t.progress}%`,
                        background: "var(--progress-bar)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {t.progress === 100 ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <BookOpen size={16} />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {t.progress === 100 ? "Concluído" : `${t.progress}%`}
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold leading-snug"
                    style={{ color: "#E8E8F0" }}
                  >
                    {t.title}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "#64647A" }}>
                    {t.discipline} · {t.sections} seções
                  </p>
                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${t.progress}%`,
                        background: "var(--progress-bar)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="max-w-6xl mx-auto px-6 py-20 w-full"
        aria-labelledby="features-title"
      >
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.18em] uppercase"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border:
                "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
            }}
          >
            <Zap size={12} />
            Recursos
          </div>
          <h2
            id="features-title"
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance"
            style={{ color: "var(--text-primary)" }}
          >
            Tudo que você precisa para passar.
          </h2>
          <p
            className="max-w-xl mx-auto text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Cada recurso foi pensado para maximizar sua retenção e minimizar o
            tempo de revisão antes da prova.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, badge }) => (
            <article
              key={title}
              className="group p-7 rounded-3xl border transition-all hover:-translate-y-1.5 hover:shadow-lg"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-start justify-between mb-5 gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
                  }}
                >
                  <Icon size={22} className="text-white" aria-hidden="true" />
                </div>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  {badge}
                </span>
              </div>
              <h3
                className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="w-full py-20"
        style={{ background: "var(--bg-secondary)" }}
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.18em] uppercase"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
              }}
            >
              <Clock size={12} />
              Como funciona
            </div>
            <h2
              id="how-it-works-title"
              className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance"
              style={{ color: "var(--text-primary)" }}
            >
              Do primeiro acesso à aprovação.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="flex gap-5 p-6 rounded-2xl border"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl grid place-items-center font-mono text-sm font-extrabold"
                  style={{
                    background:
                      i === 0
                        ? "var(--accent)"
                        : "color-mix(in srgb, var(--accent) 76%, var(--editorial-band))",
                    color: "#fff",
                  }}
                >
                  {step.number}
                </div>
                <div>
                  <h3
                    className="font-bold text-base mb-1.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disciplines ── */}
      <section
        className="max-w-5xl mx-auto px-6 py-20 w-full"
        aria-labelledby="disciplines-title"
      >
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.18em] uppercase"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border:
                "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
            }}
          >
            <GraduationCap size={12} />
            Conteúdo
          </div>
          <h2
            id="disciplines-title"
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance"
            style={{ color: "var(--text-primary)" }}
          >
            Disciplinas disponíveis
          </h2>
          <p
            className="max-w-xl mx-auto text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            Resumos estruturados para os principais ramos do direito cobrados em
            concursos federais, estaduais e municipais.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {disciplines.map((disc) => (
            <span
              key={disc}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                boxShadow: "var(--shadow)",
              }}
            >
              <BookOpen
                size={14}
                style={{ color: "var(--accent)" }}
                aria-hidden="true"
              />
              {disc}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section
        className="px-6 pb-24 flex justify-center"
        aria-labelledby="cta-title"
      >
        <div
          className="w-full max-w-4xl rounded-3xl border overflow-hidden relative"
          style={{
            background: "var(--editorial-band)",
            borderColor: "var(--editorial-rule)",
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 50% 120%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
            }}
          />

          <div className="relative z-10 px-8 py-16 md:px-16 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-[0.18em] uppercase"
              style={{
                background: "rgba(108, 92, 231, 0.2)",
                color: "#A78BFA",
                border: "1px solid rgba(108, 92, 231, 0.35)",
              }}
            >
              <Sparkles size={12} />
              Comece hoje
            </div>

            <h2
              id="cta-title"
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 text-balance leading-tight"
              style={{ color: "var(--editorial-band-text)" }}
            >
              Sua aprovação começa{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #A78BFA, #F9A826)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                agora.
              </span>
            </h2>

            <p
              className="max-w-lg mx-auto text-base leading-relaxed mb-10"
              style={{ color: "var(--dashboard-sidebar-muted)" }}
            >
              Acesse gratuitamente e comece a estudar com a plataforma mais
              inteligente para concursos públicos.
            </p>

            <Link
              id="cta-final"
              href="/login"
              className="inline-flex items-center gap-2.5 text-base font-bold px-10 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl"
              style={{
                background: "var(--action)",
                color: "var(--action-foreground)",
                boxShadow:
                  "0 10px 35px -8px color-mix(in srgb, var(--action) 60%, transparent)",
              }}
            >
              Criar minha conta gratuita
              <ArrowRight size={19} />
            </Link>

            <p
              className="mt-5 text-xs"
              style={{ color: "var(--dashboard-sidebar-muted)" }}
            >
              Sem cartão de crédito. Acesso imediato via e-mail.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="w-full border-t px-6 py-8 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <div
          className="flex items-center justify-center gap-2 mb-2 font-bold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Sparkles size={12} className="text-white" />
          </div>
          PRO Resumos
        </div>
        <p>Plataforma de estudos para concursos públicos.</p>
      </footer>
    </main>
  );
}
