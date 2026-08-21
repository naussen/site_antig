"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import { TEXT_HIGHLIGHT_COLORS } from "@/lib/text-highlight-colors.mjs";
import type { TextHighlightColor, UserTextHighlight } from "@/types/database";

export { TEXT_HIGHLIGHT_COLORS };

export interface NewTextHighlight {
  sectionId: string;
  color: TextHighlightColor;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  prefix: string;
  suffix: string;
}

async function requestHighlightApi(path: string, init?: RequestInit) {
  try {
    return await fetch(path, init);
  } catch {
    return null;
  }
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

    let cancelled = false;

    async function loadHighlights() {
      setState({ contextKey, highlights: [], loading: true, error: null });
      const query = new URLSearchParams();
      sectionIds.forEach((sectionId) => query.append("section_id", sectionId));
      const response = await requestHighlightApi(`${withSiteBasePath("/api/highlights")}?${query}`);

      if (cancelled) return;
      if (!response?.ok) {
        setState({
          contextKey,
          highlights: [],
          loading: false,
          error: "Não foi possível carregar seus realces.",
        });
        return;
      }

      const data = await response.json() as UserTextHighlight[];

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

    const response = await requestHighlightApi(withSiteBasePath("/api/highlights"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        section_id: input.sectionId,
        color: input.color,
        start_offset: input.startOffset,
        end_offset: input.endOffset,
        selected_text: input.selectedText,
        prefix: input.prefix,
        suffix: input.suffix,
      }),
    });

    if (!response?.ok) {
      setState((previous) => previous.contextKey === contextKey ? {
        ...previous,
        highlights: previous.highlights.filter((item) => item.id !== temporaryId),
        error: "Não foi possível salvar o realce.",
      } : previous);
      return false;
    }

    const data = await response.json() as UserTextHighlight;

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

    const response = await requestHighlightApi(withSiteBasePath("/api/highlights"), {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: persistedIds }),
    });

    if (!response?.ok) {
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
