import { createClient } from "@/lib/supabase/server";

export default async function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Content area — sidebar + main + notes são montados pelo page.tsx */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}

