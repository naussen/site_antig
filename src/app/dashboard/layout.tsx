import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppDock } from "@/components/navigation/app-dock";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Conteúdo Principal (Resumos ou Notas) com padding bottom para o Dock */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-24">
        {children}
      </div>

      {/* Dock de Navegação Estilo macOS */}
      <AppDock userEmail={session.user.email ?? null} />
    </div>
  );
}

