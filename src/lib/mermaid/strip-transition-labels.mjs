const PIPE_TRANSITION_LABEL =
  /\|\s*["']?\s*(?:inicia\s+em|prossegue\s+para)\s*["']?\s*\|/giu;
const INLINE_TRANSITION_LABEL =
  /--\s*["']?\s*(?:inicia\s+em|prossegue\s+para)\s*["']?\s*-->/giu;

/**
 * Remove somente rótulos editoriais redundantes das arestas.
 *
 * @param {string} chart
 * @returns {string}
 */
export function stripMermaidTransitionLabels(chart) {
  return chart
    .replace(PIPE_TRANSITION_LABEL, "")
    .replace(INLINE_TRANSITION_LABEL, "-->");
}
