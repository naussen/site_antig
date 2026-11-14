import Link from "next/link";
import { SampleQuestion } from "@/components/landing/sample-question";
import { createPublicPageMetadata, SITE_HOME_URL } from "@/lib/seo.mjs";

const OFFICIAL_SOURCE_URL = "https://www.tse.jus.br/legislacao/codigo-eleitoral/constituicao-federal/constituicao-da-republica-federativa-do-brasil";

export const metadata = createPublicPageMetadata({
  title: "Amostra gratuita: soberania popular e questão comentada",
  description: "Experimente uma leitura de Direito Constitucional e uma questão autoral de certo ou errado, com comentário e fonte oficial, sem cadastro.",
  path: "/amostra",
});

export default function SamplePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="Navegação estrutural" className="text-sm text-[var(--text-muted)]">
        <Link href={SITE_HOME_URL} className="inline-flex min-h-11 items-center rounded hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Início</Link>
        <span aria-hidden="true"> / </span>
        <span>Amostra gratuita</span>
      </nav>
      <article className="mt-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Direito Constitucional · acesso aberto</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Soberania popular: de onde vem o poder e como ele é exercido</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--text-secondary)]">Leia uma síntese, confira o texto constitucional e responda a uma questão com comentário imediato. Sem cadastro e sem pagamento.</p>
        </header>

        <div className="mt-9 space-y-9">
          <section aria-labelledby="sample-summary-title">
            <h2 id="sample-summary-title" className="text-2xl font-extrabold">Resumo do dispositivo</h2>
            <p className="mt-4 leading-8 text-[var(--text-secondary)]">A Constituição afirma que todo o poder emana do povo. O mesmo dispositivo prevê duas formas de exercício: por meio de representantes eleitos ou diretamente, sempre nos termos da Constituição.</p>
            <p className="mt-4 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--accent-soft)] p-4 leading-7">Ponto de atenção: o texto não limita o exercício do poder à representação. A alternativa “ou diretamente” também faz parte da regra.</p>
          </section>

          <section aria-labelledby="sample-law-title">
            <h2 id="sample-law-title" className="text-2xl font-extrabold">Confira a literalidade</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Constituição Federal de 1988 · art. 1º, parágrafo único</p>
            <blockquote className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 font-serif text-lg leading-8 sm:p-6">
              Parágrafo único. Todo o poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição.
            </blockquote>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">Fonte: <a href={OFFICIAL_SOURCE_URL} className="rounded font-bold text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Constituição Federal no portal oficial do TSE</a>. Texto conferido nessa fonte em <time dateTime="2026-11-14">14/11/2026</time>.</p>
          </section>

          <SampleQuestion />

          <section aria-labelledby="sample-next-title" className="border-t border-[var(--border)] pt-8">
            <h2 id="sample-next-title" className="text-2xl font-extrabold">Conheça a proposta completa</h2>
            <p className="mt-4 leading-7 text-[var(--text-secondary)]">O PRO Concursos reúne resumos, questões, legislação e ferramentas de estudo. Esta amostra curta permite experimentar a sequência de leitura e prática; suas respostas ficam apenas nesta página e não são salvas.</p>
            <a href={`${SITE_HOME_URL}#aviso-lancamento`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--action)] px-5 font-bold text-[var(--action-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Receber o aviso de lançamento</a>
          </section>
        </div>

        <footer className="mt-10 border-t border-[var(--border)] pt-6 text-sm leading-6 text-[var(--text-muted)]">
          <p>Amostra autoral elaborada com apoio de IA e conferência automatizada da literalidade na fonte indicada. Não é questão de banca nem revisão jurídica especializada.</p>
          <p className="mt-3">Consulte a <Link href="/metodologia-editorial" className="rounded font-bold text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">metodologia editorial</Link> ou <Link href="/contato" className="rounded font-bold text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">informe um erro</Link>.</p>
        </footer>
      </article>
    </main>
  );
}
