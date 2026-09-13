import { z } from "zod";
import { createHash } from "node:crypto";

const STABLE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ContentIdentityFieldsSchema = z.object({
  content_unit_id: z.uuid().optional(),
  stable_key: z.string().regex(
    STABLE_KEY_PATTERN,
    "stable_key deve usar apenas minúsculas, números e hífens."
  ).optional(),
});

const ManifestOperationSchema = z.object({
  type: z.enum(["archive", "split", "merge", "remap"]),
  from: z.array(z.string().regex(STABLE_KEY_PATTERN)).min(1),
  to: z.array(z.string().regex(STABLE_KEY_PATTERN)),
  rationale: z.string().trim().min(10),
  personal_data_strategy: z.object({
    notes: z.enum(["preserve", "move", "orphan"]),
    progress: z.enum(["preserve", "recalculate", "reset"]),
    highlights: z.enum(["preserve", "reanchor", "orphan"]),
  }),
}).superRefine((operation, context) => {
  const expected = {
    archive: operation.from.length >= 1 && operation.to.length === 0,
    split: operation.from.length === 1 && operation.to.length >= 2,
    merge: operation.from.length >= 2 && operation.to.length === 1,
    remap: operation.from.length === 1 && operation.to.length === 1,
  }[operation.type];
  if (!expected) {
    context.addIssue({
      code: "custom",
      message: `Cardinalidade inválida para operação ${operation.type}.`,
    });
  }
});

export const ChangeManifestSchema = z.object({
  schema_version: z.literal(1),
  topic_id: z.string().min(1),
  reason: z.string().trim().min(10),
  operations: z.array(ManifestOperationSchema).min(1),
});

export function validateSectionIdentities(sections, context) {
  const modernCount = sections.filter(
    (section) => section.content_unit_id || section.stable_key
  ).length;

  if (modernCount > 0 && modernCount !== sections.length) {
    context.addIssue({
      code: "custom",
      path: ["sections"],
      message: "Não misture seções legadas e versionadas no mesmo payload.",
    });
  }

  const unitIds = new Set();
  const stableKeys = new Set();
  sections.forEach((section, index) => {
    const hasUnitId = Boolean(section.content_unit_id);
    const hasStableKey = Boolean(section.stable_key);
    if (hasUnitId !== hasStableKey) {
      context.addIssue({
        code: "custom",
        path: ["sections", index],
        message: "content_unit_id e stable_key devem ser informados juntos.",
      });
    }
    if (section.content_unit_id && unitIds.has(section.content_unit_id)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "content_unit_id"],
        message: "content_unit_id duplicado no mesmo tópico.",
      });
    }
    if (section.stable_key && stableKeys.has(section.stable_key)) {
      context.addIssue({
        code: "custom",
        path: ["sections", index, "stable_key"],
        message: "stable_key duplicado no mesmo tópico.",
      });
    }
    if (section.content_unit_id) unitIds.add(section.content_unit_id);
    if (section.stable_key) stableKeys.add(section.stable_key);
  });
}

function sameEditorialContent(existing, incoming, sortOrder) {
  const normalizedExisting = {
    title: existing.title,
    content_markdown: existing.content_markdown ?? "",
    callouts: existing.callouts ?? [],
    mnemonics: existing.mnemonics ?? [],
    flashcards: existing.flashcards ?? [],
    mermaid_mindmap: existing.mermaid_mindmap ?? "",
    sort_order: existing.sort_order,
  };
  const normalizedIncoming = {
    title: incoming.title,
    content_markdown: incoming.content_markdown ?? "",
    callouts: incoming.callouts ?? [],
    mnemonics: incoming.mnemonics ?? [],
    flashcards: incoming.flashcards ?? [],
    mermaid_mindmap: incoming.mermaid_mindmap ?? "",
    sort_order: sortOrder,
  };
  return JSON.stringify(normalizedExisting) === JSON.stringify(normalizedIncoming);
}

function findExistingSection(existingSections, incoming) {
  if (incoming.content_unit_id) {
    const byUnit = existingSections.find(
      (section) => section.content_unit_id === incoming.content_unit_id
    );
    if (byUnit) return byUnit;
  }
  if (incoming.stable_key) {
    const byStableKey = existingSections.find(
      (section) => section.stable_key === incoming.stable_key
    );
    if (byStableKey) return byStableKey;
  }
  return existingSections.find(
    (section) => section.section_id === incoming.section_id
  );
}

export function buildContentImpact(existingSections, incomingSections, { replace = false } = {}) {
  const activeExisting = existingSections.filter((section) => !section.archived_at);
  const matchedExistingIds = new Set();
  const added = [];
  const restored = [];
  const updated = [];
  const unchanged = [];
  const remapped = [];

  incomingSections.forEach((incoming, sortOrder) => {
    const existing = findExistingSection(existingSections, incoming);
    if (!existing) {
      added.push(incoming);
      return;
    }
    matchedExistingIds.add(existing.section_id);
    if (existing.archived_at) restored.push({ existing, incoming });
    const identityChanged = Boolean(
      (incoming.content_unit_id && existing.content_unit_id
        && incoming.content_unit_id !== existing.content_unit_id)
      || (incoming.stable_key && existing.stable_key
        && incoming.stable_key !== existing.stable_key)
      || (incoming.content_unit_id && existing.content_unit_id
        && incoming.section_id !== existing.section_id)
    );
    if (identityChanged) {
      remapped.push({ existing, incoming });
    }
    if (sameEditorialContent(existing, incoming, sortOrder)) unchanged.push(incoming);
    else updated.push({ existing, incoming });
  });

  const removed = replace
    ? activeExisting.filter((section) => !matchedExistingIds.has(section.section_id))
    : [];

  return {
    incoming: incomingSections,
    added,
    restored,
    updated,
    unchanged,
    removed,
    remapped,
    destructive: removed.length > 0 || remapped.length > 0,
  };
}

