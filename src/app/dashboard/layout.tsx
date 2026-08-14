import { createClient } from "@/lib/supabase/server";
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

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
