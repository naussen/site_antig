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

    const { data, error } = await supabase
      .from("sections")
      .delete()
      .eq("section_id", sectionId)
      .select("section_id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Seção não encontrada" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno do servidor", details: message },
      { status: 500 }
    );
  }
}
