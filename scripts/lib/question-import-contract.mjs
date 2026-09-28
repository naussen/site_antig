import { createHash } from "node:crypto";

import { z } from "zod";

const trimmedText = (maximum) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine((value) => !value.includes("\u0000"), "texto contém byte nulo")
    .refine((value) => !value.includes("\uFFFD"), "texto contém caractere de substituição");

const nullableTrimmedText = (maximum) =>
  z.union([trimmedText(maximum), z.null()]);

const optionSchema = z.object({
  label: z.string().regex(/^[A-Z0-9]{1,3}$/u),
  body_markdown: trimmedText(5_000),
  sort_order: z.number().int().min(0).max(20),
});

const topicSchema = z.object({
  topic_id: trimmedText(200),
  relation_type: z.enum(["primary", "related", "reference"]),
  relevance: z.number().int().min(1).max(100),
  sort_order: z.number().int().min(0),
});

export const questionImportItemSchema = z
  .object({
    external_id: trimmedText(160),
    source_id: trimmedText(160),
    source_content_hash: z.string().regex(/^[a-f0-9]{64}$/u),
    question_type: z.enum(["multiple_choice", "true_false"]),
    statement_markdown: trimmedText(20_000),
    subject: trimmedText(200),
    exam_board: nullableTrimmedText(120),
    institution: nullableTrimmedText(200),
    position_name: nullableTrimmedText(200),
    exam_year: z.number().int().min(1900).max(2200).nullable(),
    difficulty: z.enum(["easy", "medium", "hard"]).nullable(),
    source_reference: nullableTrimmedText(1_000),
    source_metadata: z.record(z.string(), z.unknown()),
    topics: z.array(topicSchema).min(1).max(20),
    options: z.array(optionSchema).min(2).max(10),
    correct_option_label: z.string().regex(/^[A-Z0-9]{1,3}$/u),
    explanation: z.object({
      body_markdown: trimmedText(20_000),
      source_reference: nullableTrimmedText(1_000),
    }),
  })
  .superRefine((question, context) => {
    const labels = question.options.map((option) => option.label);
    const orders = question.options.map((option) => option.sort_order);

    if (new Set(labels).size !== labels.length) {
      context.addIssue({ code: "custom", message: "rótulos de alternativas duplicados" });
    }
    if (new Set(orders).size !== orders.length) {
      context.addIssue({ code: "custom", message: "ordens de alternativas duplicadas" });
    }
    if (!labels.includes(question.correct_option_label)) {
      context.addIssue({ code: "custom", message: "gabarito não corresponde a uma alternativa" });
    }
    if (question.question_type === "true_false" && labels.join(",") !== "C,E") {
      context.addIssue({ code: "custom", message: "certo/errado deve usar exatamente C e E" });
    }
    if (question.topics.filter((topic) => topic.relation_type === "primary").length !== 1) {
      context.addIssue({ code: "custom", message: "questão deve ter exatamente um tópico primário" });
    }
  });

