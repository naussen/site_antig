"use client";

import { useRef, useState } from "react";

export function SampleQuestion() {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const firstAnswerRef = useRef<HTMLButtonElement>(null);

  function tryAgain() {
    setAnswer(null);
    firstAnswerRef.current?.focus();
  }

  return (
    <section aria-labelledby="sample-question-title" className="border-t border-[var(--border)] pt-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Pratique · questão autoral C/E</p>
      <h2 id="sample-question-title" className="mt-3 text-2xl font-extrabold">Teste o que acabou de ler</h2>
      <p id="sample-question-statement" className="mt-4 text-lg leading-8 text-[var(--text-secondary)]">
        Segundo a Constituição Federal, o povo exerce o poder exclusivamente por meio de representantes eleitos.
      </p>
      <div role="group" aria-label="Julgue a afirmação" aria-describedby="sample-question-statement" className="mt-5 flex flex-wrap gap-3">
        {([true, false] as const).map((value) => (
          <button
            key={String(value)}
            ref={value ? firstAnswerRef : undefined}
            type="button"
            aria-pressed={answer === value}
            onClick={() => setAnswer(value)}
            className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {value ? "Certo" : "Errado"}
          </button>
        ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true">
        {answer !== null && (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="font-extrabold">{answer === false ? "Você acertou. Gabarito: Errado." : "Você marcou Certo. Gabarito: Errado."}</p>
            <p className="mt-3 leading-7 text-[var(--text-secondary)]">
              O art. 1º, parágrafo único, prevê o exercício por meio de representantes eleitos ou diretamente, nos termos da Constituição. Por isso, a palavra “exclusivamente” torna a afirmação incorreta.
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Comentário baseado apenas na literalidade do dispositivo reproduzido acima.</p>
          </div>
        )}
      </div>
      {answer !== null && (
        <button type="button" onClick={tryAgain} className="mt-4 min-h-11 rounded-lg px-2 font-bold text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          Tentar novamente
        </button>
      )}
      <noscript><p className="mt-5 leading-7">Gabarito: Errado. O dispositivo prevê representantes eleitos ou exercício direto, nos termos da Constituição.</p></noscript>
    </section>
  );
}
