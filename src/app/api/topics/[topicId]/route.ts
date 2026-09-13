import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminApiRequest } from "@/lib/api-admin-auth.mjs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    if (!isAdminApiRequest(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingTopic, error: lookupError } = await supabase
      .from("topics")
      .select("topic_id")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (lookupError) {
      console.error("Falha ao consultar tópico para arquivamento.", {
        code: lookupError.code,
      });
      return NextResponse.json({ error: "Não foi possível arquivar o tópico" }, { status: 500 });
    }

    if (!existingTopic) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }

    const { error } = await supabase.rpc("archive_content_topic", {
      p_topic_id: topicId,
      p_reason: "Arquivado pela API administrativa",
    });

    if (error) {
      console.error("Falha ao arquivar tópico.", { code: error.code });
      return NextResponse.json({ error: "Não foi possível arquivar o tópico" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Exceção ao arquivar tópico.", {
      category: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
