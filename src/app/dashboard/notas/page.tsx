import Link from "next/link";
import { AlertCircle, BookOpen, StickyNote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NoteCard } from "./note-card";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // A identidade permanente evita perder o vínculo quando section_id ou ordem mudam.
  const identityNotesResult = await supabase
    .from("user_notes")
    .select("id,content,updated_at,content_unit_id,section_id")
    .eq("user_id", user.id)
    .neq("content", "");

  type NoteRow = {
    id: string | null;
    content: string;
    updated_at: string;
    content_unit_id?: string;
    section_id: string;
  };

  let notesData = identityNotesResult.data as NoteRow[] | null;
  let notesError = identityNotesResult.error;
  if (notesError && (notesError.code === "42703" || notesError.code === "PGRST204")) {
    const legacyNotesResult = await supabase
      .from("user_notes")
      .select("id,content,updated_at,section_id")
      .eq("user_id", user.id)
      .neq("content", "");
    notesData = legacyNotesResult.data as NoteRow[] | null;
    notesError = legacyNotesResult.error;
  }

  type SectionDetails = {
    section_id: string;
    content_unit_id?: string;
    title: string;
    sort_order: number;
    topic_id: string;
    archived_at?: string | null;
  };

  const contentUnitIds = [...new Set((notesData ?? [])
    .map((note) => note.content_unit_id)
    .filter((id): id is string => Boolean(id)))];
  const legacySectionIds = [...new Set((notesData ?? []).map((note) => note.section_id))];
  let sectionsData: SectionDetails[] = [];
  let sectionLoadError: unknown = null;

  if (!notesError && contentUnitIds.length > 0) {
    const sectionsResult = await supabase
      .from("sections")
      .select("section_id,content_unit_id,title,sort_order,topic_id,archived_at")
      .in("content_unit_id", contentUnitIds);
    sectionsData = sectionsResult.data as SectionDetails[] ?? [];
    sectionLoadError = sectionsResult.error;
  }

  const resolvedLegacySectionIds = new Set(sectionsData.map((section) => section.section_id));
  const missingLegacySectionIds = legacySectionIds.filter((id) => !resolvedLegacySectionIds.has(id));
  if (!notesError && missingLegacySectionIds.length > 0) {
    const legacySectionsResult = await supabase
      .from("sections")
      .select("section_id,title,sort_order,topic_id")
      .in("section_id", missingLegacySectionIds);
    if (legacySectionsResult.error) {
      sectionLoadError = legacySectionsResult.error;
    } else {
      sectionsData = [...sectionsData, ...(legacySectionsResult.data as SectionDetails[] ?? [])];
    }
  }

  const topicIds = [...new Set(sectionsData.map((section) => section.topic_id))];
  const topicsResult = topicIds.length > 0
    ? await supabase
      .from("topics")
      .select("topic_id,title,discipline")
      .in("topic_id", topicIds)
    : { data: [], error: null };

  const sectionsByContentUnitId = new Map(sectionsData
    .filter((section) => section.content_unit_id)
    .map((section) => [section.content_unit_id as string, section]));
  const sectionsByLegacyId = new Map(sectionsData.map((section) => [section.section_id, section]));
  const topicsById = new Map((topicsResult.data ?? []).map((topic) => [topic.topic_id, topic]));
  const personalDataError = notesError ?? sectionLoadError ?? topicsResult.error;

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
    notesData.forEach((note) => {
      // Ignora notas vazias ou compostas apenas por espaços
      if (!note.content || note.content.trim() === "") return;
      // Ações de edição/exclusão exigem o UUID introduzido na migration 004.
      if (!note.id) return;
      const section = note.content_unit_id
        ? sectionsByContentUnitId.get(note.content_unit_id) ?? sectionsByLegacyId.get(note.section_id)
        : sectionsByLegacyId.get(note.section_id);
      if (!section) return;
      const topic = topicsById.get(section.topic_id);
      if (!topic) return;

      validNotes.push({
        id: note.id,
        content: note.content,
        updated_at: note.updated_at,
        section_id: section.section_id,
        section_title: section.archived_at ? `${section.title} (conteúdo arquivado)` : section.title,
        section_order: section.sort_order,
        topic_id: topic.topic_id,
        topic_title: topic.title,
        discipline: topic.discipline || "Geral",
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
        {personalDataError ? (
          <div
            role="alert"
            className="flex flex-col items-center rounded-3xl px-6 py-16 text-center"
            style={{
              background: "var(--callout-warning-bg)",
              border: "1px solid var(--callout-warning-border)",
            }}
          >
            <AlertCircle
              size={40}
              className="mb-4"
              style={{ color: "var(--callout-warning-text)" }}
              aria-hidden="true"
            />
            <p className="text-base font-semibold" style={{ color: "var(--callout-warning-text)" }}>
              Não foi possível carregar suas notas.
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Atualize a página para tentar novamente.
            </p>
          </div>
        ) : validNotes.length === 0 ? (
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
                background: "var(--action)",
                color: "var(--action-foreground)",
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
                        <Link
                          href={`/${grouped[discipline][topicTitle][0].topic_id}`}
                          className="rounded-sm underline-offset-4 transition-opacity hover:underline hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ outlineColor: "var(--accent)" }}
                          title={`Abrir o material: ${topicTitle}`}
                        >
                          {topicTitle}
                        </Link>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grouped[discipline][topicTitle].map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            userId={user.id}
                          />
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