function stableKeys(items, selector = (item) => item) {
  return new Set(items.map(selector).map((item) => item?.stable_key).filter(Boolean));
}

export function getManifestIssues(manifestInput, topicId, impact) {
  const parsed = ChangeManifestSchema.safeParse(manifestInput);
  if (!parsed.success) return [z.prettifyError(parsed.error)];
  const manifest = parsed.data;
  const issues = [];
  if (manifest.topic_id !== topicId) {
    issues.push(`Manifesto pertence a ${manifest.topic_id}, não a ${topicId}.`);
  }

  const expectedSources = stableKeys(impact.removed);
  for (const item of impact.remapped) {
    if (item.existing.stable_key) expectedSources.add(item.existing.stable_key);
  }
  const expectedDestinations = stableKeys(impact.added);
  const allowedDestinations = stableKeys(impact.incoming);
  for (const item of impact.remapped) {
    if (item.incoming.stable_key) expectedDestinations.add(item.incoming.stable_key);
  }
  if (expectedSources.size < impact.removed.length + impact.remapped.length) {
    issues.push("Todas as unidades afetadas precisam de stable_key antes da substituição.");
  }
  if (expectedDestinations.size < impact.added.length + impact.remapped.length
      && impact.removed.length > 0 && impact.added.length > 0) {
    issues.push("Todos os destinos estruturais precisam de stable_key no payload.");
  }

  const declaredSources = new Set(manifest.operations.flatMap((operation) => operation.from));
  const declaredDestinations = new Set(manifest.operations.flatMap((operation) => operation.to));
  for (const key of expectedSources) {
    if (!declaredSources.has(key)) issues.push(`Origem não mapeada no manifesto: ${key}.`);
  }
  for (const key of expectedDestinations) {
    if (!declaredDestinations.has(key) && impact.removed.length > 0) {
      issues.push(`Destino não mapeado no manifesto: ${key}.`);
    }
  }
  for (const key of declaredSources) {
    if (!expectedSources.has(key)) issues.push(`Origem desconhecida no manifesto: ${key}.`);
  }
  for (const key of declaredDestinations) {
    if (!allowedDestinations.has(key)) issues.push(`Destino desconhecido no manifesto: ${key}.`);
  }
  for (const item of impact.remapped) {
    if (
      item.existing.content_unit_id === item.incoming.content_unit_id
      && item.existing.stable_key !== item.incoming.stable_key
    ) {
      issues.push(`stable_key é permanente e não pode mudar: ${item.existing.stable_key}.`);
    }
    if (
      item.existing.stable_key === item.incoming.stable_key
      && item.existing.content_unit_id !== item.incoming.content_unit_id
    ) {
      issues.push(`stable_key não pode ser reutilizada por outra unidade: ${item.existing.stable_key}.`);
    }
    if (
      item.existing.section_id === item.incoming.section_id
      && item.existing.content_unit_id
      && item.incoming.content_unit_id
      && item.existing.content_unit_id !== item.incoming.content_unit_id
    ) {
      issues.push(
        `section_id não pode ser reutilizado por outra unidade: ${item.existing.section_id}.`
      );
    }
  }
  return issues;
}

export function assertDestructiveImportAllowed({ impact, manifest, topicId, replace }) {
  if (!impact.destructive) return;
  if (!replace) {
    throw new ContentGovernanceError("Importação destrutiva bloqueada: use substituição explícita.");
  }
  if (!manifest) {
    throw new ContentGovernanceError("Importação destrutiva bloqueada: informe um manifesto de mudança.");
  }
  const issues = getManifestIssues(manifest, topicId, impact);
  if (issues.length > 0) {
    throw new ContentGovernanceError(`Manifesto de mudança inválido:\n- ${issues.join("\n- ")}`);
  }
}

export class ContentGovernanceError extends Error {}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildChangeManifestRecord(manifest) {
  const types = new Set(manifest.operations.map((operation) => operation.type));
  let operation = "replace";
  if (types.has("split")) operation = "split";
  else if (types.has("merge")) operation = "merge";
  else if (types.size === 1 && types.has("archive")) operation = "archive";
  return {
    topic_id: manifest.topic_id,
    operation,
    manifest,
    manifest_hash: createHash("sha256")
      .update(canonicalJson(manifest), "utf8")
      .digest("hex"),
  };
}

export function summarizeContentImpact(impact, personalData = {}) {
  const identify = (section) => ({
    section_id: section.section_id,
    content_unit_id: section.content_unit_id ?? null,
    stable_key: section.stable_key ?? null,
    title: section.title,
  });
  return {
    additions: impact.added.length,
    restores: impact.restored.length,
    updates: impact.updated.length,
    unchanged: impact.unchanged.length,
    archives: impact.removed.length,
    identity_remaps: impact.remapped.length,
    destructive: impact.destructive,
    manifest_required: impact.destructive,
    affected_units: {
      additions: impact.added.map(identify),
      archives: impact.removed.map(identify),
      remaps: impact.remapped.map(({ existing, incoming }) => ({
        from: identify(existing),
        to: identify(incoming),
      })),
    },
    affected_personal_records: {
      progress: personalData.progress ?? 0,
      notes: personalData.notes ?? 0,
      highlights: personalData.highlights ?? 0,
    },
  };
}
