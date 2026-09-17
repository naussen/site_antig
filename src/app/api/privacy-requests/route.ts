import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/same-origin.mjs";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  requestType: z.enum(["access", "correction", "deletion", "portability", "information", "other"]),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos informados." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const contactEmail = user?.email?.trim().toLowerCase() ?? parsed.data.email;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count, error: countError } = await admin
    .from("privacy_requests")
    .select("id", { count: "exact", head: true })
    .eq("contact_email", contactEmail)
    .gte("created_at", since);
  if (countError) return NextResponse.json({ error: "Canal temporariamente indisponível." }, { status: 503 });
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Limite diário atingido. Aguarde antes de enviar nova solicitação." }, { status: 429 });
  }

  const { data, error } = await admin.from("privacy_requests").insert({
    user_id: user?.id ?? null,
    contact_email: contactEmail,
    request_type: parsed.data.requestType,
    message: parsed.data.message,
  }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Não foi possível registrar a solicitação." }, { status: 503 });

  return NextResponse.json({ protocol: data.id }, { status: 201 });
}
