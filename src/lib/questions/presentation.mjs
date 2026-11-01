import { parseStatementSections } from "./statement-sections.mjs";

const SOURCE_NOTICE = "Gabarito preliminar divulgado";
const QUESTION_LINE = /^Quest[ãa]o[ \t]+(\d{1,6})(?:[ \t]+\[(Gabarito preliminar divulgado)\])?[ \t]*$/iu;
const NOTICE_LINE = /^\[?Gabarito preliminar divulgado\]?[ \t]*$/iu;

// Only standalone metadata at the beginning is moved. Quoted notices and prose stay intact.
export function getQuestionPresentation(markdown, questionType) {
  const sections = parseStatementSections(markdown, questionType);
  let sourceNumber = null;
  let sourceNotice = null;
  while (sections.length > 0) {
    const first = sections[0];
    const lines = first.content.split("\n");
    const line = lines[0].trim();
    const questionLine = QUESTION_LINE.exec(line);
    if (questionLine && sourceNumber === null) {
      sourceNumber = questionLine[1];
      if (questionLine[2]) sourceNotice = SOURCE_NOTICE;
    } else if (NOTICE_LINE.test(line) && sourceNotice === null) {
      sourceNotice = SOURCE_NOTICE;
    } else {
      break;
    }
    first.content = lines.slice(1).join("\n").trim();
    if (!first.content) sections.shift();
  }
  return { sections, sourceNumber, sourceNotice };
}

export function getAnswerStatusLabel(status) {
  const labels = {
    definitivo: "Gabarito definitivo",
    definitivo_alterado: "Gabarito definitivo retificado",
    preliminar: "Gabarito preliminar",
    anulada: "Questão anulada",
    conflitante: "Gabarito em revisão",
  };
  return Object.hasOwn(labels, status) ? labels[status] : null;
}
