"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  StickyNote,
  Loader2,
  AlertCircle,
  Trash2,
  Calendar,
  Save,
  Image,
  ChevronsRight,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { MarkdownViewer } from "@/components/study/markdown-viewer";

interface NotesPanelProps {
  userId: string | null;
  sectionId: string;
  sectionTitle: string;
  /** Todos os sectionIds do tópico para carregar todas as notas */
  allSectionIds: string[];
  /** Map de sectionId → título da seção para exibir labels nas notas */
  sectionTitleMap: Record<string, string>;
  onClose?: () => void;
}

export function NotesPanel({
  userId,
  sectionId,
  sectionTitle,
  allSectionIds,
  sectionTitleMap,
  onClose,
}: NotesPanelProps) {
  const { notes, loading, saveNote, deleteNote } = useNotes(userId, allSectionIds);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft("");
    setErrorMsg("");
  }, [sectionId]);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setIsSaving(true);
    setErrorMsg("");
    try {
      await saveNote(draft);
      setDraft("");
    } catch {
      setErrorMsg("Erro ao salvar nota");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageMarkdown = `\n![Print](${base64})\n`;
            setDraft((prev) => prev + imageMarkdown);
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
      }
    }
  };

  // Separar notas da seção ativa vs. restante do tópico
  const activeNotes = useMemo(
    () => notes.filter((n) => n.section_id === sectionId),
    [notes, sectionId]
  );
  const otherNotes = useMemo(
    () => notes.filter((n) => n.section_id !== sectionId),
    [notes, sectionId]
  );

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ background: "var(--bg-sidebar)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <StickyNote size={16} className="shrink-0" style={{ color: "var(--accent)" }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider truncate"
            style={{ color: "var(--text-muted)" }}
          >
            Anotações
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
            title="Recolher anotações"
          >
            <ChevronsRight size={14} />
            <span className="hidden xl:inline">Recolher</span>
          </button>
        )}
      </div>

      {/* Título da seção ativa */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <p
          className="text-xs truncate font-medium"
          style={{ color: "var(--text-muted)" }}
          title={sectionTitle}
        >
          📌 {sectionTitle}
        </p>
      </div>

      {/* Editor estilo Post-it */}
      <div className="px-4 py-3 flex flex-col gap-2 shrink-0">
        <div
          className="w-full h-36 p-3 rounded-xl border flex flex-col shadow-sm transition-all duration-200 focus-within:shadow-md relative group"
          style={{
            background: "var(--notes-bg)",
            borderColor: "var(--notes-border)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            placeholder="Escreva sua anotação aqui... (Ctrl+V para colar imagens)"
            className="w-full flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed overflow-y-auto"
            style={{
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
            disabled={!userId || isSaving}
            aria-label={`Nova anotação para a seção "${sectionTitle}"`}
          />
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 opacity-40 group-hover:opacity-75 transition-opacity text-[10px] pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            <Image size={10} />
            <span>Ctrl+V print</span>
          </div>
        </div>

        {/* Botão de Salvar e mensagens */}
        <div className="flex items-center justify-between gap-2">
          {errorMsg ? (
            <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
              Salve para manter a nota
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!userId || !draft.trim() || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow cursor-pointer shrink-0"
            style={{
              background: draft.trim() ? "var(--accent)" : "var(--border)",
              color: draft.trim() ? "white" : "var(--text-muted)",
            }}
          >
            {isSaving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            <span>Salvar</span>
          </button>
        </div>
      </div>

      <hr className="mx-4 border-t shrink-0" style={{ borderColor: "var(--border)" }} />

      {/* Lista de notas salvas — seção ativa primeiro, depois o resto do tópico */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Notas da seção ativa */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Esta Seção ({activeNotes.length})
          </span>
          {loading && <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
        </div>

        <div className="px-4 pb-3 space-y-2.5">
          {activeNotes.length === 0 ? (
            <div className="text-center py-6 opacity-50 text-xs" style={{ color: "var(--text-muted)" }}>
              Nenhuma nota nesta seção.
            </div>
          ) : (
            activeNotes.map((note, index) => (
              <NoteCard
                key={note.id || `${note.section_id}-${note.updated_at}-${index}`}
                note={note}
                onDelete={deleteNote}
              />
            ))
          )}
        </div>

        {/* Notas das demais seções do tópico */}
        {otherNotes.length > 0 && (
          <>
            <hr className="mx-4 border-t" style={{ borderColor: "var(--border)" }} />
            <div className="px-4 pt-3 pb-1 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Outras Seções ({otherNotes.length})
              </span>
            </div>
            <div className="px-4 pb-4 space-y-2.5">
              {otherNotes.map((note, index) => (
                <NoteCard
                  key={note.id || `${note.section_id}-${note.updated_at}-${index}`}
                  note={note}
                  sectionLabel={sectionTitleMap[note.section_id]}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   Sub-componente: Card de nota individual
   ========================================================================= */

interface NoteCardProps {
  note: { id?: string; section_id: string; content: string; updated_at: string };
  sectionLabel?: string;
  onDelete: (id: string) => Promise<void>;
}

function NoteCard({ note, sectionLabel, onDelete }: NoteCardProps) {
  return (
    <div
      className="p-3 rounded-xl border relative group/note transition-all"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* Header da nota */}
      <div className="flex justify-between items-center mb-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1 min-w-0">
          <Calendar size={10} className="shrink-0" />
          <span className="truncate">
            {sectionLabel && (
              <span className="font-semibold mr-1" style={{ color: "var(--accent)" }}>
                {sectionLabel} ·
              </span>
            )}
            {note.updated_at
              ? new Date(note.updated_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : ""}
          </span>
        </div>
        <button
          onClick={() => note.id && onDelete(note.id)}
          className="p-1 rounded opacity-0 group-hover/note:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 cursor-pointer shrink-0"
          title="Excluir anotação"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="text-xs break-words overflow-x-auto">
        <MarkdownViewer content={note.content} />
      </div>
    </div>
  );
}
