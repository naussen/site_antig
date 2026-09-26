"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { getAuthErrorMessage } from "@/lib/auth-errors.mjs";
import { hasGoogleSession } from "@/lib/auth/google-only.mjs";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { createClient } from "@/lib/supabase/client";

type MfaStage = "identity" | "enroll" | "verify";

type TotpEnrollment = {
  qrCode: string;
  secret: string;
};

interface AdminLoginFormProps {
  hasSession?: boolean;
  hasAdminSession?: boolean;
}

export function AdminLoginForm({
  hasSession = false,
  hasAdminSession = false,
}: AdminLoginFormProps) {
  const supabase = useMemo(() => createClient(), []);
  const [totpCode, setTotpCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [stage, setStage] = useState<MfaStage>("identity");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectToDashboard = () => {
    window.location.href = withSiteBasePath("/dashboard");
  };

  const prepareMfa = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();

      if (
        userError ||
        claimsError ||
        !user ||
        !hasGoogleSession(user, claimsData?.claims) ||
        user.app_metadata?.role !== "admin"
      ) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não possui acesso administrativo.");
      }

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel === "aal2") {
        redirectToDashboard();
        return;
      }

      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const verifiedTotp = factors.totp[0];
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id);
        setEnrollment(null);
        setTotpCode("");
        setStage("verify");
        return;
      }

      const unverifiedTotp = factors.all.filter(
        (factor) =>
          factor.factor_type === "totp" && factor.status === "unverified"
      );

      for (const factor of unverifiedTotp) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id,
        });
        if (error) throw error;
      }

      const { data: enrolledFactor, error: enrollError } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "PRO Resumos Admin",
        });

      if (enrollError) throw enrollError;

      setFactorId(enrolledFactor.id);
      setEnrollment({
        qrCode: enrolledFactor.totp.qr_code,
        secret: enrolledFactor.totp.secret,
      });
      setTotpCode("");
      setStage("enroll");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      if (hasSession) await supabase.auth.signOut();

      const callback = new URL(
        withSiteBasePath("/auth/callback"),
        window.location.origin
      );
      callback.searchParams.set("next", withSiteBasePath("/admin"));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setLoading(false);
    }
  };

  const handleTotpVerification = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const normalizedCode = totpCode.replace(/\D/g, "");

    if (!factorId || normalizedCode.length !== 6) {
      setErrorMessage("Informe o código de seis dígitos do aplicativo autenticador.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: normalizedCode,
      });

      if (error) throw error;

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2") {
        throw new Error("O segundo fator não elevou a sessão administrativa.");
      }

      redirectToDashboard();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    setStage("identity");
    setEnrollment(null);
    setFactorId("");
    setTotpCode("");
    setErrorMessage("");
    window.location.replace(withSiteBasePath("/admin"));
  };

  if (stage !== "identity") {
    return (
      <form
        onSubmit={handleTotpVerification}
        className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">
              {stage === "enroll" ? "Ativar autenticação em dois fatores" : "Confirmar segundo fator"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
              {stage === "enroll"
                ? "Escaneie o QR code e confirme o código antes de acessar a conta administrativa."
                : "Digite o código atual exibido no seu aplicativo autenticador."}
            </p>
          </div>
        </div>

        {enrollment && (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center">
            <Image
              src={enrollment.qrCode}
              alt="QR code para configurar o autenticador TOTP"
              width={220}
              height={220}
              unoptimized
              className="mx-auto"
            />
            <p className="mt-3 text-xs text-slate-600">Código manual:</p>
            <code className="mt-1 block break-all text-xs font-semibold text-slate-900">
              {enrollment.secret}
            </code>
          </div>
        )}

        <div>
          <label
            htmlFor="admin-totp"
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            Código de seis dígitos
          </label>
          <input
            id="admin-totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-center font-mono text-xl tracking-[0.35em] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
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
          disabled={loading || totpCode.length !== 6}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <KeyRound size={20} />}
          {loading ? "Validando..." : "Validar e entrar"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          Sair da conta administrativa
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow)]">
      {hasAdminSession && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4">
          <p className="text-sm leading-5 text-[var(--text-primary)]">
            Sua identidade Google administrativa foi confirmada. Continue para cadastrar ou validar o segundo fator.
          </p>
          <button
            type="button"
            onClick={prepareMfa}
            disabled={loading}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            Continuar com MFA
          </button>
        </div>
      )}

      {!hasAdminSession && hasSession && (
        <p className="rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-2 text-sm text-[var(--text-primary)]">
          A conta Google atual não possui papel administrativo. Escolha a conta administrativa.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          {errorMessage}
        </p>
      )}

      {!hasAdminSession && (
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {loading ? "Redirecionando..." : "Continuar com Google"}
        </button>
      )}
      <p className="text-xs leading-5 text-[var(--text-secondary)]">
        O acesso administrativo exige identidade Google autorizada e TOTP/AAL2. Não existe entrada administrativa por senha local.
      </p>
    </div>
  );
}
