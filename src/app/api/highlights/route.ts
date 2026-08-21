import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { createClient } from "@/lib/supabase/server";
import { TEXT_HIGHLIGHT_COLORS } from "@/lib/text-highlight-colors.mjs";

const highlightColumns = "id,user_id,section_id,color,start_offset,end_offset,selected_text,prefix,suffix,created_at,updated_at";
const MAX_BODY_BYTES = 64 * 1024;

const createSchema = z.object({
  section_id: z.string().trim().min(1).max(200),
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

export async function GET(request: Request) {
  const access = await getAuthenticatedClient();
  if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sectionIds = new URL(request.url).searchParams.getAll("section_id");
  const parsedIds = z.array(z.string().trim().min(1).max(200)).min(1).max(200).safeParse(sectionIds);
  if (!parsedIds.success) {
    return NextResponse.json({ error: "Seções inválidas." }, { status: 400 });
  }

  const { data, error } = await access.supabase
    .from("user_text_highlights")
    .select(highlightColumns)
    .eq("user_id", access.user.id)
    .in("section_id", parsedIds.data)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Não foi possível carregar seus realces." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  try {
    const access = await getAuthenticatedClient();
    if (!access) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const payload = createSchema.parse(await readJsonBodyLimited(request, MAX_BODY_BYTES));

    const { data: section } = await access.supabase
      .from("sections")
      .select("section_id")
      .eq("section_id", payload.section_id)
      .maybeSingle();
    if (!section) return NextResponse.json({ error: "Seção não encontrada." }, { status: 404 });

    const { data, error } = await access.supabase
      .from("user_text_highlights")
      .insert({ ...payload, user_id: access.user.id })
      .select(highlightColumns)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Não foi possível salvar o realce." }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
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