export const questionImportBatchSchema = z
  .object({
    schema_version: z.literal("pro-questions/v1"),
    batch_key: z.string().regex(/^[a-z0-9]+(?:[a-z0-9._-]*[a-z0-9])?$/u),
    source: z.object({
      file_name: z.string().regex(/_ATUALIZADO\.json$/iu).refine((value) => !/[\\/]/u.test(value)),
      sha256: z.string().regex(/^[a-f0-9]{64}$/u),
      metadata: z.record(z.string(), z.unknown()),
    }),
    discipline: z.object({
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
      name: trimmedText(120),
    }),
    questions: z.array(questionImportItemSchema).min(1).max(1_000),
  })
  .superRefine((batch, context) => {
    const externalIds = batch.questions.map((question) => question.external_id);
    const sourceIds = batch.questions.map((question) => question.source_id);
    if (new Set(externalIds).size !== externalIds.length) {
      context.addIssue({ code: "custom", message: "external_id duplicado no lote" });
    }
    if (new Set(sourceIds).size !== sourceIds.length) {
      context.addIssue({ code: "custom", message: "source_id duplicado no lote" });
    }
  });

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function requiredString(value, field, sourceId) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Questão ${sourceId}: campo ${field} ausente ou inválido.`);
  }
  return value.trim();
}

function normalizeOptions(rawQuestion) {
  if (rawQuestion.tipo === "certo_errado") {
    return [
      { label: "C", body_markdown: "Certo", sort_order: 0 },
      { label: "E", body_markdown: "Errado", sort_order: 1 },
    ];
  }

  if (!rawQuestion.alternativas || Array.isArray(rawQuestion.alternativas)) {
    throw new Error(`Questão ${rawQuestion.id_alfanumerico}: alternativas inválidas.`);
  }

  return Object.entries(rawQuestion.alternativas).map(([label, body], index) => ({
    label: label.toUpperCase(),
    body_markdown: requiredString(body, `alternativas.${label}`, rawQuestion.id_alfanumerico),
    sort_order: index,
  }));
}

function normalizeAnswer(rawQuestion) {
  const answer = requiredString(rawQuestion.gabarito, "gabarito", rawQuestion.id_alfanumerico);
  if (rawQuestion.tipo === "certo_errado") {
    if (/^certo$/iu.test(answer)) return "C";
    if (/^errado$/iu.test(answer)) return "E";
    throw new Error(`Questão ${rawQuestion.id_alfanumerico}: gabarito C/E inválido.`);
  }
  return answer.toUpperCase();
}

export function transformReviewedQuestion(rawQuestion, mapping) {
  const sourceId = requiredString(rawQuestion.id_alfanumerico, "id_alfanumerico", "sem-id");
  if (rawQuestion.status_revisao !== "VALIDA") {
    throw new Error(`Questão ${sourceId}: somente status VALIDA pode ser publicado nesta amostra.`);
  }
  if (!Number.isInteger(rawQuestion.ano) || rawQuestion.ano < 1900 || rawQuestion.ano > 2200) {
    throw new Error(`Questão ${sourceId}: ano inválido.`);
  }
  if (typeof rawQuestion.banca !== "string" || !/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .-]*$/u.test(rawQuestion.banca)) {
    throw new Error(`Questão ${sourceId}: banca inválida.`);
  }

  const sourceTopic = requiredString(rawQuestion.topico, "topico", sourceId);
  const topicId = mapping.topics[sourceTopic];
  if (!topicId) {
    throw new Error(`Questão ${sourceId}: tópico sem mapeamento explícito (${sourceTopic}).`);
  }

  const comment = requiredString(rawQuestion.comentario?.texto_completo, "comentario.texto_completo", sourceId);
  const options = normalizeOptions(rawQuestion);
  const questionWithoutHash = {
    external_id: `qpygem:${mapping.discipline.slug}:${sourceId}`,
    source_id: sourceId,
    question_type: rawQuestion.tipo === "certo_errado" ? "true_false" : "multiple_choice",
    statement_markdown: requiredString(rawQuestion.enunciado, "enunciado", sourceId),
    subject: requiredString(rawQuestion.assunto, "assunto", sourceId),
    exam_board: rawQuestion.banca.trim(),
    institution: typeof rawQuestion.orgao === "string" && rawQuestion.orgao.trim() ? rawQuestion.orgao.trim() : null,
    position_name: typeof rawQuestion.cargo === "string" && rawQuestion.cargo.trim() ? rawQuestion.cargo.trim() : null,
    exam_year: rawQuestion.ano,
    difficulty: null,
    source_reference: `${mapping.source_label} — questão ${rawQuestion.id}`,
    source_metadata: {
      original_numeric_id: rawQuestion.id,
      review_status: rawQuestion.status_revisao,
      review_reason: rawQuestion.justificativa_revisao ?? null,
      state: rawQuestion.estado ?? null,
      source_topic: sourceTopic,
    },
    topics: [{ topic_id: topicId, relation_type: "primary", relevance: 100, sort_order: 0 }],
    options,
    correct_option_label: normalizeAnswer(rawQuestion),
    explanation: {
      body_markdown: comment,
      source_reference: mapping.review_report,
    },
  };

  return questionImportItemSchema.parse({
    ...questionWithoutHash,
    source_content_hash: sha256(stableStringify(questionWithoutHash)),
  });
}

export function buildQuestionBatch({ rawText, sourceFile, rawQuestions, mapping, selectedIds }) {
  if (!/_ATUALIZADO\.json$/iu.test(sourceFile) || /[\\/]/u.test(sourceFile)) {
    throw new Error("A fonte deve ser um arquivo JSON cujo nome contenha _ATUALIZADO.");
  }
  if (!Array.isArray(rawQuestions)) {
    throw new Error("A fonte revisada deve conter um array de questões.");
  }

  const selected = selectedIds.length
    ? selectedIds.map((id) => {
        const matches = rawQuestions.filter((question) => question.id_alfanumerico === id);
        if (matches.length !== 1) throw new Error(`Identificador ${id} não é único na fonte.`);
        return matches[0];
      })
    : rawQuestions;

  const batch = {
    schema_version: "pro-questions/v1",
    batch_key: mapping.batch_key,
    source: {
      file_name: sourceFile,
      sha256: sha256(rawText),
      metadata: {
        generator: "QPYGEM",
        reviewed_output: true,
        review_report: mapping.review_report,
        source_total_questions: rawQuestions.length,
        selection: selectedIds.length ? "explicit_sample" : "all",
      },
    },
    discipline: mapping.discipline,
    questions: selected.map((question) => transformReviewedQuestion(question, mapping)),
  };

  return questionImportBatchSchema.parse(batch);
}
