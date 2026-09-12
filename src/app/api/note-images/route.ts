import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeNoteImageRequest } from "@/lib/note-image-access";
import { NoteImageValidationError, processNoteImage } from "@/lib/note-image-processing.mjs";
import {
  MAX_NOTE_IMAGE_BYTES,
  NOTE_IMAGE_BUCKET,
  noteImageUrl,
} from "@/lib/note-images.mjs";
import { readBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const authorization = await authorizeNoteImageRequest();
  if ("response" in authorization) return authorization.response;

  const declaredType = request.headers.get("content-type");
  let imageBytes: Uint8Array;
  try {
    imageBytes = await readBodyLimited(request, MAX_NOTE_IMAGE_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Não foi possível ler a imagem." }, { status: 400 });
  }

  let processedImage: Buffer;
  try {
    processedImage = await processNoteImage(imageBytes, declaredType);
  } catch (error) {
    const message = error instanceof NoteImageValidationError
      ? error.message
      : "Não foi possível processar a imagem.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const imageId = randomUUID();
  const { data: storagePath, error: reservationError } = await authorization.supabase.rpc(
    "reserve_user_note_image",
    { p_image_id: imageId }
  );
  if (reservationError || typeof storagePath !== "string") {
    return NextResponse.json({ error: "Limite de imagens atingido ou serviço indisponível." }, { status: 409 });
  }

  const { error: uploadError } = await authorization.supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .upload(storagePath, processedImage, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    await authorization.supabase.rpc("release_user_note_image", { p_image_id: imageId });
    return NextResponse.json({ error: "Não foi possível armazenar a imagem." }, { status: 503 });
  }

  return NextResponse.json(
    { id: imageId, url: noteImageUrl(imageId) },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
