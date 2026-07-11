import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Validação Zod do payload de importação
// =============================================================================

const CalloutSchema = z.object({
  type: z.enum(["warning", "info", "tip"]),
  title: z.string().min(1),
  text: z.string().min(1),
});

const MnemonicSchema = z.object({
  key: z.string().min(1),
  meaning: z.string().min(1),
  description: z.string().min(1),
});

const FlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const SectionImportSchema = z.object({
  section_id: z.string().min(1),
  title: z.string().min(1),
  content_markdown: z.string().default(""),
  callouts: z.array(CalloutSchema).default([]),
  mnemonics: z.array(MnemonicSchema).default([]),
  flashcards: z.array(FlashcardSchema).default([]),
  mermaid_mindmap: z.string().optional().default(""),
});

const TopicImportSchema = z.object({
  topic_id: z.string().min(1),
  discipline: z.string().default("Geral"),
  topic_title: z.string().min(1),
  sections: z.array(SectionImportSchema).min(1, "Pelo menos uma seção é obrigatória"),
});

// =============================================================================
// POST /api/import — Importa JSON estruturado para o Supabase
// =============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = TopicImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Formato inválido",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { topic_id, discipline, topic_title, sections } = parsed.data;
    
    // Usa o Service Role Key para ignorar o RLS e inserir os dados
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert do tópico
    const { error: topicError } = await supabase.from("topics").upsert(
      { topic_id, discipline, title: topic_title },
      { onConflict: "topic_id" }
    );

    if (topicError) {
      return NextResponse.json(
        { error: "Erro ao salvar tópico", details: topicError.message },
        { status: 500 }
      );
    }

    // Upsert das seções (com sort_order baseado na posição do array)
    const sectionRows = sections.map((section, index) => ({
      section_id: section.section_id,
      topic_id,
      title: section.title,
      content_markdown: section.content_markdown || null,
      callouts: section.callouts,
      mnemonics: section.mnemonics,
      flashcards: section.flashcards,
      mermaid_mindmap: section.mermaid_mindmap || null,
      sort_order: index,
    }));

    const { error: sectionsError } = await supabase
      .from("sections")
      .upsert(sectionRows, { onConflict: "section_id" });

    if (sectionsError) {
      return NextResponse.json(
        { error: "Erro ao salvar seções", details: sectionsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Importação concluída com sucesso",
        topic_id,
        sections_count: sections.length,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro interno do servidor", details: message },
      { status: 500 }
    );
  }
}
