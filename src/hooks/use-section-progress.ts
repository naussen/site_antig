"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SectionReference {
  sectionId: string;
  contentUnitId: string;
}

function isIdentitySchemaUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "42703" || code === "PGRST204";
}

/**
 * Hook para toggle otimista de checkbox de progresso de seção.
 * Atualiza a UI imediatamente e faz upsert no Supabase em background.
 */
export function useSectionProgress(
  userId: string | null,
  sections: SectionReference[]
) {
  const sectionIds = useMemo(() => sections.map((section) => section.sectionId), [sections]);
  const contentUnitIds = useMemo(
    () => sections.map((section) => section.contentUnitId),
    [sections]
  );
  const sectionByContentUnitId = useMemo(
    () => new Map(sections.map((section) => [section.contentUnitId, section.sectionId])),
    [sections]
  );
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
      const identityResult = await supabase
        .from("user_progress")
        .select("content_unit_id, section_id, completed")
        .eq("user_id", userId)
        .in("content_unit_id", contentUnitIds);
      let data = identityResult.data as Array<{
        content_unit_id?: string;
        section_id: string;
        completed: boolean;
      }> | null;
      let progressError = identityResult.error;

      // Compatibilidade durante a janela entre deploy do frontend e da migration.
      if (progressError && isIdentitySchemaUnavailable(progressError)) {
        const legacyResult = await supabase
          .from("user_progress")
          .select("section_id, completed")
          .eq("user_id", userId)
          .in("section_id", sectionIds);
        data = legacyResult.data;
        progressError = legacyResult.error;
      }

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
        const contentUnitId = "content_unit_id" in row && typeof row.content_unit_id === "string"
          ? row.content_unit_id
          : null;
        const sectionId = contentUnitId
          ? sectionByContentUnitId.get(contentUnitId) ?? row.section_id
          : row.section_id;
        if (sectionId) map[sectionId] = row.completed;
      });
      setProgressState({ contextKey, progressMap: map });
      setLoadState({ contextKey, loading: false, error: null });
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [contentUnitIds, contextKey, sectionByContentUnitId, sectionIds, userId]);

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
      const contentUnitId = sections.find((section) => section.sectionId === sectionId)?.contentUnitId;
      if (!contentUnitId) return;

      let { error } = await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          section_id: sectionId,
          content_unit_id: contentUnitId,
          completed: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_unit_id" }
      );

      if (error && isIdentitySchemaUnavailable(error)) {
        const legacyResult = await supabase.from("user_progress").upsert(
          {
            user_id: userId,
            section_id: sectionId,
            completed: newValue,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,section_id" }
        );
        error = legacyResult.error;
      }

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
    [contextKey, progressMap, sections, userId]
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
