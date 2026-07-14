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

  return (
    <div className="min-h-screen lg:flex" style={{ background: "var(--bg-primary)" }}>
      <DashboardNavigation userEmail={user.email ?? null} />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
