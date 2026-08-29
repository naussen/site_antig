import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  getMermaidSecurityIssue,
  MAX_MERMAID_SOURCE_LENGTH,
} from "../src/lib/mermaid/security.mjs";
import {
  getTopicIdIssue,
  slugifyTopicId,
} from "../src/lib/content/topic-id.mjs";
import {
  FLASHCARD_BOARDS,
  getFlashcardContentIssue,
  getFlashcardSourceIssue,
} from "../src/lib/content/flashcard.mjs";
import { repairMermaidTransportNoise } from "../src/lib/mermaid/repair-transport-noise.mjs";

const PAGE_SIZE = 1_000;

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
    board: z.enum([...FLASHCARD_BOARDS]),
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

const KNOWN_ACRONYMS = new Set([
  "AFO", "CIDE", "CLT", "CPC", "CPP", "CTN", "CVM", "DRE", "FRF",
  "ICMS", "ISS", "LDO", "LINDB", "LOA", "LRF", "NBC", "PPA", "RT",
  "STF", "STJ", "TA", "TCE", "TCU", "TI",
]);

function normalizeTitleKey(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectContextualAcronyms(value) {
  return new Set(
    (value.match(/\b[\p{Lu}\d]{2,12}\b/gu) ?? [])
      .filter((token) => /\p{Lu}/u.test(token))
  );
}

function isAllowedUppercaseTitle(value, contextualAcronyms) {
  const words = value.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.length > 0 && words.every((word) =>
    KNOWN_ACRONYMS.has(word.toUpperCase())
    || contextualAcronyms.has(word)
    || /^(?:[IVXLCDM]+|\d+)$/i.test(word)
  );
}

function isPredominantlyUppercaseTitle(value, contextualAcronyms) {
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
  const seenSectionIds = new Set();
  const seenSectionTitles = new Set();
  const contentContext = topic.sections.map((section) => JSON.stringify({
    content_markdown: section.content_markdown,
    callouts: section.callouts,
    mnemonics: section.mnemonics,
    flashcards: section.flashcards,
    mermaid_mindmap: section.mermaid_mindmap,
  })).join("\n");
  const contextualAcronyms = collectContextualAcronyms(contentContext);
  const topicIdIssue = getTopicIdIssue(topic.topic_id, topic.topic_title);

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

  if (/\[arquivo:\s*\d+\]|_reescrito\b|^\s*(?:@@@?|unidade|m[oó]dulo)\b/i.test(topic.topic_title)) {
    context.addIssue({ code: "custom", path: ["topic_title"], message: "Título contém metadado técnico ou marcador de corte proibido." });
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

    if (/\[arquivo:\s*\d+\]|_reescrito\b|^\s*(?:@@@?|unidade|m[oó]dulo)\b/i.test(section.title)) {
      context.addIssue({ code: "custom", path: ["sections", index, "title"], message: "Título de seção contém metadado técnico ou marcador de corte proibido." });
    }
    if (/<br\s*\/?\s*>/i.test(section.content_markdown)) {
      context.addIssue({ code: "custom", path: ["sections", index, "content_markdown"], message: "Conteúdo Markdown não pode conter tags <br>." });
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

export function validateImportPayload(payload) {
  const parsed = TopicImportSchema.safeParse(payload);

  if (!parsed.success) {
    const details = z.prettifyError(parsed.error);
    throw new Error(`JSON de conteúdo inválido:\n${details}`);
  }

  return parsed.data;
}

export function requireText(value, label) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${label} é obrigatório.`);
  }
  return normalized;
}

export function assertConfirmation(expected, received) {
  if (received !== expected) {
    throw new Error(`Confirmação inválida. Use --confirm "${expected}".`);
  }
}

export function assertBatchMode(dryRun, apply) {
  if (dryRun === apply) {
    throw new Error("Use exatamente um modo no lote: --dry-run ou --apply.");
  }
}

export function getBatchSortOrder(fileName, fallbackOrder) {
  const prefix = /^(\d+)/.exec(fileName)?.[1];
  return prefix ? Number.parseInt(prefix, 10) : fallbackOrder;
}

export function buildTopicRow(payload, sortOrder) {
  const row = {
    topic_id: payload.topic_id,
    discipline: payload.discipline,
    title: payload.topic_title,
  };

  if (Number.isInteger(sortOrder)) {
    row.sort_order = sortOrder;
  }

  return row;
}

export function validateBatchEntries(entries) {
  const topicFiles = new Map();
  const sectionFiles = new Map();
  const orderFiles = new Map();
  const conflicts = [];

  for (const entry of entries) {
    const previousTopicFile = topicFiles.get(entry.payload.topic_id);
    if (previousTopicFile) {
      conflicts.push(
        `topic_id ${entry.payload.topic_id} aparece em ${previousTopicFile} e ${entry.filePath}`
      );
    } else {
      topicFiles.set(entry.payload.topic_id, entry.filePath);
    }

    if (Number.isInteger(entry.sortOrder)) {
      const orderKey = `${entry.payload.discipline}\u0000${entry.sortOrder}`;
      const previousOrderFile = orderFiles.get(orderKey);
      if (previousOrderFile) {
        conflicts.push(
          `ordem ${entry.sortOrder} da disciplina ${entry.payload.discipline} ` +
            `aparece em ${previousOrderFile} e ${entry.filePath}`
        );
      } else {
        orderFiles.set(orderKey, entry.filePath);
      }
    }

    for (const section of entry.payload.sections) {
      const previousSection = sectionFiles.get(section.section_id);
      if (previousSection) {
        conflicts.push(
          `section_id ${section.section_id} aparece em ${previousSection.filePath} ` +
            `(módulo ${previousSection.topicId}) e ${entry.filePath} ` +
            `(módulo ${entry.payload.topic_id})`
        );
      } else {
        sectionFiles.set(section.section_id, {
          filePath: entry.filePath,
          topicId: entry.payload.topic_id,
        });
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`Conflitos internos no lote:\n- ${conflicts.join("\n- ")}`);
  }

  return entries;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente ou em .env.local."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unwrap(result, context) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  return result.data;
}

async function fetchAll(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const data = unwrap(
      await buildQuery().range(from, from + PAGE_SIZE - 1),
      "Falha ao consultar conteúdo"
    );
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function getTopic(supabase, topicId) {
  const data = unwrap(
    await supabase
      .from("topics")
      .select("topic_id,title,discipline,created_at")
      .eq("topic_id", topicId)
      .maybeSingle(),
    "Falha ao consultar módulo"
  );

  if (!data) throw new Error(`Módulo não encontrado: ${topicId}`);
  return data;
}

async function getSections(supabase, topicId) {
  return fetchAll(() =>
    supabase
      .from("sections")
      .select(
        "section_id,topic_id,title,content_markdown,callouts,mnemonics,flashcards,mermaid_mindmap,sort_order,created_at"
      )
      .eq("topic_id", topicId)
      .order("sort_order", { ascending: true })
  );
}

async function listContent(supabase, values) {
  const discipline = values.discipline?.trim();
  const topics = await fetchAll(() => {
    let query = supabase
      .from("topics")
      .select("topic_id,title,discipline,created_at")
      .order("discipline")
      .order("title");
    if (discipline) query = query.eq("discipline", discipline);
    return query;
  });

  const sections = await fetchAll(() => supabase.from("sections").select("topic_id"));
  const sectionCounts = new Map();
  for (const section of sections) {
    sectionCounts.set(section.topic_id, (sectionCounts.get(section.topic_id) ?? 0) + 1);
  }

  const output = topics.map((topic) => ({
    disciplina: topic.discipline,
    modulo: topic.title,
    topic_id: topic.topic_id,
    secoes: sectionCounts.get(topic.topic_id) ?? 0,
  }));

  if (values.json) console.log(JSON.stringify(output, null, 2));
  else if (output.length === 0) console.log("Nenhum módulo encontrado.");
  else console.table(output);
}

async function auditTopicIds(supabase, values) {
  const topics = await fetchAll(() =>
    supabase
      .from("topics")
      .select("topic_id,title,discipline")
      .order("discipline")
      .order("title")
  );
  const existingIds = new Set(topics.map((topic) => topic.topic_id));
  const output = topics.flatMap((topic) => {
    const issue = getTopicIdIssue(topic.topic_id, topic.title);
    if (!issue) return [];

    const canonicalId = slugifyTopicId(topic.title);
    const suggestedId = existingIds.has(canonicalId)
      ? `${slugifyTopicId(topic.discipline)}-${canonicalId}`
      : canonicalId;

    return [{
      disciplina: topic.discipline,
      modulo: topic.title,
      topic_id_atual: topic.topic_id,
      topic_id_sugerido: suggestedId,
      motivo: issue,
    }];
  });

  if (values.json) console.log(JSON.stringify(output, null, 2));
  else if (output.length === 0) console.log("Nenhum topic_id suspeito encontrado.");
  else console.table(output);
}

async function auditFlashcards(supabase, values) {
  const sections = await fetchAll(() => supabase
    .from("sections")
    .select("section_id,topic_id,title,flashcards")
    .order("topic_id")
    .order("sort_order"));
  const affected = sections.flatMap((section) => {
    const flashcards = Array.isArray(section.flashcards) ? section.flashcards : [];
    const invalid = flashcards
      .map((flashcard, index) => ({ index: index + 1, motivo: getFlashcardContentIssue(flashcard) }))
      .filter((item) => item.motivo);
    return invalid.length ? [{
      topic_id: section.topic_id,
      section_id: section.section_id,
      secao: section.title,
      flashcards_removidos: invalid.length,
      motivos: [...new Set(invalid.map((item) => item.motivo))].join("; "),
    }] : [];
  });
  const total = affected.reduce((sum, item) => sum + item.flashcards_removidos, 0);
  if (values.json) console.log(JSON.stringify({ secoes_afetadas: affected.length, flashcards_invalidos: total, itens: affected }, null, 2));
  else {
    console.log(`${total} flashcard(s) sem origem válida em ${affected.length} seção(ões).`);
    if (affected.length && !values.apply) console.table(affected);
  }
  if (!values.apply || affected.length === 0) return;
  assertConfirmation("flashcards", values.confirm);
  const backupDirectory = join(process.cwd(), "backups");
  await mkdir(backupDirectory, { recursive: true });
  const backupPath = join(backupDirectory, `flashcards-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backupPath, `${JSON.stringify(sections.filter((section) => (
    Array.isArray(section.flashcards) && section.flashcards.some((flashcard) => getFlashcardContentIssue(flashcard))
  )), null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(`Backup dos flashcards exportado para: ${backupPath}`);
  for (const section of sections) {
    const flashcards = Array.isArray(section.flashcards) ? section.flashcards : [];
    const retained = flashcards.filter((flashcard) => !getFlashcardContentIssue(flashcard));
    if (retained.length === flashcards.length) continue;
    unwrap(await supabase.from("sections").update({ flashcards: retained }).eq("section_id", section.section_id), "Falha ao corrigir flashcards");
  }
  console.log(`${total} flashcard(s) inválido(s) removido(s); conteúdo de estudo preservado.`);
}

async function restoreFlashcards(supabase, backupPath, values) {
  const backup = await readJsonFile(backupPath);
  if (!Array.isArray(backup)) throw new Error("Backup de flashcards inválido: esperado um array de seções.");

  const currentSections = await fetchAll(() => supabase
    .from("sections")
    .select("section_id,topic_id,flashcards"));
  const currentById = new Map(currentSections.map((section) => [section.section_id, section]));
  const missingIds = backup
    .map((section) => section?.section_id)
    .filter((sectionId) => typeof sectionId !== "string" || !currentById.has(sectionId));
  if (missingIds.length) throw new Error(`Backup contém ${missingIds.length} seção(ões) inexistente(s) no banco.`);

  let rejected = 0;
  const rows = backup.map((section) => {
    const legacyCards = Array.isArray(section.flashcards) ? section.flashcards : [];
    const retainedLegacy = legacyCards.filter((flashcard) => {
      const issue = getFlashcardContentIssue(flashcard);
      if (issue) rejected += 1;
      return !issue;
    });
    const current = currentById.get(section.section_id);
    const currentCards = Array.isArray(current.flashcards) ? current.flashcards : [];
    const merged = [...retainedLegacy, ...currentCards].filter((flashcard, index, cards) => (
      cards.findIndex((candidate) => candidate.question === flashcard.question) === index
    ));
    return { section_id: section.section_id, topic_id: current.topic_id, flashcards: merged };
  });
  const restored = rows.reduce((total, row) => total + row.flashcards.length, 0);
  console.log(`${restored} flashcard(s) C/E serão restaurados; ${rejected} item(ns) incompatível(is) serão descartados.`);
  if (!values.apply) return console.log("Pré-visualização. Use --apply --confirm flashcards para restaurar.");

  assertConfirmation("flashcards", values.confirm);
  for (let index = 0; index < rows.length; index += 25) {
    const results = await Promise.all(rows.slice(index, index + 25).map((row) => (
      supabase
        .from("sections")
        .update({ flashcards: row.flashcards })
        .eq("section_id", row.section_id)
    )));
    results.forEach((result) => unwrap(result, "Falha ao restaurar flashcards"));
  }
  console.log(`${restored} flashcard(s) restaurado(s) com sucesso.`);
}

async function auditMermaidArtifacts(supabase, values) {
  const sections = await fetchAll(() => supabase
    .from("sections")
    .select("section_id,topic_id,title,mermaid_mindmap")
    .order("topic_id")
    .order("sort_order"));
  const affected = sections.flatMap((section) => {
    const source = typeof section.mermaid_mindmap === "string" ? section.mermaid_mindmap : "";
    const repaired = repairMermaidTransportNoise(source);
    if (repaired === source || getMermaidSecurityIssue(repaired)) return [];
    return [{ ...section, repaired }];
  });
  console.log(`${affected.length} diagrama(s) com ruído repetido de transporte.`);
  if (!values.apply || affected.length === 0) return;

  assertConfirmation("mermaid", values.confirm);
  const backupDirectory = join(process.cwd(), "backups");
  await mkdir(backupDirectory, { recursive: true });
  const backupPath = join(backupDirectory, `mermaid-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  const originalSections = affected.map((section) => ({
    section_id: section.section_id,
    topic_id: section.topic_id,
    title: section.title,
    mermaid_mindmap: section.mermaid_mindmap,
  }));
  await writeFile(backupPath, `${JSON.stringify(originalSections, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  for (const section of affected) {
    unwrap(
      await supabase.from("sections").update({ mermaid_mindmap: section.repaired }).eq("section_id", section.section_id),
      "Falha ao reparar Mermaid"
    );
  }
  console.log(`Backup salvo em: ${backupPath}`);
  console.log(`${affected.length} diagrama(s) reparado(s).`);
}

async function inspectContent(supabase, topicId, values) {
  const topic = await getTopic(supabase, topicId);
  const sections = await getSections(supabase, topicId);
  const output = {
    topic_id: topic.topic_id,
    discipline: topic.discipline,
    topic_title: topic.title,
    sections: sections.map(({ section_id, title, sort_order }) => ({
      section_id,
      title,
      sort_order,
    })),
  };

  if (values.json) console.log(JSON.stringify(output, null, 2));
  else {
    console.log(`Módulo: ${topic.title}`);
    console.log(`Disciplina: ${topic.discipline}`);
    console.log(`ID: ${topic.topic_id}`);
    console.table(output.sections);
  }
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(
      `JSON malformado em ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function readBatchDirectory(directoryPath) {
  let directoryEntries;
  try {
    directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    throw new Error(
      `Não foi possível ler a pasta ${directoryPath}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    );
  }

  const jsonFiles = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "pt-BR", { numeric: true }));

  if (jsonFiles.length === 0) {
    throw new Error(`Nenhum arquivo .json encontrado em ${directoryPath}.`);
  }

  const entries = [];
  const errors = [];
  for (const [index, fileName] of jsonFiles.entries()) {
    const filePath = join(directoryPath, fileName);
    try {
      entries.push({
        filePath,
        sortOrder: getBatchSortOrder(fileName, index + 1),
        payload: validateImportPayload(await readJsonFile(filePath)),
      });
    } catch (error) {
      errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Preflight encontrou JSONs inválidos:\n- ${errors.join("\n- ")}`);
  }

  return validateBatchEntries(entries);
}

async function findSectionOwnershipConflicts(supabase, payload) {
  const sectionIds = payload.sections.map((section) => section.section_id);
  const conflicts = [];

  for (let index = 0; index < sectionIds.length; index += 200) {
    const batch = sectionIds.slice(index, index + 200);
    const existing = unwrap(
      await supabase.from("sections").select("section_id,topic_id").in("section_id", batch),
      "Falha ao verificar IDs das seções"
    );
    conflicts.push(
      ...existing.filter((section) => section.topic_id !== payload.topic_id)
    );
  }

  return conflicts;
}

async function findTopicOwnershipConflict(supabase, payload) {
  const topic = unwrap(
    await supabase
      .from("topics")
      .select("topic_id,discipline,title")
      .eq("topic_id", payload.topic_id)
      .maybeSingle(),
    "Falha ao verificar o ID do módulo"
  );
  if (!topic || topic.discipline === payload.discipline) return null;
  return topic;
}

async function findBatchSectionOwnershipConflicts(supabase, entries) {
  const expectedOwners = new Map();
  for (const entry of entries) {
    for (const section of entry.payload.sections) {
      expectedOwners.set(section.section_id, entry.payload.topic_id);
    }
  }

  const sectionIds = [...expectedOwners.keys()];
  const conflicts = [];
  for (let index = 0; index < sectionIds.length; index += 200) {
    const batch = sectionIds.slice(index, index + 200);
    const existing = unwrap(
      await supabase.from("sections").select("section_id,topic_id").in("section_id", batch),
      "Falha ao verificar IDs das seções do lote"
    );
    conflicts.push(
      ...existing.filter(
        (section) => section.topic_id !== expectedOwners.get(section.section_id)
      )
    );
  }

  return conflicts;
}

async function findBatchTopicOwnershipConflicts(supabase, entries) {
  const expectedDisciplines = new Map(
    entries.map((entry) => [entry.payload.topic_id, entry.payload.discipline])
  );
  const topicIds = [...expectedDisciplines.keys()];
  const conflicts = [];

  for (let index = 0; index < topicIds.length; index += 200) {
    const batch = topicIds.slice(index, index + 200);
    const existing = unwrap(
      await supabase.from("topics").select("topic_id,discipline,title").in("topic_id", batch),
      "Falha ao verificar IDs dos módulos do lote"
    );
    conflicts.push(
      ...existing.filter(
        (topic) => topic.discipline !== expectedDisciplines.get(topic.topic_id)
      )
    );
  }

  return conflicts;
}

async function upsertImportPayload(
  supabase,
  payload,
  context = "importação",
  topicSortOrder
) {
  unwrap(
    await supabase.from("topics").upsert(
      buildTopicRow(payload, topicSortOrder),
      { onConflict: "topic_id" }
    ),
    `Falha ao salvar módulo (${context})`
  );

  const sectionRows = payload.sections.map((section, sortOrder) => ({
    section_id: section.section_id,
    topic_id: payload.topic_id,
    title: section.title,
    content_markdown: section.content_markdown || null,
    callouts: section.callouts,
    mnemonics: section.mnemonics,
    flashcards: section.flashcards,
    mermaid_mindmap: section.mermaid_mindmap || null,
    sort_order: sortOrder,
  }));

  unwrap(
    await supabase.from("sections").upsert(sectionRows, { onConflict: "section_id" }),
    `Falha ao salvar seções (${context})`
  );
}

async function importContent(supabase, filePath, values) {
  const payload = validateImportPayload(await readJsonFile(filePath));
  const topicConflict = await findTopicOwnershipConflict(supabase, payload);
  if (topicConflict) {
    throw new Error(
      `Importação bloqueada: topic_id ${payload.topic_id} já pertence à disciplina ` +
      `"${topicConflict.discipline}" (arquivo informa "${payload.discipline}").`
    );
  }
  const conflicts = await findSectionOwnershipConflicts(supabase, payload);

  if (conflicts.length > 0) {
    const details = conflicts
      .map((item) => `${item.section_id} pertence a ${item.topic_id}`)
      .join("; ");
    throw new Error(`Importação bloqueada por conflito de IDs: ${details}`);
  }

  const existingSections = await getSectionsIfTopicExists(supabase, payload.topic_id);
  const incomingIds = new Set(payload.sections.map((section) => section.section_id));
  const staleSections = existingSections.filter((section) => !incomingIds.has(section.section_id));

  console.log(`Arquivo: ${filePath}`);
  console.log(`Módulo: ${payload.topic_title} (${payload.topic_id})`);
  console.log(`Disciplina: ${payload.discipline}`);
  console.log(`Seções recebidas: ${payload.sections.length}`);
  console.log(`Seções atuais ausentes no arquivo: ${staleSections.length}`);

  if (values.replace && staleSections.length > 0) {
    console.log("Seções que serão excluídas com --replace:");
    console.table(staleSections.map(({ section_id, title }) => ({ section_id, title })));
  }

  if (!values.apply) {
    console.log("Pré-visualização concluída. Execute novamente com --apply para importar.");
    return;
  }

  // Valida toda a autorização destrutiva antes da primeira escrita para evitar
  // que uma confirmação ausente resulte em uma importação parcialmente aplicada.
  if (values.replace && staleSections.length > 0) {
    assertConfirmation(payload.topic_id, values.confirm);
  }

  await upsertImportPayload(supabase, payload, filePath);

  if (values.replace && staleSections.length > 0) {
    unwrap(
      await supabase
        .from("sections")
        .delete()
        .in("section_id", staleSections.map((section) => section.section_id)),
      "Falha ao excluir seções ausentes"
    );
  }

  console.log("Importação concluída com sucesso.");
}

async function importBatch(supabase, directoryPath, values) {
  assertBatchMode(values.dryRun, values.apply);
  if (values.replace) {
    throw new Error("import-batch não aceita --replace; o lote nunca exclui seções ausentes.");
  }

  console.log(`Preflight da pasta: ${directoryPath}`);
  const entries = await readBatchDirectory(directoryPath);
  const expectedOwners = new Map(
    entries.flatMap((entry) =>
      entry.payload.sections.map((section) => [section.section_id, entry.payload.topic_id])
    )
  );
  const conflicts = await findBatchSectionOwnershipConflicts(supabase, entries);
  const topicConflicts = await findBatchTopicOwnershipConflicts(supabase, entries);
  const expectedDisciplines = new Map(
    entries.map((entry) => [entry.payload.topic_id, entry.payload.discipline])
  );

  if (topicConflicts.length > 0 || conflicts.length > 0) {
    const topicDetails = topicConflicts
      .map(
        (item) =>
          `topic_id ${item.topic_id} pertence à disciplina "${item.discipline}", ` +
          `mas o lote atribui "${expectedDisciplines.get(item.topic_id)}"`
      );
    const details = conflicts
      .map(
        (item) =>
          `${item.section_id} pertence a ${item.topic_id}, mas o lote atribui a ` +
          `${expectedOwners.get(item.section_id)}`
      )
      .join("; ");
    throw new Error(
      `Importação em lote bloqueada por conflito de IDs: ${[...topicDetails, details].filter(Boolean).join("; ")}`
    );
  }

  const summary = entries.map((entry) => ({
    ordem: entry.sortOrder,
    arquivo: entry.filePath,
    topic_id: entry.payload.topic_id,
    modulo: entry.payload.topic_title,
    secoes: entry.payload.sections.length,
  }));
  const sectionCount = entries.reduce(
    (total, entry) => total + entry.payload.sections.length,
    0
  );

  console.table(summary);
  console.log(`Preflight aprovado: ${entries.length} módulo(s), ${sectionCount} seção(ões).`);

  if (values.dryRun) {
    console.log("Simulação concluída sem escritas. Revise a saída e use --apply para importar.");
    return;
  }

  console.log("Iniciando importação efetiva após preflight integral...");
  for (const [index, entry] of entries.entries()) {
    console.log(`[${index + 1}/${entries.length}] ${entry.filePath}`);
    await upsertImportPayload(
      supabase,
      entry.payload,
      entry.filePath,
      entry.sortOrder
    );
  }
  console.log(
    `Importação em lote concluída: ${entries.length} módulo(s), ${sectionCount} seção(ões).`
  );
}

async function getSectionsIfTopicExists(supabase, topicId) {
  const topic = unwrap(
    await supabase.from("topics").select("topic_id").eq("topic_id", topicId).maybeSingle(),
    "Falha ao consultar módulo existente"
  );
  return topic ? getSections(supabase, topicId) : [];
}

async function exportContent(supabase, topicId, outputPath, values) {
  const topic = await getTopic(supabase, topicId);
  const sections = await getSections(supabase, topicId);
  const payload = {
    topic_id: topic.topic_id,
    discipline: topic.discipline,
    topic_title: topic.title,
    sections: sections.map((section) => ({
      section_id: section.section_id,
      title: section.title,
      content_markdown: section.content_markdown ?? "",
      callouts: section.callouts ?? [],
      mnemonics: section.mnemonics ?? [],
      flashcards: section.flashcards ?? [],
      mermaid_mindmap: section.mermaid_mindmap ?? "",
    })),
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    flag: values.force ? "w" : "wx",
  });
  console.log(`Backup exportado para: ${outputPath}`);
}

async function renameTopic(supabase, topicId, newTitle, values) {
  const topic = await getTopic(supabase, topicId);
  console.log(`Título atual: ${topic.title}`);
  console.log(`Novo título: ${newTitle}`);
  if (!values.apply) return console.log("Pré-visualização. Use --apply para confirmar.");

  unwrap(
    await supabase.from("topics").update({ title: newTitle }).eq("topic_id", topicId),
    "Falha ao renomear módulo"
  );
  console.log("Módulo renomeado com sucesso. O topic_id e a URL foram preservados.");
}

async function setTopicDiscipline(supabase, topicId, newDiscipline, values) {
  const topic = await getTopic(supabase, topicId);
  console.log(`Disciplina atual: ${topic.discipline}`);
  console.log(`Nova disciplina: ${newDiscipline}`);
  if (!values.apply) return console.log("Pré-visualização. Use --apply para confirmar.");

  unwrap(
    await supabase.from("topics").update({ discipline: newDiscipline }).eq("topic_id", topicId),
    "Falha ao alterar disciplina do módulo"
  );
  console.log("Disciplina do módulo atualizada. O topic_id e a URL foram preservados.");
}

async function renameSection(supabase, sectionId, newTitle, values) {
  const section = unwrap(
    await supabase
      .from("sections")
      .select("section_id,title,topic_id")
      .eq("section_id", sectionId)
      .maybeSingle(),
    "Falha ao consultar seção"
  );
  if (!section) throw new Error(`Seção não encontrada: ${sectionId}`);

  console.log(`Título atual: ${section.title}`);
  console.log(`Novo título: ${newTitle}`);
  if (!values.apply) return console.log("Pré-visualização. Use --apply para confirmar.");

  unwrap(
    await supabase.from("sections").update({ title: newTitle }).eq("section_id", sectionId),
    "Falha ao renomear seção"
  );
  console.log("Seção renomeada com sucesso. O section_id foi preservado.");
}

async function renameDiscipline(supabase, oldName, newName, values) {
  const topics = await fetchAll(() =>
    supabase
      .from("topics")
      .select("topic_id,title,discipline")
      .eq("discipline", oldName)
      .order("title")
  );
  if (topics.length === 0) throw new Error(`Disciplina não encontrada: ${oldName}`);

  console.log(`${topics.length} módulo(s): "${oldName}" → "${newName}"`);
  console.table(topics.map(({ topic_id, title }) => ({ topic_id, modulo: title })));
  if (!values.apply) return console.log("Pré-visualização. Use --apply para confirmar.");

  unwrap(
    await supabase.from("topics").update({ discipline: newName }).eq("discipline", oldName),
    "Falha ao renomear disciplina"
  );
  console.log("Disciplina renomeada com sucesso.");
}

async function deleteTopic(supabase, topicId, values) {
  const topic = await getTopic(supabase, topicId);
  const sections = await getSections(supabase, topicId);
  console.log(`Excluir módulo: ${topic.title} (${topic.topic_id})`);
  console.log(`Seções afetadas: ${sections.length}`);
  console.log("Notas e progresso vinculados às seções também serão excluídos pelo banco.");
  if (!values.apply) return console.log("Pré-visualização. Use --apply --confirm <topic_id>.");

  assertConfirmation(topicId, values.confirm);
  unwrap(
    await supabase.from("topics").delete().eq("topic_id", topicId),
    "Falha ao excluir módulo"
  );
  console.log("Módulo excluído com sucesso.");
}

async function deleteSection(supabase, sectionId, values) {
  const section = unwrap(
    await supabase
      .from("sections")
      .select("section_id,title,topic_id")
      .eq("section_id", sectionId)
      .maybeSingle(),
    "Falha ao consultar seção"
  );
  if (!section) throw new Error(`Seção não encontrada: ${sectionId}`);

  console.log(`Excluir seção: ${section.title} (${section.section_id})`);
  console.log("Notas e progresso vinculados a esta seção também serão excluídos pelo banco.");
  if (!values.apply) return console.log("Pré-visualização. Use --apply --confirm <section_id>.");

  assertConfirmation(sectionId, values.confirm);
  unwrap(
    await supabase.from("sections").delete().eq("section_id", sectionId),
    "Falha ao excluir seção"
  );
  console.log("Seção excluída com sucesso.");
}

function printHelp() {
  console.log(`
Administração de conteúdo PRO Resumos

Uso:
  npm run content -- list [--discipline "Nome"] [--json]
  npm run content -- audit-topic-ids [--json]
  npm run content -- audit-flashcards [--apply --confirm flashcards] [--json]
  npm run content -- restore-flashcards <backup.json> [--apply --confirm flashcards]
  npm run content -- audit-mermaid-artifacts [--apply --confirm mermaid]
  npm run content -- inspect <topic-id> [--json]
  npm run content -- import <arquivo.json> [--apply] [--replace --confirm <topic-id>]
  npm run content -- import-batch <pasta> (--dry-run | --apply)
  npm run content -- export <topic-id> <saida.json> [--force]
  npm run content -- rename-topic <topic-id> "Novo título" [--apply]
  npm run content -- set-discipline <topic-id> "Nova disciplina" [--apply]
  npm run content -- rename-section <section-id> "Novo título" [--apply]
  npm run content -- rename-discipline "Nome atual" "Novo nome" [--apply]
  npm run content -- delete-topic <topic-id> [--apply --confirm <topic-id>]
  npm run content -- delete-section <section-id> [--apply --confirm <section-id>]

Regras de segurança:
  - Escritas são apenas pré-visualizadas sem --apply.
  - Exclusões e importação com --replace exigem confirmação literal.
  - IDs técnicos não são renomeados por esta ferramenta.
`);
}

export async function main(argv = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      apply: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      confirm: { type: "string" },
      discipline: { type: "string" },
      force: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      replace: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const [command, ...args] = positionals;
  if (!command || command === "help" || values.help) return printHelp();

  values.dryRun = values["dry-run"];

  const supabase = getAdminClient();
  switch (command) {
    case "list":
      return listContent(supabase, values);
    case "audit-topic-ids":
      return auditTopicIds(supabase, values);
    case "audit-flashcards":
      return auditFlashcards(supabase, values);
    case "restore-flashcards":
      return restoreFlashcards(supabase, requireText(args[0], "backup.json"), values);
    case "audit-mermaid-artifacts":
      return auditMermaidArtifacts(supabase, values);
    case "inspect":
      return inspectContent(supabase, requireText(args[0], "topic-id"), values);
    case "import":
      return importContent(supabase, requireText(args[0], "arquivo.json"), values);
    case "import-batch":
      return importBatch(supabase, requireText(args[0], "pasta"), values);
    case "export":
      return exportContent(
        supabase,
        requireText(args[0], "topic-id"),
        requireText(args[1], "arquivo de saída"),
        values
      );
    case "rename-topic":
      return renameTopic(
        supabase,
        requireText(args[0], "topic-id"),
        requireText(args[1], "novo título"),
        values
      );
    case "set-discipline":
      return setTopicDiscipline(
        supabase,
        requireText(args[0], "topic-id"),
        requireText(args[1], "nova disciplina"),
        values
      );
    case "rename-section":
      return renameSection(
        supabase,
        requireText(args[0], "section-id"),
        requireText(args[1], "novo título"),
        values
      );
    case "rename-discipline":
      return renameDiscipline(
        supabase,
        requireText(args[0], "disciplina atual"),
        requireText(args[1], "nova disciplina"),
        values
      );
    case "delete-topic":
      return deleteTopic(supabase, requireText(args[0], "topic-id"), values);
    case "delete-section":
      return deleteSection(supabase, requireText(args[0], "section-id"), values);
    default:
      throw new Error(`Comando desconhecido: ${command}. Use "npm run content -- help".`);
  }
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
