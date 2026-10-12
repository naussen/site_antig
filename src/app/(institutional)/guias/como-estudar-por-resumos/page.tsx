import Link from "next/link";
import { serializeJsonLd } from "@/lib/json-ld.mjs";
import {
  createPublicPageMetadata,
  getPublicUrl,
  SITE_HOME_URL,
} from "@/lib/seo.mjs";

const GUIDE_PATH = "/guias/como-estudar-por-resumos";
const GUIDE_URL = getPublicUrl(GUIDE_PATH);
const GUIDE_TITLE = "Como estudar por resumos sem ficar apenas na leitura";
const GUIDE_DESCRIPTION =
  "Aprenda a usar resumos como mapa de estudo, praticar recuperação ativa e transformar erros em revisões objetivas.";

export const metadata = createPublicPageMetadata({
  title: GUIDE_TITLE,
  description: GUIDE_DESCRIPTION,
  path: GUIDE_PATH,
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LearningResource",
      "@id": `${GUIDE_URL}#learning-resource`,
      name: GUIDE_TITLE,
      description: GUIDE_DESCRIPTION,
      url: GUIDE_URL,
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      learningResourceType: "Guia de estudo",
      educationalLevel: "Iniciante e intermediário",
      datePublished: "2026-10-12",
      dateModified: "2026-10-12",
      author: { "@id": `${SITE_HOME_URL}#organization` },
      isPartOf: { "@id": `${SITE_HOME_URL}#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${GUIDE_URL}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_HOME_URL },
        { "@type": "ListItem", position: 2, name: "Guias", item: getPublicUrl("/guias") },
        { "@type": "ListItem", position: 3, name: GUIDE_TITLE, item: GUIDE_URL },
      ],
    },
  ],
};

const studyCycle = [
  ["Defina a pergunta", "Antes de ler, transforme o título da seção em uma pergunta. Isso dá uma finalidade concreta à leitura."],
  ["Leia para construir o mapa", "Identifique conceitos, exceções, relações e pontos ainda confusos. Evite tentar memorizar cada frase na primeira passagem."],
  ["Feche o material", "Explique o assunto com suas palavras ou escreva os pontos principais sem consultar o resumo."],
  ["Confira e classifique o erro", "Marque se houve esquecimento, confusão entre conceitos ou falta de compreensão. Cada tipo pede uma correção diferente."],
  ["Aplique em questões", "Use questões para verificar se consegue reconhecer o conceito em outro contexto. Volte ao resumo somente nos pontos que falharam."],
] as const;

export default function StudyWithSummariesGuidePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <script type="application/ld+json">{serializeJsonLd(structuredData)}</script>
      <nav aria-label="Navegação estrutural" className="text-sm text-[var(--text-muted)]">
        <Link href={SITE_HOME_URL} className="hover:text-[var(--accent)]">Início</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/guias" className="hover:text-[var(--accent)]">Guias</Link>
      </nav>

      <article className="mt-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Método de estudo</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{GUIDE_TITLE}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--text-secondary)]">Um resumo é mais útil quando orienta o que você precisa recuperar da memória. Se ele vira apenas uma leitura repetida, fica difícil distinguir familiaridade com o texto de domínio real do assunto.</p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">Publicado e conferido editorialmente em 12 de outubro de 2026.</p>
        </header>

        <div className="mt-10 space-y-10 text-base leading-7 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Resposta curta</h2>
            <p className="mt-3">Use o resumo como mapa, não como destino final. Leia uma seção com uma pergunta em mente, feche o material, tente reconstruir a ideia e só então confira. O que você não conseguiu explicar deve orientar a próxima revisão e a escolha de questões.</p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Um ciclo em cinco passos</h2>
            <ol className="mt-5 space-y-4">
              {studyCycle.map(([title, description], index) => (
                <li key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h3 className="font-extrabold text-[var(--text-primary)]">{index + 1}. {title}</h3>
                  <p className="mt-2">{description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Como organizar uma sessão curta</h2>
            <p className="mt-3">Em vez de medir apenas páginas lidas, divida a sessão em três blocos: compreensão, recuperação e aplicação. Por exemplo, leia uma seção, faça uma tentativa de explicação sem consulta e encerre com poucas questões relacionadas. A duração de cada bloco deve acompanhar a dificuldade do tema, não uma proporção rígida.</p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">O que registrar</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>conceitos que você confundiu;</li>
              <li>exceções esquecidas;</li>
              <li>questões erradas e o motivo do erro;</li>
              <li>pontos que exigem consulta à fonte oficial;</li>
              <li>data da próxima revisão, quando ela for necessária.</li>
            </ul>
            <p className="mt-4">Evite transformar a anotação em uma segunda versão completa do resumo. Registre apenas o que muda sua próxima ação de estudo.</p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Erros comuns</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>reler imediatamente porque o texto parece familiar;</li>
              <li>destacar quase tudo e perder a hierarquia;</li>
              <li>copiar parágrafos sem tentar explicar o conteúdo;</li>
              <li>resolver questões sem analisar por que errou;</li>
              <li>acumular revisões sem priorizar as dificuldades reais.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)] sm:p-8">
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Leve o ciclo para a plataforma</h2>
            <p className="mt-3">No PRO Concursos, resumos, questões, legislação, notas e progresso ficam no mesmo ambiente. Use a plataforma como apoio ao método, mantendo a consulta às fontes oficiais sempre que o assunto exigir.</p>
            <Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--action)] px-5 font-bold text-[var(--action-foreground)]">Conhecer a área de estudos</Link>
          </section>
        </div>

        <footer className="mt-10 border-t border-[var(--border)] pt-6 text-sm leading-6 text-[var(--text-muted)]">
          <p><strong className="text-[var(--text-primary)]">Elaboração:</strong> PRO Concursos, com apoio de IA.</p>
          <p><strong className="text-[var(--text-primary)]">Conferência editorial e documental:</strong> Naussen Cosme Velho Pezat.</p>
          <p><strong className="text-[var(--text-primary)]">Última conferência:</strong> 12 de outubro de 2026.</p>
          <p className="mt-3">Conheça a <Link href="/metodologia-editorial" className="font-bold text-[var(--accent)] underline underline-offset-4">metodologia editorial</Link> ou <Link href="/contato" className="font-bold text-[var(--accent)] underline underline-offset-4">relate um erro</Link>.</p>
        </footer>
      </article>
    </main>
  );
}
