import { NextResponse } from "next/server";
import { authorizeNoteImageRequest } from "@/lib/note-image-access";
import {
  extractStoredNoteImageIds,
  NOTE_IMAGE_BUCKET,
} from "@/lib/note-images.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";

const ORPHAN_GRACE_PERIOD_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const authorization = await authorizeNoteImageRequest();
  if ("response" in authorization) return authorization.response;

  const cutoff = new Date(Date.now() - ORPHAN_GRACE_PERIOD_MS).toISOString();
  const [{ data: images, error: imagesError }, { data: notes, error: notesError }] =
    await Promise.all([
      authorization.supabase
        .from("user_note_images")
        .select("id,storage_path")
        .eq("user_id", authorization.user.id)
        .lt("created_at", cutoff),
      authorization.supabase
        .from("user_notes")
        .select("content")
        .eq("user_id", authorization.user.id),
    ]);

  if (imagesError || notesError) {
    return NextResponse.json(
      { error: "Não foi possível auditar as imagens das notas." },
      { status: 503 },
    );
  }

  const referencedIds = new Set(
    (notes ?? []).flatMap((note) => extractStoredNoteImageIds(note.content)),
  );
  let removed = 0;
  let failed = 0;

  for (const image of images ?? []) {
    if (referencedIds.has(image.id)) continue;

    const { error: removeError } = await authorization.supabase.storage
      .from(NOTE_IMAGE_BUCKET)
      .remove([image.storage_path]);
    if (removeError) {
      failed += 1;
      continue;
    }

    const { error: releaseError } = await authorization.supabase.rpc(
      "release_user_note_image",
      { p_image_id: image.id },
    );
    if (releaseError) {
      failed += 1;
      continue;
    }
    removed += 1;
  }

  return NextResponse.json(
    { removed, failed },
    { status: failed > 0 ? 503 : 200 },
  );
}
