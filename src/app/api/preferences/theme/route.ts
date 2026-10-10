import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";
import { createClient } from "@/lib/supabase/server";
import { THEME_COOKIE_NAME } from "@/lib/theme-preference";

const requestSchema = z.object({
  theme: z.enum(["light", "dark", "sepia"]),
}).strict();

const MAX_BODY_BYTES = 1024;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { theme } = requestSchema.parse(
      await readJsonBodyLimited(request, MAX_BODY_BYTES),
    );
    const { error } = await supabase.from("user_dashboard_preferences").upsert(
      { user_id: user.id, theme },
      { onConflict: "user_id" },
    );
    if (error) {
      return NextResponse.json(
        { error: "Não foi possível salvar o tema." },
        { status: 503 },
      );
    }

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(THEME_COOKIE_NAME, theme, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Tema inválido." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Não foi possível salvar o tema." },
      { status: 500 },
    );
  }
}
