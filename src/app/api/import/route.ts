import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { isAdminApiRequest } from "@/lib/api-admin-auth.mjs";
import {
  getMermaidSecurityIssue,
  MAX_MERMAID_SOURCE_LENGTH,
} from "@/lib/mermaid/security.mjs";

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

const MermaidSourceSchema = z
  .string()
  .max(MAX_MERMAID_SOURCE_LENGTH)
  .superRefine((source, context) => {
    const issue = getMermaidSecurityIssue(source);
    if (issue) {
      context.addIssue({ code: "custom", message: issue });
    }
  });

const KNOWN_ACRONYMS = new Set([
  "AFO", "CIDE", "CLT", "CPC", "CPP", "CTN", "CVM", "DRE", "FRF",
  "ICMS", "ISS", "LDO", "LINDB", "LOA", "LRF", "NBC", "PPA", "RT",
  "STF", "STJ", "TA", "TCE", "TCU", "TI",
]);

function normalizeTitleKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectContextualAcronyms(value: string) {
  return new Set(
    (value.match(/\b[\p{Lu}\d]{2,12}\b/gu) ?? [])
      .filter((token) => /\p{Lu}/u.test(token))
  );
}

function isAllowedUppercaseTitle(
  value: string,
  contextualAcronyms: Set<string>
) {
  const words = value.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.length > 0 && words.every((word) =>
    KNOWN_ACRONYMS.has(word.toUpperCase())
    || contextualAcronyms.has(word)
    || /^(?:[IVXLCDM]+|\d+)$/i.test(word)
  );
}

function isPredominantlyUppercaseTitle(
  value: string,
  contextualAcronyms: Set<string>
) {
  const letters = value.match(/\p{L}/gu) ?? [];
  if (
    letters.length < 2
    || isAllowedUppercaseTitle(value, contextualAcronyms)
  ) return false;
  const uppercaseCount = letters.filter(
    (letter) => letter === letter.toLocaleUpperCase("pt-BR")
  ).length;
  return uppercaseCount / letters.length >= 0.8;
}

const SectionImportSchema = z.object({
  section_id: z.string().min(1),
  title: z.string().min(1),
  content_markdown: z.string().default(""),
  callouts: z.array(CalloutSchema).default([]),
  mnemonics: z.array(MnemonicSchema).default([]),
  flashcards: z.array(FlashcardSchema).default([]),
  mermaid_mindmap: MermaidSourceSchema.optional().default(""),
});

const TopicImportSchema = z.object({
  topic_id: z.string().min(1),
  discipline: z.string().default("Geral"),
  topic_title: z.string().min(1),
  sections: z.array(SectionImportSchema).min(1, "Pelo menos uma seção é obrigatória"),
}).superRefine((topic, context) => {
  const seenSectionIds = new Set<string>();
  const seenSectionTitles = new Set<string>();
  const contentContext = topic.sections.map((section) => JSON.stringify({
    content_markdown: section.content_markdown,
    callouts: section.callouts,
    mnemonics: section.mnemonics,
    flashcards: section.flashcards,
    mermaid_mindmap: section.mermaid_mindmap,
  })).join("\n");
  const contextualAcronyms = collectContextualAcronyms(contentContext);

  if (isPredominantlyUppercaseTitle(topic.topic_title, contextualAcronyms)) {
    context.addIssue({
      code: "custom",
      path: ["topic_title"],
      message: "Use capitalização editorial no título; preserve maiúsculas somente em siglas.",
    });
  }

  topic.sections.forEach((section, index) => {
    const expectedSectionId = `${topic.topic_id}-sec-${String(index + 1).padStart(2, "0")}`;
    if (section.section_id !== expectedSectionId) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "section_id"],
        message: `ID fora do padrão sequencial. Esperado: ${expectedSectionId}.`,
      });
    }

    if (seenSectionIds.has(section.section_id)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "section_id"],
        message: "section_id duplicado no mesmo tópico.",
      });
    }
    seenSectionIds.add(section.section_id);

    const titleKey = normalizeTitleKey(section.title);
    if (seenSectionTitles.has(titleKey)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "title"],
        message: "Título de seção duplicado no mesmo tópico.",
      });
    }
    seenSectionTitles.add(titleKey);

    if (isPredominantlyUppercaseTitle(section.title, contextualAcronyms)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "title"],
        message: "Use capitalização editorial; preserve maiúsculas somente em siglas.",
      });
    }

    if (/\bDOUTINA\b/i.test(JSON.stringify(section))) {
      context.addIssue({
        code: "custom",
        path: ["sections", index],
        message: "Erro ortográfico encontrado: use 'doutrina', não 'doutina'.",
      });
    }

    const hasUsefulContent = Boolean(
      section.content_markdown.trim()
      || section.mermaid_mindmap.trim()
      || section.callouts.length
      || section.mnemonics.length
      || section.flashcards.length
    );
    if (!hasUsefulContent) {
      context.addIssue({
        code: "custom",
        path: ["sections", index],
        message: "A seção não possui conteúdo nem recurso didático.",
      });
    }
  });
});

// =============================================================================
// POST /api/import — Importa JSON estruturado para o Supabase
// =============================================================================

export async function POST(request: Request) {
  try {
    if (!isAdminApiRequest(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
