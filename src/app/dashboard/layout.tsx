import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/navigation/dashboard-navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // getUser valida o token contra o servidor — mais seguro que getSession (local-only)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.app_metadata?.role === "admin") {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2") {
      redirect("/admin");
    }
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "var(--dashboard-bg)" }}>
      <DashboardNavigation
        userEmail={user.email ?? null}
        userName={
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null
        }
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="min-w-0 flex-1">{children}</div>
        <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 PRO Concursos</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Conta e assinatura">
              <Link href="/dashboard/assinatura" className="font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">Assinatura</Link>
              <Link href="/dashboard/assinatura#cancelamento" className="font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">Cancelamento</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
