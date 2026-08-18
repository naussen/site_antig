export const MAX_MERMAID_SOURCE_LENGTH = 50_000;

const FORBIDDEN_DIRECTIVE_PATTERN = /%%\{/i;
const FORBIDDEN_FRONTMATTER_PATTERN = /^\s*---\s*$/m;
const FORBIDDEN_INTERACTION_PATTERN = /(?:^|[;\r\n])\s*(?:click|classDef|style|linkStyle)\b/i;
const FORBIDDEN_PROTOCOL_PATTERN = /\b(?:javascript|vbscript|data)\s*:/i;
const EVENT_HANDLER_PATTERN = /\bon[a-z]+\s*=/i;
const HTML_TAG_PATTERN = /<\/?[A-Za-z][^>]*>/g;
const ALLOWED_HTML_TAG_PATTERN = /^<br\s*\/?>$/i;

export function getMermaidSecurityIssue(source) {
  if (source.length > MAX_MERMAID_SOURCE_LENGTH) {
    return `O diagrama excede o limite de ${MAX_MERMAID_SOURCE_LENGTH} caracteres.`;
  }

  if (FORBIDDEN_DIRECTIVE_PATTERN.test(source)) {
    return "Diretivas de configuração Mermaid não são permitidas.";
  }

  if (FORBIDDEN_FRONTMATTER_PATTERN.test(source)) {
    return "Frontmatter de configuração Mermaid não é permitido.";
  }

  if (FORBIDDEN_INTERACTION_PATTERN.test(source)) {
    return "Interações e estilos Mermaid definidos pelo conteúdo não são permitidos.";
  }

  if (FORBIDDEN_PROTOCOL_PATTERN.test(source)) {
    return "Protocolos de URL executáveis ou embutidos não são permitidos.";
  }

  if (EVENT_HANDLER_PATTERN.test(source)) {
    return "Atributos de evento HTML não são permitidos.";
  }

  const htmlTags = source.match(HTML_TAG_PATTERN) ?? [];
  if (htmlTags.some((tag) => !ALLOWED_HTML_TAG_PATTERN.test(tag))) {
    return "Tags HTML não são permitidas em diagramas Mermaid, exceto <br/>.";
  }

  return null;
}

export function isSafeMermaidSource(source) {
  return getMermaidSecurityIssue(source) === null;
}
