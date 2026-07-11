import Link from "next/link";
import { ArrowLeft, BookOpen, StickyNote, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarkdownViewer } from "@/components/study/markdown-viewer";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch all notes for the user, including section and topic data
  const { data: notesData } = await supabase
    .from("user_notes")
    .select(`
      id,
      content,
      updated_at,
      sections (
        section_id,
        title,
        sort_order,
        topics (
          topic_id,
          title,
          discipline
        )
      )
    `)
    .neq("content", "");

  // Transformar e agrupar os dados
  type EnrichedNote = {
    id: string;
    content: string;
    updated_at: string;
    section_id: string;
    section_title: string;
    section_order: number;
    topic_id: string;
    topic_title: string;
    discipline: string;
  };

  const validNotes: EnrichedNote[] = [];

  if (notesData) {
    notesData.forEach((note: any) => {
      // Ignora notas vazias ou compostas apenas por espaços
      if (!note.content || note.content.trim() === "") return;
      if (!note.sections || !note.sections.topics) return;

      validNotes.push({
        id: note.id || `${note.sections.section_id}-${note.updated_at}`,
        content: note.content,
        updated_at: note.updated_at,
        section_id: note.sections.section_id,
        section_title: note.sections.title,
        section_order: note.sections.sort_order,
        topic_id: note.sections.topics.topic_id,
        topic_title: note.sections.topics.title,
        discipline: note.sections.topics.discipline || "Geral",
      });
    });
  }

  // Agrupamento: Discipline -> Topic -> Notes (ordenadas por section_order)
  const grouped = validNotes.reduce((acc, note) => {
    if (!acc[note.discipline]) acc[note.discipline] = {};
    if (!acc[note.discipline][note.topic_title]) acc[note.discipline][note.topic_title] = [];
    acc[note.discipline][note.topic_title].push(note);
    return acc;
  }, {} as Record<string, Record<string, EnrichedNote[]>>);

  // Ordenar as notas dentro de cada tópico
  Object.keys(grouped).forEach(disc => {
    Object.keys(grouped[disc]).forEach(topic => {
      grouped[disc][topic].sort((a, b) => a.section_order - b.section_order);
    });
  });

  const disciplines = Object.keys(grouped).sort();

  return (
    <main
      className="min-h-screen p-6 md:p-12"
      style={{ background: "var(--bg-primary)" }}
    >
        {/* Header global já renderizado pelo layout.tsx */}

      <section className="max-w-5xl mx-auto">
        {validNotes.length === 0 ? (
          <div
            className="text-center py-16 rounded-3xl"
            style={{
              background: "var(--bg-card)",
              border: "1px dashed var(--border)",
            }}
          >
            <StickyNote
              size={40}
              className="mx-auto mb-4 opacity-50"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-base font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Nenhuma anotação encontrada.
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Suas notas aparecerão aqui conforme você estuda e faz anotações.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 px-6 py-2 rounded-lg font-medium transition-colors hover:opacity-90"
              style={{ 
                background: "var(--accent)", 
                color: "white",
              }}
            >
              Voltar aos Resumos
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {disciplines.map((discipline) => (
              <div key={discipline} className="space-y-8">
                <h2
                  className="text-2xl font-bold flex items-center gap-3 border-b pb-3"
                  style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                >
                  <BookOpen size={24} style={{ color: "var(--accent)" }} />
                  {discipline}
                </h2>
                
                <div className="grid grid-cols-1 gap-8">
                  {Object.keys(grouped[discipline]).sort().map((topicTitle) => (
                    <div key={topicTitle} className="space-y-4 ml-2 sm:ml-6 border-l-2 pl-4" style={{ borderColor: "var(--accent-soft)" }}>
                      <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }}></span>
                        {topicTitle}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grouped[discipline][topicTitle].map((note) => (
                          <div
                            key={note.id}
                            className="p-5 rounded-xl transition-all"
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              boxShadow: "var(--shadow)",
                            }}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <Link 
                                href={`/${note.topic_id}#${note.section_id}`}
                                className="text-sm font-medium hover:underline flex-1 pr-2"
                                style={{ color: "var(--accent)" }}
                                title="Ir para o resumo"
                              >
                                📌 {note.section_title}
                              </Link>
                              <div className="flex items-center gap-1 text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                                <Calendar size={12} />
                                {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                              </div>
                            </div>
                            <div className="text-sm text-primary break-words overflow-x-auto">
                              <MarkdownViewer content={note.content} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
