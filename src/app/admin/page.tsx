import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { ProLogoLink } from "@/components/brand/pro-logo";
import { hasGoogleSession } from "@/lib/auth/google-only.mjs";
import { createClient } from "@/lib/supabase/server";
import { SITE_HOME_URL } from "@/lib/seo.mjs";

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: claimsData } = user
    ? await supabase.auth.getClaims()
    : { data: null };
  const hasAdminSession =
    hasGoogleSession(user, claimsData?.claims) &&
    user?.app_metadata?.role === "admin";

  if (hasAdminSession) {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel === "aal2") {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <ProLogoLink
            href={SITE_HOME_URL}
            label="Voltar para a página inicial"
            size={44}
            variant="full"
            highPriority
            className="mb-4"
          />
          <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
            Acesso administrativo
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Entre com a conta Google administrativa e confirme o TOTP.
          </p>
        </div>

        <AdminLoginForm hasSession={Boolean(user)} hasAdminSession={hasAdminSession} />
      </div>
    </main>
  );
}
