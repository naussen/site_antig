const TEXT_TITLE = /^((?:Texto|TEXTO)\s+(?:\d+[A-Za-z]?|[A-Z]{1,4}\d[A-Z0-9-]*))(?:[ \t]+|$)/u;
const SOURCE = /^(?:(?:[^\n]{1,100}\.\s+)?(?:Fonte|Internet):|Disponível em:|Adaptad[oa]s? de:|Extraíd[oa]s? de:)/iu;
const COMMAND_START = /^(?:Em relação|No que se refere|Tendo (?:o|a)|Com base|A partir|Sobre|Acerca|De acordo|À luz|Leia|Analise|Assinale|Julgue|Identifique|Considerando)/iu;
const COMMAND_END = /(?:assinale|julgue|identifique|indique|marque|responda|é:|são:|\?)\s*$/iu;
const SECTION_HEADING = /^#{1,3}\s*(Texto(?:[- ]base)?|Introdução|Contexto|Fonte|Chamada|Enunciado|Assertiva)\s*$/iu;

function sectionKind(heading) {
  if (/^fonte$/iu.test(heading)) return "source";
  if (/^(?:chamada|enunciado)$/iu.test(heading)) return "command";
  if (/^assertiva$/iu.test(heading)) return "assertion";
  return "base";
}

export function parseStatementSections(markdown, questionType) {
  const original = String(markdown ?? "").trim();
  if (!original) return [];

  const normalized = original.replace(/\r\n?/gu, "\n").replace(/\n(?=(?:[^\n]{1,100}\.\s+)?(?:Fonte|Internet):|No que se refere|Em relação)/giu, "\n\n");
  const paragraphs = normalized.split(/\n\s*\n/gu).map((part) => part.trim()).filter(Boolean);
  const sections = [];
  let pendingKind = null;

  for (const paragraph of paragraphs) {
    const heading = SECTION_HEADING.exec(paragraph);
    if (heading) {
      pendingKind = sectionKind(heading[1]);
      continue;
    }
    sections.push({ kind: pendingKind, content: paragraph });
    pendingKind = null;
  }

  if (sections.length === 0) return [{ kind: "command", content: original }];

  const first = sections[0];
  if (first.kind === null) {
    const match = TEXT_TITLE.exec(first.content);
    if (match) {
      sections.unshift({ kind: "title", content: match[1] });
      first.content = first.content.slice(match[0].length).trim();
      if (!first.content) sections.splice(1, 1);
      else first.kind = "base";
    }
  }

  for (const section of sections) {
    if (section.kind === null && section.content.length <= 400 && SOURCE.test(section.content)) section.kind = "source";
  }

  const untyped = sections.filter((section) => section.kind === null);
  const last = untyped.at(-1);
  const previous = untyped.at(-2);
  const isCommand = (content) => COMMAND_START.test(content) || COMMAND_END.test(content);

  if (last && previous && questionType === "true_false" && isCommand(previous.content)) {
    previous.kind = "command";
    last.kind = "assertion";
  } else if (last && previous && isCommand(last.content)) {
    last.kind = "command";
  } else if (last && !previous && sections.some((section) => section.kind === "base" || section.kind === "source")) {
    last.kind = questionType === "true_false" ? "assertion" : "command";
  }

  const hasSeparatedQuestion = sections.some((section) => section.kind === "command" || section.kind === "assertion");
  for (const section of sections) {
    if (section.kind === null) section.kind = hasSeparatedQuestion ? "base" : "command";
  }
  return sections;
}
