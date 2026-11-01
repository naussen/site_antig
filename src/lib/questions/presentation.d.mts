import type { StatementSection } from "./statement-sections.mjs";

export function getQuestionPresentation(markdown: string, questionType: string): {
  sections: StatementSection[];
  sourceNumber: string | null;
  sourceNotice: string | null;
};
export function getAnswerStatusLabel(status: string | null | undefined): string | null;
