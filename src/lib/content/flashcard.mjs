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
