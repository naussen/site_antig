export const FLASHCARD_BOARDS = new Set(["CESPE", "CEBRASPE", "FCC", "FGV"]);

export function getFlashcardSourceIssue(flashcard) {
  const source = flashcard?.source;
  if (!source || typeof source !== "object") return "fonte da questão ausente";
  if (!FLASHCARD_BOARDS.has(source.board)) return "banca deve ser CESPE, CEBRASPE, FCC ou FGV";
  if (!Number.isInteger(source.year) || source.year < 2000 || source.year > new Date().getFullYear()) return "ano da questão inválido";
  if (typeof source.exam !== "string" || !source.exam.trim()) return "concurso/cargo da questão ausente";
  if (typeof source.question_id !== "string" || !source.question_id.trim()) return "identificador da questão ausente";
  if (source.status !== "valid") return "questão não confirmada como válida e não anulada";
  if (!/^\[CERTO\/ERRADO\]\s+\S/iu.test(String(flashcard.question || ""))) return "enunciado deve iniciar com [CERTO/ERRADO]";
  if (!/^Gabarito:\s*(?:CERTO|ERRADO)\.\s*Justificativa:\s*\S/iu.test(String(flashcard.answer || ""))) return "resposta C/E inválida";
  return null;
}

export function isValidFlashcard(flashcard) {
  return getFlashcardSourceIssue(flashcard) === null;
}

const PROHIBITED_STUDY_ANALYSIS_PATTERNS = [
  /an[aá]lise\s+estat[ií]stica/iu,
  /percentual\s+de\s+cobran[cç]a/iu,
  /distribui[cç][aã]o\s+de\s+quest[oõ]es/iu,
  /(?:mais|menos)\s+cobrad[ao]s?\s+(?:em|pelas?)\s+(?:provas?|bancas?)/iu,
];

export function getFlashcardContentIssue(flashcard) {
  const content = `${flashcard?.question ?? ""} ${flashcard?.answer ?? ""}`;
  if (!/^\[CERTO\/ERRADO\]\s+\S/iu.test(String(flashcard?.question ?? ""))) {
    return "flashcard não está no modelo Certo/Errado";
  }
  if (PROHIBITED_STUDY_ANALYSIS_PATTERNS.some((pattern) => pattern.test(content))) {
    return "análise estatística ou frequência de cobrança não é reforço do tópico";
  }
  return null;
}
