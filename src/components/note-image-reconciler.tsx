"use client";

import { useEffect } from "react";
import { reconcileNoteImages } from "@/lib/note-images-client";

const STORAGE_KEY = "pro-resumos:note-images-reconciled-at";
const RECONCILIATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function NoteImageReconciler() {
  useEffect(() => {
    let shouldReconcile = true;
    try {
      const lastRun = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      shouldReconcile = !Number.isFinite(lastRun)
        || Date.now() - lastRun >= RECONCILIATION_INTERVAL_MS;
    } catch {
      // Storage bloqueado não impede a reconciliação no servidor.
    }
    if (!shouldReconcile) return;

    void reconcileNoteImages()
      .then(() => {
        try {
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          // A próxima navegação poderá repetir uma operação idempotente.
        }
      })
      .catch(() => undefined);
  }, []);

  return null;
}
