"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook para toggle otimista de checkbox de progresso de seção.
 * Atualiza a UI imediatamente e faz upsert no Supabase em background.
 */
export function useSectionProgress(
  userId: string | null,
  sectionIds: string[]
) {
  const contextKey = useMemo(
    () =>
      userId && sectionIds.length > 0
        ? JSON.stringify([userId, sectionIds])
        : "",
    [sectionIds, userId]
  );
  const [progressState, setProgressState] = useState<{
    contextKey: string;
    progressMap: Record<string, boolean>;
  }>({ contextKey: "", progressMap: {} });
  const [loadState, setLoadState] = useState<{
    contextKey: string;
    loading: boolean;
    error: string | null;
  }>({ contextKey: "", loading: false, error: null });

  const progressMap = useMemo(
    () =>
      progressState.contextKey === contextKey ? progressState.progressMap : {},
    [contextKey, progressState]
  );
  const loading =
    Boolean(contextKey) &&
    (loadState.contextKey !== contextKey || loadState.loading);
  const error = loadState.contextKey === contextKey ? loadState.error : null;

  // Carregar progresso de todas as seções ao montar
  useEffect(() => {
    if (!userId || sectionIds.length === 0) return;

    const supabase = createClient();
    let cancelled = false;

    async function loadProgress() {
      setLoadState({ contextKey, loading: true, error: null });
      const { data, error: progressError } = await supabase
        .from("user_progress")
        .select("section_id, completed")
        .eq("user_id", userId)
        .in("section_id", sectionIds);

      if (cancelled) return;

      if (progressError) {
        console.error("Erro ao carregar progresso:", progressError);
        setProgressState({ contextKey, progressMap: {} });
        setLoadState({
          contextKey,
          loading: false,
          error: "Não foi possível carregar seu progresso.",
        });
        return;
      }

      const map: Record<string, boolean> = {};
      (data ?? []).forEach((row) => {
        map[row.section_id] = row.completed;
      });
      setProgressState({ contextKey, progressMap: map });
      setLoadState({ contextKey, loading: false, error: null });
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [contextKey, sectionIds, userId]);

  const toggleProgress = useCallback(
    async (sectionId: string) => {
      if (!userId) return;

      const currentValue = progressMap[sectionId] ?? false;
      const newValue = !currentValue;

      // Update otimista
      setProgressState((previous) => ({
        contextKey,
        progressMap: {
          ...(previous.contextKey === contextKey ? previous.progressMap : {}),
          [sectionId]: newValue,
        },
      }));
      setLoadState((previous) => ({
        contextKey,
        loading: previous.contextKey === contextKey && previous.loading,
        error: null,
      }));

      const supabase = createClient();
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          section_id: sectionId,
          completed: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,section_id" }
      );

      // Reverter se falhou
      if (error) {
        console.error("Erro ao salvar progresso:", error);
        setProgressState((previous) =>
          previous.contextKey === contextKey
            ? {
                contextKey,
                progressMap: {
                  ...previous.progressMap,
                  [sectionId]: currentValue,
                },
              }
            : previous
        );
        setLoadState((previous) =>
          previous.contextKey === contextKey
            ? {
                contextKey,
                loading: false,
                error: "Não foi possível salvar a alteração de progresso.",
              }
            : previous
        );
      }
    },
    [contextKey, progressMap, userId]
  );

  const completedCount = Object.values(progressMap).filter(Boolean).length;
  const totalCount = sectionIds.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    progressMap,
    toggleProgress,
    completedCount,
    totalCount,
    progressPercent,
    loading,
    error,
  };
}
