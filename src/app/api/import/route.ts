import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAdminApiRequest } from "@/lib/api-admin-auth.mjs";
import { readJsonBodyLimited, RequestBodyError } from "@/lib/request-body.mjs";
import {
  getMermaidSecurityIssue,
  MAX_MERMAID_SOURCE_LENGTH,
} from "@/lib/mermaid/security.mjs";
import { getTopicIdIssue } from "@/lib/content/topic-id.mjs";
import { FLASHCARD_BOARDS, getFlashcardSourceIssue } from "@/lib/content/flashcard.mjs";
import { parseQuantitativeChart } from "@/lib/quantitative-chart";
import {
  ChangeManifestSchema,
  ContentGovernanceError,
  ContentIdentityFieldsSchema,
  assertDestructiveImportAllowed,
  buildChangeManifestRecord,
  buildContentImpact,
  getManifestIssues,
  summarizeContentImpact,
  validateSectionIdentities,
} from "@/lib/content/import-governance.mjs";

// =============================================================================
// Validação Zod do payload de importação
// =============================================================================

const MAX_IMPORT_BODY_BYTES = 1024 * 1024;

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
  source: z.object({
    board: z.enum([...FLASHCARD_BOARDS] as ["CESPE", "CEBRASPE", "FCC", "FGV"]),
    year: z.number().int().min(2000).max(new Date().getFullYear()),
    exam: z.string().min(1),
    question_id: z.string().min(1),
    status: z.literal("valid"),
  }),
}).superRefine((flashcard, context) => {
  const issue = getFlashcardSourceIssue(flashcard);
  if (issue) context.addIssue({ code: "custom", message: issue });
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

function hasInvalidQuantitativeChart(markdown: string) {
  for (const block of markdown.matchAll(/```quant-chart\s*\n([\s\S]*?)```/g)) {
    if (!parseQuantitativeChart(block[1])) return true;
  }
  return false;
}

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
  ...ContentIdentityFieldsSchema.shape,
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
  replace: z.boolean().optional().default(false),
  change_manifest: ChangeManifestSchema.optional(),
  dry_run: z.boolean().optional().default(false),
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
  const topicIdIssue = getTopicIdIssue(topic.topic_id, topic.topic_title);
  validateSectionIdentities(topic.sections, context);

  if (topicIdIssue) {
    context.addIssue({
      code: "custom",
      path: ["topic_id"],
      message: topicIdIssue,
    });
  }

  if (isPredominantlyUppercaseTitle(topic.topic_title, contextualAcronyms)) {
    context.addIssue({
      code: "custom",
      path: ["topic_title"],
      message: "Use capitalização editorial no título; preserve maiúsculas somente em siglas.",
    });
  }

  topic.sections.forEach((section, index) => {
    const expectedSectionId = `${topic.topic_id}-sec-${String(index + 1).padStart(2, "0")}`;
    if (!section.content_unit_id && section.section_id !== expectedSectionId) {
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

    if (hasInvalidQuantitativeChart(section.content_markdown)) {
      context.addIssue({ code: "custom", path: ["sections", index, "content_markdown"], message: "Gráfico quantitativo inválido." });
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

async function countPersonalRecords(
  supabase: SupabaseClient,
  contentUnitIds: string[]
) {
  if (contentUnitIds.length === 0) {
    return { progress: 0, notes: 0, highlights: 0 };
  }
  const count = async (table: string) => {
    const result = await supabase
      .from(table)
      .select("content_unit_id", { count: "exact", head: true })
      .in("content_unit_id", contentUnitIds);
    if (result.error) throw new Error(`Falha ao medir impacto em ${table}.`);
    return result.count ?? 0;
  };
  const [progress, notes, highlights] = await Promise.all([
    count("user_progress"),
    count("user_notes"),
    count("user_text_highlights"),
  ]);
  return { progress, notes, highlights };
}

function buildSectionRows(
  topicId: string,
  sections: z.infer<typeof SectionImportSchema>[]
) {
  return sections.map((section, index) => ({
    section_id: section.section_id,
    ...(section.content_unit_id ? { content_unit_id: section.content_unit_id } : {}),
    ...(section.stable_key ? { stable_key: section.stable_key } : {}),
    topic_id: topicId,
    title: section.title,
    content_markdown: section.content_markdown || null,
    callouts: section.callouts,
    mnemonics: section.mnemonics,
    flashcards: section.flashcards,
    mermaid_mindmap: section.mermaid_mindmap || null,
    sort_order: index,
    archived_at: null,
    archived_reason: null,
  }));
}

export async function POST(request: Request) {
  try {
    if (!isAdminApiRequest(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await readJsonBodyLimited(request, MAX_IMPORT_BODY_BYTES);
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

    const {
      topic_id,
      discipline,
      topic_title,
      sections,
      replace,
      change_manifest: changeManifest,
      dry_run: dryRun,
    } = parsed.data;
    
    // Usa o Service Role Key para ignorar o RLS e inserir os dados
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const existingTopic = await supabase
      .from("topics")
      .select("discipline")
      .eq("topic_id", topic_id)
      .maybeSingle();
    if (existingTopic.error) throw new Error("Erro ao validar o tópico atual.");
    if (existingTopic.data && existingTopic.data.discipline !== discipline) {
      throw new ContentGovernanceError(
        "Importação bloqueada: topic_id pertence a outra disciplina."
      );
    }

    const contentUnitIds = sections
      .map((section) => section.content_unit_id)
      .filter((id): id is string => Boolean(id));
    if (contentUnitIds.length > 0) {
      const ownership = await supabase
        .from("sections")
        .select("content_unit_id,topic_id")
        .in("content_unit_id", contentUnitIds);
      if (ownership.error) throw new Error("Erro ao validar as unidades de conteúdo.");
      if (ownership.data.some((section) => section.topic_id !== topic_id)) {
        throw new ContentGovernanceError(
          "Importação bloqueada: content_unit_id pertence a outro tópico."
        );
      }
    }
    const sectionOwnership = await supabase
      .from("sections")
      .select("section_id,topic_id")
      .in("section_id", sections.map((section) => section.section_id));
    if (sectionOwnership.error) throw new Error("Erro ao validar IDs legados das seções.");
    if (sectionOwnership.data.some((section) => section.topic_id !== topic_id)) {
      throw new ContentGovernanceError(
        "Importação bloqueada: section_id pertence a outro tópico."
      );
    }

    const current = await supabase
      .from("sections")
      .select("section_id,content_unit_id,stable_key,title,content_markdown,callouts,mnemonics,flashcards,mermaid_mindmap,sort_order,archived_at")
      .eq("topic_id", topic_id);
    if (current.error) throw new Error("Erro ao analisar o conteúdo atual.");

    const impact = buildContentImpact(current.data ?? [], sections, { replace });
    const affectedUnitIds = [...new Set([
      ...impact.removed.map((section: { content_unit_id?: string }) => section.content_unit_id),
      ...impact.remapped.map(
        ({ existing }: { existing: { content_unit_id?: string } }) => existing.content_unit_id
      ),
    ].filter((id): id is string => Boolean(id)))];
    const personalImpact = await countPersonalRecords(supabase, affectedUnitIds);
    const impactReport = summarizeContentImpact(impact, personalImpact);

    if (impact.destructive && changeManifest) {
      const issues = getManifestIssues(changeManifest, topic_id, impact);
      if (issues.length > 0) {
        throw new ContentGovernanceError(
          `Manifesto de mudança inválido: ${issues.join(" ")}`
        );
      }
    }
    if (dryRun) {
      return NextResponse.json({ topic_id, impact: impactReport }, { status: 200 });
    }

    assertDestructiveImportAllowed({
      impact,
      manifest: changeManifest,
      topicId: topic_id,
      replace,
    });

    const sectionRows = buildSectionRows(topic_id, sections);
    if (impact.destructive) {
      const manifestRecord = buildChangeManifestRecord(changeManifest);
      const result = await supabase.rpc("apply_content_import", {
        p_payload: { topic_id, discipline, topic_title, sections },
        p_manifest: manifestRecord.manifest,
        p_manifest_hash: manifestRecord.manifest_hash,
        p_operation: manifestRecord.operation,
      });
      if (result.error) throw new Error("Erro ao aplicar importação destrutiva de forma atômica.");
    } else {
      const { error: topicError } = await supabase.from("topics").upsert(
        { topic_id, discipline, title: topic_title },
        { onConflict: "topic_id" }
      );
      if (topicError) throw new Error("Erro ao salvar tópico.");

      const modernRows = sectionRows.filter((section) => section.content_unit_id);
      const legacyRows = sectionRows.filter((section) => !section.content_unit_id);
      if (modernRows.length > 0) {
        const result = await supabase
          .from("sections")
          .upsert(modernRows, { onConflict: "content_unit_id" });
        if (result.error) throw new Error("Erro ao salvar unidades versionadas.");
      }
      if (legacyRows.length > 0) {
        const result = await supabase
          .from("sections")
          .upsert(legacyRows, { onConflict: "section_id" });
        if (result.error) throw new Error("Erro ao salvar seções legadas.");
      }
    }

    return NextResponse.json(
      {
        message: "Importação concluída com sucesso",
        topic_id,
        sections_count: sections.length,
        impact: impactReport,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof RequestBodyError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ContentGovernanceError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Falha interna na importação de conteúdo.", {
      category: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
