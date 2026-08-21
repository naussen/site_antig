/**
 * Reencontra um trecho salvo sem depender exclusivamente dos offsets originais.
 * O prefixo e o sufixo desambiguam textos repetidos após alterações editoriais.
 *
 * @param {string} text
 * @param {{
 *   start_offset: number,
 *   end_offset: number,
 *   selected_text: string,
 *   prefix: string,
 *   suffix: string
 * }} highlight
 * @returns {{ start: number, end: number } | null}
 */
export function findAnchoredOffsets(text, highlight) {
  const directText = text.slice(highlight.start_offset, highlight.end_offset);
  if (directText === highlight.selected_text) {
    return { start: highlight.start_offset, end: highlight.end_offset };
  }

  const candidates = [];
  let searchFrom = 0;
  while (searchFrom <= text.length) {
    const index = text.indexOf(highlight.selected_text, searchFrom);
    if (index < 0) break;
    candidates.push(index);
    searchFrom = index + Math.max(1, highlight.selected_text.length);
  }

  const hasContext = Boolean(highlight.prefix || highlight.suffix);
  const contextualMatch = hasContext
    ? candidates.find((start) => {
        const prefixMatches = !highlight.prefix
          || text.slice(Math.max(0, start - highlight.prefix.length), start) === highlight.prefix;
        const end = start + highlight.selected_text.length;
        const suffixMatches = !highlight.suffix
          || text.slice(end, end + highlight.suffix.length) === highlight.suffix;
        return prefixMatches && suffixMatches;
      })
    : undefined;
  const start = contextualMatch ?? (candidates.length === 1 ? candidates[0] : null);
  return start === null
    ? null
    : { start, end: start + highlight.selected_text.length };
}
