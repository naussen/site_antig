export type StatementSection = { kind: "title" | "base" | "source" | "command" | "assertion"; content: string };
export function parseStatementSections(markdown: string, questionType: string): StatementSection[];
