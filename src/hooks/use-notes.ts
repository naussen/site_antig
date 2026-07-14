"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserNote } from "@/types/database";

interface UseNotesReturn {
  notes: UserNote[];
  loading: boolean;
  error: string | null;
  saveNote: (content: string) => Promise<UserNote | null>;
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
  sectionId: string | string[],
  activeSectionId?: string
): UseNotesReturn {
  const sectionIds = useMemo(
    () => (Array.isArray(sectionId) ? sectionId : [sectionId]),
    [sectionId]
  );
  const contextKey =
    userId && sectionIds.length > 0
      ? JSON.stringify([userId, sectionIds])
      : "";
  const requestIdRef = useRef(0);
  const [notesState, setNotesState] = useState<{
    contextKey: string;
    notes: UserNote[];
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
  const targetSectionId =
    activeSectionId ?? (Array.isArray(sectionId) ? sectionId[0] : sectionId);

  const fetchNotes = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!userId || sectionIds.length === 0) {
      return;
    }

    setLoadState({ contextKey, loading: true, error: null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .in("section_id", sectionIds)
      .order("updated_at", { ascending: false });

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

    setNotesState({ contextKey, notes: (data ?? []) as UserNote[] });
    setLoadState({ contextKey, loading: false, error: null });
  }, [contextKey, sectionIds, userId]);

  useEffect(() => {
    // O efeito sincroniza o estado local com as notas persistidas no Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (content: string): Promise<UserNote | null> => {
    if (!userId || !targetSectionId || !content.trim()) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: userId,
        section_id: targetSectionId,
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar nota:", error);
      throw error;
    }

    const newNote = data as UserNote;
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
