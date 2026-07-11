"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserNote } from "@/types/database";

interface UseNotesReturn {
  notes: UserNote[];
  loading: boolean;
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
  sectionId: string | string[]
): UseNotesReturn {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(false);

  // sectionId ativo para inserts (sempre string única)
  const activeSectionId = Array.isArray(sectionId) ? sectionId[0] : sectionId;

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      return;
    }

    const ids = Array.isArray(sectionId) ? sectionId : [sectionId];
    if (ids.length === 0) {
      setNotes([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .in("section_id", ids)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar notas:", error);
    } else if (data) {
      setNotes(data as UserNote[]);
    }
    setLoading(false);
  }, [userId, sectionId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (content: string): Promise<UserNote | null> => {
    if (!userId || !activeSectionId || !content.trim()) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: userId,
        section_id: activeSectionId,
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
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!noteId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      console.error("Erro ao deletar nota:", error);
      throw error;
    }

    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return { notes, loading, saveNote, deleteNote, refetch: fetchNotes };
}
