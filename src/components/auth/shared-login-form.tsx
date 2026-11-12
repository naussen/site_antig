"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { SHARED_ACCOUNT_EMAIL, isSharedAccount } from "@/lib/auth/shared-account.mjs";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

export function SharedLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const password = new FormData(event.currentTarget).get("password") as string;
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: SHARED_ACCOUNT_EMAIL, password });
      if (error || !isSharedAccount(data.user)) {
        if (data.session) await supabase.auth.signOut();
        throw new Error("login");
      }
      window.location.assign(withSiteBasePath("/dashboard"));
    } catch {
      setError("Não foi possível entrar. Confira a senha atual ou tente novamente mais tarde.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-[var(--text-primary)]">
      <h1 className="text-xl font-bold">Conta Amigos</h1>
      <p className="text-sm text-[var(--text-secondary)]">Notas e progresso são compartilhados entre todos que usam esta conta. Evite inserir informações pessoais.</p>
      <label htmlFor="shared-password" className="block text-sm font-semibold">Senha compartilhada</label>
      <input id="shared-password" name="password" type="password" autoComplete="current-password" required maxLength={128} disabled={busy} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3 focus-visible:outline-2 focus-visible:outline-[var(--accent)]" />
      <button disabled={busy} className="min-h-11 w-full rounded-lg bg-[var(--accent)] p-3 font-bold text-[var(--bg-primary)] disabled:opacity-50">{busy ? "Entrando…" : "Entrar como Amigos"}</button>
      {error && <p role="alert" className="text-sm">{error}</p>}
    </form>
  );
}
