/** Corrige somente artefatos comuns de transporte, sem reescrever a estrutura. */
export function normalizeMermaidChart(chart: string) {
  const withoutFence = chart
    .trim()
    .replace(/^```(?:mermaid)?\s*\r?\n/i, "")
    .replace(/\r?\n```\s*$/i, "");

  const separatedStatements = withoutFence.replace(
    /]\s+(?=[A-Za-z_][\w-]*\s+(?:-->|---|==>|-\.->|--o|--x))/g,
    "]\n",
  );

  return separatedStatements
    .split(/\r?\n/)
    .map((line) => {
      const quotedUnsafeNodeLabels = line.replace(
        /(\b[A-Za-z_][\w-]*)\[([^\]\r\n]*)\]/g,
        (match, nodeId: string, rawLabel: string) => {
          const label = rawLabel.trim();
          if (
            !label
            || label.startsWith('"')
            || !/[<>()]/.test(label)
          ) {
            return match;
          }

          return `${nodeId}["${label.replace(/"/g, '\\"')}"]`;
        },
      );

      return quotedUnsafeNodeLabels.replace(
        /\["([^"\]]*)\["([^"\]]+)"\]([^"\]]*)"\]/g,
        (_match, before: string, quoted: string, after: string) =>
          `["${before}'${quoted}'${after}"]`,
      );
    })
    .join("\n");
}
