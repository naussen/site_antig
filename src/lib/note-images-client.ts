"use client";

import { extractStoredNoteImageIds, noteImageUrl } from "@/lib/note-images.mjs";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

type UploadedNoteImage = { id: string; url: string };

async function publicError(response: Response, fallback: string) {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export async function uploadNoteImage(file: File): Promise<UploadedNoteImage> {
  const response = await fetch(withSiteBasePath("/api/note-images"), {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await publicError(response, "Não foi possível enviar a imagem."));

  const body = await response.json() as Partial<UploadedNoteImage>;
  if (typeof body.id !== "string" || body.url !== noteImageUrl(body.id)) {
    throw new Error("O servidor retornou uma referência de imagem inválida.");
  }
  return { id: body.id, url: body.url };
}

export async function deleteNoteImage(imageId: string): Promise<void> {
  const response = await fetch(noteImageUrl(imageId), {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error("Não foi possível excluir a imagem da nota.");
  }
}

export async function deleteStoredNoteImages(content: string): Promise<void> {
  const imageIds = extractStoredNoteImageIds(content);
  if (imageIds.length === 0) return;
  const results = await Promise.allSettled(imageIds.map(deleteNoteImage));
  if (results.some((result) => result.status === "rejected")) {
    throw new Error("Uma ou mais imagens não puderam ser excluídas.");
  }
}
