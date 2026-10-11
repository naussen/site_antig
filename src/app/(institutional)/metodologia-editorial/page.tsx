import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo.mjs";

export const metadata = createPublicPageMetadata({
  title: "Metodologia editorial",
  description:
    "Etapas de elaboração, conferência documental, publicação e correção do conteúdo do PRO Concursos.",
  path: "/metodologia-editorial",
});

const editorialSteps = [
  ["Definição do tema", "O escopo e a finalidade didática são delimitados antes da elaboração."],
  ["Fontes", "São identificadas as fontes oficiais aplicáveis, como legislação, órgãos públicos e tribunais."],
  ["Estruturação", "Ferramentas de IA podem apoiar a organização inicial, sempre como material não confiável sujeito a conferência."],
  ["Comparação manual", "Informações objetivas são comparadas com as fontes selecionadas, com atenção especial a datas, prazos, quóruns, numerais e referências."],
  ["Qualidade editorial", "Hierarquia, clareza, legibilidade e separação entre literalidade e explicação são verificadas antes da publicação."],
  ["Publicação e manutenção", "O conteúdo é publicado com indicação de fonte e data quando o formato permitir, e pode ser revisto por mudança normativa ou relato fundamentado."],
] as const;

export default function EditorialMethodPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Processo editorial</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Metodologia editorial</h1>
      <p className="mt-5 leading-7 text-[var(--text-secondary)]">O método busca reduzir erros e tornar o conteúdo rastreável. Ele não transforma o material em fonte oficial nem elimina a necessidade de conferência pelo estudante.</p>
      <ol className="mt-10 space-y-5">
        {editorialSteps.map(([title, description], index) => (
          <li key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
            <p className="text-sm font-bold text-[var(--accent)]">Etapa {index + 1}</p>
            <h2 className="mt-1 text-xl font-extrabold">{title}</h2>
            <p className="mt-3 leading-7 text-[var(--text-secondary)]">{description}</p>
          </li>
        ))}
      </ol>
      <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-xl font-extrabold">Responsabilidade e correção</h2>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">A conferência editorial e documental é realizada por Naussen Cosme Velho Pezat. Não é apresentada como revisão jurídica especializada. Um erro pode ser relatado pelo <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">canal de contato</Link> e, quando relevante, documentado no <Link href="/correcoes" className="font-bold text-[var(--accent)] underline underline-offset-4">registro de correções</Link>.</p>
      </section>
    </main>
  );
}
