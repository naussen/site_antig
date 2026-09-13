import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { createClient } from "@/lib/supabase/server";
import { TEXT_HIGHLIGHT_COLORS } from "@/lib/text-highlight-colors.mjs";

const legacyHighlightColumns = "id,user_id,section_id,color,start_offset,end_offset,selected_text,prefix,suffix,created_at,updated_at";
const highlightColumns = "id,user_id,section_id,color,start_offset,end_offset,selected_text,prefix,suffix,created_at,updated_at,content_unit_id,content_revision_id,migration_status,anchor_context";
const MAX_BODY_BYTES = 64 * 1024;

const createSchema = z.object({
  section_id: z.string().trim().min(1).max(200),
  content_unit_id: z.uuid().optional(),
  color: z.enum(TEXT_HIGHLIGHT_COLORS),
  start_offset: z.number().int().min(0).max(2_000_000),
  end_offset: z.number().int().positive().max(2_000_000),
  selected_text: z.string().min(1).max(10_000),
  prefix: z.string().max(128),
  suffix: z.string().max(128),
}).strict().refine((value) => value.end_offset > value.start_offset, {
  message: "Intervalo de realce inválido.",
});

const deleteSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
}).strict();

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : { supabase, user };
}

function isIdentitySchemaUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "42703" || code === "PGRST204";
}

export async function GET(request: Request) {
  const access = await getAuthenticatedClient();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const sectionIds = searchParams.getAll("section_id");
  const contentUnitIds = searchParams.getAll("content_unit_id");
  const parsedIds = z.array(z.string().trim().min(1).max(200)).min(1).max(200).safeParse(sectionIds);
  const parsedContentUnitIds = z.array(z.uuid()).max(200).safeParse(contentUnitIds);
  if (!parsedIds.success || !parsedContentUnitIds.success) {
    return NextResponse.json({ error: "Seções inválidas." }, { status: 400 });
  }

  let data: Array<Record<string, unknown>> | null = null;
  let queryError: unknown = null;
  if (parsedContentUnitIds.data.length > 0) {
    const identityResult = await access.supabase
      .from("user_text_highlights")
      .select(highlightColumns)
      .eq("user_id", access.user.id)
      .in("content_unit_id", parsedContentUnitIds.data)
      .order("created_at", { ascending: true });
    data = identityResult.data as Array<Record<string, unknown>> | null;
    queryError = identityResult.error;
  }

  if (parsedContentUnitIds.data.length === 0 || (queryError && isIdentitySchemaUnavailable(queryError))) {
    const legacyResult = await access.supabase
      .from("user_text_highlights")
      .select(legacyHighlightColumns)
      .eq("user_id", access.user.id)
      .in("section_id", parsedIds.data)
      .order("created_at", { ascending: true });
    data = legacyResult.data as Array<Record<string, unknown>> | null;
    queryError = legacyResult.error;
  }

  if (queryError) return NextResponse.json({ error: "Não foi possível carregar seus realces." }, { status: 500 });
  return NextResponse.json((data ?? []).map((highlight) => ({
    ...highlight,
    migration_status: highlight.migration_status ?? "active",
    anchor_context: highlight.anchor_context ?? {},
  })));
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  try {
    const access = await getAuthenticatedClient();
    if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const payload = createSchema.parse(await readJsonBodyLimited(request, MAX_BODY_BYTES));

    let sectionResult = payload.content_unit_id
      ? await access.supabase
        .from("sections")
        .select("section_id,content_unit_id,current_revision_id")
        .eq("content_unit_id", payload.content_unit_id)
        .is("archived_at", null)
        .maybeSingle()
      : null;

    if (!sectionResult || (sectionResult.error && isIdentitySchemaUnavailable(sectionResult.error))) {
      sectionResult = await access.supabase
        .from("sections")
        .select("section_id")
        .eq("section_id", payload.section_id)
        .maybeSingle();
    }

    if (sectionResult.error) {
      return NextResponse.json({ error: "Não foi possível validar a seção." }, { status: 500 });
    }
    const section = sectionResult.data;
    if (!section) return NextResponse.json({ error: "Seção não encontrada." }, { status: 404 });

    if (section.section_id !== payload.section_id) {
      return NextResponse.json({ error: "Identidade da seção inconsistente." }, { status: 409 });
    }

    const contentUnitId = "content_unit_id" in section && typeof section.content_unit_id === "string"
      ? section.content_unit_id
      : null;
    const currentRevisionId = "current_revision_id" in section
      && typeof section.current_revision_id === "string"
      ? section.current_revision_id
      : null;
    const insertPayload = {
      ...payload,
      user_id: access.user.id,
      ...(contentUnitId ? {
        content_unit_id: contentUnitId,
        content_revision_id: currentRevisionId,
        migration_status: "active",
        anchor_context: {
          selected_text: payload.selected_text,
          prefix: payload.prefix,
          suffix: payload.suffix,
          start_offset: payload.start_offset,
          end_offset: payload.end_offset,
          anchor_version: 1,
        },
      } : {}),
    };

    const identityInsertResult = await access.supabase
      .from("user_text_highlights")
      .insert(insertPayload)
      .select(contentUnitId ? highlightColumns : legacyHighlightColumns)
      .single();
    let data = identityInsertResult.data as Record<string, unknown> | null;
    let insertError: unknown = identityInsertResult.error;

    if (insertError && contentUnitId && isIdentitySchemaUnavailable(insertError)) {
      const legacyResult = await access.supabase
        .from("user_text_highlights")
        .insert({
          section_id: payload.section_id,
          color: payload.color,
          start_offset: payload.start_offset,
          end_offset: payload.end_offset,
          selected_text: payload.selected_text,
          prefix: payload.prefix,
          suffix: payload.suffix,
          user_id: access.user.id,
        })
        .select(legacyHighlightColumns)
        .single();
      data = legacyResult.data as Record<string, unknown> | null;
      insertError = legacyResult.error;
    }

    if (insertError || !data) {
      return NextResponse.json({ error: "Não foi possível salvar o realce." }, { status: 500 });
    }
    return NextResponse.json({
      ...data,
      migration_status: data.migration_status ?? "active",
      anchor_context: data.anchor_context ?? {},
    }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Realce inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Não foi possível salvar o realce." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  try {
    const access = await getAuthenticatedClient();
    if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const payload = deleteSchema.parse(await readJsonBodyLimited(request, MAX_BODY_BYTES));
    const { data, error } = await access.supabase
      .from("user_text_highlights")
      .delete()
      .eq("user_id", access.user.id)
      .in("id", payload.ids)
      .select("id");

    if (error) return NextResponse.json({ error: "Não foi possível remover o realce." }, { status: 500 });
    return NextResponse.json({ deleted_ids: (data ?? []).map((item) => item.id) });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Realce inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Não foi possível remover o realce." }, { status: 500 });
  }
}
