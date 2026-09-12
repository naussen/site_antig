import { NextResponse } from "next/server";
import { authorizeNoteImageRequest } from "@/lib/note-image-access";
import {
  NOTE_IMAGE_BUCKET,
  isValidNoteImageId,
  noteImageStoragePath,
} from "@/lib/note-images.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";

export const runtime = "nodejs";

interface NoteImageRouteProps {
  params: Promise<{ imageId: string }>;
}

export async function GET(_request: Request, { params }: NoteImageRouteProps) {
  const { imageId } = await params;
  if (!isValidNoteImageId(imageId)) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  const authorization = await authorizeNoteImageRequest();
  if ("response" in authorization) return authorization.response;

  const storagePath = noteImageStoragePath(authorization.user.id, imageId);
  const { data, error } = await authorization.supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .download(storagePath);
  if (error || !data) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  return new Response(await data.arrayBuffer(), {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: Request, { params }: NoteImageRouteProps) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const { imageId } = await params;
  if (!isValidNoteImageId(imageId)) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  const authorization = await authorizeNoteImageRequest();
  if ("response" in authorization) return authorization.response;

  const storagePath = noteImageStoragePath(authorization.user.id, imageId);
  const { error: removeError } = await authorization.supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .remove([storagePath]);
  if (removeError) {
    return NextResponse.json({ error: "Não foi possível excluir a imagem." }, { status: 503 });
  }

  await authorization.supabase.rpc("release_user_note_image", { p_image_id: imageId });
  return new NextResponse(null, { status: 204 });
}
