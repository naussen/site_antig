import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

export const metadata = createPublicPageMetadata({
  title: "Guias de estudo para concursos",
  description:
    "Guias práticos e gratuitos para organizar leitura, revisão e resolução de questões em concursos públicos.",
  path: "/guias",
});

export default function GuidesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Conteúdo gratuito</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight">Guias de estudo para concursos</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">Orientações práticas para transformar leitura em um ciclo de compreensão, recuperação ativa e correção de erros. O acervo será ampliado gradualmente, após conferência individual de cada publicação.</p>

      <section className="mt-10" aria-labelledby="guias-publicados">
        <h2 id="guias-publicados" className="text-2xl font-extrabold">Guias publicados</h2>
        <article className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)] sm:p-8">
          <p className="text-sm font-bold text-[var(--accent)]">Método de estudo</p>
          <h3 className="mt-2 text-2xl font-extrabold">Como estudar por resumos sem ficar apenas na leitura</h3>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--text-secondary)]">Um roteiro para usar o resumo como mapa, testar a lembrança sem consultar o texto e transformar erros em prioridades de revisão.</p>
          <Link href="/guias/como-estudar-por-resumos" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--action)] px-5 font-bold text-[var(--action-foreground)]">Ler o guia</Link>
        </article>
      </section>

      <aside className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm leading-6 text-[var(--text-secondary)]">
        <p><strong className="text-[var(--text-primary)]">Transparência:</strong> os guias podem ser estruturados com apoio de inteligência artificial, mas passam por conferência editorial manual. Consulte a <Link href="/metodologia-editorial" className="font-bold text-[var(--accent)] underline underline-offset-4">metodologia editorial</Link> e a <Link href="/politica-de-ia" className="font-bold text-[var(--accent)] underline underline-offset-4">política de IA</Link>.</p>
      </aside>
    </main>
  );
}
