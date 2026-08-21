import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  Gavel,
  Highlighter,
  Layers3,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Sunrise,
} from "lucide-react";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

const LOGO_SRC = withSiteBasePath("/brand/pro-concursos-logo.png");

function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="PRO Concursos"
      width={250}
      height={100}
      className={`h-auto w-[170px] rounded-xl bg-white/95 px-2 py-1 sm:w-[210px] ${className}`}
      priority
    />
  );
}

function WindowFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#181820] shadow-2xl shadow-black/25">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f9a826]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
        <span className="ml-2 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c4b5fd]">
        <Sparkles size={13} aria-hidden="true" /> {eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-[#b4b1c3] md:text-lg">{description}</p>
    </div>
  );
}

function ResumosPreview() {
  return (
    <WindowFrame label="Módulo Resumos · Direito Constitucional">
      <div className="grid min-h-[430px] md:grid-cols-[185px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#14141b] p-5 md:block">
          <div className="mb-7 flex items-center gap-2 text-sm font-extrabold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a78bfa]"><BookOpen size={16} /></span>
            PRO Resumos
          </div>
          <div className="mb-2 rounded-xl bg-[#a78bfa]/15 px-3 py-2.5 text-xs font-semibold text-[#c4b5fd]">Visão geral</div>
          {["Poder constituinte", "Direitos fundamentais", "Administração pública"].map((item) => (
            <div key={item} className="mb-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/40">{item}</div>
          ))}
        </aside>
        <div className="bg-[#f4f5f7] p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6c5ce7]">Direito Constitucional</p>
              <h3 className="mt-1 text-xl font-extrabold text-[#1a1a2e] sm:text-2xl">Poder Constituinte</h3>
            </div>
            <span className="rounded-full bg-[#6c5ce7]/10 px-3 py-1 text-[10px] font-bold text-[#6c5ce7]">68% concluído</span>
          </div>
          <div className="rounded-2xl border border-[#e5e5ef] bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold text-[#6c5ce7]">1. Conceito e titularidade</p>
            <div className="space-y-2 text-xs leading-6 text-[#64647a] sm:text-sm">
              <p>O poder constituinte é a capacidade de criar ou modificar uma Constituição, estruturando juridicamente o Estado.</p>
              <p>A titularidade pertence ao <strong className="text-[#1a1a2e]">povo</strong>, que a exerce por representantes ou diretamente.</p>
            </div>
            <div className="mt-5 rounded-xl border-l-4 border-[#f9a826] bg-[#fff7e7] p-3 text-xs text-[#69480c]"><strong>Ponto de prova:</strong> titularidade e exercício não se confundem.</div>
            <div className="mt-5 flex items-center justify-between border-t border-[#e5e5ef] pt-4">
              <span className="text-[10px] text-[#9898aa]">Seção 4 de 9</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#6c5ce7] px-3 py-2 text-[10px] font-bold text-white"><Check size={12} /> Marcar como lida</span>
            </div>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

function LegisPreview() {
  return (
    <WindowFrame label="Módulo Legis · Constituição Federal">
      <div className="min-h-[430px] bg-[#f6f0df] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[#cbbf9e] pb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b6914]">Texto oficial versionado</p>
            <h3 className="mt-1 font-serif text-xl font-bold text-[#3d3529] sm:text-2xl">Constituição da República Federativa do Brasil</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8b6914]/30 bg-[#8b6914]/10 px-3 py-1 text-[10px] font-bold text-[#6d510e]"><CheckCircle2 size={12} /> Fonte oficial conferida</span>
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_155px]">
          <article className="rounded-2xl border border-[#d4c9a8] bg-[#fffaf0] p-5 font-serif text-sm leading-7 text-[#4b4332] shadow-sm">
            <p className="mb-3 font-bold">Art. 5º</p>
            <p>Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.</p>
            <div className="mt-5 border-t border-[#d4c9a8] pt-4 font-sans text-[10px] text-[#8b7e6a]">Redação vigente · conferida em fonte oficial</div>
          </article>
          <aside className="space-y-3">
            {[["Texto oficial", "Ativo"], ["Prática C/E", "12 itens"], ["Meu progresso", "42%"]].map(([title, value]) => (
              <div key={title} className="rounded-xl border border-[#d4c9a8] bg-[#f0e8d0] p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#8b7e6a]">{title}</p>
                <p className="mt-1 text-xs font-extrabold text-[#3d3529]">{value}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </WindowFrame>
  );
}

function FlashcardPreview() {
  return (
    <div className="relative mx-auto flex min-h-52 max-w-sm items-center justify-center">
      <div className="absolute h-40 w-64 rotate-6 rounded-2xl bg-[#4c3cb6] opacity-45" />
      <div className="relative flex h-44 w-72 -rotate-2 flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] p-5 shadow-xl">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Certo ou errado?</span>
        <p className="text-center text-sm font-bold leading-6 text-white">O poder constituinte originário é juridicamente ilimitado.</p>
        <div className="flex justify-center gap-2"><span className="rounded-lg bg-white/10 px-4 py-2 text-[10px] font-bold text-white">Errado</span><span className="rounded-lg bg-[#f9a826] px-4 py-2 text-[10px] font-bold text-[#121212]">Certo</span></div>
      </div>
    </div>
  );
}

function NotesPreview() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-[#fdd835]/35 bg-[#fffde7] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between border-b border-[#eadc8a] pb-3"><span className="flex items-center gap-2 text-xs font-extrabold text-[#6b5e1e]"><NotebookPen size={15} /> Minhas anotações</span><span className="text-[9px] font-semibold text-[#928743]">Salvo agora</span></div>
      <p className="text-xs leading-6 text-[#5d5528]">Revisar a diferença entre poder constituinte derivado reformador e decorrente antes de resolver as questões.</p>
      <div className="mt-4 flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6c5ce7]" /><span className="h-2 w-2 rounded-full bg-[#f9a826]" /><span className="h-2 w-2 rounded-full bg-[#22c55e]" /></div>
    </div>
  );
}

function HighlightPreview() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white p-5 text-[#36364b] shadow-xl">
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#f4f5f7] p-2"><Highlighter size={14} className="text-[#6c5ce7]" /><span className="h-5 w-5 rounded-md bg-[#facc15]" /><span className="h-5 w-5 rounded-md bg-[#fb923c]" /><span className="h-5 w-5 rounded-md bg-[#f472b6]" /><span className="h-5 w-5 rounded-md bg-[#60a5fa]" /><span className="h-5 w-5 rounded-md bg-[#4ade80]" /></div>
      <p className="text-sm leading-7">A administração pública obedecerá aos princípios de legalidade, impessoalidade, <span className="mx-1 rounded bg-[#fde047]/70 px-1">moralidade, publicidade e eficiência</span>.</p>
      <p className="mt-4 text-[10px] font-semibold text-[#9898aa]">Realces salvos automaticamente</p>
    </div>
  );
}

function ThemePreview() {
  const themes = [
    { name: "Light", icon: Sun, bg: "bg-[#f4f5f7]", card: "bg-white", text: "text-[#1a1a2e]", muted: "bg-[#e5e5ef]" },
    { name: "Dark", icon: Moon, bg: "bg-[#0f0f14]", card: "bg-[#22222e]", text: "text-[#e8e8f0]", muted: "bg-[#3d3d4d]" },
    { name: "Sepia", icon: Sunrise, bg: "bg-[#f4ecd8]", card: "bg-[#f0e8d0]", text: "text-[#3d3529]", muted: "bg-[#d4c9a8]" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {themes.map(({ name, icon: Icon, bg, card, text, muted }) => (
        <div key={name} className={`rounded-xl p-2.5 ${bg}`}>
          <div className={`rounded-lg p-3 shadow-sm ${card}`}><Icon size={14} className={text} /><div className={`mt-3 h-2 w-4/5 rounded bg-current opacity-80 ${text}`} /><div className={`mt-2 h-1.5 w-full rounded ${muted}`} /><div className={`mt-1 h-1.5 w-3/5 rounded ${muted}`} /></div>
          <p className={`mt-2 text-center text-[9px] font-bold ${text}`}>{name}</p>
        </div>
      ))}
    </div>
  );
}

const toolPreviews = [
  { title: "Flashcards que desafiam sua memória", description: "Prática C/E integrada ao conteúdo para revisar sem interromper o ritmo.", preview: <FlashcardPreview /> },
  { title: "Anotações no contexto certo", description: "Registre observações durante a leitura e encontre tudo em um painel central.", preview: <NotesPreview /> },
  { title: "Realce o que realmente importa", description: "Dez cores, salvamento automático e seus trechos marcados sempre disponíveis.", preview: <HighlightPreview /> },
  { title: "Conforto visual em qualquer horário", description: "Alterne entre Light, Dark e Sepia de acordo com seu ambiente de estudo.", preview: <ThemePreview /> },
];

export function LandingPageContent() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#181820] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#181820]/90 px-5 py-3 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="https://proconcursos.com.br/" aria-label="PRO Concursos — página inicial"><BrandLogo /></Link>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/5 hover:text-white sm:block">Entrar</Link><Link href="/login" className="rounded-xl bg-[#f9a826] px-4 py-2.5 text-xs font-extrabold text-[#121212] shadow-lg shadow-[#f9a826]/15 transition hover:-translate-y-0.5 hover:bg-[#ffc15c] sm:px-5 sm:text-sm">Começar agora</Link></div>
        </div>
      </nav>

      <header className="relative px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(108,92,231,0.32),transparent_70%)]" />
        <div className="pointer-events-none absolute -left-32 top-32 h-80 w-80 rounded-full bg-[#7c3aed]/15 blur-3xl" /><div className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-[#f9a826]/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c4b5fd]"><Sparkles size={13} /> Um ecossistema completo para concursos</span>
          <h1 className="text-balance text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white md:text-7xl lg:text-8xl">Sua aprovação começa <span className="bg-gradient-to-r from-[#a78bfa] to-[#f9a826] bg-clip-text text-transparent">agora.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-8 text-[#b4b1c3] md:text-xl">Resumos inteligentes, legislação oficial, flashcards, anotações e ferramentas de leitura em uma experiência feita para você avançar todos os dias.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"><Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f9a826] px-8 py-4 text-base font-extrabold text-[#121212] shadow-2xl shadow-[#f9a826]/20 transition hover:-translate-y-1 hover:bg-[#ffc15c] sm:w-auto">Criar minha conta gratuita <ArrowRight size={19} /></Link><a href="#modulos" className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 px-8 py-4 text-sm font-bold text-white/80 transition hover:border-[#a78bfa]/60 hover:bg-white/5 hover:text-white sm:w-auto">Conhecer a plataforma</a></div>
          <p className="mt-5 text-xs text-white/40">Sem cartão de crédito. Acesso imediato via e-mail.</p>
        </div>
      </header>

      <section className="px-5 pb-24 sm:px-8" aria-label="Assinatura única">
        <div className="mx-auto grid max-w-5xl gap-5 rounded-3xl border border-[#a78bfa]/25 bg-[#262638] p-6 shadow-2xl shadow-black/20 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f9a826]">Uma assinatura. Todo o ecossistema.</p><h2 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">PRO Resumos + PRO Legis e os próximos módulos.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#b4b1c3]">Tudo por uma só assinatura mensal. Novas ferramentas e módulos serão incorporados futuramente à plataforma.</p></div>
          <div className="flex gap-2 md:flex-col"><span className="rounded-full bg-[#a78bfa]/15 px-4 py-2 text-center text-xs font-bold text-[#c4b5fd]">Resumos</span><span className="rounded-full bg-[#a78bfa]/15 px-4 py-2 text-center text-xs font-bold text-[#c4b5fd]">Legis</span><span className="rounded-full border border-dashed border-white/25 px-4 py-2 text-center text-xs font-bold text-white/45">Mais em breve</span></div>
        </div>
      </section>

      <section id="modulos" className="border-y border-white/10 bg-[#20202c] px-5 py-24 sm:px-8">
        <SectionHeading eyebrow="Módulos" title="Do resumo à lei seca, sem trocar de plataforma." description="Dois ambientes complementares para compreender a matéria, consultar a literalidade e praticar com segurança." />
        <div className="mx-auto max-w-6xl space-y-14">
          <article className="grid items-center gap-8 lg:grid-cols-[0.78fr_1.4fr]"><div><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-lg shadow-[#7c3aed]/25"><Layers3 size={22} /></span><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c4b5fd]">PRO Resumos</p><h3 className="mt-3 text-3xl font-extrabold tracking-tight">Conteúdo organizado para você entender e reter.</h3><p className="mt-4 leading-7 text-[#b4b1c3]">Resumos jurídicos divididos em seções, com pontos de prova, mnemônicos, mapas mentais e progresso de leitura.</p></div><ResumosPreview /></article>
          <article className="grid items-center gap-8 lg:grid-cols-[1.4fr_0.78fr]"><div className="lg:order-2"><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#f9a826] to-[#c27b08] text-[#121212] shadow-lg shadow-[#f9a826]/20"><Gavel size={22} /></span><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f9a826]">PRO Legis</p><h3 className="mt-3 text-3xl font-extrabold tracking-tight">A legislação vigente em uma leitura confiável.</h3><p className="mt-4 leading-7 text-[#b4b1c3]">Texto oficial versionado, progresso por dispositivo legal e prática C/E conectada à literalidade da lei.</p></div><LegisPreview /></article>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8" id="ferramentas">
        <SectionHeading eyebrow="Ferramentas de estudo" title="Veja como cada recurso trabalha a seu favor." description="Uma experiência integrada para ler, testar a memória, registrar ideias e estudar com conforto por mais tempo." />
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          {toolPreviews.map(({ title, description, preview }) => <article key={title} className="overflow-hidden rounded-3xl border border-white/10 bg-[#262638]"><div className="min-h-[270px] bg-[radial-gradient(circle_at_50%_45%,rgba(167,139,250,0.14),transparent_65%)] p-6 sm:p-8">{preview}</div><div className="border-t border-white/10 p-6 sm:p-7"><h3 className="text-xl font-extrabold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-[#b4b1c3]">{description}</p></div></article>)}
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8" aria-labelledby="future-title">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#a78bfa]/25 bg-gradient-to-br from-[#302d4e] to-[#262638] p-8 text-center sm:p-12"><div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#a78bfa]/15 blur-3xl" /><FileText className="relative mx-auto text-[#f9a826]" size={34} /><h2 id="future-title" className="relative mt-5 text-3xl font-extrabold text-white md:text-4xl">O ecossistema continuará crescendo.</h2><p className="relative mx-auto mt-4 max-w-2xl leading-7 text-[#b4b1c3]">Além de Resumos e Legis, novos módulos para outras etapas da preparação serão lançados futuramente — integrados à mesma conta e à mesma assinatura mensal.</p></div>
      </section>

      <section className="px-5 pb-24 sm:px-8" aria-labelledby="cta-title">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#343449] bg-[#262638] px-8 py-16 text-center md:px-16"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_120%,rgba(108,92,231,0.25),transparent_70%)]" /><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/35 bg-[#a78bfa]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c4b5fd]"><Sparkles size={12} /> Comece hoje</span><h2 id="cta-title" className="mt-7 text-balance text-4xl font-extrabold tracking-tight text-white md:text-5xl">Sua aprovação começa <span className="bg-gradient-to-r from-[#a78bfa] to-[#f9a826] bg-clip-text text-transparent">agora.</span></h2><p className="mx-auto mt-5 max-w-lg leading-7 text-[#b4b1c3]">Acesse gratuitamente e comece a estudar com uma plataforma criada para concursos públicos.</p><Link href="/login" className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#f9a826] px-9 py-4 text-base font-extrabold text-[#121212] shadow-2xl shadow-[#f9a826]/20 transition hover:-translate-y-1 hover:bg-[#ffc15c]">Criar minha conta gratuita <ArrowRight size={19} /></Link><p className="mt-5 text-xs text-white/40">Sem cartão de crédito. Acesso imediato via e-mail.</p></div></div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row"><BrandLogo className="opacity-90" /><p className="text-center text-xs text-white/40 sm:text-right">Um ecossistema de estudos para concursos públicos.</p></div></footer>
    </main>
  );
}
