"use client";

import { type FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

export function PasswordRecoveryButton({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nonceRequested, setNonceRequested] = useState(false);

  async function sendRecovery() {
    setPending(true);
    setMessage(null);
    try {
      const callback = new URL(withSiteBasePath("/auth/callback"), window.location.origin);
      callback.searchParams.set("next", "/dashboard/conta");
      const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
      if (error) throw error;
      setMessage("E-mail de recuperação solicitado. Verifique sua caixa de entrada.");
    } catch {
      setMessage("Não foi possível solicitar a recuperação agora. Aguarde e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function requestNonce() {
    setPending(true);
    setMessage(null);
    const { error } = await createClient().auth.reauthenticate();
    setPending(false);
    if (error) setMessage("Não foi possível enviar o código de segurança agora.");
    else {
      setNonceRequested(true);
      setMessage("Código de segurança enviado ao e-mail confirmado.");
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("passwordConfirmation") ?? "");
    const nonce = String(form.get("nonce") ?? "").trim();
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setMessage("A nova senha precisa ter 12+ caracteres, com minúscula, maiúscula e número.");
      return;
    }
    if (password !== confirmation) {
      setMessage("A confirmação não corresponde à nova senha.");
      return;
    }
    setPending(true);
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ password, ...(nonce ? { nonce } : {}) });
    setPending(false);
    if (error) {
      setMessage(error.code === "reauthentication_needed" || error.code === "reauth_nonce_missing"
        ? "Solicite o código de segurança, informe-o abaixo e tente novamente."
        : "Não foi possível atualizar a senha. Verifique o código e os requisitos.");
    } else {
      formElement.reset();
      setNonceRequested(false);
      setMessage("Senha atualizada com sucesso.");
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={sendRecovery} disabled={pending} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--accent-soft)] disabled:cursor-wait disabled:opacity-60">
        {pending ? <LoaderCircle size={18} className="animate-spin" /> : <KeyRound size={18} />}
        {pending ? "Solicitando..." : "Enviar e-mail para redefinir senha"}
      </button>
      <form onSubmit={updatePassword} className="space-y-3 border-t border-[var(--border)] pt-4">
        <div>
          <label htmlFor="new-password" className="mb-1 block text-xs font-bold text-[var(--text-primary)]">Nova senha</label>
          <input id="new-password" name="newPassword" type="password" minLength={12} required autoComplete="new-password" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" />
        </div>
        <div>
          <label htmlFor="password-confirmation" className="mb-1 block text-xs font-bold text-[var(--text-primary)]">Confirmar nova senha</label>
          <input id="password-confirmation" name="passwordConfirmation" type="password" minLength={12} required autoComplete="new-password" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" />
        </div>
        {nonceRequested && <div><label htmlFor="password-nonce" className="mb-1 block text-xs font-bold text-[var(--text-primary)]">Código de segurança</label><input id="password-nonce" name="nonce" inputMode="numeric" autoComplete="one-time-code" required maxLength={12} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]" /></div>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"><CheckCircle2 size={17} />Atualizar senha</button>
          <button type="button" onClick={requestNonce} disabled={pending} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)] disabled:cursor-wait disabled:opacity-60"><MailCheck size={17} />Solicitar código</button>
        </div>
      </form>
      {message && <p className="mt-3 text-sm text-[var(--text-secondary)]" role="status">{message}</p>}
    </div>
  );
}
