import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

export const metadata = createPublicPageMetadata({
  title: "Sobre o PRO Concursos",
  description:
    "Conheça a proposta, o responsável editorial e os limites do PRO Concursos.",
  path: "/sobre",
});

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Transparência editorial</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Sobre o PRO Concursos</h1>
      <div className="mt-8 space-y-8 text-base leading-7 text-[var(--text-secondary)]">
        <section>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">A proposta</h2>
          <p className="mt-3">O PRO Concursos é uma plataforma independente de apoio ao estudo para concursos públicos. O produto reúne resumos estruturados, questões, legislação e ferramentas de revisão para estudantes que desejam organizar a preparação em um único ambiente.</p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Responsabilidade editorial</h2>
          <p className="mt-3">Naussen Cosme Velho Pezat mantém o produto e responde pela conferência editorial e documental do conteúdo publicado. Essa função descreve o processo efetivamente realizado e não representa título acadêmico, habilitação profissional jurídica ou certificação especializada.</p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Como o conteúdo é tratado</h2>
          <p className="mt-3">A inteligência artificial pode apoiar estruturação, síntese e revisão de forma, mas suas respostas não são tratadas como fonte. Informações objetivas devem ser comparadas manualmente com fontes oficiais antes da publicação, conforme a <Link href="/metodologia-editorial" className="font-bold text-[var(--accent)] underline underline-offset-4">metodologia editorial</Link> e a <Link href="/politica-de-ia" className="font-bold text-[var(--accent)] underline underline-offset-4">política de uso de IA</Link>.</p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Limites e correções</h2>
          <p className="mt-3">O material tem finalidade educacional, não garante aprovação, não constitui consultoria jurídica e não substitui legislação, editais ou decisões em suas fontes oficiais. Erros podem ser informados pelo <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">canal de contato</Link>; correções relevantes são registradas na página de <Link href="/correcoes" className="font-bold text-[var(--accent)] underline underline-offset-4">correções editoriais</Link>.</p>
        </section>
      </div>
    </main>
  );
}
