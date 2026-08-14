import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Acesso administrativo | PRO Resumos",
};

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasAdminSession = user?.app_metadata?.role === "admin";

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
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            <ShieldCheck size={24} />
          </Link>
          <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">
            Acesso administrativo
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Use a conta administrativa confirmada para acessar o painel.
          </p>
        </div>

        <AdminLoginForm hasAdminSession={hasAdminSession} />
      </div>
    </main>
  );
}
