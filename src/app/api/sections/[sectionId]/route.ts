import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminApiRequest } from "@/lib/api-admin-auth.mjs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;

    if (!isAdminApiRequest(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingSection, error: lookupError } = await supabase
      .from("sections")
      .select("section_id")
      .eq("section_id", sectionId)
      .maybeSingle();

    if (lookupError) {
      console.error("Falha ao consultar seção para arquivamento.", {
        code: lookupError.code,
      });
      return NextResponse.json({ error: "Não foi possível arquivar a seção" }, { status: 500 });
    }

    if (!existingSection) {
      return NextResponse.json({ error: "Seção não encontrada" }, { status: 404 });
    }

    const { error } = await supabase.rpc("archive_content_section", {
      p_section_id: sectionId,
      p_reason: "Arquivada pela API administrativa",
    });

    if (error) {
      console.error("Falha ao arquivar seção.", { code: error.code });
      return NextResponse.json({ error: "Não foi possível arquivar a seção" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Exceção ao arquivar seção.", {
      category: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
