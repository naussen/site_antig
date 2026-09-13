"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_NOTE_LENGTH } from "@/lib/note-images.mjs";
import { UserNote } from "@/types/database";

export interface NoteSectionReference {
  sectionId: string;
  contentUnitId: string;
}

export type PersonalNote = UserNote & { content_unit_id?: string };

function isIdentitySchemaUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "42703" || code === "PGRST204";
}

interface UseNotesReturn {
  notes: PersonalNote[];
  loading: boolean;
  error: string | null;
  saveNote: (content: string) => Promise<PersonalNote | null>;
  deleteNote: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar múltiplas notas manuais de um usuário.
 * Aceita um sectionId individual ou um array de sectionIds para
 * carregar notas de todo o tópico de uma vez.
 */
export function useNotes(
  userId: string | null,
  sections: NoteSectionReference[],
  activeSectionId?: string
): UseNotesReturn {
  const sectionIds = useMemo(() => sections.map((section) => section.sectionId), [sections]);
  const contentUnitIds = useMemo(
    () => sections.map((section) => section.contentUnitId),
    [sections]
  );
  const contextKey =
    userId && sectionIds.length > 0
      ? JSON.stringify([userId, sectionIds])
      : "";
  const requestIdRef = useRef(0);
  const [notesState, setNotesState] = useState<{
    contextKey: string;
    notes: PersonalNote[];
  }>({ contextKey: "", notes: [] });
  const [loadState, setLoadState] = useState<{
    contextKey: string;
    loading: boolean;
    error: string | null;
  }>({ contextKey: "", loading: false, error: null });

  const notes = notesState.contextKey === contextKey ? notesState.notes : [];
  const loading =
    Boolean(contextKey) &&
    (loadState.contextKey !== contextKey || loadState.loading);
  const error = loadState.contextKey === contextKey ? loadState.error : null;

  // sectionId ativo para inserts (sempre string única)
  const targetSectionId = activeSectionId ?? sectionIds[0];
  const targetContentUnitId = sections.find(
    (section) => section.sectionId === targetSectionId
  )?.contentUnitId;

  const fetchNotes = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!userId || sectionIds.length === 0) {
      return;
    }

    setLoadState({ contextKey, loading: true, error: null });
    const supabase = createClient();
    let { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .in("content_unit_id", contentUnitIds)
      .order("updated_at", { ascending: false });

    // Compatibilidade com bancos em que a migration de identidade ainda não foi aplicada.
    if (error && isIdentitySchemaUnavailable(error)) {
      const legacyResult = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", userId)
        .in("section_id", sectionIds)
        .order("updated_at", { ascending: false });
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (error) {
      console.error("Erro ao buscar notas:", error);
      setNotesState({ contextKey, notes: [] });
      setLoadState({
        contextKey,
        loading: false,
        error: "Não foi possível carregar suas notas.",
      });
      return;
    }

    setNotesState({ contextKey, notes: (data ?? []) as PersonalNote[] });
    setLoadState({ contextKey, loading: false, error: null });
  }, [contentUnitIds, contextKey, sectionIds, userId]);

  useEffect(() => {
    // O efeito sincroniza o estado local com as notas persistidas no Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (content: string): Promise<PersonalNote | null> => {
    const normalizedContent = content.trim();
    if (!userId || !targetSectionId || !targetContentUnitId || !normalizedContent) return null;
    if (normalizedContent.length > MAX_NOTE_LENGTH) {
      throw new Error(`A nota deve ter no máximo ${MAX_NOTE_LENGTH.toLocaleString("pt-BR")} caracteres.`);
    }
    const supabase = createClient();

    let { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: userId,
        section_id: targetSectionId,
        content_unit_id: targetContentUnitId,
        content: normalizedContent,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error && isIdentitySchemaUnavailable(error)) {
      const legacyResult = await supabase
        .from("user_notes")
        .insert({
          user_id: userId,
          section_id: targetSectionId,
          content: normalizedContent,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error) {
      console.error("Erro ao salvar nota:", error);
      throw error;
    }

    const newNote = data as PersonalNote;
    setNotesState((previous) =>
      previous.contextKey === contextKey
        ? { contextKey, notes: [newNote, ...previous.notes] }
        : previous
    );
    return newNote;
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!userId || !noteId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao deletar nota:", error);
      throw error;
    }

    setNotesState((previous) =>
      previous.contextKey === contextKey
        ? {
            contextKey,
            notes: previous.notes.filter((note) => note.id !== noteId),
          }
        : previous
    );
  };

  return { notes, loading, error, saveNote, deleteNote, refetch: fetchNotes };
}
