"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LAUNCH_CONSENT_TEXT, LAUNCH_CONSENT_VERSION, LAUNCH_INTEREST_PATH } from "@/lib/launch-interest";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

const errors: Record<number, string> = {
  400: "Confira o e-mail e marque a autorização para continuar.",
  409: "O termo foi atualizado. Recarregue a página e leia a nova versão.",
  429: "Muitas tentativas. Aguarde um minuto e tente novamente.",
};
const unavailable = "O cadastro está temporariamente indisponível. Tente novamente em instantes.";

export function LaunchInterestForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submitted) return;

    const fields = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const response = await fetch(withSiteBasePath(LAUNCH_INTEREST_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          consent: fields.has("consent"),
          consentVersion: LAUNCH_CONSENT_VERSION,
        }),
      });
      if (response.status === 204) setSubmitted(true);
      else setError(errors[response.status] ?? unavailable);
    } catch {
      setError(unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="aviso-lancamento" aria-labelledby="aviso-lancamento-titulo" className="mt-5 scroll-mt-24 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-left sm:p-5">
      <h2 id="aviso-lancamento-titulo" className="text-lg font-extrabold">Receba o aviso de lançamento</h2>
      <p role="status" className={submitted ? "mt-3 text-sm leading-6 text-emerald-200" : "sr-only"}>
        {submitted && "Tudo certo! O aviso de lançamento será enviado para o e-mail informado."}
      </p>
      {!submitted && (
        <form method="post" onSubmit={submit} className="mt-3 space-y-3">
          <label htmlFor="launch-email" className="block text-sm font-semibold">Seu e-mail</label>
          <input
            id="launch-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={pending}
            placeholder="voce@exemplo.com"
            className="w-full min-w-0 rounded-xl border border-white/30 bg-[#181820] px-3 py-2.5 text-base text-white placeholder:text-white/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f9a826]"
          />
          <label className="flex items-start gap-3 text-sm leading-5 text-white/85">
            <input name="consent" type="checkbox" required disabled={pending} className="mt-0.5 size-4 shrink-0 accent-[#f9a826] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f9a826]" />
            <span>{LAUNCH_CONSENT_TEXT}</span>
          </label>
          <p className="text-xs leading-5 text-white/75">
            Cadastro gratuito e opcional. Você pode retirar seu consentimento a qualquer momento.
            {" "}<Link href="/privacidade#lista-lancamento" className="font-semibold text-white underline underline-offset-4">Leia o termo de consentimento</Link>.
          </p>
          {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={pending} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#f9a826] px-4 py-2.5 text-sm font-extrabold text-[#121212] hover:bg-[#ffc15c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f9a826] disabled:opacity-70">
            {pending ? "Enviando…" : "Quero receber o aviso"}
          </button>
        </form>
      )}
    </section>
  );
}
