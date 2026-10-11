import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

export const metadata = createPublicPageMetadata({
  title: "Correções editoriais",
  description:
    "Política e registro público de correções relevantes do PRO Concursos.",
  path: "/correcoes",
});

export default function CorrectionsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Transparência editorial</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Correções editoriais</h1>
      <p className="mt-5 leading-7 text-[var(--text-secondary)]">Este registro público foi iniciado em 11 de outubro de 2026. Correções relevantes serão descritas com a página afetada, data, tipo, resumo da alteração e fonte usada na conferência.</p>
      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
        <h2 className="text-xl font-extrabold">Registro atual</h2>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">Nenhuma correção editorial foi registrada nesta página desde o início deste histórico.</p>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-extrabold">Como relatar um problema</h2>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">Informe a página, o trecho, o motivo da divergência e, quando possível, a fonte oficial correspondente. Não envie senhas, documentos pessoais ou dados de pagamento.</p>
        <Link href="/contato" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--action)] px-5 font-bold text-[var(--action-foreground)]">Acessar canal de contato</Link>
      </section>
    </main>
  );
}
