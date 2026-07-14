"use client";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Loader2,
  Maximize2,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MarkdownViewer } from "@/components/study/markdown-viewer";
import { createClient } from "@/lib/supabase/client";

interface NoteCardProps {
  note: {
    id: string;
    content: string;
    updated_at: string;
    section_id: string;
    section_title: string;
    topic_id: string;
    topic_title: string;
  };
  userId: string;
}

type EditorMode = "inline" | "expanded" | null;

export function NoteCard({ note, userId }: NoteCardProps) {
  const router = useRouter();
  const [content, setContent] = useState(note.content);
  const [updatedAt, setUpdatedAt] = useState(note.updated_at);
  const [draft, setDraft] = useState(note.content);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isBusy = isSaving || isDeleting;
  const isEditing = editorMode !== null;
  const normalizedDraft = draft.trim();

  useEffect(() => {
    if (editorMode !== "expanded") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editorMode]);

  const cancelEditing = () => {
    setDraft(content);
    setErrorMessage("");
    setEditorMode(null);
  };

  const startEditing = (mode: Exclude<EditorMode, null>) => {
    setDraft(content);
    setErrorMessage("");
    setIsConfirmingDelete(false);
    setEditorMode(mode);
  };

  const handleSave = async () => {
    if (!normalizedDraft) {
      setErrorMessage("A nota não pode ficar vazia. Use Excluir para removê-la.");
      return;
    }

    if (normalizedDraft === content) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_notes")
      .update({ content: normalizedDraft })
      .eq("id", note.id)
      .eq("user_id", userId)
      .select("content, updated_at")
      .single();

    if (error || !data) {
      console.error("Erro ao atualizar nota:", error);
      setErrorMessage("Não foi possível salvar a alteração. Tente novamente.");
      setIsSaving(false);
      return;
    }

    setContent(data.content);
    setDraft(data.content);
    setUpdatedAt(data.updated_at);
    if (editorMode === "inline") {
      setEditorMode(null);
    }
    setIsSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", note.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Erro ao excluir nota:", error);
      setErrorMessage("Não foi possível excluir a nota. Tente novamente.");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
      return;
    }

    setIsDeleted(true);
    router.refresh();
  };

  if (isDeleted) return null;

  return (
    <article
      className="p-5 rounded-xl transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p
            className="text-sm font-medium break-words"
            style={{ color: "var(--accent)" }}
          >
            📌 {note.section_title}
          </p>
          <div
            className="flex items-center gap-1 mt-1 text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            <Calendar size={12} aria-hidden="true" />
            <span>
              Atualizada em {new Date(updatedAt).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => startEditing("expanded")}
            disabled={isBusy || isEditing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
            title="Abrir a nota em tamanho maior"
          >
            <Maximize2 size={13} aria-hidden="true" />
            Abrir
          </button>

          <button
            type="button"
            onClick={() => startEditing("inline")}
            disabled={isBusy || isEditing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <Pencil size={13} aria-hidden="true" />
            Editar
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setEditorMode(null);
              setIsConfirmingDelete(true);
            }}
            disabled={isBusy || isConfirmingDelete}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            style={{
              background: "var(--callout-warning-bg)",
              borderColor: "var(--callout-warning-border)",
              color: "var(--callout-warning-text)",
            }}
          >
            <Trash2 size={13} aria-hidden="true" />
            Excluir
          </button>
        </div>
      </div>

      {editorMode === "inline" ? (
        <div className="space-y-2">
          <label
            htmlFor={`note-${note.id}`}
            className="block text-xs font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Conteúdo da nota
          </label>
          <textarea
            id={`note-${note.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSaving}
            rows={7}
            className="w-full resize-y rounded-lg border p-3 text-sm leading-relaxed outline-none focus:ring-2 disabled:cursor-wait disabled:opacity-70"
            style={{
              background: "var(--notes-bg)",
              borderColor: "var(--notes-border)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-50 cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              <X size={13} aria-hidden="true" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !normalizedDraft}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              ) : (
                <Save size={13} aria-hidden="true" />
              )}
              Salvar alteração
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-primary break-words overflow-x-auto">
          <MarkdownViewer content={content} />
        </div>
      )}

      {isConfirmingDelete && (
        <div
          className="mt-4 p-3 rounded-lg border"
          style={{
            background: "var(--callout-warning-bg)",
            borderColor: "var(--callout-warning-border)",
          }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--callout-warning-text)" }}>
            Excluir esta nota permanentemente?
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex flex-wrap justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isDeleting}
              className="px-3 py-2 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-50 cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              style={{
                background: "var(--callout-warning-border)",
                borderColor: "var(--callout-warning-border)",
                color: "white",
              }}
            >
              {isDeleting && (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              )}
              Confirmar exclusão
            </button>
          </div>
        </div>
      )}

      {errorMessage && editorMode !== "expanded" && (
        <div
          role="alert"
          className="flex items-start gap-2 mt-3 text-xs font-medium"
          style={{ color: "var(--callout-warning-text)" }}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {editorMode === "expanded" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isBusy) {
              cancelEditing();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`expanded-note-title-${note.id}`}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-7"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !isBusy) {
                cancelEditing();
              }
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4
                  id={`expanded-note-title-${note.id}`}
                  className="break-words text-xl font-bold"
                >
                  {note.topic_title}
                </h4>
                <p className="mt-1 break-words text-sm" style={{ color: "var(--accent)" }}>
                  {note.section_title}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isBusy}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border p-2 transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                aria-label="Fechar nota ampliada"
                title="Fechar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <label
              htmlFor={`expanded-note-${note.id}`}
              className="mb-2 block text-xs font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Conteúdo da nota
            </label>
            <textarea
              id={`expanded-note-${note.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isSaving}
              autoFocus
              className="min-h-72 flex-1 resize-y rounded-xl border p-4 text-sm leading-relaxed outline-none focus:ring-2 disabled:cursor-wait disabled:opacity-70 sm:min-h-96 sm:text-base"
              style={{
                background: "var(--notes-bg)",
                borderColor: "var(--notes-border)",
                color: "var(--text-primary)",
              }}
            />

            {errorMessage && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 text-xs font-medium"
                style={{ color: "var(--callout-warning-text)" }}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-75 disabled:opacity-50 cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <X size={15} aria-hidden="true" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !normalizedDraft}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {isSaving ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save size={15} aria-hidden="true" />
                )}
                Salvar alteração
              </button>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
