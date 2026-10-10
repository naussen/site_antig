const TECHNICAL_SECTION_MARKER = /^[\t ]*@@@/m;

export function getTechnicalMarkdownMarkerIssue(markdown) {
  return TECHNICAL_SECTION_MARKER.test(markdown)
    ? "Conteúdo Markdown contém marcador técnico @@@; converta-o em cabeçalho Markdown antes da importação."
    : null;
}
