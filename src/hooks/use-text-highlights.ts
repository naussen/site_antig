"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TextHighlightColor, UserTextHighlight } from "@/types/database";

export const TEXT_HIGHLIGHT_COLORS: TextHighlightColor[] = [
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blue",
  "cyan",
  "green",
  "lime",
  "gray",
];

export interface NewTextHighlight {
  sectionId: string;
  color: TextHighlightColor;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  prefix: string;
  suffix: string;
}

export function useTextHighlights(userId: string | null, sectionIds: string[]) {
  const contextKey = useMemo(
    () => userId && sectionIds.length > 0 ? JSON.stringify([userId, sectionIds]) : "",
    [sectionIds, userId],
  );
  const [state, setState] = useState<{
    contextKey: string;
    highlights: UserTextHighlight[];
    loading: boolean;
    error: string | null;
  }>({ contextKey: "", highlights: [], loading: false, error: null });

  const highlights = useMemo(
    () => state.contextKey === contextKey ? state.highlights : [],
    [contextKey, state.contextKey, state.highlights],
  );
  const loading = Boolean(contextKey) && (state.contextKey !== contextKey || state.loading);
  const error = state.contextKey === contextKey ? state.error : null;

  useEffect(() => {
    if (!userId || sectionIds.length === 0) return;

    const supabase = createClient();
    let cancelled = false;

    async function loadHighlights() {
      setState({ contextKey, highlights: [], loading: true, error: null });
      const { data, error: loadError } = await supabase
        .from("user_text_highlights")
        .select("*")
        .eq("user_id", userId)
        .in("section_id", sectionIds)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (loadError) {
        console.error("Erro ao carregar realces:", loadError);
        setState({
          contextKey,
          highlights: [],
          loading: false,
          error: "Não foi possível carregar seus realces.",
        });
        return;
      }

      setState({
        contextKey,
        highlights: (data ?? []) as UserTextHighlight[],
        loading: false,
        error: null,
      });
    }

    loadHighlights();
    return () => {
      cancelled = true;
    };
  }, [contextKey, sectionIds, userId]);

  const addHighlight = useCallback(async (input: NewTextHighlight) => {
    if (!userId || !contextKey) return false;

    const now = new Date().toISOString();
    const temporaryId = `pending-${crypto.randomUUID()}`;
    const optimisticHighlight: UserTextHighlight = {
      id: temporaryId,
      user_id: userId,
      section_id: input.sectionId,
      color: input.color,
      start_offset: input.startOffset,
      end_offset: input.endOffset,
      selected_text: input.selectedText,
      prefix: input.prefix,
      suffix: input.suffix,
      created_at: now,
      updated_at: now,
    };

    setState((previous) => previous.contextKey === contextKey ? {
      ...previous,
      highlights: [...previous.highlights, optimisticHighlight],
      error: null,
    } : previous);

    const supabase = createClient();
    const { data, error: saveError } = await supabase
      .from("user_text_highlights")
      .insert({
        user_id: userId,
        section_id: input.sectionId,
        color: input.color,
        start_offset: input.startOffset,
        end_offset: input.endOffset,
        selected_text: input.selectedText,
        prefix: input.prefix,
        suffix: input.suffix,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Erro ao salvar realce:", saveError);
      setState((previous) => previous.contextKey === contextKey ? {
        ...previous,
        highlights: previous.highlights.filter((item) => item.id !== temporaryId),
        error: "Não foi possível salvar o realce.",
      } : previous);
      return false;
    }

    setState((previous) => previous.contextKey === contextKey ? {
      ...previous,
      highlights: previous.highlights.map((item) => (
        item.id === temporaryId ? data as UserTextHighlight : item
      )),
      error: null,
    } : previous);
    return true;
  }, [contextKey, userId]);

  const removeHighlights = useCallback(async (highlightIds: string[]) => {
    if (!userId || !contextKey || highlightIds.length === 0) return false;

    const removed = highlights.filter((item) => highlightIds.includes(item.id));
    setState((previous) => previous.contextKey === contextKey ? {
      ...previous,
      highlights: previous.highlights.filter((item) => !highlightIds.includes(item.id)),
      error: null,
    } : previous);

    const persistedIds = highlightIds.filter((id) => !id.startsWith("pending-"));
    if (persistedIds.length === 0) return true;

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("user_text_highlights")
      .delete()
      .eq("user_id", userId)
      .in("id", persistedIds);

    if (deleteError) {
      console.error("Erro ao remover realce:", deleteError);
      setState((previous) => previous.contextKey === contextKey ? {
        ...previous,
        highlights: [...previous.highlights, ...removed],
        error: "Não foi possível remover o realce.",
      } : previous);
      return false;
    }
    return true;
  }, [contextKey, highlights, userId]);

  const highlightsBySection = useMemo(() => {
    const grouped: Record<string, UserTextHighlight[]> = {};
    highlights.forEach((highlight) => {
      grouped[highlight.section_id] = [...(grouped[highlight.section_id] ?? []), highlight];
    });
    return grouped;
  }, [highlights]);

  return {
    highlights,
    highlightsBySection,
    loading,
    error,
    addHighlight,
    removeHighlights,
  };
}
