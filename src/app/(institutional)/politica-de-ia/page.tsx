import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

export const metadata = createPublicPageMetadata({
  title: "Política de uso de inteligência artificial",
  description:
    "Como o PRO Concursos utiliza inteligência artificial e quais controles editoriais aplica.",
  path: "/politica-de-ia",
});

export default function AiPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Transparência</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Política de uso de inteligência artificial</h1>
      <div className="mt-8 space-y-8 text-base leading-7 text-[var(--text-secondary)]">
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Onde a IA pode ser usada</h2><p className="mt-3">Ferramentas de IA podem apoiar organização, síntese, geração de estruturas de estudo, revisão de clareza e identificação de pontos que exigem conferência. Produção em escala não substitui a análise individual do material.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">O que a IA não representa</h2><p className="mt-3">Uma resposta gerada por IA não é fonte jurídica, não é prova de vigência e não é aceita como confirmação factual. A plataforma não atribui à IA autoria profissional, habilitação ou responsabilidade editorial.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Controle humano</h2><p className="mt-3">O conteúdo destinado à publicação passa por conferência editorial e documental manual pelo responsável pelo PRO Concursos. Informações objetivas devem ser comparadas com fontes oficiais, conforme descrito na <Link href="/metodologia-editorial" className="font-bold text-[var(--accent)] underline underline-offset-4">metodologia editorial</Link>.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Limitações</h2><p className="mt-3">Mesmo com conferência, podem existir omissões, interpretações inadequadas ou conteúdo desatualizado. O estudante deve consultar a fonte oficial e o edital aplicável antes de tomar decisões de estudo ou usar uma informação em contexto profissional.</p></section>
        <section><h2 className="text-xl font-extrabold text-[var(--text-primary)]">Relato de erro</h2><p className="mt-3">Relatos podem ser enviados pelo <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">canal de contato</Link>. Correções relevantes são descritas publicamente sem expor dados pessoais do usuário que fez o relato.</p></section>
      </div>
    </main>
  );
}
