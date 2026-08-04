import { z } from "zod";

const CalloutSchema = z.object({
  type: z.enum(["warning", "info", "tip"]),
  title: z.string().min(1),
  text: z.string().min(1),
}).passthrough();

const MnemonicSchema = z.object({
  key: z.string().min(1),
  meaning: z.string().min(1),
  description: z.string().min(1),
}).passthrough();

const FlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
}).passthrough();

const EditableSectionSchema = z.object({
  section_id: z.string().trim().min(1, "Informe o identificador da seção."),
  title: z.string().trim().min(1, "Informe o título da seção."),
  content_markdown: z.string().default(""),
  callouts: z.array(CalloutSchema).default([]),
  mnemonics: z.array(MnemonicSchema).default([]),
  flashcards: z.array(FlashcardSchema).default([]),
  mermaid_mindmap: z.string().optional().default(""),
}).passthrough();

export const EditableTopicSchema = z.object({
  topic_id: z.string().trim().min(1, "Informe o identificador do material."),
  discipline: z.string().trim().default("Geral"),
  topic_title: z.string().trim().min(1, "Informe o título do material."),
  sections: z.array(EditableSectionSchema).min(1, "O material precisa ter pelo menos uma seção."),
}).passthrough().superRefine((topic, context) => {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  topic.sections.forEach((section, index) => {
    const expectedId = `${topic.topic_id}-sec-${String(index + 1).padStart(2, "0")}`;

    if (section.section_id !== expectedId) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "section_id"],
        message: `Identificador fora da sequência esperada: ${expectedId}.`,
      });
    }

    if (seenIds.has(section.section_id)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "section_id"],
        message: "O identificador desta seção está duplicado.",
      });
    }
    seenIds.add(section.section_id);

    const normalizedTitle = normalizeTitle(section.title);
    if (seenTitles.has(normalizedTitle)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "title"],
        message: "O título desta seção está duplicado.",
      });
    }
    seenTitles.add(normalizedTitle);

    const hasContent = Boolean(
      section.content_markdown.trim()
      || section.mermaid_mindmap.trim()
      || section.callouts.length
      || section.mnemonics.length
      || section.flashcards.length
    );

    if (!hasContent) {
      context.addIssue({
        code: "custom",
        path: ["sections", index],
        message: "A seção não possui conteúdo nem recurso didático.",
      });
    }

    if (/\bDOUTINA\b/i.test(JSON.stringify(section))) {
      context.addIssue({
        code: "custom",
        path: ["sections", index],
        message: "Foi encontrado 'DOUTINA'; use 'doutrina'.",
      });
    }
  });
});

export type EditableTopic = z.infer<typeof EditableTopicSchema>;
export type EditableSection = EditableTopic["sections"][number];

export interface EditorValidationIssue {
  path: string;
  message: string;
}

export type EditorParseResult =
  | { success: true; data: EditableTopic; issues: [] }
  | { success: false; data: null; issues: EditorValidationIssue[] };

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function formatPath(path: PropertyKey[]) {
  if (path.length === 0) return "raiz";

  return path.reduce<string>((formatted, part) => {
    if (typeof part === "number") return `${formatted}[${part + 1}]`;
    return formatted ? `${formatted}.${String(part)}` : String(part);
  }, "");
}

export function validateEditableTopic(value: unknown): EditorParseResult {
  const parsed = EditableTopicSchema.safeParse(value);

  if (parsed.success) {
    return { success: true, data: parsed.data, issues: [] };
  }

  return {
    success: false,
    data: null,
    issues: parsed.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  };
}

export function parseEditableTopicJson(text: string): EditorParseResult {
  try {
    return validateEditableTopic(JSON.parse(text));
  } catch {
    return {
      success: false,
      data: null,
      issues: [{ path: "raiz", message: "O arquivo não contém um JSON válido." }],
    };
  }
}

export function getRevisedFileName(sourceName: string) {
  const baseName = sourceName.replace(/\.json$/i, "").replace(/_revisado$/i, "");
  return `${baseName || "material"}_revisado.json`;
}

export function serializeEditableTopic(topic: EditableTopic) {
  return `${JSON.stringify(topic, null, 2)}\n`;
}
