"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook para toggle otimista de checkbox de progresso de seção.
 * Atualiza a UI imediatamente e faz upsert no Supabase em background.
 */
export function useSectionProgress(
  userId: string | null,
  sectionIds: string[]
) {
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

  // Carregar progresso de todas as seções ao montar
  useEffect(() => {
    if (!userId || sectionIds.length === 0) return;

    const supabase = createClient();

    async function loadProgress() {
      const { data } = await supabase
        .from("user_progress")
        .select("section_id, completed")
        .eq("user_id", userId)
        .in("section_id", sectionIds);

      if (data) {
        const map: Record<string, boolean> = {};
        data.forEach((row) => {
          map[row.section_id] = row.completed;
        });
        setProgressMap(map);
      }
    }

    loadProgress();
  }, [userId, sectionIds]);

  const toggleProgress = useCallback(
    async (sectionId: string) => {
      if (!userId) return;

      const currentValue = progressMap[sectionId] ?? false;
      const newValue = !currentValue;

      // Update otimista
      setProgressMap((prev) => ({ ...prev, [sectionId]: newValue }));

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
        setProgressMap((prev) => ({ ...prev, [sectionId]: currentValue }));
      }
    },
    [userId, progressMap]
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
  };
}
