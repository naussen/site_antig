"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

const LOGIN_ERRORS: Record<string, string> = {
  auth: "Não foi possível concluir a autenticação. Tente novamente.",
  google_required: "Esta aplicação aceita somente contas autenticadas pelo Google.",
};

interface LoginFormProps {
  returnTo: string | null;
  errorCode?: string | null;
}

export function LoginForm({ returnTo, errorCode = null }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorCode ? LOGIN_ERRORS[errorCode] ?? LOGIN_ERRORS.auth : ""
  );
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const callback = new URL(
        withSiteBasePath("/auth/callback"),
        window.location.origin
      );
      if (returnTo) callback.searchParams.set("next", returnTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch {
      setErrorMessage("Não foi possível iniciar o login com Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z" />
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691Z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.193 5.236C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z" />
          </svg>
        )}
        <span>{loading ? "Redirecionando..." : "Continuar com Google"}</span>
      </button>

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-2 text-sm text-[var(--text-primary)]">
          {errorMessage}
        </p>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent)]" size={18} aria-hidden="true" />
        <p className="text-xs leading-5 text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Acesso exclusivo pelo Google.</strong>{" "}
          O PRO Concursos não recebe nem armazena sua senha Google. Recebemos somente os dados básicos autorizados para criar a conta e manter a sessão.
        </p>
      </div>
    </div>
  );
}
