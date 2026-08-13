"use client";

import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { getAuthErrorMessage } from "@/lib/auth-errors.mjs";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        setErrorMessage("Esta conta não possui acesso administrativo.");
        return;
      }

      window.location.href = withSiteBasePath("/dashboard");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]"
    >
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          E-mail administrativo
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          Senha
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <LogIn size={20} />
        )}
        {loading ? "Entrando..." : "Entrar como administrador"}
      </button>
    </form>
  );
}
