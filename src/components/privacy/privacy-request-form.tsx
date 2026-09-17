"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

type PrivacyRequestFormProps = {
  accountEmail?: string;
};

export function PrivacyRequestForm({ accountEmail }: PrivacyRequestFormProps) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setResult(null);
    const form = new FormData(formElement);
    try {
      const response = await fetch(withSiteBasePath("/api/privacy-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: accountEmail ?? form.get("email"),
          requestType: form.get("requestType"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      });
      const payload = await response.json() as { protocol?: string; error?: string };
      if (!response.ok || !payload.protocol) throw new Error(payload.error ?? "Não foi possível enviar.");
      setResult({ ok: true, message: `Solicitação registrada. Protocolo: ${payload.protocol}` });
      formElement.reset();
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Não foi possível enviar." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      {!accountEmail && (
        <div>
          <label htmlFor="privacy-email" className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">E-mail para retorno</label>
          <input id="privacy-email" name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)]" />
        </div>
      )}
      <div>
        <label htmlFor="privacy-request-type" className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">Tipo de solicitação</label>
        <select id="privacy-request-type" name="requestType" required className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)]">
          <option value="access">Acesso aos dados</option>
          <option value="correction">Correção</option>
          <option value="deletion">Exclusão</option>
          <option value="portability">Portabilidade</option>
          <option value="information">Informações sobre o tratamento</option>
          <option value="other">Outro direito ou dúvida</option>
        </select>
      </div>
      <div>
        <label htmlFor="privacy-message" className="mb-1.5 block text-sm font-bold text-[var(--text-primary)]">Detalhes</label>
        <textarea id="privacy-message" name="message" required minLength={10} maxLength={2000} rows={5} className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)]" />
        <p className="mt-1 text-xs text-[var(--text-muted)]">Não envie senhas, dados de cartão ou documentos completos.</p>
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="privacy-website">Site</label>
        <input id="privacy-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
        {pending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
        {pending ? "Registrando..." : "Registrar solicitação LGPD"}
      </button>
      {result && <p role={result.ok ? "status" : "alert"} className={`rounded-xl border p-3 text-sm ${result.ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"}`}>{result.message}</p>}
    </form>
  );
}
